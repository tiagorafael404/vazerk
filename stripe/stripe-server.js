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

const PORT = process.env.PORT || 8080;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const paypalClientId = process.env.PAYPAL_CLIENT_ID;
const paypalClientSecret = process.env.PAYPAL_SECRET;
const paypalMode = (process.env.PAYPAL_MODE || 'sandbox').toLowerCase();
const paypalApiBaseUrl = paypalMode === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY is not configured. Set it before creating checkout sessions.');
}

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
    })
  : null;

// 1) Create a Checkout Session.
async function getPayPalAccessToken() {
  if (!paypalClientId || !paypalClientSecret) {
    throw new Error('PayPal credentials are not configured on the server.');
  }

  const auth = Buffer.from(`${paypalClientId}:${paypalClientSecret}`).toString('base64');
  const response = await fetch(`${paypalApiBaseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error_description || data?.error || 'Failed to obtain PayPal access token');
  }

  return data.access_token;
}

async function createPayPalOrder(req, res) {
  try {
    const { amount, currency = 'EUR', productName } = req.body || {};
    if (!amount) {
      return res.status(400).json({ error: 'Missing amount' });
    }

    const accessToken = await getPayPalAccessToken();
    const response = await fetch(`${paypalApiBaseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: String(currency || 'EUR').toUpperCase(),
              value: String(amount),
            },
            description: productName || 'Produto Vazerk',
          },
        ],
        application_context: {
          return_url: process.env.SUCCESS_URL || 'https://vazerk.com/success.html',
          cancel_url: process.env.CANCEL_URL || 'https://vazerk.com/cancel.html',
          shipping_preference: 'NO_SHIPPING',
        },
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.message || 'Failed to create PayPal order' });
    }

    return res.json({ orderId: data.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to create PayPal order' });
  }
}

async function capturePayPalOrder(req, res) {
  try {
    const { orderId } = req.body || {};
    if (!orderId) {
      return res.status(400).json({ error: 'Missing orderId' });
    }

    const accessToken = await getPayPalAccessToken();
    const response = await fetch(`${paypalApiBaseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.message || 'Failed to capture PayPal order' });
    }

    return res.json({ ok: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to capture PayPal order' });
  }
}

async function createCheckoutSession(req, res) {
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
}

app.options('/api/checkout-session', (req, res) => res.sendStatus(204));
app.all('/api/checkout-session', (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', allowedMethods: ['POST'] });
  }
  return createCheckoutSession(req, res);
});

app.options('/api/paypal/create-order', (req, res) => res.sendStatus(204));
app.all('/api/paypal/create-order', (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', allowedMethods: ['POST'] });
  }
  return createPayPalOrder(req, res);
});

app.options('/api/paypal/capture-order', (req, res) => res.sendStatus(204));
app.all('/api/paypal/capture-order', (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', allowedMethods: ['POST'] });
  }
  return capturePayPalOrder(req, res);
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