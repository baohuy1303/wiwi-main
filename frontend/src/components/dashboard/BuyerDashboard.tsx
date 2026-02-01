// src/components/dashboard/BuyerDashboard.tsx

import { Link } from 'react-router-dom';
import { Card, CardBody, CardFooter } from '@heroui/card';
import { Button } from '@heroui/button';
import { Image } from "@heroui/image";
import { Progress, Chip } from '@heroui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTicketAlt,
    faStar,
    faReceipt,
    faEye,
    faShieldAlt,
} from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { getItemsByBuyerId, getRandomItems } from '@/api';
import { useUser } from '@/UserContext';
import { Item } from '@/types';
// Define the types for the props we expect

export default function BuyerDashboard() {
    const { user } = useUser();

    useEffect(() => {
        const fetchSuggestedRaffles = async () => {
            const suggestedRaffles = await getRandomItems(5 as any);
            setSuggestedRaffles(suggestedRaffles);
        };
        fetchSuggestedRaffles();
    }, [user]);
    const [suggestedRaffles, setSuggestedRaffles] = useState<Item[]>([]);
    const [buyerRaffleDetails, setBuyerRaffleDetails] = useState<Item[]>([]);
    useEffect(() => {
        const fetchBuyerRaffleDetails = async () => {
            const buyerRaffleDetails = await getItemsByBuyerId(
                user?._id as string
            );
            setBuyerRaffleDetails(buyerRaffleDetails);
        };
        fetchBuyerRaffleDetails();
    }, [user]);

    const totalTicketsUsedByBuyer =
        buyerRaffleDetails?.reduce((acc: number, item: any) => {
            // Find the user's participation in this raffle
            const userParticipation = item.participants?.find(
                (participant: any) => participant.userId === user?._id
            );
            return acc + (userParticipation?.ticketsSpent || 0);
        }, 0) || 0;

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 text-white">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold">Hi, {user?.email}!</h1>
                    {/* <p className="text-gray-400">Welcome back, {buyer.username}!</p> */}
                </div>
                <Link to="/raffles">
                    <Button
                        color="primary"
                        variant="shadow"
                        size="lg"
                        startContent={<FontAwesomeIcon icon={faTicketAlt} />}
                    >
                        Browse All Raffles
                    </Button>
                </Link>
            </div>

            {/* Stats Overview Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700">
                    <CardBody className="flex flex-row items-center gap-4 p-6">
                        <FontAwesomeIcon
                            icon={faTicketAlt}
                            size="2x"
                            className="text-primary"
                        />
                        <div>
                            <p className="text-gray-400">Your Ticket Balance</p>
                            <p className="text-2xl font-bold">
                                {user?.ticketBalance}
                            </p>
                        </div>
                    </CardBody>
                </Card>
                <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700">
                    <CardBody className="flex flex-row items-center gap-4 p-6">
                        <FontAwesomeIcon
                            icon={faStar}
                            size="2x"
                            className="text-secondary"
                        />
                        <div>
                            <p className="text-gray-400">Raffles Entered</p>
                            <p className="text-2xl font-bold">
                                {buyerRaffleDetails?.length || 0}
                            </p>
                        </div>
                    </CardBody>
                </Card>
                <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700">
                    <CardBody className="flex flex-row items-center gap-4 p-6">
                        <FontAwesomeIcon
                            icon={faReceipt}
                            size="2x"
                            className="text-success"
                        />
                        <div>
                            <p className="text-gray-400">Total Tickets Used</p>
                            <p className="text-2xl font-bold">
                                {totalTicketsUsedByBuyer}
                            </p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* My Raffles Section (Grid) */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">Raffles You've Entered</h2>
                {buyerRaffleDetails?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {buyerRaffleDetails?.map((item) => (
                            <Card
                                key={item._id}
                                className="bg-slate-800/50 backdrop-blur-md border border-slate-700 w-full flex flex-col relative"
                            >
                                <div className="relative">
                                    <Image
                                        alt={item.title}
                                        className="object-cover h-48 w-full"
                                        src={
                                            item.images?.[0] ||
                                            'https://via.placeholder.com/400x300?text=No+Image'
                                        }
                                    />
                                    {item.aiVerificationScore > 0.7 && (
                                        <div className="absolute top-2 left-2 z-10">
                                            <Chip
                                                color="success"
                                                variant="shadow"
                                                startContent={
                                                    <FontAwesomeIcon
                                                        icon={faShieldAlt}
                                                        size="xs"
                                                    />
                                                }
                                            >
                                                Verified
                                            </Chip>
                                        </div>
                                    )}
                                </div>
                                <CardBody className="flex flex-col flex-grow p-4 space-y-3">
                                    <h3 className="font-semibold text-lg flex-grow">
                                        {item?.title}
                                    </h3>
                                    <Progress
                                        aria-label="Raffle progress"
                                        size="md"
                                        value={item?.ticketsSold}
                                        maxValue={item?.ticketGoal}
                                        color="success"
                                        label={`${item?.ticketsSold} / ${item?.ticketGoal} tickets sold`}
                                        showValueLabel={true}
                                        className="max-w-full"
                                    />
                                </CardBody>
                                <CardFooter className="bg-slate-900/60 border-t border-slate-700 flex justify-between items-center p-4">
                                    <div className="flex items-center gap-2">
                                        <FontAwesomeIcon
                                            icon={faTicketAlt}
                                            className="text-secondary"
                                        />
                                        <span className="font-bold">
                                            You have{' '}
                                            {item.participants?.find(
                                                (participant: any) =>
                                                    participant.userId ===
                                                    user?._id
                                            )?.ticketsSpent || 0}{' '}
                                            tickets
                                        </span>
                                    </div>
                                    <Link to={`/raffles/${item._id}`}>
                                        <Button
                                            size="sm"
                                            color="secondary"
                                            variant="ghost"
                                        >
                                            View Raffle
                                        </Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 text-center py-10">
                        You haven't entered any raffles yet. Go find one!
                    </p>
                )}
            </div>

            {/* Suggested Raffles Section */}
            <div className="space-y-6 pt-8">
                <h2 className="text-2xl font-bold">Suggested For You</h2>
                {suggestedRaffles?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {suggestedRaffles.map((item) => (
                            <Card
                                key={item._id}
                                className="bg-slate-800/50 backdrop-blur-md border border-slate-700 w-full flex flex-col hover:border-primary transition-colors duration-300"
                            >
                                <div className="relative">
                                    <Image
                                        alt={item.title}
                                        className="object-cover h-48 w-full"
                                        src={
                                            item.images?.[0] ||
                                            'https://via.placeholder.com/400x300?text=No+Image'
                                        }
                                    />
                                    {item.aiVerificationScore > 0.7 && (
                                        <div className="absolute top-2 left-2 z-10">
                                            <Chip
                                                color="success"
                                                variant="shadow"
                                                startContent={
                                                    <FontAwesomeIcon
                                                        icon={faShieldAlt}
                                                        size="xs"
                                                    />
                                                }
                                            >
                                                Verified
                                            </Chip>
                                        </div>
                                    )}
                                </div>
                                <CardBody className="flex flex-col flex-grow p-4 space-y-2">
                                    <h3 className="font-semibold text-lg flex-grow">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-gray-400 line-clamp-2">
                                        {item.description}
                                    </p>
                                </CardBody>
                                <div className="px-4 pb-4">
                                    <Progress
                                        aria-label="Raffle progress"
                                        size="md"
                                        value={item.ticketsSold}
                                        maxValue={item.ticketGoal}
                                        color="success"
                                        label={`${Math.round((item.ticketsSold / item.ticketGoal) * 100)}% Funded`}
                                        showValueLabel={true}
                                        className="max-w-full"
                                    />
                                </div>
                                <CardFooter className="bg-slate-900/60 border-t border-slate-700 p-3">
                                    <Link
                                        to={`/raffles/${item._id}`}
                                        className="w-full"
                                    >
                                        <Button
                                            color="primary"
                                            variant="ghost"
                                            className="w-full"
                                            startContent={
                                                <FontAwesomeIcon icon={faEye} />
                                            }
                                        >
                                            View Details
                                        </Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 text-center py-10">
                        No new raffles to suggest right now!
                    </p>
                )}
            </div>
        </div>
    );
}