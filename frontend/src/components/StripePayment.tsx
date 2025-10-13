import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { useUser } from '@/UserContext';
import { useSearchParams } from 'react-router-dom';
import {
    createStripeCustomer,
    attachPaymentMethod,
    purchaseCurrency,
    getStripePackages,
    getStripeCustomer,
    createCheckoutSession,
} from '@/api';

interface Package {
    packageId: string;
    name: string;
    priceCents: number;
    priceDollars: number;
    currencyAmount: number;
}

export default function StripePayment() {
    const { user, refreshUser } = useUser();
    const [searchParams] = useSearchParams();
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [customerInfo, setCustomerInfo] = useState<any>(null);
    const [paymentMethodId, setPaymentMethodId] = useState('');
    const [showChangePayment, setShowChangePayment] = useState(false);

    useEffect(() => {
        console.log('StripePayment: User state:', user);
        if (user) {
            loadPackages();
            loadCustomerInfo();
        }
    }, [user]);

    // Handle Stripe checkout success
    useEffect(() => {
        const success = searchParams.get('success');
        const sessionId = searchParams.get('session_id');

        if (success === 'true' && sessionId && user) {
            console.log('Stripe checkout successful, refreshing user data...');
            setSuccess(
                'Payment successful! Your tickets have been added to your account.'
            );
            refreshUser();
            loadCustomerInfo();

            // Clean up URL parameters
            const url = new URL(window.location.href);
            url.searchParams.delete('success');
            url.searchParams.delete('session_id');
            window.history.replaceState({}, '', url.toString());
        }

        const canceled = searchParams.get('canceled');
        if (canceled === 'true') {
            setError('Payment was canceled. Please try again.');

            // Clean up URL parameters
            const url = new URL(window.location.href);
            url.searchParams.delete('canceled');
            window.history.replaceState({}, '', url.toString());
        }
    }, [searchParams, user, refreshUser]);

    const loadPackages = async () => {
        try {
            console.log('Loading packages...');
            const response = await getStripePackages();
            console.log('Packages loaded:', response);
            setPackages(response.packages);
        } catch (err) {
            console.error('Error loading packages:', err);
        }
    };

    const loadCustomerInfo = async () => {
        if (!user) return;

        try {
            console.log('Loading customer info for user:', user._id);
            const customer = await getStripeCustomer(user._id);
            console.log('Customer info loaded:', customer);
            setCustomerInfo(customer);
        } catch (err) {
            console.error('Error loading customer info:', err);
        }
    };

    const createCustomer = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            await createStripeCustomer(user._id, user.email, user.email);
            await loadCustomerInfo();
            setSuccess('Stripe customer created successfully!');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error creating customer');
        } finally {
            setLoading(false);
        }
    };

    const attachTestPaymentMethod = async () => {
        if (!user || !paymentMethodId) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await attachPaymentMethod(user._id, paymentMethodId);
            await loadCustomerInfo();
            setSuccess('Payment method updated successfully!');
            setPaymentMethodId(''); // Clear the input
            if (showChangePayment) {
                setShowChangePayment(false); // Close modal if it was open
            }
        } catch (err: any) {
            setError(
                err.response?.data?.message || 'Error attaching payment method'
            );
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (packageId: string) => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const result = await purchaseCurrency(user._id, packageId);
            setSuccess(
                `Purchase successful! You received ${result.currencyPurchased.toLocaleString()} tickets!`
            );
            await loadCustomerInfo();
            await refreshUser();
        } catch (err: any) {
            setError(
                err.response?.data?.message || 'Error purchasing currency'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleStripeCheckout = async (packageId: string) => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const result = await createCheckoutSession(user._id, packageId);
            // Redirect to Stripe Checkout
            window.location.href = result.url;
        } catch (err: any) {
            setError(
                err.response?.data?.message || 'Error creating checkout session'
            );
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <Card className="max-w-2xl mx-auto">
                <CardBody>
                    <p className="text-center text-gray-500">
                        Please log in to purchase tickets.
                    </p>
                </CardBody>
            </Card>
        );
    }

    console.log('Rendering StripePayment with:', {
        user: !!user,
        packages: packages.length,
        customerInfo: !!customerInfo,
        loading,
    });

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader className="text-white flex flex-col gap-2">
                    <h2 className="text-3xl font-bold">Buy Tickets</h2>
                    <p className="text-gray-300 text-sm">
                        Convert real money to tickets ($1 = 1 ticket)
                    </p>
                </CardHeader>
                <CardBody className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                            <p className="text-green-300 text-sm">{success}</p>
                        </div>
                    )}

                    {packages.length === 0 && (
                        <div className="text-center py-4">
                            <p className="text-gray-300">Loading packages...</p>
                        </div>
                    )}

                    {!customerInfo && packages.length > 0 && (
                        <div className="space-y-4">
                            <p className="text-gray-300">
                                First, create a Stripe customer account:
                            </p>
                            <Button
                                onClick={createCustomer}
                                isLoading={loading}
                                color="primary"
                            >
                                Create Stripe Customer
                            </Button>
                        </div>
                    )}

                    {customerInfo && !customerInfo.defaultPaymentMethod && (
                        <div className="space-y-4">
                            <p className="text-gray-300">
                                Attach a payment method:
                            </p>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="pm_card_visa (test token)"
                                    value={paymentMethodId}
                                    onChange={(e) =>
                                        setPaymentMethodId(e.target.value)
                                    }
                                    className="flex-1"
                                />
                                <Button
                                    onClick={attachTestPaymentMethod}
                                    isLoading={loading}
                                    color="primary"
                                >
                                    Attach
                                </Button>
                            </div>
                            <p className="text-sm text-gray-400">
                                Test tokens: pm_card_visa, pm_card_mastercard,
                                pm_card_chargeDeclined
                            </p>
                        </div>
                    )}

                    {customerInfo && customerInfo.defaultPaymentMethod && (
                        <div className="space-y-4">
                            <div className="bg-slate-700/50 p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-white mb-1">
                                            Current Payment Method
                                        </h3>
                                        <p className="text-gray-300 text-sm">
                                            {customerInfo.defaultPaymentMethod}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            setShowChangePayment(true);
                                            setError(null);
                                            setSuccess(null);
                                            setPaymentMethodId('');
                                        }}
                                        color="secondary"
                                        size="sm"
                                        variant="bordered"
                                    >
                                        Change
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {customerInfo && customerInfo.defaultPaymentMethod && (
                        <div className="space-y-4">
                            <div className="bg-slate-700/50 p-4 rounded-lg">
                                <h3 className="font-semibold text-white mb-2">
                                    Your Account
                                </h3>
                                <p className="text-gray-300">
                                    Email: {customerInfo.email}
                                </p>
                                <p className="text-gray-300">
                                    Ticket Balance:{' '}
                                    <span className="text-primary font-semibold">
                                        {user?.ticketBalance?.toLocaleString() ||
                                            0}
                                    </span>
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {packages.map((pkg) => (
                                    <Card
                                        key={pkg.packageId}
                                        className="border border-gray-600 hover:border-primary/50 transition-colors"
                                    >
                                        <CardBody className="text-center space-y-3">
                                            <h3 className="font-semibold text-white text-lg">
                                                {pkg.name}
                                            </h3>
                                            <div className="text-3xl font-bold text-primary">
                                                ${pkg.priceDollars}
                                            </div>
                                            <div className="text-gray-300 text-sm">
                                                {pkg.currencyAmount.toLocaleString()}{' '}
                                                tickets
                                            </div>
                                            <div className="space-y-2">
                                                <Button
                                                    onClick={() =>
                                                        handlePurchase(
                                                            pkg.packageId
                                                        )
                                                    }
                                                    isLoading={loading}
                                                    color="primary"
                                                    className="w-full"
                                                    size="lg"
                                                >
                                                    Buy Now (Test)
                                                </Button>
                                                <Button
                                                    onClick={() =>
                                                        handleStripeCheckout(
                                                            pkg.packageId
                                                        )
                                                    }
                                                    isLoading={loading}
                                                    color="secondary"
                                                    variant="bordered"
                                                    className="w-full"
                                                    size="sm"
                                                >
                                                    Checkout with Stripe →
                                                </Button>
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Change Payment Method Modal */}
            {showChangePayment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-white">
                                    Change Payment Method
                                </h2>
                                <Button
                                    onClick={() => setShowChangePayment(false)}
                                    variant="light"
                                    size="sm"
                                >
                                    ✕
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-slate-700/50 p-3 rounded-lg">
                                    <p className="text-gray-300 text-sm mb-1">
                                        Current:
                                    </p>
                                    <p className="text-white font-mono text-sm">
                                        {customerInfo?.defaultPaymentMethod}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-gray-300">
                                        New Payment Method
                                    </label>
                                    <Input
                                        placeholder="pm_card_mastercard (test token)"
                                        value={paymentMethodId}
                                        onChange={(e) =>
                                            setPaymentMethodId(e.target.value)
                                        }
                                        className="text-white"
                                    />
                                    <p className="text-xs text-gray-400">
                                        Test tokens: pm_card_visa,
                                        pm_card_mastercard, pm_card_amex,
                                        pm_card_chargeDeclined
                                    </p>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                                        <p className="text-red-300 text-sm">
                                            {error}
                                        </p>
                                    </div>
                                )}

                                {success && (
                                    <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                                        <p className="text-green-300 text-sm">
                                            {success}
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        onClick={() =>
                                            setShowChangePayment(false)
                                        }
                                        variant="bordered"
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={attachTestPaymentMethod}
                                        isLoading={loading}
                                        color="primary"
                                        className="flex-1"
                                    >
                                        Update Payment Method
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
