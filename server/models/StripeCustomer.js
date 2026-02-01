const mongoose = require("mongoose");

const stripeCustomerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
        unique: true
    },
    stripeCustomerId: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    currencyBalance: {
        type: Number,
        default: 0
    },
    defaultPaymentMethod: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const StripeCustomer = mongoose.model("StripeCustomer", stripeCustomerSchema);

module.exports = StripeCustomer;
