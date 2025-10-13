const express = require("express");
const cors = require("cors");
const connect = require("./connect");
const userRoutes = require("./routes/Users");
const itemRoutes = require("./routes/Items");
const stripeRoutes = require('./routes/Stripe');
const raffleStatusJob = require('./jobs/raffleStatusJob');
const cronJobs = require('./cronJobs');

// Import models to register them with Mongoose
require('./models/Users');
require('./models/Items');
require('./models/StripeCustomer');
require('./models/StripeTransaction');

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.use('/api', userRoutes);
app.use('/api', itemRoutes);
app.use('/api', stripeRoutes);

// Manual trigger endpoint for testing cron job
app.post('/api/cron/process-ended-raffles', async (req, res) => {
    try {
        await cronJobs.processEndedRaffles();
        res.json({ message: 'Cron job executed successfully' });
    } catch (error) {
        console.error('Error executing cron job:', error);
        res.status(500).json({
            message: 'Error executing cron job',
            error: error.message,
        });
    }
});

connect
    .connectToServer()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            raffleStatusJob();
            console.log('🕐 Raffle cron job started - runs every hour');
        });
    })
    .catch((err) => {
        console.error('Failed to connect to DB:', err);
    });