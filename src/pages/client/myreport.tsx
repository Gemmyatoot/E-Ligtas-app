import { useEffect, useState, useRef } from 'react';
import { db, storage } from '@/firebase/firebase';
import { useRouter } from 'next/router';
import {
    doc,
    collection,
    addDoc,
    getDoc,
    query,
    onSnapshot,
    orderBy,
    updateDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { XCircle } from 'lucide-react';
import CompletedModal from '@/components/CompletedModal';

interface Message {
    id: string;
    type: 'chat' | 'file';
    message: string;
    createdAt: Date;
    sentBy: string;
}

interface ImagePreview {
    file: File;
    previewUrl: string;
}

const MyReport: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState<string>('');
    const [images, setImages] = useState<ImagePreview[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [transactionId, setTransactionId] = useState<string | null>(null);
    const chatContainerRef = useRef<HTMLDivElement | null>(null);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [status, setStatus] = useState(null);
    const [userData, setUserData] = useState<any | null>(null);
    const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const router = useRouter();
    const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
    const [modalType, setModalType] = useState<'completed' | null>(null);

    useEffect(() => {
        const sessionData = sessionStorage.getItem('userSession');
        if (!sessionData) return;

        try {
            const { uuid, type, id } = JSON.parse(sessionData);

            if (type === 'client') {
                setUserId(uuid);
                setTransactionId(id);
            } else {
                // If the type is not 'client', clear the session data and redirect
                sessionStorage.removeItem('userSession');
                router.push('/client'); // Redirect to '/client' page
            }
        } catch (error) {
            console.error('Invalid session data:', error);
            // In case of error in parsing the session, clear the session and redirect
            sessionStorage.removeItem('userSession');
            router.push('/client'); // Redirect to '/client'
        }
    }, [router]);

    const maskName = (name: string | undefined): string => {
        if (!name) return '';
        const parts = name.split(' ');
        return parts
            .map((part) => {
                if (part.length <= 2) return part; // Skip masking for very short names
                const start = part[0];
                const end = part[part.length - 1];
                const masked = '*'.repeat(part.length - 2);
                return `${start}${masked}${end}`;
            })
            .join(' ');
    };

    const maskNumber = (phone: string | undefined): string => {
        if (!phone || phone.length < 7) return phone || '';
        const start = phone.slice(0, 2);
        const end = phone.slice(-1);
        return `${start}********${end}`;
    };
    const closeModal = () => {
        setSelectedCaseId(null);
        setModalType(null);
    };

    useEffect(() => {
        const fetchUserStatus = () => {
            // Ensure userId is valid
            if (!userId) {
                console.error("User ID is null or undefined");
                return;
            }

            try {
                // Real-time listener for the user's status document from Firestore
                const userDocRef = doc(db, 'users', userId); // Assuming 'users' collection and userId document
                const unsubscribe = onSnapshot(userDocRef, (userDoc) => {
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUserData(userData);
                        setStatus(userData?.status ?? null); // Set the status from Firestore

                        // Check if it's the first login and set modal state
                        if (userData?.is_firstLogin) {
                            setIsFirstLogin(true);
                            setIsModalOpen(true); // Show modal if first login
                        } else {
                            setIsFirstLogin(false);
                        }
                    } else {
                        console.error("No such document!");
                    }
                });

                // Cleanup the listener when the component is unmounted or userId changes
                return unsubscribe;

            } catch (error) {
                console.error("Error fetching user status:", error);
            }
        };

        if (userId) {
            const unsubscribe = fetchUserStatus();
            return () => {
                // Only call unsubscribe if it is defined (it should be, but TypeScript needs assurance)
                if (unsubscribe) {
                    unsubscribe();
                }
            };
        }
    }, [userId]);

    // Real-time listener for Firestore messages
    useEffect(() => {
        if (!userId) return;

        const userDocRef = doc(db, 'users', userId);
        const chatsCollectionRef = collection(userDocRef, 'chats');
        const q = query(chatsCollectionRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs: Message[] = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    type: data.type,
                    message: data.message,
                    createdAt: data.createdAt,
                    sentBy: data.sentBy,
                };
            });
            setMessages(msgs);
            scrollToBottom();
        });

        return () => unsubscribe();
    }, [userId]);

    // Function to copy userId to clipboard
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                alert('User ID copied to clipboard!');
            })
            .catch((err) => {
                console.error('Error copying to clipboard:', err);
            });
    };

    // Function to update is_firstLogin field to false after the modal is viewed
    const updateFirstLoginStatus = async () => {
        try {
            const userDocRef = doc(db, 'users', userId!);
            await updateDoc(userDocRef, { is_firstLogin: false });
            setIsModalOpen(false); // Close modal after updating status
        } catch (error) {
            console.error('Error updating first login status:', error);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = event.target.files;
        if (!selectedFiles) return;

        const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        const newImages: ImagePreview[] = [];

        Array.from(selectedFiles).forEach((file) => {
            if (validImageTypes.includes(file.type)) {
                const previewUrl = URL.createObjectURL(file);
                newImages.push({ file, previewUrl });
            }
        });

        setImages((prev) => [...prev, ...newImages]);
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSendMessage = async () => {
        if (!userId || (!newMessage && images.length === 0)) return;

        setIsSending(true);
        try {
            const userDocRef = doc(db, 'users', userId);
            const chatsCollectionRef = collection(userDocRef, 'chats');

            // Upload images if any
            const uploadedImageUrls: string[] = [];
            for (const { file } of images) {
                const fileRef = ref(storage, `users/${userId}/chats/${file.name}`);
                const snapshot = await uploadBytes(fileRef, file);
                const fileURL = await getDownloadURL(snapshot.ref);
                uploadedImageUrls.push(fileURL);
            }

            const messageData = {
                type: images.length > 0 ? 'file' : 'chat',
                message: images.length > 0 ? uploadedImageUrls.join(',') : newMessage,
                createdAt: Date.now(),
                sentBy: userId,
            };

            await addDoc(chatsCollectionRef, messageData);

            setNewMessage('');
            setImages([]);
            scrollToBottom();
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handlePrintReport = () => {
        setSelectedCaseId(userId);
    };

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            setShowScrollToBottom(false);
        }
    };

    const handleScroll = () => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
            setShowScrollToBottom(!isAtBottom);
        }
    };

    // Map statuses to progress percentage
    const getProgressPercentage = (status: string) => {
        switch (status) {
            case 'assigned':
                return 2;
            case 'Under Investigation':
                return 33;
            case 'In Progress':
                return 64;
            case 'Completed':
                return 100;
            default:
                return 0; // Default to 0% if no valid status is found
        }
    };

    const openStatus = () => {
        const sideContent = document.getElementById("sideContent");
        if (sideContent) {
          sideContent.classList.remove("hidden");
          sideContent.classList.add("block");
        }
      };

      const closeStatus = () => {
        const sideContent = document.getElementById("sideContent");
        if (sideContent) {
          sideContent.classList.remove("block");
          sideContent.classList.add("hidden");
        }
      };
    return (
        <div className="flex h-screen bg-gray-100" style={{ height: 'calc(100vh - 85px)' }}>
            {/* Chat Section */}
            <div className="relative flex flex-col w-[100vw] md:w-2/3 bg-white shadow-md">
                <div className="p-4 bg-blue-600 text-white text-sm font-medium flex justify-between">
                    <p className="text-sm">Report ID: {transactionId}</p>

                    <button className='flex md:hidden' onClick={openStatus}>Status</button>
                </div>
                <div
                    ref={chatContainerRef}
                    className="overflow-y-auto p-4 text-xs relative inline-flex flex-col"
                    style={{ height: 'calc(100vh - 210px)' }}
                    onScroll={handleScroll}
                >
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`mb-4 p-3 rounded-lg max-w-[75%] ${message.sentBy === userId
                                ? 'ml-auto bg-blue-100' // Sent by current user (right-aligned)
                                : 'mr-auto bg-gray-200' // Sent by others (left-aligned)
                                }`}
                        >
                            {message.type === 'chat' && (
                                <p className="text-gray-700" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.message}</p>
                            )}
                            {message.type === 'file' && (
                                <div>
                                    {/* Display image preview if the file is an image */}
                                    <a
                                        href={message.message}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <img
                                            src={message.message}
                                            alt="Uploaded file"
                                            className="w-full h-auto max-h-60 object-contain rounded-lg cursor-pointer"
                                        />
                                    </a>
                                </div>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                                {new Date(message.createdAt).toLocaleString()}
                            </p>
                        </div>
                    ))}

                    {showScrollToBottom && (
                        <button
                            onClick={scrollToBottom}
                            className="sticky bottom-0 bg-blue-600 text-white justify-center items-center p-2 w-[40px] h-[40px] rounded-full shadow-md"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 15.632L20.968 10.884L20.032 9.11597L12 13.368L3.96798 9.11597L3.03198 10.884L12 15.632Z" fill="white" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Message Input */}
                <div className='absolute w-full bottom-0 left-0'>
                    {/* Image Previews Section */}
                    <div className="bg-gray-100">
                        {images.length > 0 && (
                            <div className="p-2">
                                <div className="flex flex-wrap gap-2">
                                    {images.map((image, index) => (
                                        <div key={index} className="relative border bg-white rounded h-[80px] w-[80px] overflow-hidden">
                                            <img
                                                src={image.previewUrl}
                                                alt={`Preview ${index}`}
                                                className="w-20 h-20 object-cover rounded"
                                            />
                                            <button
                                                onClick={() => removeImage(index)}
                                                className="absolute top-2 right-2 text-xs"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z" fill="black" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className=" p-4 bg-white border-t flex items-center space-x-2">
                        <input
                            type="file"
                            onChange={handleFileChange}
                            multiple
                            className="hidden"
                            id="fileUpload"
                        />
                        <label htmlFor="fileUpload">
                            <svg
                                width="20"
                                height="18"
                                viewBox="0 0 20 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M18.9286 0H1.07143C0.787268 0 0.514746 0.112882 0.313814 0.313814C0.112882 0.514746 0 0.787268 0 1.07143V16.0714C0 16.3556 0.112882 16.6281 0.313814 16.829C0.514746 17.03 0.787268 17.1429 1.07143 17.1429H18.9286C19.2127 17.1429 19.4853 17.03 19.6862 16.829C19.8871 16.6281 20 16.3556 20 16.0714V1.07143C20 0.787268 19.8871 0.514746 19.6862 0.313814C19.4853 0.112882 19.2127 0 18.9286 0ZM13.3759 2.86607C13.8146 2.82588 14.255 2.92185 14.6371 3.14093C15.0193 3.36001 15.3247 3.69154 15.5116 4.09039C15.6986 4.48925 15.7582 4.93603 15.6821 5.36993C15.6061 5.80382 15.3981 6.20373 15.0866 6.51522C14.7752 6.8267 14.3752 7.03462 13.9414 7.11067C13.5075 7.18672 13.0607 7.1272 12.6618 6.94021C12.263 6.75323 11.9314 6.44786 11.7124 6.0657C11.4933 5.68353 11.3973 5.24313 11.4375 4.80446C11.4832 4.30578 11.7021 3.83886 12.0562 3.48476C12.4103 3.13066 12.8772 2.91176 13.3759 2.86607ZM1.96429 15.7143C1.82221 15.7143 1.68594 15.6578 1.58548 15.5574C1.48501 15.4569 1.42857 15.3207 1.42857 15.1786V11.2665L7.17143 6.16071L11.4996 10.4799L6.26652 15.7143H1.96429ZM18.5714 15.1786C18.5714 15.3207 18.515 15.4569 18.4145 15.5574C18.3141 15.6578 18.1778 15.7143 18.0357 15.7143H8.28705L14.9625 9.03884L18.5714 12.0464V15.1786Z"
                                    fill="#131419"
                                />
                            </svg>
                        </label>
                        <textarea
                            placeholder="Type a message"
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                                e.target.style.height = "auto"; // Reset height to auto
                                const maxHeight = 100; // Set your maximum height (in pixels)
                                if (e.target.scrollHeight > maxHeight) {
                                    e.target.style.height = `${maxHeight}px`; // Set height to maximum
                                    e.target.style.overflowY = "scroll"; // Enable scroll when max height is reached
                                } else {
                                    e.target.style.height = `${e.target.scrollHeight}px`; // Adjust height to content
                                    e.target.style.overflowY = "hidden"; // Hide overflow if within max height
                                }
                            }}
                            className="flex-1 p-2 border rounded-lg resize-none overflow-hidden"
                            style={{ maxHeight: "200px" }} // Optional: max-height as CSS backup
                            rows={1}
                        />


                        {isSending ? (
                            <svg
                                className="cursor-progress"
                                width="20"
                                height="17"
                                viewBox="0 0 20 17"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M1.4 16.8828L18.85 9.40281C19.0304 9.32597 19.1842 9.19779 19.2923 9.03421C19.4004 8.87064 19.4581 8.67889 19.4581 8.48281C19.4581 8.28674 19.4004 8.09499 19.2923 7.93141C19.1842 7.76784 19.0304 7.63966 18.85 7.56281L1.4 0.0828133C1.2489 0.0169078 1.08377 -0.0103438 0.919509 0.00351645C0.755246 0.0173767 0.597018 0.0719128 0.459098 0.162205C0.321179 0.252498 0.207908 0.375706 0.129505 0.520713C0.0511009 0.665721 0.010031 0.827967 0.00999999 0.992814L0 5.60281C0 6.10281 0.37 6.53281 0.87 6.59281L15 8.48281L0.87 10.3628C0.37 10.4328 0 10.8628 0 11.3628L0.00999999 15.9728C0.00999999 16.6828 0.74 17.1728 1.4 16.8828Z"
                                    fill="#506AFF"
                                />
                            </svg>
                        ) : (
                            <button onClick={handleSendMessage} disabled={isSending}>
                                <svg
                                    width="20"
                                    height="17"
                                    viewBox="0 0 20 17"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M1.4 16.8828L18.85 9.40281C19.0304 9.32597 19.1842 9.19779 19.2923 9.03421C19.4004 8.87064 19.4581 8.67889 19.4581 8.48281C19.4581 8.28674 19.4004 8.09499 19.2923 7.93141C19.1842 7.76784 19.0304 7.63966 18.85 7.56281L1.4 0.0828133C1.2489 0.0169078 1.08377 -0.0103438 0.919509 0.00351645C0.755246 0.0173767 0.597018 0.0719128 0.459098 0.162205C0.321179 0.252498 0.207908 0.375706 0.129505 0.520713C0.0511009 0.665721 0.010031 0.827967 0.00999999 0.992814L0 5.60281C0 6.10281 0.37 6.53281 0.87 6.59281L15 8.48281L0.87 10.3628C0.37 10.4328 0 10.8628 0 11.3628L0.00999999 15.9728C0.00999999 16.6828 0.74 17.1728 1.4 16.8828Z"
                                        fill="#506AFF"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Chat Information Section */}
            <div id='sideContent' className="side-content flex-col w-full h-full md:h-auto md:w-1/3 bg-gray-200 p-4 hidden absolute md:relative md:flex">
                <button className='flex md:hidden p-2 bg-blue-400 text-white rounded ' onClick={closeStatus}>Close</button>
                
                <div className='flex justify-between mb-3 font-medium'>
                    Report Information

                    {status == 'Completed' ? (<button onClick={handlePrintReport} title='Download Data' className='rounded bg-blue-700 p-2'><svg width="18" height="19" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 17H18V19H0V17ZM10 11.172L16.071 5.1L17.485 6.514L9 15L0.515 6.515L1.929 5.1L8 11.173V0H10V11.172Z" fill="white" />
                    </svg>
                    </button>) : (<button title='Data In Progress' className='cursor-not-allowed rounded bg-blue-700 p-2'><svg width="18" height="19" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 17H18V19H0V17ZM10 11.172L16.071 5.1L17.485 6.514L9 15L0.515 6.515L1.929 5.1L8 11.173V0H10V11.172Z" fill="white" />
                    </svg>
                    </button>)}

                </div>

                {status == 'Removed' ? (
                    <div className="max-w-md mx-auto bg-red-100 mb-4 rounded p-2 border border-red-500">
                        <div className="flex items-center">
                            {/* Icon */}
                            <XCircle className="text-red-500 w-8 h-8" />

                            {/* Message */}
                            <div className="ml-4">
                                <h3 className="text-md font-semibold text-red-800">Report Removed</h3>
                                <p className="text-red-600 text-xs">
                                    Based on the results of our investigation, this report has been removed.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div></div>
                )}


                {/* Progress Bar Section */}
                <div className="p-4 bg-white rounded shadow">
                    <div className="text-xs font-semibold text-gray-900">Status</div>
                    <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                            <span className="text-xs font-medium text-gray-600">Assigned</span>
                            <span className="text-xs font-medium text-gray-600">Under Investigation</span>
                            <span className="text-xs font-medium text-gray-600">In Progress</span>
                            <span className="text-xs font-medium text-gray-600">Completed</span>
                        </div>
                        <div className="flex mb-2 items-center justify-between">
                            <span className="text-xs font-medium text-gray-600">25%</span>
                            <span className="text-xs font-medium text-gray-600">50%</span>
                            <span className="text-xs font-medium text-gray-600">75%</span>
                            <span className="text-xs font-medium text-gray-600">100%</span>
                        </div>
                        <div className="flex mb-2 items-center justify-between">
                            <div className="w-full bg-gray-200 rounded-full h-1">
                                <div
                                    className={`h-1 rounded-full transition-all duration-500 ${status === 'assigned'
                                        ? 'bg-gray-400'
                                        : status === 'Under Investigation'
                                            ? 'bg-yellow-500'
                                            : status === 'In Progress'
                                                ? 'bg-blue-500'
                                                : status === 'Completed'
                                                    ? 'bg-green-500'
                                                    : ''}`}
                                    style={{ width: `${getProgressPercentage(status || '')}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow p-4 mt-3 overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                    {userData && (
                        <div className="text-xs">
                            <div className={`rounded shadow p-2 text-white font-medium my-2 ${userData.formData?.incidenttype === 'Rape' ? 'bg-red-500' :
                                status === 'Neglect' ? 'bg-yellow-500' :
                                    status === 'Physical Abuse' ? '' :
                                        'bg-orange-500' /* fallback for other statuses or empty status */
                                }`}>
                                {userData.formData?.incidenttype}
                            </div>

                            <p>Reportee: {maskName(userData.formData?.reportee)}</p>
                            <p>Phone Number: {maskNumber(userData.formData?.contact)}</p>
                            <p>Victim's Name: {maskName(userData.formData?.name)}</p>
                            <p>Status: {userData.status}</p>
                            <p>Age: {userData.formData?.age}</p>
                            <p>Address: {userData.formData?.address}</p>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-w-full space-y-4 text-xs">
                        <h2 className="text-lg font-bold">Welcome!</h2>
                        <p>Please make sure to copy this Transaction ID for monitoring purposes:</p>
                        <p className='text-sm bg-slate-100 rounded py-2 text-center'><strong>{transactionId}</strong></p>
                        <button
                            onClick={() => copyToClipboard(transactionId!)}
                            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-300"
                        >
                            Copy Transaction ID
                        </button>
                        <p>Make sure to copy this for future reference and monitoring purposes.</p>
                        <button
                            onClick={updateFirstLoginStatus}
                            className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-700 transition duration-300"
                        >
                            I have copied it
                        </button>
                    </div>
                </div>
            )}

            {modalType === 'completed' && selectedCaseId && (
                <CompletedModal caseId={selectedCaseId} onClose={closeModal} />
            )}
        </div>
    );
};

export default MyReport;
