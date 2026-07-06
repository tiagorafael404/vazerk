// Minimal backend for Stripe Payment Links (webhook + checkout session creation).
// Deploy somewhere with HTTPS (e.g., Render, Railway, Fly.io) and set STRIPE_SECRET_KEY,
// STRIPE_WEBHOOK_SECRET.

import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Enable CORS so the static frontend can call this backend
app.use(cors());
app.options('*', cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  return next();
});

// IMPORTANT: Stripe needs the raw body for signature verification.
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '1mb' }));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  return next(err);
});

const PORT = process.env.PORT || 3000;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY is not configured. Set it before creating checkout sessions.');
}

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
    })
  : null;

// 1) Create a Checkout Session.
app.post('/api/checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe is not configured on the server.' });
    }

    const {
      amount,
      currency = 'eur',
      productName,
      email,
      fullName,
      phone,
      address,
      postal,
      city,
      country,
      paymentMethod,
      optionName
    } = req.body || {};

    if (!amount) {
      return res.status(400).json({ error: 'Missing amount' });
    }

    // Build the line item
    const lineItems = [
      {
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: Math.round(amount),
          product_data: {
            name: optionName ? `${productName} (${optionName})` : (productName || 'Produto'),
          },
        },
        quantity: 1,
      },
    ];

    // Map frontend payment method to Stripe payment_method_types
    let paymentMethodTypes = ['card'];
    if (paymentMethod === 'paypal') {
      paymentMethodTypes = ['paypal'];
    } else if (paymentMethod === 'mbway') {
      paymentMethodTypes = ['mb_way'];
    } else if (paymentMethod === 'applepay') {
      paymentMethodTypes = ['card']; // Apple Pay is card-based in Stripe
    }

    const sessionOptions = {
      mode: 'payment',
      line_items: lineItems,
      customer_email: email,
      // Redirect URLs
      success_url: process.env.SUCCESS_URL || 'https://vazerk.com/success.html',
      cancel_url: process.env.CANCEL_URL || 'https://vazerk.com/cancel.html',
      // We already collected the address in our custom form, so do not force the user
      // to enter a shipping address again on the Stripe Checkout page.
      billing_address_collection: 'auto',
      // Attach the shipping/customer details to Stripe metadata so the store owner
      // can see them in the Stripe Dashboard and process the order.
      metadata: {
        fullName: fullName || '',
        phone: phone || '',
        address: address || '',
        postal: postal || '',
        city: city || '',
        country: country || '',
        paymentMethod: paymentMethod || '',
        optionName: optionName || '',
      },
      payment_method_types: paymentMethodTypes,
    };

    const session = await stripe.checkout.sessions.create(sessionOptions);

    return res.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to create checkout session' });
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