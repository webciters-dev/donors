import express from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { sendDonorPaymentConfirmationEmail, sendStudentSponsorshipNotificationEmail } from '../lib/emailService.js';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

// POST /api/payments/create-payment-intent - Create payment intent for embedded payment
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { studentId, amount, paymentFrequency, userId, currency } = req.body;

    if (!studentId || !amount || !paymentFrequency || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: studentId, amount, paymentFrequency, userId' 
      });
    }

    // Get user (donor) details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true 
      }
    });

    if (!user || user.role !== 'DONOR') {
      return res.status(403).json({ error: 'Unauthorized: Only donors can create payment intents' });
    }

    // Get student details with applications
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        applications: true
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (student.sponsored) {
      return res.status(400).json({ error: 'Student is already sponsored' });
    }

    // Get the latest APPROVED application for the student
    const application = student.applications?.find(app => app.status === 'APPROVED');
    if (!application) {
      return res.status(400).json({ error: 'No approved application found for this student' });
    }

    // Verify total commitment matches student's educational need
    // Application currency is determined by university country selection
    const appCurrency = application.currency || 'USD'; // Default to USD if not set
    const requestedCurrency = currency || 'USD'; // Default to USD if not provided
    
    // No currency normalization needed - support all currencies directly
    // Use single amount field from application
    const totalNeed = application.amount || 0;
    const providedAmount = parseFloat(amount);
    
    // Debug logging
    console.log("Payment validation debug:", {
      originalRequestedCurrency: currency,
      originalApplicationCurrency: application.currency,
      applicationAmount: application.amount,
      totalNeed,
      providedAmount,
      paymentFrequency,
      match: providedAmount === totalNeed,
      studentId: student.id,
      applicationId: application.id
    });
    
    // Validate that the application has the required amount set
    if (!totalNeed || totalNeed <= 0) {
      return res.status(400).json({ 
        error: `Application does not have valid educational need amount set for ${appCurrency}. Please contact support.`,
        applicationCurrency: appCurrency,
        applicationAmount: application.amount
      });
    }
    
    // Validate currency compatibility (must be exact match)
    if (appCurrency !== requestedCurrency) {
      return res.status(400).json({ 
        error: `Currency mismatch: Application uses ${appCurrency} but payment requested in ${requestedCurrency}`,
        applicationCurrency: appCurrency,
        requestedCurrency: requestedCurrency
      });
    }
    
    // Simple exact match validation - no currency conversion needed
    if (providedAmount !== totalNeed) {
      return res.status(400).json({ 
        error: 'Total sponsorship amount must match the full educational need', 
        required: totalNeed, 
        provided: providedAmount,
        currency: currency,
        paymentFrequency: paymentFrequency
      });
    }

    // Create or get existing Stripe customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id,
          studentId: studentId
        }
      });
    }

    let paymentIntent;

    if (paymentFrequency === 'one-time') {
      // Use original currency - NO conversion needed
      const stripeAmount = parseFloat(amount);
      const stripeCurrency = appCurrency.toLowerCase(); // Stripe uses lowercase
      const stripeDescription = `Full sponsorship for ${student.name} - ${student.program} at ${student.university}`;
      
      // Create one-time payment intent in original currency
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(stripeAmount * 100), // Convert to cents/pence/smallest unit
        currency: stripeCurrency, // Use original currency (usd, gbp, eur, cad, pkr)
        customer: customer.id,
        metadata: {
          studentId,
          userId,
          studentName: student.name,
          paymentFrequency: 'one-time',
          originalAmount: amount,
          originalCurrency: appCurrency
        },
        description: stripeDescription
      });
    } else {
      // Create subscription for recurring payments
      const intervalMapping = {
        'monthly': 'month',
        'quarterly': { interval: 'month', interval_count: 3 },
        'bi-annually': { interval: 'month', interval_count: 6 },
        'annually': 'year'
      };

      const interval = intervalMapping[paymentFrequency];
      
      // Calculate amount per interval for 2-year program
      // Use original amount - NO conversion
      const baseAmount = parseFloat(amount);
      const stripeCurrency = appCurrency.toLowerCase(); // Stripe uses lowercase
      
      let amountPerInterval;
      if (paymentFrequency === 'monthly') {
        amountPerInterval = Math.round((baseAmount / 24) * 100); // 24 months over 2 years
      } else if (paymentFrequency === 'quarterly') {
        amountPerInterval = Math.round((baseAmount / 8) * 100);  // 8 quarters over 2 years
      } else if (paymentFrequency === 'bi-annually') {
        amountPerInterval = Math.round((baseAmount / 4) * 100);  // 4 payments over 2 years
      } else if (paymentFrequency === 'annually') {
        amountPerInterval = Math.round((baseAmount / 2) * 100);  // 2 payments over 2 years
      }

      // Create product and price for subscription
      const product = await stripe.products.create({
        name: `Sponsorship for ${student.name}`,
        description: `${paymentFrequency} sponsorship for ${student.program} at ${student.university}`,
        metadata: {
          studentId,
          userId,
          studentName: student.name
        }
      });

      const price = await stripe.prices.create({
        unit_amount: amountPerInterval,
        currency: stripeCurrency, // Use original currency
        recurring: typeof interval === 'object' ? interval : { interval },
        product: product.id,
        metadata: {
          studentId,
          userId,
          paymentFrequency,
          totalAmount: amount,
          originalAmount: amount,
          originalCurrency: appCurrency
        }
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: price.id,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          studentId,
          userId,
          studentName: student.name,
          paymentFrequency,
          totalAmount: amount
        }
      });

      paymentIntent = subscription.latest_invoice.payment_intent;
    }

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerId: customer.id,
      isSubscription: paymentFrequency !== 'one-time'
    });

  } catch (error) {
    console.error('❌ ERROR CREATING PAYMENT INTENT:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error type:', error.type);
    
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: error.message,
      code: error.code
    });
  }
});

