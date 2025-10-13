const Item = require("../models/Items");
const Users = require("../models/Users");
const mongoose = require("mongoose");

const createItem = async (req, res) => {
    try {
        const newItem = new Item(req.body);
        await newItem.save();
        return res.status(201).json(newItem);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getItems = async (req, res) => {
    try {
        const items = await Item.find();
        return res.status(200).json(items);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id).populate('sellerId');
        return res.status(200).json(item);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const updateItem = async (req, res) => {
    try {
        const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
        return res.status(200).json(item);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const deleteItem = async (req, res) => {
    try {
        const item = await Item.findByIdAndDelete(req.params.id);
        return res.status(200).json(item);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getItemsBySellerId = async (req, res) => {
    try {
        const items = await Item.find({ sellerId: req.params.sellerId }).populate('sellerId');
        return res.status(200).json(items);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getAllTickersSoldBySeller = async (req, res) => {
    try {
        const items = await Item.find({ sellerId: req.params.sellerId }).select('ticketsSold').populate('sellerId');
        const ticketsSold = items.reduce((acc, item) => acc + item.ticketsSold, 0);
        return res.status(200).json(ticketsSold);
    } catch (error) {
        return res.status(500).json({ message: error.message });    
    }
}

const getItemsByBuyerId = async (req, res) => {
    try {
        const items = await Item.find({ participants: { $elemMatch: { userId: req.params.buyerId } } }).populate('sellerId');
        return res.status(200).json(items);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getRandomItems = async (req, res) => {
    try {
        const item = await Item.aggregate([{ $sample: { size: parseInt(req.params.size) } }]).populate('sellerId');
        return res.status(200).json(item);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const enterRaffle = async (req, res) => {
    try {
        const { userId, itemId, quantity } = req.body;

        // Validate input
        if (!userId || !itemId || !quantity || quantity < 1) {
            return res.status(400).json({
                message:
                    'Invalid input. userId, itemId, and quantity (>0) are required.',
            });
        }

        // Fetch user and item with session
        const user = await Users.findById(userId);
        const item = await Item.findById(itemId);

        // Check if user exists
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check if item exists
        if (!item) {
            return res.status(404).json({ message: 'Raffle not found.' });
        }

        // Check if raffle is live
        if (item.status !== 'live' && item.status !== 'goal_met_grace_period') {
            return res.status(400).json({
                message: 'This raffle is not currently accepting entries.',
            });
        }

        // Calculate total cost
        const totalCost = quantity * item.ticketCost;

        // Check if user has sufficient balance
        if (user.ticketBalance < totalCost) {
            return res.status(400).json({
                message: `Insufficient balance. You need ${totalCost} tickets but only have ${user.ticketBalance}.`,
            });
        }

        // With new rules: allow unlimited entries even after goal is met
        // No ticket limit restrictions - only limited by user balance

        // Update user balance
        user.ticketBalance -= totalCost;
        user.totalSpent += totalCost;
        await user.save();

        // Update seller revenue based on goal status
        const seller = await Users.findById(item.sellerId);
        if (seller) {
            if (item.ticketsSold < item.ticketGoal) {
                // Before goal: 100% revenue goes to seller
                seller.ticketBalance += totalCost;
                seller.totalRevenue += totalCost;
                await seller.save();
            }
            // After goal: revenue goes to charity overflow (handled in business rules)
        }

        // Update item participants
        const existingParticipant = item.participants.find(
            (p) => p.userId.toString() === userId
        );

        if (existingParticipant) {
            // User already participated, increment their ticket count
            existingParticipant.ticketsSpent += totalCost;
        } else {
            // New participant
            item.participants.push({
                userId: new mongoose.Types.ObjectId(userId),
                ticketsSpent: totalCost,
                joinedAt: new Date(),
            });
        }

        // Update tickets sold (this will trigger the pre-save hook to recalculate)
        item.ticketsSold += totalCost;
        console.log(item.ticketsSold);
        await item.save();

        // Fetch updated item with populated sellerId for response
        const updatedItem = await Item.findById(itemId).populate('sellerId');

        return res.status(200).json({
            message: 'Successfully entered raffle!',
            item: updatedItem,
            user: {
                _id: user._id,
                ticketBalance: user.ticketBalance,
                totalSpent: user.totalSpent,
            },
        });
    } catch (error) {
        console.error('Error entering raffle:', error);
        return res.status(500).json({ message: error.message });
    }
};

// Helper function to select winner using weighted random selection
const selectWinner = async (item) => {
    if (!item.participants || item.participants.length === 0) {
        throw new Error('No participants in raffle');
    }

    // Create weighted array where each userId appears N times (N = ticketsSpent)
    const entries = [];
    item.participants.forEach((participant) => {
        for (let i = 0; i < participant.ticketsSpent; i++) {
            entries.push(participant.userId);
        }
    });

    // Random selection
    const randomIndex = Math.floor(Math.random() * entries.length);
    const winnerId = entries[randomIndex];
    const winnerEmail = await Users.findById(winnerId).select('email');

    return { winnerId, winnerEmail };
};

const confirmRaffle = async (req, res) => {
    try {
        const { itemId, sellerId } = req.body;

        // Validate input
        if (!itemId || !sellerId) {
            return res
                .status(400)
                .json({ message: 'itemId and sellerId are required.' });
        }

        // Fetch item
        const item = await Item.findById(itemId);

        if (!item) {
            return res.status(404).json({ message: 'Raffle not found.' });
        }

        // Verify user is the seller
        if (item.sellerId.toString() !== sellerId) {
            return res
                .status(403)
                .json({ message: 'Only the seller can confirm this raffle.' });
        }

        // Check status - allow confirmation during grace period
        if (item.status !== 'goal_met_grace_period') {
            return res.status(400).json({
                message: 'Raffle is not in grace period for confirmation.',
            });
        }

        // Check if already confirmed
        if (item.sellerConfirmed === true) {
            return res
                .status(400)
                .json({ message: 'Raffle already confirmed.' });
        }

        // Confirm the raffle
        item.sellerConfirmed = true;

        // Select winner
        const { winnerId, winnerEmail } = await selectWinner(item);
        item.winnerId = winnerId;
        item.winnerEmail = winnerEmail;
        item.status = 'ended';

        await item.save();

        // Fetch updated item with populated fields
        const updatedItem = await Item.findById(itemId)
            .populate('sellerId')
            .populate('winnerId');

        // Send winner notification email
        try {
            const axios = require('axios');
            const winnerData = {
                winner_id: winnerId,
                item_id: itemId,
                winner_email: winnerEmail.email,
                item_title: item.title,
                seller_email: updatedItem.sellerId.email,
                ticket_cost: item.ticketCost,
                tickets_spent:
                    item.participants.find(
                        (p) => p.userId.toString() === winnerId.toString()
                    )?.ticketsSpent || 0,
                charity_overflow: item.charityOverflow || 0,
            };

            // Call Python backend to send email (with timeout)
            await axios.post(
                'http://localhost:8000/send-raffle-winner-email',
                winnerData
            );
            console.log('Winner notification email sent successfully');
        } catch (emailError) {
            console.log(
                'Email service unavailable - continuing without email notification'
            );
            // Don't fail the request if email fails
        }

        return res.status(200).json({
            message: 'Raffle confirmed and winner selected!',
            item: updatedItem,
            winner: {
                winnerId: winnerId,
                winnerEmail: winnerEmail.email,
            },
        });
    } catch (error) {
        console.error('Error confirming raffle:', error);
        return res.status(500).json({ message: error.message });
    }
};

const cancelRaffle = async (req, res) => {
    try {
        const { itemId, sellerId } = req.body;

        // Validate input
        if (!itemId || !sellerId) {
            return res
                .status(400)
                .json({ message: 'itemId and sellerId are required.' });
        }

        // Fetch item
        const item = await Item.findById(itemId);

        if (!item) {
            return res.status(404).json({ message: 'Raffle not found.' });
        }

        // Verify user is the seller
        if (item.sellerId.toString() !== sellerId) {
            return res
                .status(403)
                .json({ message: 'Only the seller can cancel this raffle.' });
        }

        // Check status - allow cancellation during grace period
        if (item.status !== 'goal_met_grace_period') {
            return res
                .status(400)
                .json({
                    message: 'Raffle is not in grace period for cancellation.',
                });
        }

        // Check deadline - must be within 24 hours
        const now = new Date();
        if (item.confirmationDeadline && now >= item.confirmationDeadline) {
            return res.status(400).json({
                message:
                    'Cancellation deadline has passed. Raffle will be auto-confirmed.',
            });
        }

        // Process refunds for all participants
        const refundSummary = [];

        for (const participant of item.participants) {
            const refundAmount = participant.ticketsSpent * item.ticketCost;

            // Update user balance
            const user = await Users.findById(participant.userId).session(
                session
            );
            if (user) {
                user.ticketBalance += refundAmount;
                user.totalSpent -= refundAmount;
                await user.save();

                refundSummary.push({
                    userId: participant.userId,
                    refundAmount: refundAmount,
                });
            }
        }

        // Update item status
        item.sellerConfirmed = false;
        item.status = 'cancelled';
        await item.save();

        // Commit transaction

        return res.status(200).json({
            message: 'Raffle cancelled and refunds processed.',
            item: item,
            refundSummary: refundSummary,
        });
    } catch (error) {
        console.error('Error cancelling raffle:', error);
        return res.status(500).json({ message: error.message });
    }
};

const endRaffleNotMet = async (req, res) => {
    try {
        const { itemId, sellerId } = req.body;

        // Validate input
        if (!itemId || !sellerId) {
            return res.status(400).json({
                message: 'itemId and sellerId are required.',
            });
        }

        // Fetch item
        const item = await Item.findById(itemId);

        if (!item) {
            return res.status(404).json({ message: 'Raffle not found.' });
        }

        // Verify user is the seller
        if (item.sellerId.toString() !== sellerId) {
            return res.status(403).json({
                message: 'Only the seller can end this raffle.',
            });
        }

        // Check status
        if (item.status !== 'not_met_pending_decision') {
            return res.status(400).json({
                message: 'Raffle is not in pending decision status.',
            });
        }

        // Refund all participants
        for (const participant of item.participants) {
            const user = await Users.findById(participant.userId);
            if (user) {
                user.ticketBalance += participant.ticketsSpent;
                await user.save();
            }
        }

        // Update raffle status
        item.status = 'not_met';
        await item.save();

        return res.status(200).json({
            message: 'Raffle ended and all participants refunded.',
            refundedAmount: item.participants.reduce(
                (sum, p) => sum + p.ticketsSpent,
                0
            ),
        });
    } catch (error) {
        console.error('Error ending raffle:', error);
        return res.status(500).json({ message: error.message });
    }
};

const extendRaffle = async (req, res) => {
    try {
        const { itemId, sellerId, newEndDate } = req.body;

        // Validate input
        if (!itemId || !sellerId || !newEndDate) {
            return res.status(400).json({
                message: 'itemId, sellerId, and newEndDate are required.',
            });
        }

        // Validate new end date is in the future
        const newDate = new Date(newEndDate);
        if (newDate <= new Date()) {
            return res.status(400).json({
                message: 'New end date must be in the future.',
            });
        }

        // Fetch item
        const item = await Item.findById(itemId);

        if (!item) {
            return res.status(404).json({ message: 'Raffle not found.' });
        }

        // Verify user is the seller
        if (item.sellerId.toString() !== sellerId) {
            return res.status(403).json({
                message: 'Only the seller can extend this raffle.',
            });
        }

        // Check status
        if (item.status !== 'not_met_pending_decision') {
            return res.status(400).json({
                message: 'Raffle is not in pending decision status.',
            });
        }

        // Update end date and status
        item.endDate = newDate;
        item.status = 'live';
        await item.save();

        return res.status(200).json({
            message:
                'Raffle extended successfully. All participants have been notified.',
            newEndDate: newDate,
        });
    } catch (error) {
        console.error('Error extending raffle:', error);
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createItem,
    getItems,
    getItem,
    updateItem,
    deleteItem,
    getItemsBySellerId,
    getAllTickersSoldBySeller,
    getItemsByBuyerId,
    getRandomItems,
    enterRaffle,
    confirmRaffle,
    cancelRaffle,
    endRaffleNotMet,
    extendRaffle,
};