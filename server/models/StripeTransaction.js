const mongoose = require("mongoose");

const stripeTransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    stripeCustomerId: {
        type: String,
        required: true
    },
    amountPaid: {
        type: Number,
        required: true
    },
    currencyPurchased: {
        type: Number,
        required: true
    },
    packageName: {
        type: String,
        required: true
    },
    packageId: {
        type: String,
        required: true
    },
    stripePaymentId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['completed', 'failed', 'pending'],
        default: 'completed'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const StripeTransaction = mongoose.model("StripeTransaction", stripeTransactionSchema);

module.exports = StripeTransaction;