// POST /api/payments/confirm-payment - Confirm payment and create sponsorship
router.post('/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId, userId, studentId, paymentFrequency } = req.body;

    if (!paymentIntentId || !userId || !studentId || !paymentFrequency) {
      return res.status(400).json({ 
        error: 'Missing required fields: paymentIntentId, userId, studentId, paymentFrequency' 
      });
    }

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Get user (donor) details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true 
      }
    });

    if (!user || user.role !== 'DONOR') {
      return res.status(403).json({ error: 'Unauthorized: Only donors can confirm payments' });
    }

    // Get student details
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (student.sponsored) {
      return res.status(400).json({ error: 'Student is already sponsored' });
    }

    // Create or get donor
    let donor = await prisma.donor.findUnique({
      where: { email: user.email }
    });

    if (!donor) {
      donor = await prisma.donor.create({
        data: {
          name: user.name,
          email: user.email,
          organization: null
        }
      });
    }

    // Create sponsorship and update records in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Store original amount and currency (no conversion)
      const originalAmount = paymentIntent.metadata?.originalAmount;
      const originalCurrency = paymentIntent.metadata?.originalCurrency;
      const sponsorshipAmount = originalAmount ? parseFloat(originalAmount) : Math.round(paymentIntent.amount / 100);
      
      const sponsorship = await tx.sponsorship.create({
        data: {
          donorId: donor.id,
          studentId,
          amount: sponsorshipAmount, // Original amount in original currency
          paymentFrequency,
          stripePaymentIntentId: paymentIntentId,
          stripeSubscriptionId: paymentIntent.metadata?.subscriptionId || null,
          // Store currency information for audit
          amountOriginal: sponsorshipAmount,
          currencyOriginal: originalCurrency || paymentIntent.currency?.toUpperCase() || 'USD',
          amountBaseUSD: paymentIntent.currency === 'usd' ? Math.round(paymentIntent.amount / 100) : null, // Only if USD
          baseCurrency: paymentIntent.currency?.toUpperCase() || 'USD'
        },
        include: {
          donor: {
            select: {
              name: true,
              organization: true,
              taxId: true
            }
          },
          student: {
            select: {
              name: true,
              university: true,
              program: true
            }
          }
        }
      });

      // Mark student as sponsored
      await tx.student.update({
        where: { id: studentId },
        data: { sponsored: true }
      });

      // Update donor's total funded amount in original currency
      // Note: For multi-currency display, we'll need to track currency-specific totals
      await tx.donor.update({
        where: { id: donor.id },
        data: {
          totalFunded: {
            increment: sponsorshipAmount // Use original amount
          }
        }
      });

      return sponsorship;
    });

    // Send payment confirmation emails (async, don't block response)
    try {
      // Send confirmation email to donor
      sendDonorPaymentConfirmationEmail({
        email: user.email,
        donorName: user.name,
        studentName: result.student.name,
        amount: result.amountOriginal,
        currency: result.currencyOriginal,
        paymentMethod: paymentIntent.payment_method_types?.[0] || 'Credit Card',
        transactionId: paymentIntentId,
        sponsorshipId: result.id
      }).catch(emailError => {
        console.error('Failed to send donor payment confirmation email:', emailError);
      });

      // Send sponsorship notification email to student
      sendStudentSponsorshipNotificationEmail({
        email: student.email,
        studentName: result.student.name,
        donorName: result.donor.name,
        amount: result.amountOriginal,
        currency: result.currencyOriginal,
        sponsorshipId: result.id,
        message: paymentIntent.metadata?.message || null
      }).catch(emailError => {
        console.error('Failed to send student sponsorship notification email:', emailError);
      });
    } catch (emailError) {
      console.error('Failed to send payment confirmation emails:', emailError);
    }

    res.json({ 
      success: true, 
      sponsorship: result,
      message: 'Payment confirmed and sponsorship created successfully' 
    });

  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// POST /api/payments/create-checkout-session - Create Stripe checkout session
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { studentId, donorEmail, donorName, amount, organization } = req.body;

    if (!studentId || !donorEmail || !donorName || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: studentId, donorEmail, donorName, amount' 
      });
    }

    // Get student details
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (student.sponsored) {
      return res.status(400).json({ error: 'Student is already sponsored' });
    }

    // Create or get existing Stripe customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: donorEmail,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: donorEmail,
        name: donorName,
        metadata: {
          organization: organization || ''
        }
      });
    }

    // Get student's application currency
    const studentWithApp = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        applications: {
          where: { status: 'APPROVED' },
          orderBy: { submittedAt: 'desc' },
          take: 1
        }
      }
    });
    
    const appCurrency = studentWithApp?.applications?.[0]?.currency || 'USD';
    
    // Create checkout session in original currency
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: appCurrency.toLowerCase(), // Use original currency
            product_data: {
              name: `Sponsorship for ${student.name}`,
              description: `${student.program} at ${student.university}`,
              metadata: {
                studentId: student.id,
                studentName: student.name
              }
            },
            unit_amount: parseInt(amount) * 100, // Convert to smallest currency unit
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/#/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/#/marketplace`,
      metadata: {
        studentId,
        donorEmail,
        donorName,
        organization: organization || ''
      }
    });

    res.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Duplicate endpoint removed - using the first confirm-payment implementation

