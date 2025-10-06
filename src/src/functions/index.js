const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe.secret_key);

admin.initializeApp();

exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  const { planId, wineId, quantity, price } = data;
  const lineItems = [];
  if (planId) {
    lineItems.push({ price: planId, quantity: 1 });
  } else if (wineId) {
    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: { name: 'Wine Purchase' },
        unit_amount: price * 100, // Cents
      },
      quantity,
    });
  }
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: planId ? 'subscription' : 'payment',
    success_url: 'https://your-app-url/success',
    cancel_url: 'https://your-app-url/cancel',
    client_reference_id: context.auth.uid,
    metadata: { wineId }, // For webhook
  });
  return { url: session.url };
});

exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, functions.config().stripe.webhook_secret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id;
    const wineId = session.metadata.wineId;
    const planId = session.line_items?.data[0]?.price?.id;

    if (wineId) {
      // Create order and reduce stock for wine
      const order = {
        orderNumber: `ORDER-${Date.now()}`,
        wines: [{ wineId, quantity: 1 }],
        status: 'On the Way',
        date: new Date().toISOString().split('T')[0],
        userId,
      };
      await admin.firestore().collection('orders').doc(order.orderNumber).set(order);
      const wineRef = admin.firestore().collection('wines').doc(wineId);
      await wineRef.update({ stock: admin.firestore.FieldValue.increment(-1) });
      console.log(`Processed wine purchase for user ${userId}, wine ${wineId}`);
    } else if (planId) {
      // Existing plan update logic
      let planName;
      if (planId === 'price_friends') planName = 'Friends';
      else if (planId === 'price_family') planName = 'Family';
      else if (planId === 'price_collectors') planName = 'Collectors';

      if (userId && planName) {
        await admin.firestore().collection('users').doc(userId).update({ plan: planName });
        console.log(`Updated plan for user ${userId} to ${planName}`);
     