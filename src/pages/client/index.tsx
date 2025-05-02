import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { auth } from "@/firebase/firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import ViewMyReportModal from '@/components/ViewMyReportModal';
import ReportIncidentModal from '@/components/ReportIncidentModal';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface NewsItem {
    id: string;
    title: string;
    caption: string;
    createdAt: string; // You can format this later for display
    images: string[];
}

export default function ClientPage() {
    const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [userType, setUserType] = useState<"client" | "other" | null>(null);
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const router = useRouter();

    const [isOpen, setIsOpen] = useState(false);
    const [shouldAnimate, setShouldAnimate] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const [fullScreenImages, setFullScreenImages] = useState<string[]>([]); // Array of image URLs
    const [currentImageIndex, setCurrentImageIndex] = useState<number>(0); // Index of the currently displayed image
    const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const tutorialSteps = [
        {
            title: "Welcome to Incident Reporting",
            content: "This quick tutorial will show you how to report a new incident using our system. Let's get started!",
            image: null,
            highlight: null
        },
        {
            title: "Locate the Report Card",
            content: "Find the 'Report New Incident' card on your dashboard. It's easily identifiable by its distinctive image.",
            image: "/images/card2.png",
            highlight: "card-header"
        },
        {
            title: "Understand the Purpose",
            content: "The card provides a quick way to report new incidents. Each report you submit will be tracked and addressed promptly by our team.",
            highlight: "card-description"
        },
        {
            title: "Submit a Report",
            content: "Click the 'Report New Incident' button at the bottom of the card. This will open the reporting form where you can provide incident details.",
            highlight: "card-button"
        },
        {
            title: "Ready to Report",
            content: "You're now ready to report incidents! Remember, providing clear and detailed information helps us resolve issues faster.",
            highlight: null
        }
    ];

    useEffect(() => {
        const hasSeenTutorial = localStorage.getItem('tutorialSeen');

        if (!hasSeenTutorial) {
            setTimeout(() => {
                setShouldAnimate(true);
                setIsOpen(true);
            }, 100);
        } else {
            setShouldAnimate(true);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserType("client");
            } else {
                setUserType(null);
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchNews = async () => {
        const db = getFirestore();
        const newsCollection = collection(db, 'news'); // Adjust the collection name as necessary
        const newsSnapshot = await getDocs(newsCollection);
        const newsData = newsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as { title: string; caption: string; createdAt: string; images: string[]; })
        }));
        setNewsItems(newsData);
    };

    useEffect(() => {
        fetchNews();
    }, []);

    const createClient = async () => {
        try {
            await signInAnonymously(auth);
            setUserType("client");
            router.push("/client/myreport");
        } catch (error) {
            console.error("Error creating anonymous user:", error);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('tutorialSeen', 'true');
    };

    const handleNext = () => {
        if (currentStep < tutorialSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const openFullScreen = (images: string[], index: number) => {
        console.log("Opening Full Screen Viewer");
        console.log("Images:", images);
        console.log("Starting Index:", index);
        setFullScreenImages(images);
        setCurrentImageIndex(index);
        setIsFullScreen(true);
    };


    // Close full-screen viewer
    const closeFullScreen = () => {
        setIsFullScreen(false);
        setFullScreenImages([]);
        setCurrentImageIndex(0);
    };

    // Handle navigation between images
    const navigateImage = (direction: 'next' | 'prev'): void => {
        console.log("test");
        setCurrentImageIndex((prevIndex) => {
            let newIndex;
            if (direction === 'next') {
                newIndex = (prevIndex + 1) % fullScreenImages.length; // Wrap to start
            } else {
                newIndex = (prevIndex - 1 + fullScreenImages.length) % fullScreenImages.length; // Wrap to end
            }
            console.log("Navigating:", direction, "New Index:", newIndex);
            return newIndex;
        });
    };

    return (
        <div className='max-w-[100vw]'>
            <nav className='justify-between items-center flex w-full px-5 py-3'>
                <h1 className='font-bold'>E-Ligtas</h1>
                <ul className='flex gap-5 items-center'>
                    <li><a href="#homepage">Home</a></li>
                    <li><a href="#newspage">News</a></li>
                    <li onClick={() => setIsLoginModalOpen(true)} className='py-2 px-4 rounded text-white font-semibold bg-blue-500 hover:bg-blue-600'>Report Incident</li>
                </ul>
            </nav>

            <section id='homepage' className="relative min-h-[100dvh] flex items-center">
                <div className="absolute inset-0 -z-10">
                    <Image src="/images/bg2.jpg" alt="bg-2" layout="fill" objectFit="cover" objectPosition="center" priority />
                </div>

                <div className='inset-0 -z-10 h-full w-full bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-10 border-b absolute py-2 px-10 font-bold text-xl'>

                </div>
                <div className="flex flex-wrap gap-5 justify-center p-10 md:p-20">

                    <div className="mb-5 relative w-72 h-[350px] md:w-80 flex flex-col rounded-xl bg-white bg-clip-border text-gray-700 shadow-md">
                        <div className="relative mx-4 -mt-6 h-40 overflow-hidden rounded-xl bg-blue-gray-500 bg-clip-border text-white shadow-lg shadow-blue-gray-500/40 bg-gradient-to-r bg-red-100 border-2 border-white">
                            <Image src="/images/card1.png" alt="bg-2" layout="fill" objectFit="cover" objectPosition="center" priority />
                        </div>
                        <div className="p-6">
                            <h5 className="mb-2 block font-sans text-xl font-semibold leading-snug tracking-normal text-blue-gray-900 antialiased">
                                My Reported Incidents
                            </h5>
                            <p className="block font-sans text-base font-light leading-relaxed text-inherit antialiased">
                                Access a complete history of your reported incidents here. Stay informed about updates and resolutions for each case you've submitted.
                            </p>
                        </div>
                        <div className="p-6 pt-0">
                            <button onClick={() => setIsCreateClientModalOpen(true)} data-ripple-light="true" type="button" className="select-none rounded-lg bg-blue-500 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/40 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none">
                                My Reported Incident
                            </button>
                        </div>
                    </div>

                    <div className="relative flex w-72 md:w-80 h-[350px] flex-col rounded-xl bg-white bg-clip-border text-gray-700 shadow-md">
                        <div className="relative mx-4 -mt-6 h-40 overflow-hidden rounded-xl bg-blue-gray-500 bg-clip-border text-white shadow-lg shadow-blue-gray-500/40 bg-gradient-to-r bg-blue-100 border-2 border-white">
                            <Image src="/images/card2.png" alt="bg-2" layout="fill" objectFit="cover" objectPosition="center" priority />
                        </div>
                        <div className="p-6">
                            <h5 className="mb-2 block font-sans text-xl font-semibold leading-snug tracking-normal text-blue-gray-900 antialiased">
                                Report New Incident
                            </h5>
                            <p className="block font-sans text-base font-light leading-relaxed text-inherit antialiased">
                                Have a new incident to report? Submit it here to ensure swift action and a clear record of the issue for prompt resolution.
                            </p>
                        </div>
                        <div className="p-6 pt-0">
                            <button onClick={() => setIsLoginModalOpen(true)} data-ripple-light="true" type="button" className="select-none rounded-lg bg-red-500 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/40 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none">
                                Report New Incident
                            </button>
                        </div>
                    </div>

                </div>
            </section>

            <section id="newspage" className="relative max-w-6xl mx-auto min-h-[100dvh] items-center px-16 py-10">
    <h1 className="text-2xl font-bold mb-4">News</h1>
    <div className="flex flex-wrap gap-5 justify-center">
        {/* Sort newsItems by createdAt in descending order */}
        {newsItems
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((news) => (
                <div
                    key={news.id}
                    className="relative flex min-w-96 max-w-96 flex-col rounded-xl bg-white bg-clip-border text-gray-700 shadow-md"
                >
                    <div className="p-6">
                        <h5 className="mb-2 block font-sans text-xl font-semibold leading-snug tracking-normal text-blue-gray-900 antialiased">
                            {news.title}
                        </h5>
                        <div className="relative">
                            <p
                                className={`text-gray-600 mb-2 ${
                                    isExpanded ? '' : 'line-clamp-3 overflow-hidden'
                                }`}
                                style={{
                                    display: '-webkit-box',
                                    WebkitBoxOrient: 'vertical',
                                    WebkitLineClamp: isExpanded ? 'none' : 3,
                                    overflow: 'hidden',
                                }}
                            >
                                {news.caption}
                            </p>
                            {news.caption.length > 0 && (
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="text-blue-500 hover:underline mt-1"
                                >
                                    {isExpanded ? 'Show Less' : 'Show More'}
                                </button>
                            )}
                        </div>
                        <p className="text-gray-400 text-sm">
                            {new Date(news.createdAt).toLocaleString()}
                        </p>
                    </div>
                    <div
                        className={`grid ${
                            news.images.length === 1
                                ? 'grid-cols-1'
                                : news.images.length === 2
                                ? 'grid-cols-2'
                                : news.images.length === 3
                                ? 'grid-cols-3'
                                : 'grid-cols-2'
                        } gap-2`}
                    >
                        {news.images.slice(0, 4).map((imageUrl, index) => (
                            <div
                                key={index}
                                className="relative h-48 overflow-hidden cursor-pointer"
                                onClick={() => openFullScreen(news.images, index)}
                            >
                                <Image
                                    src={imageUrl}
                                    alt={`News image ${index + 1}`}
                                    layout="fill"
                                    objectFit="cover"
                                    priority
                                />
                                {news.images.length > 4 && index === 3 && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <span className="text-white text-lg">
                                            +{news.images.length - 4}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        {/* Full Screen Image Viewer */}
        {isFullScreen && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
                <button
                    className="absolute top-4 right-4 text-white p-2"
                    onClick={closeFullScreen}
                >
                    <X className="h-8 w-8" />
                </button>
                {fullScreenImages.length > 1 && (
                    <>
                        <button
                            className="absolute z-50 right-4 text-white p-2"
                            onClick={() => navigateImage("next")}
                        >
                            <ArrowRight className="h-8 w-8" />
                        </button>
                        <button
                            className="absolute left-4 z-50 text-white p-2"
                            onClick={() => navigateImage("prev")}
                        >
                            <ArrowLeft className="h-8 w-8" />
                        </button>
                    </>
                )}
                <div className="relative w-full h-[70vh]">
                    <Image
                        src={fullScreenImages[currentImageIndex]}
                        alt={`Full screen image ${currentImageIndex + 1}`}
                        fill
                        style={{ objectFit: 'contain' }}
                        priority
                    />
                </div>
            </div>
        )}
    </div>
</section>


            <footer className="relative flex items-center"></footer>

            {/* View My Report Modal */}
            <ViewMyReportModal
                isOpen={isCreateClientModalOpen}
                onClose={() => setIsCreateClientModalOpen(false)}
            />

            {/* Report New Incident Modal */}
            <ReportIncidentModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
            />

            <div className="fixed bottom-10 right-10">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative flex focus:outline-none"
                    aria-label="Toggle info modal"
                >
                    <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></div>
                    <div className="relative inline-flex rounded-full bg-blue-500 p-2 transition-transform hover:scale-110">
                        <svg
                            width="26"
                            height="26"
                            viewBox="0 0 32 32"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={`transition-transform duration-300 ${isOpen ? 'scale-0' : 'scale-100'
                                }`}
                        >
                            <path
                                d="M19.8911 0C22.0351 0 23.1071 1.4592 23.1071 3.1312C23.1071 5.2192 21.2447 7.1504 18.8207 7.1504C16.7903 7.1504 15.6063 5.9504 15.6623 3.9664C15.6623 2.2976 17.0719 0 19.8911 0ZM13.2943 32C11.6015 32 10.3615 30.9568 11.5455 26.3616L13.4879 18.2144C13.8255 16.912 13.8815 16.3888 13.4879 16.3888C12.9807 16.3888 10.7855 17.288 9.48469 18.176L8.63989 16.768C12.7551 13.2704 17.4895 11.2208 19.5215 11.2208C21.2127 11.2208 21.4943 13.2576 20.6495 16.3888L18.4239 24.952C18.0303 26.464 18.1983 26.9856 18.5935 26.9856C19.1007 26.9856 20.7647 26.3584 22.3999 25.0544L23.3599 26.3568C19.3567 30.432 14.9839 32 13.2943 32Z"
                                fill="white"
                            />
                        </svg>
                    </div>
                </button>
            </div>

            {/* Modal Container */}
            <div className="fixed bottom-10 right-10">
                <button
                    onClick={() => setIsOpen(true)}
                    className="relative flex focus:outline-none"
                    aria-label="Show tutorial"
                >
                    <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></div>
                    <div className="relative inline-flex rounded-full bg-blue-500 p-2 transition-transform hover:scale-110">
                        <svg
                            width="26" height="26" viewBox="0 0 32 32" fill="none"
                            className={`${shouldAnimate ? 'transition-transform duration-300' : ''} ${isOpen ? 'scale-0' : 'scale-100'
                                }`}
                        >
                            <path d="M19.8911 0C22.0351 0 23.1071 1.4592 23.1071 3.1312C23.1071 5.2192 21.2447 7.1504 18.8207 7.1504C16.7903 7.1504 15.6063 5.9504 15.6623 3.9664C15.6623 2.2976 17.0719 0 19.8911 0ZM13.2943 32C11.6015 32 10.3615 30.9568 11.5455 26.3616L13.4879 18.2144C13.8255 16.912 13.8815 16.3888 13.4879 16.3888C12.9807 16.3888 10.7855 17.288 9.48469 18.176L8.63989 16.768C12.7551 13.2704 17.4895 11.2208 19.5215 11.2208C21.2127 11.2208 21.4943 13.2576 20.6495 16.3888L18.4239 24.952C18.0303 26.464 18.1983 26.9856 18.5935 26.9856C19.1007 26.9856 20.7647 26.3584 22.3999 25.0544L23.3599 26.3568C19.3567 30.432 14.9839 32 13.2943 32Z" fill="white" />
                        </svg>
                    </div>
                </button>
            </div>

            {/* Modal Container */}
            <div
                className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
                    }`}
            >
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black ${shouldAnimate ? 'transition-opacity duration-300' : ''} ${isOpen ? 'opacity-50' : 'opacity-0'
                        }`}
                    onClick={handleClose}
                />

                {/* Modal Content */}
                <div
                    className={`bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full m-4 ${shouldAnimate ? 'transition-all duration-300' : ''
                        }`}
                    style={{
                        transform: isOpen ? 'scale(1) translate(0, 0)' : 'scale(0) translate(calc(50vw - 50%), calc(50vh - 50%))',
                        opacity: isOpen ? 1 : 0,
                        transformOrigin: 'bottom right'
                    }}
                >
                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
                        aria-label="Close modal"
                    >
                        <X size={24} />
                    </button>

                    {/* Tutorial Content */}
                    <div className="space-y-6 mt-6">
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 h-1 rounded-full ">
                            <div
                                className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
                            />
                        </div>

                        {/* Step Content */}
                        <div className="min-h-[300px]">
                            <h2 className="text-lg font-bold mb-4">{tutorialSteps[currentStep].title}</h2>

                            <div className="relative">
                                {/* Example Card (shown in specific steps) */}
                                {currentStep >= 1 && currentStep <= 3 && (
                                    <div className={`relative flex w-60 h-[250px] mt-10 flex-col rounded-xl bg-white bg-clip-border text-gray-700 shadow-md mx-auto ${tutorialSteps[currentStep].highlight === 'card-header' ? 'ring-4 ring-blue-500 ring-offset-4' : ''
                                        }`}>
                                        <div className="relative mx-4 -mt-6 h-40 overflow-hidden rounded-xl bg-blue-gray-500 bg-clip-border text-white shadow-lg shadow-blue-gray-500/40 bg-gradient-to-r bg-blue-100 border-2 border-white">
                                            <img src="/images/card2.png" alt="Example card header" className="w-full h-full object-cover" />
                                        </div>
                                        <div className={`p-6 ${tutorialSteps[currentStep].highlight === 'card-description' ? 'ring-4 ring-blue-500 ring-offset-4' : ''
                                            }`}>
                                            <h5 className="mb-2 block font-sans text-md font-semibold leading-snug tracking-normal text-blue-gray-900 antialiased">
                                                Report New Incident
                                            </h5>
                                            <p className="block font-sans text-xs font-light leading-relaxed text-inherit antialiased">
                                                Have a new incident to report? Submit it here to ensure swift action and a clear record of the issue for prompt resolution.
                                            </p>
                                        </div>
                                        <div className={`p-6 pt-0 ${tutorialSteps[currentStep].highlight === 'card-button' ? 'ring-4 ring-blue-500 ring-offset-4' : ''
                                            }`}>
                                            <button className="select-none rounded-lg bg-red-500 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/40">
                                                Report New Incident
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <p className="text-gray-600 text-xs mt-5">{tutorialSteps[currentStep].content}</p>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between items-center">
                            <button
                                onClick={handlePrev}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${currentStep === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500 hover:bg-blue-50'
                                    }`}
                                disabled={currentStep === 0}
                            >
                                <ChevronLeft size={20} />
                                <span>Previous</span>
                            </button>

                            {currentStep < tutorialSteps.length - 1 ? (
                                <button
                                    onClick={handleNext}
                                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                                >
                                    <span>Next</span>
                                    <ChevronRight size={20} />
                                </button>
                            ) : (
                                <button
                                    onClick={handleClose}
                                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    Get Started
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

ClientPage.useLayout = false;
