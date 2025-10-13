const dotenv = require('dotenv');
dotenv.config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const StripeCustomer = require('../models/StripeCustomer');
const StripeTransaction = require('../models/StripeTransaction');
const Users = require('../models/Users');

// Currency packages configuration - $1 = 1 ticket
const CURRENCY_PACKAGES = {
    "package_1": { price: 100, currency_amount: 1, name: "1 Tickets - $1.00" }, // $1 = 1 tickets
    "package_2": { price: 500, currency_amount: 5, name: "5 Tickets - $5.00" }, // $5 = 5 tickets
    "package_3": { price: 2000, currency_amount: 20, name: "20 Tickets - $20.00" }, // $20 = 20 tickets
    "package_4": { price: 4500, currency_amount: 50, name: "50 Tickets - $45.00" }, // $45 = 50 tickets (10% discount)
    "package_5": { price: 7500, currency_amount: 90, name: "90 Tickets - $75.00" }, // $75 = 90 tickets (20% discount)
    "package_6": { price: 10000, currency_amount: 120, name: "120 Tickets - $100.00" }, // $100 = 120 tickets (20% discount)
};

const createStripeCustomer = async (req, res) => {
    try {
        const { userId, email, name } = req.body;

        // Check if user exists
        const user = await Users.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if customer already exists
        const existingCustomer = await StripeCustomer.findOne({ userId });
        if (existingCustomer) {
            return res.status(400).json({ message: 'Customer already exists' });
        }

        // Create Stripe customer
        const stripeCustomer = await stripe.customers.create({
            email,
            name,
            description: `Customer for currency purchases - ${name}`
        });

        // Create local customer record
        const customer = new StripeCustomer({
            userId,
            stripeCustomerId: stripeCustomer.id,
            email,
            name,
            currencyBalance: 0
        });

        await customer.save();

        res.status(201).json({
            status: 'success',
            userId,
            stripeCustomerId: stripeCustomer.id,
            message: 'Customer created successfully'
        });

    } catch (error) {
        console.error('Error creating Stripe customer:', error);
        res.status(500).json({ message: error.message });
    }
};

const attachPaymentMethod = async (req, res) => {
    try {
        const { userId, paymentMethodId } = req.body;
        console.log('Attaching payment method:', { userId, paymentMethodId });

        // Find customer
        const customer = await StripeCustomer.findOne({ userId });
        if (!customer) {
            console.log('Customer not found for userId:', userId);
            return res.status(404).json({ message: 'Customer not found' });
        }

        console.log('Found customer:', customer._id);

        // Handle test tokens vs real payment methods
        if (paymentMethodId.startsWith('pm_card_')) {
            // Test token - store directly
            console.log('Using test token, storing directly');
            customer.defaultPaymentMethod = paymentMethodId;
            await customer.save();
            console.log('Payment method saved:', customer.defaultPaymentMethod);

            return res.status(200).json({
                status: 'success',
                message: 'Test payment method configured for customer',
                paymentMethodId
            });
        } else {
            // Real payment method - attach to Stripe
            await stripe.paymentMethods.attach(paymentMethodId, {
                customer: customer.stripeCustomerId
            });

            // Set as default payment method
            await stripe.customers.update(customer.stripeCustomerId, {
                invoice_settings: {
                    default_payment_method: paymentMethodId
                }
            });

            customer.defaultPaymentMethod = paymentMethodId;
            await customer.save();

            return res.status(200).json({
                status: 'success',
                message: 'Payment method attached and set as default',
                paymentMethodId
            });
        }

    } catch (error) {
        console.error('Error attaching payment method:', error);
        res.status(500).json({ message: error.message });
    }
};

