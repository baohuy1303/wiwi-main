import axios from "axios";

const url = 'http://localhost:3000/api';
const pythonUrl = 'http://localhost:8000';

export const getUser = async (id: string) => {
    try {
        const response = await axios.get(`${url}/user/get/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching user:', error);
        throw error;
    }
};

export const loginUser = async (email: string, password: string) => {
    try {
        const response = await axios.post(`${url}/user/login`, {
            email,
            password,
        });
        return response.data;
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
};

export const createUser = async (userData: any) => {
    try {
        const response = await axios.post(`${url}/user/post`, userData);
        return response.data;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

// Stripe API functions
export const createStripeCustomer = async (
    userId: string,
    email: string,
    name: string
) => {
    try {
        const response = await axios.post(`${url}/stripe/create-customer`, {
            userId,
            email,
            name,
        });
        return response.data;
    } catch (error) {
        console.error('Error creating Stripe customer:', error);
        throw error;
    }
};

export const attachPaymentMethod = async (
    userId: string,
    paymentMethodId: string
) => {
    try {
        const response = await axios.post(
            `${url}/stripe/attach-payment-method`,
            {
                userId,
                paymentMethodId,
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error attaching payment method:', error);
        throw error;
    }
};

export const purchaseCurrency = async (userId: string, packageId: string) => {
    try {
        const response = await axios.post(`${url}/stripe/purchase-currency`, {
            userId,
            packageId,
        });
        return response.data;
    } catch (error) {
        console.error('Error purchasing currency:', error);
        throw error;
    }
};

export const getStripeCustomer = async (userId: string) => {
    try {
        const response = await axios.get(`${url}/stripe/customer/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error getting Stripe customer:', error);
        throw error;
    }
};

export const getStripePackages = async () => {
    try {
        const response = await axios.get(`${url}/stripe/packages`);
        return response.data;
    } catch (error) {
        console.error('Error getting Stripe packages:', error);
        throw error;
    }
};

export const getStripeTransactions = async (userId: string) => {
    try {
        const response = await axios.get(
            `${url}/stripe/transactions/${userId}`
        );
        return response.data;
    } catch (error) {
        console.error('Error getting Stripe transactions:', error);
        throw error;
    }
};

// Stripe Checkout (redirects to checkout.stripe.com)
export const createCheckoutSession = async (
    userId: string,
    packageId: string
) => {
    try {
        const response = await axios.post(
            `${url}/stripe/create-checkout-session`,
            {
                userId,
                packageId,
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error creating checkout session:', error);
        throw error;
    }
};

export const getItemsBySellerId = async (userId: string) => {
    try {
        const response = await axios.get(`${url}/item/getBySellerID/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching items:', error);
        throw error;
    }
};

export const getAllTickersSoldBySeller = async (sellerId: string) => {
    try {
        const response = await axios.get(
            `${url}/item/getAllTickersSoldBySeller/${sellerId}`
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching all tickets sold:', error);
        throw error;
    }
};

export const getItemsByBuyerId = async (buyerId: string) => {
    try {
        const response = await axios.get(`${url}/item/getByBuyerId/${buyerId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching items:', error);
        throw error;
    }
};

// Upload image and metadata for AI analysis
export const analyzeItem = async (data: FormData) => {
    try {
        const response = await axios.post(
            'http://localhost:8000/agent/analyze_images',
            data,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error analyzing item:', error);
        throw error;
    }
};

// Create a new raffle item
export const createItem = async (itemData: any) => {
    try {
        const response = await axios.post(`${url}/item/post`, itemData);
        return response.data;
    } catch (error) {
        console.error('Error creating item:', error);
        throw error;
    }
};

export const getRandomItems = async (size: number) => {
    try {
        const response = await axios.get(`${url}/item/getRandomItems/${size}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching random items:', error);
        throw error;
    }
};
export const getAllItems = async () => {
    try {
        const response = await axios.get(`${url}/item/get`);
        return response.data;
    } catch (error) {
        console.error('Error fetching all items:', error);
        throw error;
    }
};

export const getItemById = async (id: string) => {
    try {
        const response = await axios.get(`${url}/item/get/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching item by id:', error);
        throw error;
    }
};

export const enterRaffle = async (
    userId: string,
    itemId: string,
    quantity: number
) => {
    try {
        const response = await axios.post(`${url}/item/enter-raffle`, {
            userId,
            itemId,
            quantity,
        });
        return response.data;
    } catch (error) {
        console.error('Error entering raffle:', error);
        throw error;
    }
};

export const confirmRaffle = async (itemId: string, sellerId: string) => {
    try {
        const response = await axios.post(`${url}/item/confirm-raffle`, {
            itemId,
            sellerId,
        });
        return response.data;
    } catch (error) {
        console.error('Error confirming raffle:', error);
        throw error;
    }
};

export const cancelRaffle = async (itemId: string, sellerId: string) => {
    try {
        const response = await axios.post(`${url}/item/cancel-raffle`, {
            itemId,
            sellerId,
        });
        return response.data;
    } catch (error) {
        console.error('Error cancelling raffle:', error);
        throw error;
    }
};

// Send winner notification email via Python backend
export const sendWinnerNotification = async (winnerData: {
    winner_id: string;
    item_id: string;
    winner_email: string;
    item_title: string;
    seller_email: string;
    ticket_cost: number;
    tickets_spent: number;
    charity_overflow?: number;
}) => {
    try {
        const response = await axios.post(
            `${pythonUrl}/send-raffle-winner-email`,
            winnerData
        );
        return response.data;
    } catch (error) {
        console.error('Error sending winner notification:', error);
        throw error;
    }
};

// End raffle that didn't meet goal (with refunds)
export const endRaffleNotMet = async (itemId: string, sellerId: string) => {
    try {
        const response = await axios.post(`${url}/item/end-raffle-not-met`, {
            itemId,
            sellerId,
        });
        return response.data;
    } catch (error) {
        console.error('Error ending raffle:', error);
        throw error;
    }
};

// Extend raffle that didn't meet goal
export const extendRaffle = async (itemId: string, sellerId: string, newEndDate: string) => {
    try {
        const response = await axios.post(`${url}/item/extend-raffle`, {
            itemId,
            sellerId,
            newEndDate,
        });
        return response.data;
    } catch (error) {
        console.error('Error extending raffle:', error);
        throw error;
    }
};
