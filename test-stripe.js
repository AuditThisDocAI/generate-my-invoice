const Stripe = require('stripe');
const stripe = new Stripe('sk_test_12345');
console.log(typeof stripe.checkout.sessions.list);
