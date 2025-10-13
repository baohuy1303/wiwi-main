import DefaultLayout from '@/layouts/default';
import { useState, useEffect } from 'react';
import { Input } from '@heroui/input';
import { Card, CardBody, CardFooter, Chip, Select, SelectItem, Progress } from '@heroui/react';
import { Image } from '@heroui/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faClock, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { getAllItems } from '@/api';
import { Item } from '@/types';
import { Link } from 'react-router-dom';

export default function BrowsePage() {
    const [items, setItems] = useState<Item[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [sortOption, setSortOption] = useState('ending_soon');
    const [statusFilter, setStatusFilter] = useState('live');
    const [loading, setLoading] = useState(true);

    // Fetch all items on component mount
    useEffect(() => {
        const fetchItems = async () => {
            try {
                const allItems = await getAllItems();
                setItems(allItems);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching items:', error);
                setLoading(false);
            }
        };
        fetchItems();
    }, []);

    // Predefined categories for consistent filtering
    const predefinedCategories = [
        'electronics',
        'clothing',
        'furniture',
        'books',
        'toys',
        'sports',
        'home',
        'garden',
        'automotive',
        'other',
    ];

    // Get unique categories from all items (for display)
    const allCategories = Array.from(
        new Set(items.flatMap((item) => item.category))
    );
    console.log('Available categories:', allCategories);

    // Filter and sort items
    const filteredAndSortedItems = items
        .filter((item) => {
            // Status filter
            if (statusFilter === 'all') {
                // Show all items
            } else if (statusFilter === 'goal_met') {
                // Group goal met and grace period statuses
                if (
                    !['goal_met', 'goal_met_grace_period'].includes(item.status)
                ) {
                    return false;
                }
            } else if (statusFilter === 'awaiting_decision') {
                // Group awaiting decision statuses
                if (
                    ![
                        'awaiting_confirmation',
                        'not_met_pending_decision',
                    ].includes(item.status)
                ) {
                    return false;
                }
            } else if (item.status !== statusFilter) {
                return false;
            }

            // Category filter (case-insensitive)
            if (selectedCategories.length > 0) {
                const hasMatchingCategory = selectedCategories.some(
                    (selectedCat) =>
                        item.category.some((itemCat) =>
                            itemCat
                                .toLowerCase()
                                .includes(selectedCat.toLowerCase())
                        )
                );
                if (!hasMatchingCategory) return false;
            }

            // Search filter (case-insensitive, includes categories)
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesTitle = item.title.toLowerCase().includes(query);
                const matchesDescription = item.description
                    .toLowerCase()
                    .includes(query);
                const matchesCategory = item.category.some((cat) =>
                    cat.toLowerCase().includes(query)
                );
                if (!matchesTitle && !matchesDescription && !matchesCategory)
                    return false;
            }

            return true;
        })
        .sort((a, b) => {
            switch (sortOption) {
                case 'ending_soon':
                    return (
                        new Date(a.endDate).getTime() -
                        new Date(b.endDate).getTime()
                    );
                case 'newest':
                    return (
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    );
                case 'popular':
                    return b.ticketsSold - a.ticketsSold;
                case 'least_popular':
                    return a.ticketsSold - b.ticketsSold;
                case 'price_low_high':
                    return a.ticketCost - b.ticketCost;
                case 'price_high_low':
                    return b.ticketCost - a.ticketCost;
                default:
                    return 0;
            }
        });

    const handleCategoryToggle = (category: string) => {
        setSelectedCategories((prev) =>
            prev.includes(category)
                ? prev.filter((cat) => cat !== category)
                : [...prev, category]
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'live':
                return 'success';
            case 'goal_met':
                return 'primary';
            case 'goal_met_grace_period':
                return 'secondary';
            case 'awaiting_confirmation':
                return 'warning';
            case 'ended':
                return 'default';
            case 'not_met':
                return 'warning';
            case 'not_met_pending_decision':
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
                return 'Goal Met - Grace Period';
            case 'awaiting_confirmation':
                return 'Awaiting Decision';
            case 'ended':
                return 'Ended';
            case 'not_met':
                return 'Not Met';
            case 'not_met_pending_decision':
                return 'Not Met - Awaiting Decision';
            case 'cancelled':
                return 'Cancelled';
            default:
                return status;
        }
    };

    const truncateText = (text: string, maxLength: number = 150) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    };

    if (loading) {
        return (
            <DefaultLayout>
                <div className="flex justify-center items-center min-h-screen">
                    <div className="text-white text-xl">Loading items...</div>
                </div>
            </DefaultLayout>
        );
    }

    return (
        <DefaultLayout>
            <div className="px-4 md:px-8 lg:px-16 py-10 text-white min-h-screen">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold">Browse Raffles</h1>
                    <p className="text-gray-400">
                        Discover amazing items and join raffles to win
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                    <Input
                        isClearable
                        placeholder="Search raffles..."
                        startContent={<FontAwesomeIcon icon={faSearch} />}
                        className="w-full md:max-w-xs"
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                    <div className="flex gap-4 items-center">
                        <Select
                            labelPlacement="outside"
                            placeholder="Status"
                            className="w-50"
                            selectedKeys={[statusFilter]}
                            onSelectionChange={(keys) =>
                                setStatusFilter(Array.from(keys)[0] as string)
                            }
                        >
                            <SelectItem key="live">Live</SelectItem>
                            <SelectItem key="goal_met">Goal Met</SelectItem>
                            <SelectItem key="awaiting_decision">
                                Awaiting Decision
                            </SelectItem>
                            <SelectItem key="ended">Ended</SelectItem>
                            <SelectItem key="not_met">Not Met</SelectItem>
                            <SelectItem key="cancelled">Cancelled</SelectItem>
                            <SelectItem key="all">All</SelectItem>
                        </Select>
                        <Select
                            labelPlacement="outside"
                            placeholder="Sort by"
                            className="w-40"
                            selectedKeys={[sortOption]}
                            onSelectionChange={(keys) =>
                                setSortOption(Array.from(keys)[0] as string)
                            }
                        >
                            <SelectItem key="ending_soon">
                                Ending Soon
                            </SelectItem>
                            <SelectItem key="newest">Newest</SelectItem>
                            <SelectItem key="popular">Popular</SelectItem>
                            <SelectItem key="least_popular">
                                Least Popular
                            </SelectItem>
                            <SelectItem key="price_low_high">
                                Price Low-High
                            </SelectItem>
                            <SelectItem key="price_high_low">
                                Price High-Low
                            </SelectItem>
                        </Select>
                    </div>
                </div>

                {/* Category Chips */}
                <div className="flex flex-wrap gap-3 max-w-7xl pb-4 mb-8">
                    {predefinedCategories.map((category) => {
                        // Check if this category has any items
                        const hasItems = items.some((item) =>
                            item.category.some((itemCat) =>
                                itemCat
                                    .toLowerCase()
                                    .includes(category.toLowerCase())
                            )
                        );

                        return (
                            <Chip
                                key={category}
                                variant={
                                    selectedCategories.includes(category)
                                        ? 'solid'
                                        : 'bordered'
                                }
                                color={
                                    selectedCategories.includes(category)
                                        ? 'primary'
                                        : hasItems
                                          ? 'default'
                                          : 'default'
                                }
                                onClick={() => handleCategoryToggle(category)}
                                className={`cursor-pointer whitespace-nowrap capitalize hover:scale-105 transition-all duration-200 ease-in-out hover:bg-primary/50`}
                            >
                                {category}
                            </Chip>
                        );
                    })}
                </div>

                {/* Results Count */}
                <p className="text-gray-400 mb-6">
                    Showing {filteredAndSortedItems.length} raffles
                </p>

                {/* Raffle Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSortedItems.map((item) => (
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
                                            item.images[0] ||
                                            'https://via.placeholder.com/400x300'
                                        }
                                    />
                                    <div className="absolute top-2 left-2 flex flex-col gap-2 z-10">
                                        <Chip
                                            color={getStatusColor(item.status)}
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
                                    <div className="absolute bottom-2 left-2 right-2">
                                        <div className="flex gap-2 flex-wrap">
                                            {item.category
                                                .slice(0, 2)
                                                .map((cat) => (
                                                    <Chip
                                                        key={cat}
                                                        size="sm"
                                                        className="bg-black/50 text-white"
                                                    >
                                                        {cat}
                                                    </Chip>
                                                ))}
                                            {item.category.length > 2 && (
                                                <Chip
                                                    size="sm"
                                                    className="bg-black/50 text-white"
                                                >
                                                    +{item.category.length - 2}
                                                </Chip>
                                            )}
                                        </div>
                                    </div>
                                </CardBody>
                                <CardFooter className="text-left flex-col items-start min-h-[200px]">
                                    <h4 className="font-bold text-large mb-2">
                                        {truncateText(item.title, 30)}
                                    </h4>
                                    <p className="text-gray-400 text-sm mb-3 h-[50px]">
                                        {truncateText(item.description)}
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

                                    <div className="flex justify-between items-center w-full mb-3">
                                        <span className="text-lg font-semibold">
                                            ${item.ticketCost}
                                        </span>
                                        <div className="flex items-center gap-1 text-sm text-gray-400">
                                            <FontAwesomeIcon icon={faClock} />
                                            <span>
                                                {formatDate(item.endDate)}
                                            </span>
                                        </div>
                                    </div>
                                </CardFooter>
                            </Card>
                        </Link>
                    ))}
                </div>

                {filteredAndSortedItems.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-400 text-xl">
                            No raffles found matching your criteria
                        </p>
                    </div>
                )}
            </div>
        </DefaultLayout>
    );
}
