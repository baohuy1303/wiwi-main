// src/pages/raffledetail.tsx

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import DefaultLayout from "@/layouts/default";
import { Button } from "@heroui/button";
import { Image } from "@heroui/image";
import { Progress, User as HeroUser, Chip } from '@heroui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTicketAlt,
    faTrophy,
    faClock,
    faHeart,
    faShieldAlt,
} from '@fortawesome/free-solid-svg-icons';
import { getItemById, getUser, enterRaffle } from '@/api';
import { Item, User } from '@/types';
import { useUser } from '@/UserContext';
import CheckoutModal from '@/components/CheckoutModal';

export default function RaffleDetailPage() {
    const { id } = useParams();
    const { user, setUser } = useUser();

    //mongo logic here... use the ID to fetch the raffle data

    // for now, I am using the mock data herey.

    const [mainImage, setMainImage] = useState<string>('');
    const [raffleData, setRaffleData] = useState<Item>();
    const [sellerData, setSellerData] = useState<User | null>(null);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [winnerData, setWinnerData] = useState<User | null>(null);

    useEffect(() => {
        const fetchRaffleData = async () => {
            const raffleData = await getItemById(id as string);
            setRaffleData(raffleData);
            console.log(raffleData);

            // Set the first image as main image when data is loaded
            if (raffleData?.images && raffleData.images.length > 0) {
                setMainImage(raffleData.images[0]);
            }

            // Check if sellerId is already populated (object) or needs to be fetched (string)
            if (raffleData?.sellerId) {
                if (typeof raffleData.sellerId === 'object') {
                    // sellerId is already populated with user data
                    setSellerData(raffleData.sellerId);
                } else {
                    // sellerId is a string ID, need to fetch user data
                    try {
                        const sellerData = await getUser(raffleData.sellerId);
                        setSellerData(sellerData);
                    } catch (error) {
                        console.error('Error fetching seller data:', error);
                    }
                }
            }

            // Fetch winner data if winner exists
            if (raffleData?.winnerId) {
                if (typeof raffleData.winnerId === 'object') {
                    setWinnerData(raffleData.winnerId);
                } else {
                    try {
                        const winnerUser = await getUser(raffleData.winnerId);
                        setWinnerData(winnerUser);
                    } catch (error) {
                        console.error('Error fetching winner data:', error);
                    }
                }
            }
        };

        fetchRaffleData();
    }, [id]);

    // Keyboard navigation for images
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (!raffleData?.images || raffleData.images.length <= 1) return;

            if (e.key === 'ArrowLeft') {
                const currentIndex = raffleData.images.indexOf(mainImage);
                const prevIndex =
                    currentIndex > 0
                        ? currentIndex - 1
                        : raffleData.images.length - 1;
                setMainImage(raffleData.images[prevIndex]);
            } else if (e.key === 'ArrowRight') {
                const currentIndex = raffleData.images.indexOf(mainImage);
                const nextIndex =
                    currentIndex < raffleData.images.length - 1
                        ? currentIndex + 1
                        : 0;
                setMainImage(raffleData.images[nextIndex]);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [raffleData, mainImage]);

    const handleEnterRaffle = async (quantity: number) => {
        if (!user || !raffleData) {
            throw new Error('User not logged in or raffle data not loaded');
        }

        const result = await enterRaffle(user._id, raffleData._id, quantity);
        return {
            item: result.item,
            newBalance: result.user.ticketBalance,
        };
    };

    const handleSuccess = (updatedItem: Item, newBalance: number) => {
        setRaffleData(updatedItem);
        if (user) {
            setUser({ ...user, ticketBalance: newBalance });
        }
        setSuccessMessage(
            `Successfully entered the raffle! You now have ${updatedItem.participants.find((p) => p.userId === user?._id)?.ticketsSpent || 0} entries.`
        );
        setTimeout(() => setSuccessMessage(null), 5000);
    };

    const handleOpenCheckout = () => {
        if (!user) {
            alert('Please log in to enter this raffle.');
            return;
        }
        setShowCheckoutModal(true);
    };

    const getTimeRemaining = (deadline: string | undefined) => {
        if (!deadline) return null;
        const now = new Date().getTime();
        const deadlineTime = new Date(deadline).getTime();
        const diff = deadlineTime - now;

        if (diff <= 0) return 'Expired';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${minutes}m`;
    };

    const isUserWinner = winnerData?._id === user?._id;
    const userParticipant = raffleData?.participants.find(
        (p) => p.userId === user?._id
    );
    const userRefundAmount = userParticipant
        ? userParticipant.ticketsSpent * (raffleData?.ticketCost || 0)
        : 0;

    return (
        <DefaultLayout>
            <div className="container mx-auto px-4 py-8 text-white">
                {/* Success Message */}
                {successMessage && (
                    <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                        <p className="text-green-300">{successMessage}</p>
                    </div>
                )}

                {/* Winner Announcement */}
                {raffleData?.status === 'ended' && raffleData?.winnerId && (
                    <div
                        className={`mb-6 p-6 rounded-lg ${isUserWinner ? 'bg-yellow-500/20 border-2 border-yellow-500' : 'bg-blue-500/20 border border-blue-500/50'}`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <FontAwesomeIcon
                                icon={faTrophy}
                                className="text-yellow-400 text-2xl"
                            />
                            <h2 className="text-2xl font-bold">
                                {isUserWinner
                                    ? '🎉 Congratulations! You Won!'
                                    : 'Winner Announced!'}
                            </h2>
                        </div>
                        <p
                            className={`text-lg ${isUserWinner ? 'text-yellow-200' : 'text-blue-200'}`}
                        >
                            {isUserWinner
                                ? 'You are the winner of this raffle! The seller will contact you soon.'
                                : `Winner: ${winnerData?.email || 'Anonymous'}`}
                        </p>
                    </div>
                )}

                {/* Grace Period */}
                {raffleData?.status === 'goal_met_grace_period' && (
                    <div className="mb-6 p-6 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <FontAwesomeIcon
                                icon={faClock}
                                className="text-yellow-400 text-2xl"
                            />
                            <h2 className="text-2xl font-bold">
                                🎯 Goal Met - 24 Hour Grace Period
                            </h2>
                        </div>
                        <p className="text-yellow-200 mb-2">
                            The seller has{' '}
                            {getTimeRemaining(raffleData.confirmationDeadline)}{' '}
                            to decide:
                        </p>
                        <div className="text-yellow-200 space-y-1">
                            <p>
                                • <strong>End Early:</strong> Select winner now
                                and end the raffle
                            </p>
                            <p>
                                • <strong>Continue:</strong> Let it run until
                                end date for maximum charity overflow
                            </p>
                        </div>
                        <p className="text-yellow-300 text-sm mt-2">
                            If no decision is made, the raffle will continue
                            until the end date to maximize charity donations.
                        </p>
                    </div>
                )}

                {/* Awaiting Confirmation (Legacy) */}
                {raffleData?.status === 'awaiting_confirmation' && (
                    <div className="mb-6 p-6 bg-purple-500/20 border border-purple-500/50 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <FontAwesomeIcon
                                icon={faClock}
                                className="text-purple-400 text-2xl"
                            />
                            <h2 className="text-2xl font-bold">
                                Goal Met! Awaiting Seller Confirmation
                            </h2>
                        </div>
                        <p className="text-purple-200">
                            The seller has{' '}
                            {getTimeRemaining(raffleData.confirmationDeadline)}{' '}
                            to confirm or cancel this raffle.
                            {!raffleData.confirmationDeadline ||
                            new Date(raffleData.confirmationDeadline) <=
                                new Date()
                                ? ' Winner will be selected automatically.'
                                : ' After the deadline, a winner will be selected automatically.'}
                        </p>
                    </div>
                )}

                {/* Cancelled Raffle */}
                {raffleData?.status === 'cancelled' && (
                    <div className="mb-6 p-6 bg-red-500/20 border border-red-500/50 rounded-lg">
                        <h2 className="text-2xl font-bold mb-2">
                            Raffle Cancelled
                        </h2>
                        <p className="text-red-200 mb-2">
                            This raffle has been cancelled by the seller. All
                            participants have been refunded.
                        </p>
                        {userRefundAmount > 0 && (
                            <p className="text-green-300 font-semibold">
                                You were refunded {userRefundAmount} tickets.
                            </p>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Left Column: Image Gallery */}
                    <div className="space-y-4">
                        {/* Main Image Display */}
                        <div className="flex justify-center items-center">
                            {mainImage ? (
                                <Image
                                    src={mainImage}
                                    className="w-full h-[70vh] object-cover rounded-xl shadow-lg"
                                />
                            ) : (
                                <div className="w-full h-96 bg-gray-800 rounded-xl shadow-lg flex items-center justify-center">
                                    <div className="text-center text-gray-400">
                                        <FontAwesomeIcon
                                            icon={faTicketAlt}
                                            size="3x"
                                            className="mb-4"
                                        />
                                        <p>No images available</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Thumbnail Grid */}
                        {raffleData?.images && raffleData.images.length > 1 && (
                            <div className="grid grid-cols-4 gap-2">
                                {raffleData.images.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setMainImage(img)}
                                        className="relative"
                                    >
                                        <Image
                                            src={img}
                                            alt={`Thumbnail ${index + 1}`}
                                            className={`w-full h-20 object-cover rounded-md cursor-pointer border-2 transition-all ${
                                                mainImage === img
                                                    ? 'border-primary scale-105'
                                                    : 'border-transparent hover:border-gray-400'
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Raffle Details & Actions */}
                    <div className="flex flex-col space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <h1 className="text-4xl font-bold flex-grow">
                                {raffleData?.title}
                            </h1>
                            {raffleData &&
                                raffleData.aiVerificationScore > 0.7 && (
                                    <Chip
                                        color="success"
                                        variant="shadow"
                                        startContent={
                                            <FontAwesomeIcon
                                                icon={faShieldAlt}
                                                size="sm"
                                            />
                                        }
                                    >
                                        AI Verified
                                    </Chip>
                                )}
                        </div>
                        <div className="flex items-center gap-4">
                            <HeroUser
                                name={sellerData?.email || ''}
                                description="Verified Seller"
                                avatarProps={{
                                    isBordered: true,
                                    src: 'https://i.pravatar.cc/150',
                                }}
                            />
                            <Chip color="secondary" variant="flat">
                                {raffleData?.condition}
                            </Chip>
                        </div>
                        <p className="text-gray-300 leading-relaxed">
                            {raffleData?.description}
                        </p>

                        <div className="pt-4">
                            <Progress
                                label={`Sold ${raffleData?.ticketsSold} of ${raffleData?.ticketGoal} tickets${raffleData && raffleData?.charityOverflow > 0 ? ` (+${raffleData.charityOverflow} overflow)` : ''}`}
                                value={raffleData?.ticketsSold}
                                maxValue={raffleData?.ticketGoal}
                                color={
                                    raffleData &&
                                    raffleData?.ticketsSold >=
                                        raffleData?.ticketGoal
                                        ? 'warning'
                                        : 'success'
                                }
                                showValueLabel={true}
                                className="w-full"
                            />
                            {raffleData?.charityOverflow &&
                                raffleData?.charityOverflow > 0 && (
                                    <div className="mt-2 p-3 bg-warning-500/10 border border-warning-500/30 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <FontAwesomeIcon
                                                icon={faHeart}
                                                className="text-warning"
                                            />
                                            <span className="text-warning font-semibold">
                                                Charity Overflow:{' '}
                                                {raffleData.charityOverflow}{' '}
                                                tickets
                                            </span>
                                        </div>
                                        <p className="text-sm text-warning-300 mt-1">
                                            70% goes to charity, 30% to seller
                                            when raffle ends
                                        </p>
                                    </div>
                                )}
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center py-4">
                            <div>
                                <p className="text-2xl font-bold">
                                    {raffleData?.endDate
                                        ? Math.floor(
                                              (new Date(
                                                  raffleData.endDate
                                              ).getTime() -
                                                  Date.now()) /
                                                  (1000 * 60 * 60 * 24)
                                          )
                                        : null}
                                </p>
                                <p className="text-gray-400">Days Left</p>
                            </div>
                            <div>
                                {raffleData &&
                                raffleData?.ticketsSold >=
                                    raffleData?.ticketGoal ? (
                                    <>
                                        <p className="text-2xl font-bold text-warning">
                                            Goal Met!
                                        </p>
                                        <p className="text-gray-400">
                                            Overflow Active
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-2xl font-bold">
                                            {raffleData?.ticketGoal
                                                ? raffleData?.ticketGoal -
                                                  raffleData?.ticketsSold
                                                : 0}
                                        </p>
                                        <p className="text-gray-400">
                                            Tickets Left
                                        </p>
                                    </>
                                )}
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    ${raffleData?.ticketCost}
                                </p>
                                <p className="text-gray-400">Per Entry</p>
                            </div>
                        </div>

                        {/* Purchase Section */}
                        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6 space-y-4">
                            {(raffleData?.status === 'live' ||
                                raffleData?.status ===
                                    'goal_met_grace_period') && (
                                <>
                                    <p className="text-lg font-semibold text-center">
                                        ENTER NOW!
                                    </p>
                                    <Button
                                        color="primary"
                                        variant="shadow"
                                        size="lg"
                                        className="w-full font-bold"
                                        startContent={
                                            <FontAwesomeIcon
                                                icon={faTicketAlt}
                                            />
                                        }
                                        onClick={handleOpenCheckout}
                                    >
                                        For {raffleData?.ticketCost} tickets
                                    </Button>
                                    {user && (
                                        <p className="text-sm text-gray-400 text-center">
                                            Your balance:{' '}
                                            {user.ticketBalance.toLocaleString()}{' '}
                                            tickets
                                        </p>
                                    )}
                                </>
                            )}
                            {raffleData?.status === 'awaiting_confirmation' && (
                                <div className="text-center">
                                    <p className="text-lg font-semibold text-purple-400 mb-2">
                                        Awaiting Seller Confirmation
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        No more entries accepted
                                    </p>
                                </div>
                            )}
                            {raffleData?.status === 'ended' && (
                                <div className="text-center">
                                    <p className="text-lg font-semibold text-green-400 mb-2">
                                        Raffle Ended
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        Winner has been selected
                                    </p>
                                </div>
                            )}
                            {raffleData?.status === 'cancelled' && (
                                <div className="text-center">
                                    <p className="text-lg font-semibold text-red-400 mb-2">
                                        Raffle Cancelled
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        Refunds processed
                                    </p>
                                </div>
                            )}
                            {raffleData?.status === 'not_met' && (
                                <div className="text-center">
                                    <p className="text-lg font-semibold text-orange-400 mb-2">
                                        Goal Not Met
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        Raffle ended without meeting goal
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Checkout Modal */}
                <CheckoutModal
                    isOpen={showCheckoutModal}
                    onClose={() => setShowCheckoutModal(false)}
                    raffleItem={raffleData}
                    userBalance={user?.ticketBalance || 0}
                    onSuccess={handleSuccess}
                    onEnterRaffle={handleEnterRaffle}
                />
            </div>
        </DefaultLayout>
    );
}