// POST /api/payments/verify-payment - Verify and process successful payment
router.post('/verify-payment', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    const { studentId, donorEmail, donorName, organization } = session.metadata;

    // Create or get donor
    let donor = await prisma.donor.findUnique({
      where: { email: donorEmail }
    });

    if (!donor) {
      donor = await prisma.donor.create({
        data: {
          name: donorName,
          email: donorEmail,
          organization: organization || null
        }
      });
    }

    // Create sponsorship and update records
    const result = await prisma.$transaction(async (tx) => {
      // Create the sponsorship
      const sponsorship = await tx.sponsorship.create({
        data: {
          donorId: donor.id,
          studentId,
          amount: session.amount_total / 100 // Convert from cents
        },
        include: {
          donor: {
            select: {
              name: true,
              organization: true,
              taxId: true
            }
          },
          student: {
            select: {
              name: true,
              university: true,
              program: true
            }
          }
        }
      });

      // Mark student as sponsored
      await tx.student.update({
        where: { id: studentId },
        data: { sponsored: true }
      });

      // Update donor's total funded amount
      await tx.donor.update({
        where: { id: donor.id },
        data: {
          totalFunded: {
            increment: session.amount_total / 100
          }
        }
      });

      return sponsorship;
    });

    res.json({ 
      success: true, 
      sponsorship: result,
      message: 'Payment processed successfully' 
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// POST /api/payments/webhook - Stripe webhook endpoint (optional)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.log('Webhook secret not configured');
    return res.status(400).send('Webhook secret not configured');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Payment successful:', session.id);
      // Process the successful payment here
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

export default router;