const cron = require('node-cron');
const Item = require('./models/Items');
const Users = require('./models/Users');
const axios = require('axios');

// Function to select winner for a raffle
async function selectWinnerForRaffle(raffle) {
    try {
        const entries = [];
        raffle.participants.forEach((participant) => {
            for (let i = 0; i < participant.ticketsSpent; i++) {
                entries.push(participant.userId);
            }
        });

        if (entries.length === 0) {
            console.log(`No participants found for raffle ${raffle._id}`);
            return null;
        }

        const randomIndex = Math.floor(Math.random() * entries.length);
        const winnerId = entries[randomIndex];
        const winner = await Users.findById(winnerId).select('email');

        if (!winner) {
            console.log(`Winner not found for raffle ${raffle._id}`);
            return null;
        }

        // Update raffle with winner
        await Item.findByIdAndUpdate(raffle._id, {
            winnerId: winnerId,
            winnerEmail: winner.email,
            status: 'ended'
        });

        // Send winner notification email
        try {
            const seller = await Users.findById(raffle.sellerId).select('email');
            const winnerData = {
                winner_id: winnerId,
                item_id: raffle._id,
                winner_email: winner.email,
                item_title: raffle.title,
                seller_email: seller.email,
                ticket_cost: raffle.ticketCost,
                tickets_spent: raffle.participants.find(
                    (p) => p.userId.toString() === winnerId.toString()
                )?.ticketsSpent || 0,
                charity_overflow: raffle.charityOverflow || 0,
            };

            // Call Python backend to send email
            await axios.post(
                'http://localhost:8000/send-raffle-winner-email',
                winnerData
            );
            console.log(`Winner notification email sent for raffle ${raffle._id}`);
        } catch (emailError) {
            console.error(
                `Failed to send winner notification email for raffle ${raffle._id}:`,
                emailError
            );
        }

        return { winnerId, winnerEmail: winner.email };
    } catch (error) {
        console.error(`Error selecting winner for raffle ${raffle._id}:`, error);
        return null;
    }
}

// Function to process ended raffles
async function processEndedRaffles() {
    try {
        console.log('🕐 Running cron job: Processing ended raffles...');
        
        const now = new Date();
        
        // Find raffles that have ended but don't have winners yet
        const endedRaffles = await Item.find({
            endDate: { $lte: now },
            status: { $in: ['live', 'goal_met_grace_period'] },
            winnerId: { $exists: false },
            participants: { $exists: true, $not: { $size: 0 } }
        }).populate('participants.userId');

        console.log(`Found ${endedRaffles.length} raffles that need winner selection`);

        for (const raffle of endedRaffles) {
            console.log(`Processing raffle: ${raffle.title} (${raffle._id})`);
            
            // Process charity overflow if applicable
            if (raffle.charityOverflow > 0) {
                const charityAmount = Math.floor(raffle.charityOverflow * 0.7);
                const sellerRefund = Math.floor(raffle.charityOverflow * 0.3);

                // Update seller's ticket balance and revenue
                if (sellerRefund > 0) {
                    await Users.findByIdAndUpdate(raffle.sellerId, {
                        $inc: {
                            ticketBalance: sellerRefund,
                            totalRevenue: sellerRefund,
                        },
                    });
                    console.log(`Updated seller balance for raffle ${raffle._id}: +${sellerRefund} tickets`);
                }

                // Update charity overflow amount
                await Item.findByIdAndUpdate(raffle._id, {
                    charityOverflow: charityAmount
                });
            }

            // Select winner
            const winner = await selectWinnerForRaffle(raffle);
            if (winner) {
                console.log(`✅ Winner selected for raffle ${raffle._id}: ${winner.winnerEmail}`);
            } else {
                console.log(`❌ Failed to select winner for raffle ${raffle._id}`);
            }
        }

        console.log('✅ Cron job completed successfully');
    } catch (error) {
        console.error('❌ Error in cron job:', error);
    }
}

// Schedule cron job to run every hour
cron.schedule('0 * * * *', processEndedRaffles, {
    scheduled: true,
    timezone: "America/New_York"
});

// Also run immediately on startup (for testing)
console.log('🚀 Starting raffle cron job...');
processEndedRaffles();

module.exports = {
    processEndedRaffles,
    selectWinnerForRaffle
};
