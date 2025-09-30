import express from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
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