const express = require('express');
const router = express.Router();
const {
    createStripeCustomer,
    attachPaymentMethod,
    purchaseCurrency,
    getCustomer,
    getPackages,
    getTransactions,
    createCheckoutSession
} = require('../controllers/Stripe');

// Stripe customer management
router.post('/stripe/create-customer', createStripeCustomer);
router.post('/stripe/attach-payment-method', attachPaymentMethod);
router.get('/stripe/customer/:userId', getCustomer);

// Currency purchase
router.post('/stripe/purchase-currency', purchaseCurrency);
router.post('/stripe/create-checkout-session', createCheckoutSession);
router.get('/stripe/packages', getPackages);
router.get('/stripe/transactions/:userId', getTransactions);

module.exports = router;
