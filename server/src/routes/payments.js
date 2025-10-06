import express from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

// POST /api/payments/create-payment-intent - Create payment intent for embedded payment
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { studentId, amount, paymentFrequency, userId } = req.body;

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

    // Verify total commitment matches student's educational need
    const totalNeed = student.needUSD;
    const providedAmount = parseFloat(amount);
    
    if (providedAmount !== totalNeed) {
      return res.status(400).json({ 
        error: 'Total sponsorship amount must match the full educational need', 
        required: totalNeed, 
        provided: providedAmount
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
      // Create one-time payment intent
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(amount) * 100), // Convert to cents
        currency: 'usd',
        customer: customer.id,
        metadata: {
          studentId,
          userId,
          studentName: student.name,
          paymentFrequency: 'one-time'
        },
        description: `Full sponsorship for ${student.name} - ${student.program} at ${student.university}`
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
      let amountPerInterval;
      if (paymentFrequency === 'monthly') {
        amountPerInterval = Math.round((parseFloat(amount) / 24) * 100); // 24 months over 2 years
      } else if (paymentFrequency === 'quarterly') {
        amountPerInterval = Math.round((parseFloat(amount) / 8) * 100);  // 8 quarters over 2 years
      } else if (paymentFrequency === 'bi-annually') {
        amountPerInterval = Math.round((parseFloat(amount) / 4) * 100);  // 4 payments over 2 years
      } else if (paymentFrequency === 'annually') {
        amountPerInterval = Math.round((parseFloat(amount) / 2) * 100);  // 2 payments over 2 years
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
        currency: 'usd',
        recurring: typeof interval === 'object' ? interval : { interval },
        product: product.id,
        metadata: {
          studentId,
          userId,
          paymentFrequency,
          totalAmount: amount
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
      // Create the sponsorship
      const sponsorship = await tx.sponsorship.create({
        data: {
          donorId: donor.id,
          studentId,
          amount: Math.round(paymentIntent.amount / 100), // Convert from cents
          paymentFrequency,
          stripePaymentIntentId: paymentIntentId,
          stripeSubscriptionId: paymentIntent.metadata?.subscriptionId || null
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
            increment: Math.round(paymentIntent.amount / 100)
          }
        }
      });

      return sponsorship;
    });

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

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Sponsorship for ${student.name}`,
              description: `${student.program} at ${student.university}`,
              metadata: {
                studentId: student.id,
                studentName: student.name
              }
            },
            unit_amount: parseInt(amount) * 100, // Convert to cents
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

// POST /api/payments/confirm-payment - Confirm payment and create sponsorship
router.post('/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId, studentId, userId, paymentFrequency } = req.body;

    if (!paymentIntentId || !studentId || !userId || !paymentFrequency) {
      return res.status(400).json({ 
        error: 'Missing required fields: paymentIntentId, studentId, userId, paymentFrequency' 
      });
    }

    // Retrieve the payment intent to verify it's succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        error: 'Payment not completed', 
        status: paymentIntent.status 
      });
    }

    // Get user and student details
    const [user, student] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, role: true }
      }),
      prisma.student.findUnique({
        where: { id: studentId }
      })
    ]);

    if (!user || user.role !== 'DONOR') {
      return res.status(403).json({ error: 'Unauthorized: Only donors can confirm payments' });
    }

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (student.sponsored) {
      return res.status(400).json({ error: 'Student is already sponsored' });
    }

    // Create or get donor record
    let donor = await prisma.donor.findFirst({
      where: { email: user.email }
    });

    if (!donor) {
      donor = await prisma.donor.create({
        data: {
          name: user.name,
          email: user.email,
          organization: null // Can be updated later
        }
      });
    }

    // Create sponsorship and update records in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the sponsorship
      const sponsorship = await tx.sponsorship.create({
        data: {
          donorId: donor.id,
          studentId,
          amount: student.educationalNeed, // Always full amount
          paymentFrequency,
          stripePaymentIntentId: paymentIntentId,
          status: 'ACTIVE'
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
              program: true,
              educationalNeed: true
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
            increment: student.educationalNeed
          }
        }
      });

      return sponsorship;
    });

    res.json({ 
      success: true, 
      sponsorship: result,
      message: 'Sponsorship created successfully'
    });

  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

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