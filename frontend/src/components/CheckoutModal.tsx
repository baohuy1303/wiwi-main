import React, { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Image } from '@heroui/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faTicketAlt, faWallet } from '@fortawesome/free-solid-svg-icons';
import { Item } from '@/types';
import { useNavigate } from 'react-router-dom';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    raffleItem: Item | undefined;
    userBalance: number;
    onSuccess: (updatedItem: Item, newBalance: number) => void;
    onEnterRaffle: (quantity: number) => Promise<{ item: Item; newBalance: number }>;
}

export default function CheckoutModal({
    isOpen,
    onClose,
    raffleItem,
    userBalance,
    onSuccess,
    onEnterRaffle,
}: CheckoutModalProps) {
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            setQuantity(1);
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen || !raffleItem) return null;

    const totalCost = quantity * raffleItem.ticketCost;
    const remainingBalance = userBalance - totalCost;
    const hasInsufficientBalance = remainingBalance < 0;
    // With new rules: sales continue even after goal is met
    const ticketsRemaining = raffleItem.ticketGoal - raffleItem.ticketsSold;
    const isOverflowActive = raffleItem.ticketsSold >= raffleItem.ticketGoal;
    const maxQuantity = Math.floor(userBalance / raffleItem.ticketCost);

    const handleIncrement = () => {
        if (quantity < maxQuantity) {
            setQuantity(quantity + 1);
        }
    };

    const handleDecrement = () => {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
    };

    const handleQuantityChange = (value: string) => {
        const num = parseInt(value);
        if (!isNaN(num) && num >= 1 && num <= maxQuantity) {
            setQuantity(num);
        }
    };

    const handleConfirmEntry = async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await onEnterRaffle(quantity);
            onSuccess(result.item, result.newBalance);
            onClose();
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                    'Error entering raffle. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleBuyTickets = () => {
        navigate('/buytickets');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold text-white">
                            Enter Raffle
                        </h2>
                        <Button
                            onClick={onClose}
                            variant="light"
                            size="sm"
                            isDisabled={loading}
                        >
                            ✕
                        </Button>
                    </div>

                    {/* Raffle Info */}
                    <div className="mb-6">
                        <div className="flex gap-4 mb-4">
                            <Image
                                src={
                                    raffleItem.images[0] ||
                                    'https://via.placeholder.com/100'
                                }
                                alt={raffleItem.title}
                                className="w-24 h-24 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                                <h3 className="font-bold text-white text-lg mb-1">
                                    {raffleItem.title}
                                </h3>
                                <p className="text-gray-400 text-sm">
                                    {raffleItem.ticketCost} tickets per entry
                                </p>
                                {isOverflowActive ? (
                                    <div className="space-y-1">
                                        <p className="text-warning text-sm font-semibold">
                                            🎯 Goal Met - Overflow Active!
                                        </p>
                                        <p className="text-gray-400 text-xs">
                                            Additional entries support charity
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-sm">
                                        {ticketsRemaining} entries remaining
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="bg-slate-700/50 p-4 rounded-lg mb-4">
                        <label className="text-sm text-gray-300 mb-2 block">
                            Number of Entries
                        </label>
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={handleDecrement}
                                isDisabled={quantity <= 1 || loading}
                                color="primary"
                                variant="bordered"
                                size="lg"
                                isIconOnly
                            >
                                <FontAwesomeIcon icon={faMinus} />
                            </Button>
                            <Input
                                type="number"
                                value={quantity.toString()}
                                onChange={(e) =>
                                    handleQuantityChange(e.target.value)
                                }
                                className="text-center text-white text-xl font-bold"
                                classNames={{
                                    input: 'text-center text-white text-xl font-bold',
                                }}
                                min={1}
                                max={maxQuantity}
                                isDisabled={loading}
                            />
                            <Button
                                onClick={handleIncrement}
                                isDisabled={quantity >= maxQuantity || loading}
                                color="primary"
                                variant="bordered"
                                size="lg"
                                isIconOnly
                            >
                                <FontAwesomeIcon icon={faPlus} />
                            </Button>
                        </div>
                    </div>

                    {/* Cost Calculation */}
                    <div className="bg-slate-700/50 p-4 rounded-lg mb-4 space-y-2">
                        <div className="flex justify-between text-gray-300">
                            <span>Cost per entry:</span>
                            <span className="font-semibold">
                                {raffleItem.ticketCost} tickets
                            </span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                            <span>Quantity:</span>
                            <span className="font-semibold">× {quantity}</span>
                        </div>
                        {isOverflowActive && (
                            <div className="bg-warning-500/10 border border-warning-500/30 rounded p-2">
                                <div className="flex items-center gap-2 text-warning text-sm">
                                    <span>💝</span>
                                    <span className="font-semibold">
                                        Charity Overflow Active
                                    </span>
                                </div>
                                <p className="text-warning-300 text-xs mt-1">
                                    70% goes to charity, 30% to seller when
                                    raffle ends
                                </p>
                            </div>
                        )}
                        <div className="border-t border-slate-600 pt-2 mt-2"></div>
                        <div className="flex justify-between text-white text-lg">
                            <span className="font-bold">Total Cost:</span>
                            <span className="font-bold text-primary">
                                <FontAwesomeIcon
                                    icon={faTicketAlt}
                                    className="mr-1"
                                />
                                {totalCost} tickets
                            </span>
                        </div>
                    </div>

                    {/* Balance Info */}
                    <div className="bg-slate-700/50 p-4 rounded-lg mb-4 space-y-2">
                        <div className="flex justify-between text-gray-300">
                            <span className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faWallet} />
                                Your Balance:
                            </span>
                            <span className="font-semibold text-white">
                                {userBalance.toLocaleString()} tickets
                            </span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                            <span>After purchase:</span>
                            <span
                                className={`font-semibold ${
                                    hasInsufficientBalance
                                        ? 'text-red-400'
                                        : 'text-green-400'
                                }`}
                            >
                                {hasInsufficientBalance ? '-' : ''}
                                {Math.abs(
                                    remainingBalance
                                ).toLocaleString()}{' '}
                                tickets
                            </span>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg mb-4">
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Insufficient Balance Warning */}
                    {hasInsufficientBalance && (
                        <div className="p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg mb-4">
                            <p className="text-yellow-300 text-sm">
                                Insufficient balance. You need{' '}
                                {Math.abs(remainingBalance)} more tickets.
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {hasInsufficientBalance ? (
                            <>
                                <Button
                                    onClick={onClose}
                                    variant="bordered"
                                    className="flex-1"
                                    isDisabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleBuyTickets}
                                    color="primary"
                                    className="flex-1"
                                    isDisabled={loading}
                                >
                                    Buy More Tickets
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    onClick={onClose}
                                    variant="bordered"
                                    className="flex-1"
                                    isDisabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleConfirmEntry}
                                    isLoading={loading}
                                    color="primary"
                                    className="flex-1"
                                    startContent={
                                        !loading && (
                                            <FontAwesomeIcon
                                                icon={faTicketAlt}
                                            />
                                        )
                                    }
                                >
                                    Confirm Entry for {totalCost} tickets
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

