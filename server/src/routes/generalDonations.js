// server/src/routes/generalDonations.js
import express from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { sendGeneralDonationConfirmationEmail } from '../lib/emailService.js';
import { requireAuth, onlyRoles } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

// US States for validation
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

// Minimum donation amount in USD
const MIN_DONATION_AMOUNT = 10;

// POST /api/general-donations/create-checkout - Create Stripe checkout session
router.post('/create-checkout', async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      phone, 
      streetAddress, 
      city, 
      state, 
      zipCode, 
      message, 
      amount 
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !streetAddress || !city || !state || !zipCode || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: fullName, email, streetAddress, city, state, zipCode, amount' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate state
    if (!US_STATES.includes(state.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid US state code' });
    }

    // Validate amount
    const donationAmount = parseFloat(amount);
    if (isNaN(donationAmount) || donationAmount < MIN_DONATION_AMOUNT) {
      return res.status(400).json({ 
        error: `Minimum donation amount is $${MIN_DONATION_AMOUNT}`,
        minAmount: MIN_DONATION_AMOUNT 
      });
    }

    // Validate ZIP code (basic US format)
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(zipCode)) {
      return res.status(400).json({ error: 'Invalid ZIP code format. Use 12345 or 12345-6789' });
    }

    // Create or update pending donation record
    const donation = await prisma.generalDonation.create({
      data: {
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        streetAddress: streetAddress.trim(),
        city: city.trim(),
        state: state.toUpperCase().trim(),
        zipCode: zipCode.trim(),
        message: message?.trim() || null,
        amount: donationAmount,
        currency: 'USD',
        paymentStatus: 'PENDING'
      }
    });

    // Get base URL for redirects
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email.toLowerCase().trim(),
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'General Donation to AWAKE',
              description: 'Supporting student education through AWAKE Connect',
            },
            unit_amount: Math.round(donationAmount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        donationId: donation.id,
        donorName: fullName.trim(),
        donorEmail: email.toLowerCase().trim(),
        type: 'general_donation'
      },
      success_url: `${baseUrl}/#/donation-success?session_id={CHECKOUT_SESSION_ID}&donation_id=${donation.id}`,
      cancel_url: `${baseUrl}/#/donate?cancelled=true`,
    });

    // Update donation with session ID
    await prisma.generalDonation.update({
      where: { id: donation.id },
      data: { stripeSessionId: session.id }
    });

    console.log('✅ General donation checkout session created:', {
      donationId: donation.id,
      sessionId: session.id,
      amount: donationAmount,
      donor: fullName
    });

    res.json({
      sessionId: session.id,
      sessionUrl: session.url,
      donationId: donation.id
    });

  } catch (error) {
    console.error('❌ Error creating general donation checkout:', error);
    res.status(500).json({ 
      error: 'Failed to create donation checkout',
      details: error.message 
    });
  }
});

// POST /api/general-donations/confirm - Confirm payment after Stripe redirect
router.post('/confirm', async (req, res) => {
  try {
    const { sessionId, donationId } = req.body;

    if (!sessionId || !donationId) {
      return res.status(400).json({ error: 'Missing sessionId or donationId' });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ 
        error: 'Payment not completed',
        paymentStatus: session.payment_status 
      });
    }

    // Get the donation record
    const donation = await prisma.generalDonation.findUnique({
      where: { id: donationId }
    });

    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    // Verify session matches
    if (donation.stripeSessionId !== sessionId) {
      return res.status(400).json({ error: 'Session ID mismatch' });
    }

    // Update donation status
    const updatedDonation = await prisma.generalDonation.update({
      where: { id: donationId },
      data: {
        paymentStatus: 'COMPLETED',
        stripePaymentIntentId: session.payment_intent,
        paidAt: new Date()
      }
    });

    // Send confirmation email
    try {
      await sendGeneralDonationConfirmationEmail({
        email: donation.email,
        donorName: donation.fullName,
        amount: donation.amount,
        donationId: donation.id,
        transactionId: session.payment_intent
      });
      console.log('✅ General donation confirmation email sent to:', donation.email);
    } catch (emailError) {
      console.error('⚠️ Failed to send confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    console.log('✅ General donation confirmed:', {
      donationId,
      amount: donation.amount,
      donor: donation.fullName
    });

    res.json({
      success: true,
      donation: {
        id: updatedDonation.id,
        fullName: updatedDonation.fullName,
        amount: updatedDonation.amount,
        paidAt: updatedDonation.paidAt
      }
    });

  } catch (error) {
    console.error('❌ Error confirming general donation:', error);
    res.status(500).json({ 
      error: 'Failed to confirm donation',
      details: error.message 
    });
  }
});

