const cron = require('node-cron');
const Item = require('../models/Items');

// Helper function to select winner using weighted random selection
const selectWinner = (item) => {
  if (!item.participants || item.participants.length === 0) {
    throw new Error('No participants in raffle');
  }

  // Create weighted array where each userId appears N times (N = ticketsSpent)
  const entries = [];
  item.participants.forEach(participant => {
    for (let i = 0; i < participant.ticketsSpent; i++) {
      entries.push(participant.userId);
    }
  });

  // Random selection
  const randomIndex = Math.floor(Math.random() * entries.length);
  const winnerId = entries[randomIndex];

  return winnerId;
};

async function applyBusinessRules(doc) {
  const now = new Date();

  // Calculate tickets sold
  doc.ticketsSold = doc.participants.reduce(
    (sum, p) => sum + (p.ticketsSpent || 0),
    0
  );

  // Cap ticket cost
  if (doc.ticketCost > doc.ticketGoal * 0.5) {
    doc.ticketCost = Math.round(doc.ticketGoal * 0.5);
  }

  // Determine status
  if (doc.ticketsSold >= doc.ticketGoal) {
    // Goal has been met
    if (doc.confirmationDeadline === null) {
      // First time reaching goal - set confirmation deadline to 24 hours from now
      doc.confirmationDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      doc.status = 'awaiting_confirmation';
    } else if (doc.status === 'awaiting_confirmation' && now >= doc.confirmationDeadline && doc.sellerConfirmed === null) {
      // Deadline passed without seller decision - auto-confirm
      doc.sellerConfirmed = true;
    } else if (doc.sellerConfirmed === false) {
      // Seller cancelled
      doc.status = 'cancelled';
    } else if (doc.sellerConfirmed === true && doc.winnerId) {
      // Winner selected
      doc.status = 'ended';
    } else if (doc.status !== 'awaiting_confirmation') {
      // Keep awaiting_confirmation status if still pending
      doc.status = 'awaiting_confirmation';
    }
  } else if (now >= doc.endDate) {
    // Time expired without meeting goal
    doc.status = 'not_met';
  } else {
    // Still active
    doc.status = 'live';
  }
}

// Run every hour (at minute 0)
function startRaffleStatusJob() {
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running raffle status job...');
    try {
      const items = await Item.find();

      for (const item of items) {
        const prevStatus = item.status;
        const prevSellerConfirmed = item.sellerConfirmed;
        
        await applyBusinessRules(item);

        // Check if auto-confirmation happened
        if (item.sellerConfirmed === true && prevSellerConfirmed === null && item.status === 'awaiting_confirmation') {
          // Auto-confirmed, now select winner
          try {
            const winnerId = selectWinner(item);
            item.winnerId = winnerId;
            item.status = 'ended';
            console.log(`🎉 Auto-confirmed raffle ${item._id} and selected winner ${winnerId}`);
          } catch (error) {
            console.error(`❌ Error selecting winner for raffle ${item._id}:`, error.message);
          }
        }

        if (item.isModified('status') || item.status !== prevStatus || item.isModified('sellerConfirmed')) {
          await item.save();
        }
      }

      console.log('✅ Raffle status job completed successfully.');
    } catch (err) {
      console.error('❌ Raffle status job failed:', err);
    }
  });
}

module.exports = startRaffleStatusJob;