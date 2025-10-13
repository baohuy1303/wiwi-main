import JSON5 from 'json5';

import { useEffect, useState, useRef } from "react";

import DefaultLayout from "@/layouts/default";
import { Button } from "@heroui/button";
import {
    Input,
    Textarea,
    Select,
    SelectItem,
    Card,
    Chip,
    CheckboxGroup,
    Checkbox,
} from '@heroui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUpload,
    faArrowRight,
    faArrowLeft,
    faWandMagicSparkles,
    faDollarSign,
    faChevronLeft,
    faChevronRight,
    faTimes,
    faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/UserContext';
import { analyzeItem, createItem } from '@/api';

// This mock response can be removed if our backend
// It's used here as a fallback in the catch block for demonstration.
// const mockAiResponse = {
//   category: ["Electronics", "Apple", "Laptop"],
//   aiSuggestedPrice: 1250,
// };

export default function CreateRafflePage() {
    // State to manage which step of the form we are on
    const [step, setStep] = useState(1); // 1: Details, 2: Analyzing, 3: Review
    const { user, loading } = useUser();
    const navigate = useNavigate();

    /* const testParsed = {
        image_quality: {
            resolution: '3024x4032',
            aspect_ratio: 0.75,
            file_size_kb: 2615.77,
            format: 'JPEG',
        },
        title: 'MacBook Pro with Magic Keyboard - Space Gray',
        description:
            'Modern MacBook Pro featuring the sleek Magic Keyboard design in Space Gray. The laptop appears to be in excellent condition with clear keyboard backlighting. The image shows the device during active use with code visible on the screen, indicating full functionality. Red Bull energy drink can visible in background suggests this is a working setup.',
        condition: 'Used - Excellent',
        images: [
            'https://wiwi-bucket-hackmidwest.s3.us-west-2.amazonaws.com/uploads/8011dac5-0a12-4ac2-b5e3-837b95362d3a_IMG_2919.jpg',
        ],
        category: ['Electronics', 'Gaming'],
        aiVerificationScore: 9.2,
        ticketCost: 25,
        ticketGoal: 1200,
        auction_rating: {
            quality_tier: 'High',
            market_demand: 'High',
        },
        recommendations: [
            'Include additional close-up shots of ports and screen',
            'Add specific MacBook model year and specifications',
            'Photograph any included accessories or original packaging',
            'Include system report screenshot showing specifications',
        ],
        notes: 'AI-powered analysis completed using AWS Bedrock Claude 3.5 Sonnet',
    }; */

    useEffect(() => {
        if (!user && !loading) {
            navigate('/login');
        }
    }, [user, loading]);

    // Debug: Monitor formData changes

    // State for all form data
    const [formData, setFormData] = useState({
        title: '',
        condition: 'new',
        description: '',
        imageFiles: [] as File[],
        imageUrls: [] as string[],
        category: [] as string[],
        ticketPrice: 1,
        ticketGoal: 10,
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        aiVerificationScore: 0.85,
    });
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [aiStatus, setAiStatus] = useState<string>(
        'Initializing AI analysis...'
    );
    const [aiProgress, setAiProgress] = useState<number>(0);
    const [parsed, setParsed] = useState<any>(null);

    useEffect(() => {
        console.log('Form data updated:', formData);
    }, [formData]);

    // Function to auto-fill form fields based on AI analysis data
    const autoFillFormFromAI = (aiData: any) => {
        // Map condition from AI to form condition values

        // Map AI categories to form categories (filter to only include valid categories)
        const validCategories = [
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
        const mapCategories = (aiCategories: string[]) => {
            if (!Array.isArray(aiCategories)) return [];
            return aiCategories
                .map((cat) => cat.toLowerCase())
                .filter((cat) =>
                    validCategories.some((valid) =>
                        cat.includes(valid.toLowerCase())
                    )
                );
        };

        // Always prioritize AI-provided S3 image URLs over local files
        const aiImages = aiData.images || [];
        const hasAiImages = aiImages.length > 0;

        // Create the updated form data
        const updatedFormData = {
            title: aiData.title || '',
            description: aiData.description || '',
            condition: aiData.condition || 'used',
            ticketPrice: aiData.ticket_price || 1,
            ticketGoal: aiData.ticket_goal
            || 10,
            category: mapCategories(aiData.category) || [],
            // Always use S3 images from AI analysis when available, otherwise keep existing
            imageFiles: hasAiImages ? [] : formData.imageFiles, // Clear local files when using S3 images
            imageUrls: hasAiImages ? aiImages : formData.imageUrls, // Prioritize S3 URLs
            endDate: formData.endDate,
            aiVerificationScore: aiData.ai_verification_score || 0.1,
        };

        // Update form data with AI suggestions
        setFormData(updatedFormData);

        console.log('Form auto-filled with AI data:', aiData);
        console.log('AI categories:', aiData.category);
        console.log('Mapped categories:', mapCategories(aiData.category));
        console.log('AI S3 images:', aiImages);
        console.log('Has AI S3 images:', hasAiImages);
        console.log(
            'Using S3 images:',
            hasAiImages ? 'YES - S3 URLs' : 'NO - keeping local files'
        );
        console.log('Updated form data:', updatedFormData);

        return updatedFormData;
    };

    // Auto-fill form when step 3 loads and we have AI analysis data
    useEffect(() => {
        console.log(
            'Auto-fill useEffect triggered - step:',
            step,
            'parsed:',
            parsed
        );
        if (step === 3 && parsed) {
            console.log('Step 3 loaded with AI data, auto-filling form...');
            console.log('Parsed data for auto-fill:', parsed);
            autoFillFormFromAI(parsed);
        }
    }, [step, parsed]);
    const currentStepRef = useRef<number>(0);
    const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup interval on unmount or step change
    useEffect(() => {
        return () => {
            if (statusIntervalRef.current) {
                clearInterval(statusIntervalRef.current);
            }
        };
    }, [step]);

    // Debug aiProgress changes
    useEffect(() => {
        console.log('aiProgress changed to:', aiProgress);
    }, [aiProgress]);

    const handleInputChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            const urls = files.map((file) => URL.createObjectURL(file));

            setFormData((prev) => ({
                ...prev,
                imageFiles: files,
                imageUrls: urls,
            }));
        }
    };

    const handleCategoryChange = (value: string[]) => {
        setFormData((prev) => ({ ...prev, category: value }));
        console.log('Selected categories:', value);
    };

    const removeImage = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            imageFiles: prev.imageFiles.filter((_, i) => i !== index),
            imageUrls: prev.imageUrls.filter((_, i) => i !== index),
        }));

        // Adjust current image index if needed
        if (currentImageIndex >= formData.imageUrls.length - 1) {
            setCurrentImageIndex(Math.max(0, formData.imageUrls.length - 2));
        }
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) =>
            prev < formData.imageUrls.length - 1 ? prev + 1 : 0
        );
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) =>
            prev > 0 ? prev - 1 : formData.imageUrls.length - 1
        );
    };

    const startAiAnalysis = async () => {
        if (!formData.imageFiles || formData.imageFiles.length === 0) {
            setError('Please upload at least one image before proceeding.');
            return;
        }
        setError(null);
        setStep(2);

        // Reset AI status
        console.log('Starting AI analysis, resetting status...');
        setAiStatus('Initializing AI analysis...');
        setAiProgress(0);

        const data = new FormData();
        data.append('title', formData.title);
        data.append('condition', formData.condition);
        data.append('description', formData.description);
        // Append the first image for AI analysis
        for (const image of formData.imageFiles) {
            data.append('images', image);
        }

        // Simulate AI analysis steps with real-time updates
        const statusSteps = [
            { status: 'Uploading images to cloud storage...', progress: 10 },
            { status: 'Initializing AWS Bedrock AI model...', progress: 20 },
            { status: 'Analyzing product authenticity...', progress: 35 },
            {
                status: 'Checking for stock photos and AI-generated content...',
                progress: 50,
            },
            { status: 'Running reverse image search...', progress: 65 },
            {
                status: 'Comparing with similar items in database...',
                progress: 80,
            },
            {
                status: 'Calculating optimal pricing and ticket costs...',
                progress: 90,
            },
            { status: 'Generating final recommendations...', progress: 95 },
        ];

        // Reset step counter
        currentStepRef.current = 0;

        // Start status updates
        console.log('Starting interval...');
        statusIntervalRef.current = setInterval(() => {
            console.log(
                'Interval running, current step:',
                currentStepRef.current,
                'total steps:',
                statusSteps.length
            );
            if (currentStepRef.current < statusSteps.length) {
                const step = statusSteps[currentStepRef.current];
                console.log('Updating to step:', step);
                setAiStatus(step.status);
                setAiProgress(step.progress);
                currentStepRef.current++;
            } else {
                // If we've gone through all steps, stop the interval
                console.log('All steps completed, clearing interval');
                if (statusIntervalRef.current) {
                    clearInterval(statusIntervalRef.current);
                    statusIntervalRef.current = null;
                }
            }
        }, 1000);

        // Also start with the first step immediately
        console.log('Setting initial step...');
        setAiStatus(statusSteps[0].status);
        setAiProgress(statusSteps[0].progress);
        currentStepRef.current = 1;

        // Start the API call in parallel
        const apiPromise = analyzeItem(data);

        // Set a timeout to ensure status updates continue even if API is slow
        const timeoutId = setTimeout(() => {
            if (statusIntervalRef.current) {
                clearInterval(statusIntervalRef.current);
                statusIntervalRef.current = null;
            }
            setAiStatus('Analysis taking longer than expected...');
            setAiProgress(95);
        }, 15000); // 15 seconds timeout

        try {
            console.log('Calling analyzeItem API...');
            const aiData = await apiPromise;
            clearTimeout(timeoutId);

            console.log('AI API response received:', aiData);

            // Clear the status interval
            if (statusIntervalRef.current) {
                clearInterval(statusIntervalRef.current);
                statusIntervalRef.current = null;
            }
            setAiStatus('Analysis complete! Processing results...');
            setAiProgress(100);

            // Check if the response has the expected structure
            if (
                aiData &&
                aiData.analysis &&
                aiData.analysis.metrics &&
                aiData.analysis.metrics.traces
            ) {
                console.log('Processing AI response...');
                const rawText =
                    aiData.analysis.metrics.traces[0].children[1].message
                        .content[0].toolResult.content[0].text;

                console.log('Raw AI text:', rawText);

                const parsed = JSON5.parse(rawText);

                // Store the parsed data
                setParsed(parsed);
                console.log('Set parsed data, moving to step 3...');
            } else {
                console.log(
                    'AI response structure unexpected, using fallback...'
                );
                // Use fallback data if structure is unexpected
                const testParsed = {
                    title: 'AI Analysis Result',
                    description:
                        'AI analysis completed but data structure was unexpected',
                    condition: 'Used - Good',
                    category: ['Electronics'],
                    ticketCost: 10,
                    ticketGoal: 500,
                    aiVerificationScore: 0.85,
                    images: [],
                };
                setParsed(testParsed);
            }

            setStep(3);
        } catch (err) {
            // Clear the status interval and timeout on error
            clearTimeout(timeoutId);
            if (statusIntervalRef.current) {
                clearInterval(statusIntervalRef.current);
                statusIntervalRef.current = null;
            }
            setAiStatus('Analysis failed. Using default values...');
            setAiProgress(0);
            console.error('AI Analysis failed:', err);
            console.error(
                'Error details:',
                err instanceof Error ? err.message : String(err),
                err instanceof Error ? err.stack : ''
            );
            setError('AI analysis failed. Using default values.');

            // Use test data as fallback if AI analysis fails
            const fallbackData = {
                title: 'AI Analysis Failed',
                description: 'AI analysis failed, using default values',
                condition: 'Used - Good',
                category: ['Electronics'],
                ticketCost: 10,
                ticketGoal: 500,
                aiVerificationScore: 0.85,
                images: [], // No S3 images in fallback, will use original uploads
            };

            console.log('Using fallback test data:', fallbackData);
            // Store the fallback data for use in step 3
            setParsed(fallbackData);

            setStep(3);
        }
    };

    const handlePostRaffle = async () => {
        if (!user) {
            setError('You must be logged in to create a raffle.');
            return;
        }

        // Validate required fields
        if (
            !formData.title ||
            !formData.description ||
            formData.imageUrls.length === 0 ||
            formData.category.length === 0
        ) {
            setError(
                'Please fill in all required fields and select at least one category.'
            );
            return;
        }

        if (formData.ticketPrice <= 0 || formData.ticketGoal <= 0) {
            setError('Invalid ticket price or goal.');
            return;
        }

        if (formData.ticketPrice > formData.ticketGoal * 0.5) {
            setError('Ticket price cannot exceed 50% of market price.');
            return;
        }

        if (formData.endDate <= new Date()) {
            setError('End date must be in the future.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Create the item data matching the backend schema
            const itemData = {
                sellerId: user._id,
                title: formData.title,
                description: formData.description,
                condition: formData.condition,
                images: formData.imageUrls, // Array of image URLs
                category: formData.category,
                aiVerificationScore: formData.aiVerificationScore || 0.85, // Default score, can be enhanced later
                ticketCost: formData.ticketPrice,
                ticketGoal: formData.ticketGoal,
                ticketsSold: 0,
                participants: [],
                status: 'live',
                endDate: formData.endDate,
                charityOverflow: 0,
                createdAt: new Date(),
            };

            console.log('Submitting item data:', itemData);
            console.log('Categories being sent:', formData.category);

            await createItem(itemData);

            // Navigate to the new raffle detail page or dashboard
            navigate(`/dashboard`);
        } catch (err) {
            console.error('Failed to create raffle:', err);
            setError('Failed to create raffle. Please try again.');
            setIsSubmitting(false);
        }
    };

    /*   const ticketGoal = formData.aiSuggestedPrice > 0 && formData.ticketPrice > 0 
    ? Math.ceil(formData.aiSuggestedPrice / formData.ticketPrice) 
    : 0; */

    return (
        <DefaultLayout>
            <div className="container mx-auto px-4 py-8 text-white">
                <h1 className="text-4xl font-bold mb-2">Create a New Raffle</h1>
                <p className="text-gray-400 mb-8">
                    Follow the steps below to list your item.
                </p>

                {/* STEP 1: Item Details */}
                {step === 1 && (
                    <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700 p-8">
                        <h2 className="text-2xl font-semibold mb-6">
                            1. Item Details
                        </h2>
                        {error && (
                            <p className="text-red-500 bg-red-900/20 p-3 rounded-md mb-4">
                                {error}
                            </p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* ... (Rest of the form remains the same) ... */}
                            {/* Left Column: Form Fields */}
                            <div className="space-y-6">
                                <Input
                                    name="title"
                                    label="Raffle Title"
                                    placeholder="e.g., iPhone 15 Pro Max"
                                    variant="bordered"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                />
                                <Select
                                    name="condition"
                                    label="Item Condition"
                                    selectedKeys={[formData.condition]}
                                    variant="bordered"
                                    onChange={handleInputChange}
                                    required
                                >
                                    <SelectItem key="new">Brand New</SelectItem>
                                    <SelectItem key="like-new">
                                        Like New
                                    </SelectItem>
                                    <SelectItem key="used">
                                        Used (Good Condition)
                                    </SelectItem>
                                    <SelectItem key="lightly-worn">
                                        Lightly Worn
                                    </SelectItem>
                                    <SelectItem key="poor">Poor</SelectItem>
                                    <SelectItem key="needs-repair">
                                        Needs Repair
                                    </SelectItem>
                                </Select>
                                <Textarea
                                    name="description"
                                    label="Description"
                                    placeholder="Describe your item in detail..."
                                    variant="bordered"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            {/* Right Column: Image Upload */}
                            <div className="flex flex-col items-center justify-center">
                                <label
                                    htmlFor="file-upload"
                                    className="relative cursor-pointer w-full h-64 border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center hover:bg-slate-700/50 transition-colors"
                                >
                                    {formData.imageUrls.length > 0 ? (
                                        <div className="w-full h-full relative">
                                            {/* Image Carousel */}
                                            <div className="w-full h-full flex items-center justify-center">
                                                <img
                                                    src={
                                                        formData.imageUrls[
                                                            currentImageIndex
                                                        ]
                                                    }
                                                    alt={`Preview ${currentImageIndex + 1}`}
                                                    className="object-contain w-full h-full rounded-lg"
                                                />
                                            </div>

                                            {/* Navigation Arrows */}
                                            {formData.imageUrls.length > 1 && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={prevImage}
                                                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={faChevronLeft}
                                                            className="text-sm"
                                                        />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={nextImage}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={
                                                                faChevronRight
                                                            }
                                                            className="text-sm"
                                                        />
                                                    </button>
                                                </>
                                            )}

                                            {/* Image Counter */}
                                            <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                                                {currentImageIndex + 1} /{' '}
                                                {formData.imageUrls.length}
                                            </div>

                                            {/* Remove Button */}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeImage(
                                                        currentImageIndex
                                                    )
                                                }
                                                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors"
                                            >
                                                <FontAwesomeIcon
                                                    icon={faTimes}
                                                    className="text-xs"
                                                />
                                            </button>

                                            {/* Dots Indicator */}
                                            {formData.imageUrls.length > 1 && (
                                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                                                    {formData.imageUrls.map(
                                                        (_, index) => (
                                                            <button
                                                                key={index}
                                                                type="button"
                                                                onClick={() =>
                                                                    setCurrentImageIndex(
                                                                        index
                                                                    )
                                                                }
                                                                className={`w-2 h-2 rounded-full transition-colors ${
                                                                    index ===
                                                                    currentImageIndex
                                                                        ? 'bg-white'
                                                                        : 'bg-white/50 hover:bg-white/70'
                                                                }`}
                                                            />
                                                        )
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon
                                                icon={faUpload}
                                                size="3x"
                                                className="text-gray-400 mb-4"
                                            />
                                            <span className="text-gray-400">
                                                Click to upload images
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                PNG, JPG, GIF up to 10MB each
                                            </span>
                                        </>
                                    )}
                                </label>
                                <input
                                    id="file-upload"
                                    name="imageFiles"
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileChange}
                                />
                                {formData.imageUrls.length > 0 && (
                                    <p className="text-sm text-gray-400 mt-2">
                                        {formData.imageUrls.length} image(s)
                                        selected
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end mt-8">
                            <Button
                                color="primary"
                                size="lg"
                                endContent={
                                    <FontAwesomeIcon icon={faArrowRight} />
                                }
                                onClick={startAiAnalysis}
                            >
                                Analyze Item
                            </Button>
                        </div>
                    </Card>
                )}

                {/* STEP 2: AI Analyzing */}
                {step === 2 && (
                    <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700 p-8 text-center h-96 flex flex-col justify-center items-center">
                        <div className="w-full max-w-md">
                            {/* AI Status Header */}
                            <div className="flex items-center justify-center mb-6">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center mr-4">
                                    <FontAwesomeIcon
                                        icon={faWandMagicSparkles}
                                        className="text-white text-xl"
                                    />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-xl font-semibold text-white">
                                        AI Analysis
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        Powered by AWS Bedrock
                                    </p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-slate-700 rounded-full h-3 mb-6">
                                <div
                                    className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${aiProgress}%` }}
                                ></div>
                            </div>

                            {/* Status Message */}
                            <div className="mb-6">
                                <p className="text-lg text-white font-medium mb-2">
                                    {aiStatus}
                                </p>
                                <p className="text-sm text-gray-400">
                                    {aiProgress}% Complete
                                </p>
                            </div>

                            {/* Animated Dots */}
                            <div className="flex justify-center space-x-1">
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                            </div>

                            {/* Analysis Steps Preview */}
                            <div className="mt-6 text-left">
                                <h4 className="text-sm font-semibold text-gray-300 mb-2">
                                    Analysis Steps:
                                </h4>
                                <div className="space-y-1 text-xs text-gray-400">
                                    <div
                                        className={`flex items-center ${aiProgress >= 10 ? 'text-primary' : ''}`}
                                    >
                                        <FontAwesomeIcon
                                            icon={faCheck}
                                            className={`w-3 h-3 mr-2 ${aiProgress >= 10 ? 'text-primary' : 'text-gray-600'}`}
                                        />
                                        Image upload & validation
                                    </div>
                                    <div
                                        className={`flex items-center ${aiProgress >= 35 ? 'text-primary' : ''}`}
                                    >
                                        <FontAwesomeIcon
                                            icon={faCheck}
                                            className={`w-3 h-3 mr-2 ${aiProgress >= 35 ? 'text-primary' : 'text-gray-600'}`}
                                        />
                                        Authenticity verification
                                    </div>
                                    <div
                                        className={`flex items-center ${aiProgress >= 65 ? 'text-primary' : ''}`}
                                    >
                                        <FontAwesomeIcon
                                            icon={faCheck}
                                            className={`w-3 h-3 mr-2 ${aiProgress >= 65 ? 'text-primary' : 'text-gray-600'}`}
                                        />
                                        Reverse image search
                                    </div>
                                    <div
                                        className={`flex items-center ${aiProgress >= 90 ? 'text-primary' : ''}`}
                                    >
                                        <FontAwesomeIcon
                                            icon={faCheck}
                                            className={`w-3 h-3 mr-2 ${aiProgress >= 90 ? 'text-primary' : 'text-gray-600'}`}
                                        />
                                        Price optimization
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* STEP 3: Review & Finalize */}
                {step === 3 && (
                    <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700 p-8">
                        <h2 className="text-2xl font-semibold mb-2">
                            2. Review & Finalize
                        </h2>
                        <p className="text-gray-400 mb-6">
                            We've analyzed your item. You can adjust the
                            suggestions below.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* ... (Rest of Step 3 remains the same) ... */}
                            {/* Left Column: Editable Details */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-primary border-b border-primary/20 pb-2">
                                    Your Item Details
                                </h3>
                                <div className="relative">
                                    {/* Image Carousel for Review */}
                                    <div className="w-full h-64 flex items-center justify-center bg-slate-800 rounded-lg">
                                        <img
                                            src={
                                                formData.imageUrls[
                                                    currentImageIndex
                                                ]
                                            }
                                            alt={`Preview ${currentImageIndex + 1}`}
                                            className="object-contain w-full h-full rounded-lg"
                                        />
                                    </div>

                                    {/* Navigation for Review */}
                                    {formData.imageUrls.length > 1 && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={prevImage}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                                            >
                                                <FontAwesomeIcon
                                                    icon={faChevronLeft}
                                                    className="text-sm"
                                                />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={nextImage}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                                            >
                                                <FontAwesomeIcon
                                                    icon={faChevronRight}
                                                    className="text-sm"
                                                />
                                            </button>
                                        </>
                                    )}

                                    {/* Image Counter for Review */}
                                    <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                                        {currentImageIndex + 1} /{' '}
                                        {formData.imageUrls.length}
                                    </div>

                                    {/* Dots for Review */}
                                    {formData.imageUrls.length > 1 && (
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                                            {formData.imageUrls.map(
                                                (_, index) => (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        onClick={() =>
                                                            setCurrentImageIndex(
                                                                index
                                                            )
                                                        }
                                                        className={`w-2 h-2 rounded-full transition-colors ${
                                                            index ===
                                                            currentImageIndex
                                                                ? 'bg-white'
                                                                : 'bg-white/50 hover:bg-white/70'
                                                        }`}
                                                    />
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                                <Input
                                    name="title"
                                    label="Raffle Title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    variant="bordered"
                                    required
                                />
                                <Select
                                    name="condition"
                                    label="Item Condition"
                                    selectedKeys={[formData.condition]}
                                    onChange={handleInputChange}
                                    variant="bordered"
                                    required
                                >
                                    <SelectItem key="new">Brand New</SelectItem>
                                    <SelectItem key="like-new">
                                        Like New
                                    </SelectItem>
                                    <SelectItem key="used">
                                        Used (Good Condition)
                                    </SelectItem>
                                    <SelectItem key="lightly-worn">
                                        Lightly Worn
                                    </SelectItem>
                                    <SelectItem key="poor">Poor</SelectItem>
                                    <SelectItem key="needs-repair">
                                        Needs Repair
                                    </SelectItem>
                                </Select>
                                <Textarea
                                    name="description"
                                    label="Description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    variant="bordered"
                                    required
                                />
                            </div>

                            {/* Right Column: AI Suggestions (Editable) */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-secondary border-b border-secondary/20 pb-2 flex items-center gap-2">
                                        <FontAwesomeIcon
                                            icon={faWandMagicSparkles}
                                        />
                                        AI Suggestions
                                    </h3>
                                    {parsed && (
                                        <Button
                                            color="primary"
                                            variant="bordered"
                                            size="sm"
                                            onClick={() =>
                                                autoFillFormFromAI(parsed)
                                            }
                                        >
                                            Apply AI Data
                                        </Button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <Input
                                        name="ticketGoal"
                                        label="Product Price"
                                        placeholder="e.g., 1250"
                                        variant="bordered"
                                        type="number"
                                        step="1"
                                        startContent={
                                            <FontAwesomeIcon
                                                icon={faDollarSign}
                                            />
                                        }
                                        value={String(formData.ticketGoal)}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    <Input
                                        name="ticketPrice"
                                        label="Entry Price"
                                        variant="bordered"
                                        type="number"
                                        min="1"
                                        step="1"
                                        startContent={
                                            <FontAwesomeIcon
                                                icon={faDollarSign}
                                            />
                                        }
                                        value={String(formData.ticketPrice)}
                                        onChange={handleInputChange}
                                        description={`Min: $1, Max: $${Math.floor(formData.ticketPrice * 0.5)} (50% of product price)`}
                                        required
                                    />
                                </div>
                                <div className="pt-4 border-t border-slate-700">
                                    <label className="text-sm text-gray-400">
                                        Categories{' '}
                                        {formData.category.length > 0 &&
                                            `(${formData.category.length} selected)`}
                                    </label>
                                    <CheckboxGroup
                                        className="flex flex-wrap gap-2"
                                        name="category"
                                        orientation="horizontal"
                                        value={formData.category}
                                        onValueChange={handleCategoryChange}
                                        isRequired={true}
                                    >
                                        <Checkbox value="electronics">
                                            <Chip>Electronics</Chip>
                                        </Checkbox>
                                        <Checkbox value="clothing">
                                            <Chip>Clothing</Chip>
                                        </Checkbox>
                                        <Checkbox value="furniture">
                                            <Chip>Furniture</Chip>
                                        </Checkbox>
                                        <Checkbox value="books">
                                            <Chip>Books</Chip>
                                        </Checkbox>
                                        <Checkbox value="toys">
                                            <Chip>Toys</Chip>
                                        </Checkbox>
                                        <Checkbox value="sports">
                                            <Chip>Sports</Chip>
                                        </Checkbox>
                                        <Checkbox value="home">
                                            <Chip>Home</Chip>
                                        </Checkbox>
                                        <Checkbox value="other">
                                            <Chip>Other</Chip>
                                        </Checkbox>
                                    </CheckboxGroup>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    End Date *
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.endDate
                                        .toISOString()
                                        .slice(0, 16)}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            endDate: new Date(e.target.value),
                                        }))
                                    }
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>
                        {error && (
                            <p className="text-red-500 bg-red-900/20 p-3 rounded-md mt-4">
                                {error}
                            </p>
                        )}
                        <div className="flex justify-between mt-8">
                            <Button
                                color="default"
                                variant="bordered"
                                size="lg"
                                startContent={
                                    <FontAwesomeIcon icon={faArrowLeft} />
                                }
                                onClick={() => setStep(1)}
                            >
                                Back
                            </Button>
                            <Button
                                color="success"
                                variant="shadow"
                                size="lg"
                                onClick={handlePostRaffle}
                                isLoading={isSubmitting}
                                isDisabled={isSubmitting}
                            >
                                {isSubmitting ? 'Creating...' : 'Post Raffle'}
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
        </DefaultLayout>
    );
}