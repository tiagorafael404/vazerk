// Minimal backend for Stripe Payment Links (webhook + checkout session creation).
// Deploy somewhere with HTTPS (e.g., Render, Railway, Fly.io) and set STRIPE_SECRET_KEY,
// STRIPE_WEBHOOK_SECRET.

import express from 'express';
import Stripe from 'stripe';

const app = express();

// IMPORTANT: Stripe needs the raw body for signature verification.
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// 1) Create a PaymentIntent or Checkout Session.
// This example uses Checkout Sessions.
// You can swap to PaymentIntents if you prefer card elements.
app.post('/api/checkout-session', async (req, res) => {
  try {
    const { amount, currency, productName, email, fullName, phone, address, postal, city, country } = req.body || {};

    if (!amount || !currency) {
      return res.status(400).json({ error: 'Missing amount/currency' });
    }

    // Use Stripe Price or build line_items with amount.
    // For dynamic amounts, Checkout supports unit_amount.
    // Amount must be in the smallest currency unit.
    const lineItems = [
      {
        price_data: {
          currency,
          unit_amount: Math.round(amount),
          product_data: {
            name: productName || 'Produto',
          },
        },
        quantity: 1,
      },
    ];

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: email,
      // Redirect URLs
      success_url: process.env.SUCCESS_URL || 'https://example.com/success',
      cancel_url: process.env.CANCEL_URL || 'https://example.com/cancel',
      // Collect shipping/address-like fields (optional)
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['PT', 'ES', 'FR', 'DE', 'GB', 'US'],
      },
      // Attach metadata to link to your order
      metadata: {
        fullName: fullName || '',
        phone: phone || '',
        address: address || '',
        postal: postal || '',
        city: city || '',
        country: country || '',
      },
      // Optional: allow payment methods
      // payment_method_types: ['card', 'ideal', 'bancontact'],
    });

    return res.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// 2) Webhook to verify Stripe events
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('checkout.session.completed', session.id);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`Stripe server listening on port ${PORT}`);
});

