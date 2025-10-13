const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    condition: {
        type: String,
        required: true,
    },
    images: [
        {
            type: String,
            required: true,
        },
    ],
    category: [
        {
            type: String,
            required: true,
        },
    ],

    aiVerificationScore: {
        type: Number,
        required: true,
    },

    ticketCost: {
        type: Number,
        required: true,
    },
    ticketGoal: {
        type: Number,
        required: true,
    },
    ticketsSold: {
        type: Number,
        required: true,
    },

    participants: [
        // simple embedded array for hackathon
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Users',
                required: true,
            },
            ticketsSpent: {
                type: Number,
                required: true,
            },
            joinedAt: {
                type: Date,
                required: true,
            },
        },
    ],

    status: {
        type: String,
        required: true,
        enum: [
            'live',
            'goal_met',
            'goal_met_grace_period',
            'ended',
            'not_met',
            'not_met_pending_decision',
            'awaiting_confirmation',
            'cancelled',
        ],
    },
    winnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
    },
    confirmationDeadline: {
        type: Date,
        default: null,
    },
    sellerConfirmed: {
        type: Boolean,
        default: null,
    },
    endDate: {
        type: Date,
        required: true,
    },
    charityOverflow: {
        type: Number,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
    },
});

async function applyBusinessRules(doc) {
    const now = new Date();

    // Recalculate ticketsSold
    doc.ticketsSold = doc.participants.reduce(
        (sum, p) => sum + (p.ticketsSpent || 0),
        0
    );

    // Ensure ticketCost reasonable
    if (doc.ticketCost > doc.ticketGoal * 0.5) {
        doc.ticketCost = Math.round(doc.ticketGoal * 0.5);
    }

    // Calculate charity overflow when tickets exceed goal
    if (doc.ticketsSold > doc.ticketGoal) {
        // Calculate overflow tickets and their revenue value
        const overflowTickets = doc.ticketsSold - doc.ticketGoal;
        doc.charityOverflow = overflowTickets;
    } else {
        doc.charityOverflow = 0;
    }

    // Determine status
    if (doc.ticketsSold >= doc.ticketGoal) {
        // Goal has been met - seller has 24 hours to decide
        if (doc.confirmationDeadline === null) {
            // First time reaching goal - set 24-hour grace period
            doc.confirmationDeadline = new Date(
                now.getTime() + 24 * 60 * 60 * 1000
            );
            doc.status = 'goal_met_grace_period';
        } else if (doc.status === 'goal_met_grace_period') {
            // Check if grace period has expired
            if (now >= doc.confirmationDeadline) {
                // Grace period expired - raffle continues until end date
                doc.status = 'live';
                doc.confirmationDeadline = null; // Clear deadline
            }
        } else if (doc.sellerConfirmed === true && doc.winnerId) {
            // Seller chose to end early - winner selected
            doc.status = 'ended';
        } else if (doc.sellerConfirmed === false) {
            // Seller cancelled during grace period
            doc.status = 'cancelled';
        }
    } else if (now >= doc.endDate) {
        // Time expired without meeting goal - seller needs to decide
        if (doc.ticketsSold > 0) {
            // Has participants - seller can choose to end or extend
            doc.status = 'not_met_pending_decision';
        } else {
            // No participants - automatically mark as not met
            doc.status = 'not_met';
        }
    } else {
        // Still active
        doc.status = 'live';
    }

    // Process charity overflow when event ends
    if (now >= doc.endDate && doc.charityOverflow > 0) {
        // 70% goes to charity (store for future processing)
        const charityAmount = Math.floor(doc.charityOverflow * 0.7);
        // 30% goes back to seller ticket balance
        const sellerRefund = Math.floor(doc.charityOverflow * 0.3);

        // Update seller's ticket balance and revenue
        if (sellerRefund > 0) {
            await Users.findByIdAndUpdate(doc.sellerId, {
                $inc: {
                    ticketBalance: sellerRefund,
                    totalRevenue: sellerRefund,
                },
            });
        }

        // Store charity amount for future processing
        doc.charityOverflow = charityAmount;
    }
}
  
  itemSchema.pre('save', async function (next) {
    await applyBusinessRules(this);
    next();
  });
  
  itemSchema.pre('findOneAndUpdate', async function (next) {
    const update = this.getUpdate();
  
    // Fetch current document to reapply logic correctly
    const doc = await this.model.findOne(this.getQuery());
    if (!doc) return next();
  
    Object.assign(doc, update.$set || update);
    await applyBusinessRules(doc);
  
    // Apply back to update
    this.setUpdate({ $set: doc });
    next();
  });

const Item = mongoose.model("Item", itemSchema);

module.exports = Item;