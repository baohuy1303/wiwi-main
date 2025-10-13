// src/components/dashboard/SellerDashboard.tsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardFooter } from '@heroui/card';
import { Button } from '@heroui/button';
import { Image } from '@heroui/image';
import { Progress, Chip } from '@heroui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faTicketAlt,
    faListOl,
    faCheck,
    faTimes,
    faClock,
    faTrophy,
    faDollarSign,
    faHeart,
    faShieldAlt,
} from '@fortawesome/free-solid-svg-icons';
import {
    confirmRaffle,
    cancelRaffle,
    getItemsBySellerId,
    endRaffleNotMet,
    extendRaffle,
} from '@/api';
import { useUser } from '@/UserContext';
import { Item } from '@/types';

export default function SellerDashboard() {
    const { user } = useUser();
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [extensionDate, setExtensionDate] = useState<string>('');

    // Fetch items when user is available
    useEffect(() => {
        const fetchItems = async () => {
            if (user?._id) {
                const fetchedItems = await getItemsBySellerId(user._id);
                setItems(fetchedItems);
            }
        };
        fetchItems();
    }, [user]);

    // Refresh items function
    const refreshItems = async () => {
        if (user?._id) {
            const fetchedItems = await getItemsBySellerId(user._id);
            setItems(fetchedItems);
        }
    };

    // Calculations
    const totalTicketsSold =
        items?.reduce((acc, item) => acc + item.ticketsSold, 0) || 0;
    const totalRevenue = user?.totalRevenue || 0;
    const totalCharityOverflow =
        items?.reduce((acc, item) => acc + (item.charityOverflow || 0), 0) || 0;

    // Filter raffles in grace period
    const gracePeriodRaffles = items.filter(
        (item) => item.status === 'goal_met_grace_period'
    );

    // Filter raffles that need seller decision (goal not met)
    const pendingDecisionRaffles = items.filter(
        (item) => item.status === 'not_met_pending_decision'
    );

    const otherRaffles = items.filter(
        (item) =>
            item.status !== 'goal_met_grace_period' &&
            item.status !== 'not_met_pending_decision'
    );

    const getTimeRemaining = (deadline: string) => {
        const now = new Date().getTime();
        const deadlineTime = new Date(deadline).getTime();
        const diff = deadlineTime - now;

        if (diff <= 0) return 'Expired - Auto-confirming soon';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${minutes}m remaining`;
    };

    const handleConfirm = async (itemId: string) => {
        if (!user?._id) return;

        setLoading(itemId);
        setError(null);
        setSuccess(null);

        try {
            const result = await confirmRaffle(itemId, user._id);
            setSuccess(
                `Raffle confirmed! Winner selected: ${result.winner.winnerEmail}`
            );
            await refreshItems();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error confirming raffle');
        } finally {
            setLoading(null);
        }
    };

    const handleCancel = async (itemId: string) => {
        if (!user?._id) return;

        if (
            !confirm(
                'Are you sure you want to cancel this raffle? All participants will be refunded.'
            )
        ) {
            return;
        }

        setLoading(itemId);
        setError(null);
        setSuccess(null);

        try {
            await cancelRaffle(itemId, user._id);
            setSuccess(
                'Raffle cancelled. All participants have been refunded.'
            );
            await refreshItems();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error cancelling raffle');
        } finally {
            setLoading(null);
        }
    };

    const handleEndRaffleNotMet = async (itemId: string) => {
        if (!user?._id) return;

        if (
            !confirm(
                'Are you sure you want to end this raffle? All participants will be refunded.'
            )
        ) {
            return;
        }

        setLoading(itemId);
        setError(null);
        setSuccess(null);

        try {
            const result = await endRaffleNotMet(itemId, user._id);
            setSuccess(
                `Raffle ended. ${result.refundedAmount} tickets refunded to participants.`
            );
            await refreshItems();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error ending raffle');
        } finally {
            setLoading(null);
        }
    };

    const handleExtendRaffle = async (itemId: string) => {
        if (!user?._id || !extensionDate) return;

        setLoading(itemId);
        setError(null);
        setSuccess(null);

        try {
            await extendRaffle(itemId, user._id, extensionDate);
            setSuccess(
                'Raffle extended successfully. All participants have been notified.'
            );
            setExtensionDate('');
            await refreshItems();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error extending raffle');
        } finally {
            setLoading(null);
        }
    };

    const getStatusChip = (status: string) => {
        switch (status) {
            case 'live':
                return (
                    <Chip color="success" variant="flat">
                        Live
                    </Chip>
                );
            case 'goal_met_grace_period':
                return (
                    <Chip color="warning" variant="flat">
                        Goal Met - 24h Grace Period
                    </Chip>
                );
            case 'awaiting_confirmation':
                return (
                    <Chip color="warning" variant="flat">
                        Needs Confirmation
                    </Chip>
                );
            case 'ended':
                return (
                    <Chip
                        color="primary"
                        variant="flat"
                        startContent={<FontAwesomeIcon icon={faTrophy} />}
                    >
                        Ended - Winner Selected
                    </Chip>
                );
            case 'cancelled':
                return (
                    <Chip color="danger" variant="flat">
                        Cancelled
                    </Chip>
                );
            case 'not_met':
                return (
                    <Chip color="default" variant="flat">
                        Goal Not Met
                    </Chip>
                );
            case 'not_met_pending_decision':
                return (
                    <Chip color="warning" variant="flat">
                        Goal Not Met - Action Required
                    </Chip>
                );
            default:
                return <Chip>{status}</Chip>;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'live':
                return 'success';
            case 'goal_met':
            case 'goal_met_grace_period':
                return 'primary';
            case 'awaiting_confirmation':
            case 'not_met_pending_decision':
                return 'warning';
            case 'ended':
                return 'default';
            case 'not_met':
                return 'warning';
            case 'cancelled':
                return 'danger';
            default:
                return 'default';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'live':
                return 'Live';
            case 'goal_met':
                return 'Goal Met';
            case 'goal_met_grace_period':
                return 'Grace Period';
            case 'awaiting_confirmation':
                return 'Awaiting Decision';
            case 'ended':
                return 'Ended';
            case 'not_met':
                return 'Not Met';
            case 'not_met_pending_decision':
                return 'Pending Decision';
            case 'cancelled':
                return 'Cancelled';
            default:
                return status;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 text-white">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold">Welcome Back! </h1>
                    {/* <p className="text-gray-400">Hi, {user.email}!</p> */}
                </div>
                <Link to="/raffles/new">
                    <Button
                        color="primary"
                        variant="shadow"
                        size="lg"
                        startContent={<FontAwesomeIcon icon={faPlus} />}
                    >
                        Start a New Raffle
                    </Button>
                </Link>
            </div>

            {/* Stats Overview Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700">
                    <CardBody className="flex flex-row items-center gap-4 p-6">
                        <FontAwesomeIcon
                            icon={faListOl}
                            size="2x"
                            className="text-primary"
                        />
                        <div>
                            <p className="text-gray-400">Active Raffles</p>
                            <p className="text-2xl font-bold">{items.length}</p>
                        </div>
                    </CardBody>
                </Card>
                <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700">
                    <CardBody className="flex flex-row items-center gap-4 p-6">
                        <FontAwesomeIcon
                            icon={faTicketAlt}
                            size="2x"
                            className="text-secondary"
                        />
                        <div>
                            <p className="text-gray-400">Total Tickets Sold</p>
                            <p className="text-2xl font-bold">
                                {totalTicketsSold}
                            </p>
                        </div>
                    </CardBody>
                </Card>
                <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700">
                    <CardBody className="flex flex-row items-center gap-4 p-6">
                        <FontAwesomeIcon
                            icon={faDollarSign}
                            size="2x"
                            className="text-success"
                        />
                        <div>
                            <p className="text-gray-400">Total Revenue</p>
                            <p className="text-2xl font-bold">
                                {totalRevenue} tickets
                            </p>
                        </div>
                    </CardBody>
                </Card>
                <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700">
                    <CardBody className="flex flex-row items-center gap-4 p-6">
                        <FontAwesomeIcon
                            icon={faHeart}
                            size="2x"
                            className="text-warning"
                        />
                        <div>
                            <p className="text-gray-400">Charity Overflow</p>
                            <p className="text-2xl font-bold">
                                {totalCharityOverflow} tickets
                            </p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Messages */}
            {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <p className="text-red-300">{error}</p>
                </div>
            )}
            {success && (
                <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                    <p className="text-green-300">{success}</p>
                </div>
            )}

            {/* Grace Period Raffles */}
            {gracePeriodRaffles.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-yellow-400">
                        🎯 Goal Met - 24 Hour Grace Period
                    </h2>
                    <p className="text-gray-300">
                        Your raffles have met their goal! You have 24 hours to
                        decide:
                        <br />• <strong>End Early:</strong> Select winner now
                        and end the raffle
                        <br />• <strong>Continue:</strong> Let it run until end
                        date for maximum charity overflow
                    </p>
                    {gracePeriodRaffles.map((item: any) => (
                        <Card
                            key={item._id}
                            className="bg-yellow-500/10 border-2 border-yellow-500/50 w-full"
                        >
                            <CardBody>
                                <div className="grid grid-cols-12 items-center gap-6">
                                    <div className="col-span-3">
                                        <Link to={`/raffles/${item._id}`}>
                                            <Image
                                                alt={item.title}
                                                className="object-cover rounded-lg h-32 w-full"
                                                src={
                                                    item.images?.[0] ||
                                                    item.imageUrl
                                                }
                                            />
                                        </Link>
                                    </div>
                                    <div className="col-span-9 flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <Link to={`/raffles/${item._id}`}>
                                                <h3 className="font-semibold text-lg hover:text-primary">
                                                    {item.title}
                                                </h3>
                                            </Link>
                                            {getStatusChip(item.status)}
                                        </div>
                                        <div className="flex items-center gap-2 text-yellow-300">
                                            <FontAwesomeIcon icon={faClock} />
                                            <span className="font-semibold">
                                                {getTimeRemaining(
                                                    item.confirmationDeadline
                                                )}
                                            </span>
                                        </div>
                                        <Progress
                                            aria-label="Tickets sold"
                                            size="md"
                                            value={item.ticketsSold}
                                            maxValue={item.ticketGoal}
                                            color="success"
                                            showValueLabel={true}
                                            label={`Sold ${item.ticketsSold} of ${item.ticketGoal} tickets`}
                                            className="max-w-full"
                                        />
                                        <div className="flex gap-3 mt-2">
                                            <Button
                                                color="success"
                                                onClick={() =>
                                                    handleConfirm(item._id)
                                                }
                                                isLoading={loading === item._id}
                                                startContent={
                                                    <FontAwesomeIcon
                                                        icon={faCheck}
                                                    />
                                                }
                                            >
                                                End Early & Select Winner
                                            </Button>

                                            {/* <Button
                        color="danger"
                        variant="bordered"
                        onClick={() => handleCancel(item._id)}
                        isLoading={loading === item._id}
                        startContent={<FontAwesomeIcon icon={faTimes} />}
                      >
                        Cancel & Refund All
                      </Button> */}
                                        </div>
                                        <p className="text-sm text-gray-400">
                                            After 24 hours, the raffle will
                                            continue for charity overflow until
                                            end date.
                                        </p>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pending Decision Raffles */}
            {pendingDecisionRaffles.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-warning">
                        ⚠️ Goal Not Met - Action Required
                    </h2>
                    <p className="text-gray-300">
                        Your raffles didn't meet their goal. You have two
                        options:
                        <br />• <strong>End Raffle:</strong> Refund all
                        participants and close the raffle
                        <br />• <strong>Extend Raffle:</strong> Give it more
                        time to reach the goal
                    </p>
                    {pendingDecisionRaffles.map((item: any) => (
                        <Card
                            key={item._id}
                            className="bg-warning-500/10 border-2 border-warning-500/50 w-full"
                        >
                            <CardBody>
                                <div className="grid grid-cols-12 items-center gap-6">
                                    <div className="col-span-3">
                                        <Link to={`/raffles/${item._id}`}>
                                            <Image
                                                alt={item.title}
                                                className="object-cover rounded-lg h-32 w-full"
                                                src={
                                                    item.images?.[0] ||
                                                    item.imageUrl
                                                }
                                            />
                                        </Link>
                                    </div>
                                    <div className="col-span-9 flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <Link to={`/raffles/${item._id}`}>
                                                <h3 className="font-semibold text-lg hover:text-primary">
                                                    {item.title}
                                                </h3>
                                            </Link>
                                            {getStatusChip(item.status)}
                                        </div>
                                        <Progress
                                            aria-label="Tickets sold"
                                            size="md"
                                            value={item.ticketsSold}
                                            maxValue={item.ticketGoal}
                                            color="warning"
                                            showValueLabel={true}
                                            label={`Sold ${item.ticketsSold} of ${item.ticketGoal} tickets`}
                                            className="max-w-full"
                                        />
                                        <div className="flex gap-3 mt-2">
                                            <Button
                                                color="danger"
                                                onClick={() =>
                                                    handleEndRaffleNotMet(
                                                        item._id
                                                    )
                                                }
                                                isLoading={loading === item._id}
                                                startContent={
                                                    <FontAwesomeIcon
                                                        icon={faTimes}
                                                    />
                                                }
                                            >
                                                End Raffle & Refund All
                                            </Button>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="datetime-local"
                                                    value={extensionDate}
                                                    onChange={(e) =>
                                                        setExtensionDate(
                                                            e.target.value
                                                        )
                                                    }
                                                    className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                                    placeholder="New end date"
                                                />
                                                <Button
                                                    color="primary"
                                                    onClick={() =>
                                                        handleExtendRaffle(
                                                            item._id
                                                        )
                                                    }
                                                    isLoading={
                                                        loading === item._id
                                                    }
                                                    isDisabled={!extensionDate}
                                                    startContent={
                                                        <FontAwesomeIcon
                                                            icon={faClock}
                                                        />
                                                    }
                                                >
                                                    Extend Raffle
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-400">
                                            Choose to end the raffle and refund
                                            participants, or extend the deadline
                                            to give it more time.
                                        </p>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}

            {/* Other Raffles Section */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">Your Raffles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {otherRaffles.map((item) => (
                        <Link to={`/raffles/${item._id}`} key={item._id}>
                            <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700 hover:scale-105 hover:border-primary transition-all duration-300">
                                <CardBody className="overflow-visible p-0 relative">
                                    <Image
                                        shadow="sm"
                                        radius="lg"
                                        width="100%"
                                        alt={item.title}
                                        className="w-full object-cover h-[300px]"
                                        src={
                                            item.images?.[0] ||
                                            'https://via.placeholder.com/400x300?text=No+Image'
                                        }
                                    />
                                    <div className="absolute top-2 left-2 flex flex-col gap-2 z-10">
                                        <Chip
                                            color={
                                                getStatusColor(
                                                    item.status
                                                ) as any
                                            }
                                            variant="shadow"
                                        >
                                            {getStatusLabel(item.status)}
                                        </Chip>
                                        {item.aiVerificationScore > 0.7 && (
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
                                        )}
                                    </div>
                                </CardBody>
                                <CardFooter className="text-left flex-col items-start min-h-[180px]">
                                    <h4 className="font-bold text-large mb-2">
                                        {item.title}
                                    </h4>
                                    <p className="text-gray-400 text-sm mb-3 h-[40px] line-clamp-2">
                                        {item.description}
                                    </p>
                                    <div className="w-full mb-3">
                                        <Progress
                                            color="success"
                                            size="sm"
                                            maxValue={item.ticketGoal}
                                            value={item.ticketsSold}
                                            showValueLabel={true}
                                            label={`${item.ticketsSold}/${item.ticketGoal} tickets`}
                                        />
                                    </div>
                                    {item.charityOverflow > 0 && (
                                        <div className="flex items-center gap-2 text-warning">
                                            <FontAwesomeIcon icon={faHeart} />
                                            <span className="text-sm">
                                                Charity: {item.charityOverflow}{' '}
                                                tickets
                                            </span>
                                        </div>
                                    )}
                                </CardFooter>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {items.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-400 text-xl">
                        You haven't created any raffles yet.
                    </p>
                    <Link to="/raffles/new">
                        <Button
                            color="primary"
                            className="mt-4"
                            startContent={<FontAwesomeIcon icon={faPlus} />}
                        >
                            Create Your First Raffle
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}