const purchaseCurrency = async (req, res) => {
    try {
        const { userId, packageId } = req.body;

        // Validate customer exists
        const customer = await StripeCustomer.findOne({ userId });
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Validate package exists
        if (!CURRENCY_PACKAGES[packageId]) {
            return res.status(400).json({ message: 'Invalid package ID' });
        }

        const packageData = CURRENCY_PACKAGES[packageId];

        // Check if customer has payment method
        if (!customer.defaultPaymentMethod) {
            return res.status(400).json({ 
                message: 'No payment method attached. Please attach a payment method first.' 
            });
        }

        // Create and confirm PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: packageData.price,
            currency: 'usd',
            customer: customer.stripeCustomerId,
            payment_method: customer.defaultPaymentMethod,
            confirm: true,
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never'
            },
            metadata: {
                userId: userId,
                packageId: packageId,
                currencyAmount: packageData.currency_amount.toString()
            }
        });

        if (paymentIntent.status === 'succeeded') {
            // Update currency balance
            customer.currencyBalance += packageData.currency_amount;
            await customer.save();

            // Update user's ticket balance
            const user = await Users.findById(userId);
            if (user) {
                user.ticketBalance += packageData.currency_amount;
                await user.save();
            }

            // Record transaction
            const transaction = new StripeTransaction({
                userId,
                stripeCustomerId: customer.stripeCustomerId,
                amountPaid: packageData.price,
                currencyPurchased: packageData.currency_amount,
                packageName: packageData.name,
                packageId,
                stripePaymentId: paymentIntent.id,
                status: 'completed'
            });

            await transaction.save();

            return res.status(200).json({
                status: 'success',
                transactionId: transaction._id,
                currencyPurchased: packageData.currency_amount,
                newBalance: customer.currencyBalance,
                message: 'Currency purchase successful'
            });
        } else {
            return res.status(400).json({ 
                message: `Payment failed: ${paymentIntent.status}` 
            });
        }

    } catch (error) {
        console.error('Error purchasing currency:', error);
        
        if (error.type === 'StripeCardError') {
            return res.status(400).json({ 
                message: 'Card was declined. Please try a different payment method.' 
            });
        }
        
        res.status(500).json({ message: error.message });
    }
};

const getCustomer = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('Getting customer for userId:', userId);

        const customer = await StripeCustomer.findOne({ userId });
        if (!customer) {
            console.log('Customer not found for userId:', userId);
            return res.status(404).json({ message: 'Customer not found' });
        }

        console.log('Customer found:', {
            userId: customer.userId,
            defaultPaymentMethod: customer.defaultPaymentMethod,
            currencyBalance: customer.currencyBalance
        });

        res.status(200).json({
            userId: customer.userId,
            email: customer.email,
            name: customer.name,
            currencyBalance: customer.currencyBalance,
            stripeCustomerId: customer.stripeCustomerId,
            defaultPaymentMethod: customer.defaultPaymentMethod,
            createdAt: customer.createdAt
        });

    } catch (error) {
        console.error('Error getting customer:', error);
        res.status(500).json({ message: error.message });
    }
};

const getPackages = async (req, res) => {
    try {
        const packages = Object.entries(CURRENCY_PACKAGES).map(([packageId, packageData]) => ({
            packageId,
            name: packageData.name,
            priceCents: packageData.price,
            priceDollars: packageData.price / 100,
            currencyAmount: packageData.currency_amount
        }));

        res.status(200).json({ packages });

    } catch (error) {
        console.error('Error getting packages:', error);
        res.status(500).json({ message: error.message });
    }
};

const getTransactions = async (req, res) => {
    try {
        const { userId } = req.params;

        const transactions = await StripeTransaction.find({ userId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            userId,
            transactions: transactions.map(tx => ({
                transactionId: tx._id,
                amountPaid: tx.amountPaid,
                currencyPurchased: tx.currencyPurchased,
                packageName: tx.packageName,
                timestamp: tx.createdAt,
                status: tx.status
            }))
        });

    } catch (error) {
        console.error('Error getting transactions:', error);
        res.status(500).json({ message: error.message });
    }
};

// Stripe Checkout Session (redirects to checkout.stripe.com)
const createCheckoutSession = async (req, res) => {
    try {
        const { userId, packageId } = req.body;

        // Validate customer exists
        const customer = await StripeCustomer.findOne({ userId });
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Validate package exists
        if (!CURRENCY_PACKAGES[packageId]) {
            return res.status(400).json({ message: 'Invalid package ID' });
        }

        const packageData = CURRENCY_PACKAGES[packageId];

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: customer.stripeCustomerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: packageData.name,
                            description: `${packageData.currency_amount} tickets`,
                        },
                        unit_amount: packageData.price,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/buytickets?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/buytickets?canceled=true`,
            metadata: {
                userId: userId,
                packageId: packageId,
                currencyAmount: packageData.currency_amount.toString()
            }
        });

        res.status(200).json({
            sessionId: session.id,
            url: session.url
        });

    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createStripeCustomer,
    attachPaymentMethod,
    purchaseCurrency,
    getCustomer,
    getPackages,
    getTransactions,
    createCheckoutSession
};