// GET /api/general-donations/admin - Get all donations (Admin only)
router.get('/admin', requireAuth, onlyRoles('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate, status, page = 1, limit = 50 } = req.query;

    // Build filter
    const where = {};

    if (status && status !== 'all') {
      where.paymentStatus = status.toUpperCase();
    } else {
      // Default to completed donations
      where.paymentStatus = 'COMPLETED';
    }

    if (startDate) {
      where.paidAt = {
        ...where.paidAt,
        gte: new Date(startDate)
      };
    }

    if (endDate) {
      // Add one day to include the end date fully
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      where.paidAt = {
        ...where.paidAt,
        lte: endDateTime
      };
    }

    // Get paginated donations
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [donations, totalCount, totals] = await Promise.all([
      prisma.generalDonation.findMany({
        where,
        orderBy: { paidAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.generalDonation.count({ where }),
      prisma.generalDonation.aggregate({
        where,
        _sum: { amount: true },
        _count: { id: true }
      })
    ]);

    res.json({
      donations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit))
      },
      totals: {
        totalAmount: totals._sum.amount || 0,
        totalDonations: totals._count.id || 0
      }
    });

  } catch (error) {
    console.error('❌ Error fetching general donations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch donations',
      details: error.message 
    });
  }
});

// GET /api/general-donations/admin/export - Export donations as CSV (Admin only)
router.get('/admin/export', requireAuth, onlyRoles('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    // Build filter
    const where = {};

    if (status && status !== 'all') {
      where.paymentStatus = status.toUpperCase();
    } else {
      where.paymentStatus = 'COMPLETED';
    }

    if (startDate) {
      where.paidAt = {
        ...where.paidAt,
        gte: new Date(startDate)
      };
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      where.paidAt = {
        ...where.paidAt,
        lte: endDateTime
      };
    }

    // Get all donations for export
    const donations = await prisma.generalDonation.findMany({
      where,
      orderBy: { paidAt: 'desc' }
    });

    // Calculate totals
    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);

    // Build CSV
    const headers = [
      'Donation ID',
      'Full Name',
      'Email',
      'Phone',
      'Street Address',
      'City',
      'State',
      'ZIP Code',
      'Amount (USD)',
      'Message',
      'Payment Status',
      'Stripe Payment ID',
      'Date Paid'
    ];

    const rows = donations.map(d => [
      d.id,
      `"${d.fullName.replace(/"/g, '""')}"`,
      d.email,
      d.phone || '',
      `"${d.streetAddress.replace(/"/g, '""')}"`,
      `"${d.city.replace(/"/g, '""')}"`,
      d.state,
      d.zipCode,
      d.amount.toFixed(2),
      d.message ? `"${d.message.replace(/"/g, '""')}"` : '',
      d.paymentStatus,
      d.stripePaymentIntentId || '',
      d.paidAt ? new Date(d.paidAt).toISOString() : ''
    ]);

    // Add summary row
    rows.push([]);
    rows.push(['TOTAL', '', '', '', '', '', '', '', totalAmount.toFixed(2), '', '', '', '']);
    rows.push(['Total Donations:', donations.length]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    // Set response headers for CSV download
    const filename = `general-donations-${startDate || 'all'}-to-${endDate || 'now'}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);

  } catch (error) {
    console.error('❌ Error exporting general donations:', error);
    res.status(500).json({ 
      error: 'Failed to export donations',
      details: error.message 
    });
  }
});

// GET /api/general-donations/admin/stats - Get donation statistics (Admin only)
router.get('/admin/stats', requireAuth, onlyRoles('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build filter for completed donations
    const where = { paymentStatus: 'COMPLETED' };

    if (startDate) {
      where.paidAt = {
        ...where.paidAt,
        gte: new Date(startDate)
      };
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      where.paidAt = {
        ...where.paidAt,
        lte: endDateTime
      };
    }

    // Get statistics
    const [periodStats, allTimeStats, recentDonations] = await Promise.all([
      prisma.generalDonation.aggregate({
        where,
        _sum: { amount: true },
        _count: { id: true },
        _avg: { amount: true },
        _max: { amount: true },
        _min: { amount: true }
      }),
      prisma.generalDonation.aggregate({
        where: { paymentStatus: 'COMPLETED' },
        _sum: { amount: true },
        _count: { id: true }
      }),
      prisma.generalDonation.findMany({
        where: { paymentStatus: 'COMPLETED' },
        orderBy: { paidAt: 'desc' },
        take: 5,
        select: {
          id: true,
          fullName: true,
          amount: true,
          paidAt: true
        }
      })
    ]);

    res.json({
      period: {
        totalAmount: periodStats._sum.amount || 0,
        totalDonations: periodStats._count.id || 0,
        averageAmount: periodStats._avg.amount || 0,
        maxAmount: periodStats._max.amount || 0,
        minAmount: periodStats._min.amount || 0
      },
      allTime: {
        totalAmount: allTimeStats._sum.amount || 0,
        totalDonations: allTimeStats._count.id || 0
      },
      recentDonations
    });

  } catch (error) {
    console.error('❌ Error fetching donation stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch donation statistics',
      details: error.message 
    });
  }
});

export default router;
