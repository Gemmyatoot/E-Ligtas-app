// components/modals/ViewMyReportModal.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Modal from "@/components/Modal";
import InputField from "@/components/inputs/InputField";
import { auth, db, signInAnonymously } from "@/firebase/firebase";
import { getDoc, doc, getDocs, collection } from 'firebase/firestore';

interface ViewMyReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ViewMyReportModal({ isOpen, onClose }: ViewMyReportModalProps) {
    const [transactionId, setTransactionId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTransactionId(e.target.value);
    };

    const handleLogin = async () => {
        setError("");
        setLoading(true);
    
        // Ensure the transactionId is valid
        if (!transactionId || transactionId.length < 6) {
            setError("Transaction ID must be at least 6 characters long.");
            setLoading(false);
            return;
        }
    
        // Get the first 3 characters and the last 3 characters from the transactionId
        const start = transactionId.slice(0, 3); // e.g. "hsy"
        const end = transactionId.slice(-3);    // e.g. "H2d"
    
        try {
            // Firestore query to find all documents in "users" collection
            const usersCollectionRef = collection(db, "users");
            const querySnapshot = await getDocs(usersCollectionRef);
    
            // Filter documents by document ID matching the start and end parts
            const matchingDocs = querySnapshot.docs.filter(doc => {
                const userId = doc.id;
                return userId.startsWith(start) && userId.endsWith(end);
            });
    
            if (matchingDocs.length > 0) {
                // Assuming there's a match, get the first document (you can customize this as needed)
                const matchedUserDoc = matchingDocs[0];
    
                // Set the session data
                const sessionData = {
                    uuid: matchedUserDoc.id,  // Use the matched document ID
                    type: "client",
                    id: transactionId,         // Store the transaction ID as well
                };
    
                sessionStorage.setItem("userSession", JSON.stringify(sessionData));
    
                // Redirect to the report page
                router.push("/client/myreport");
            } else {
                setError("No matching transaction found.");
            }
        } catch (error) {
            console.error("Error logging in:", error);
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    
    

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h2 className="text-lg font-semibold">View My Report</h2>
            <p className="mb-4 text-xs">You will be redirected to your Report.</p>

            <InputField
                label="Transaction ID"
                type="text"
                name="transactionid"
                value={transactionId}
                onChange={handleChange}
                required
            />

            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

            <div className='flex gap-3'>
                <button onClick={handleLogin} className="flex bg-[#272727] px-3 text-sm justify-center text-white font-medium py-2 rounded hover:bg-[#272727]">
                    {loading ? (
                        <svg className='animate-spin mr-2' width="31" height="31" viewBox="0 0 31 31" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M29.3413 11.1792C29.8684 11.0146 30.1655 10.4523 29.9673 9.93683C29.0317 7.50371 27.4952 5.34041 25.4945 3.6526C23.2384 1.74938 20.4858 0.529898 17.5604 0.137549C14.6349 -0.254801 11.6583 0.196297 8.98046 1.4378C6.30263 2.6793 4.03495 4.65958 2.44408 7.14579C0.853204 9.632 0.00528502 12.5208 2.4616e-05 15.4724C-0.00523579 18.424 0.832381 21.3158 2.41438 23.8076C3.99638 26.2995 6.25699 28.2878 8.93037 29.5389C11.3012 30.6483 13.9092 31.137 16.5105 30.967C17.0616 30.931 17.4477 30.4257 17.3762 29.8781L16.9632 26.713C16.8917 26.1654 16.3894 25.7845 15.8374 25.8025C14.2191 25.8555 12.606 25.5266 11.131 24.8364C9.35307 24.0044 7.84968 22.682 6.7976 21.0249C5.74551 19.3677 5.18846 17.4446 5.19196 15.4816C5.19546 13.5187 5.75936 11.5976 6.81734 9.94415C7.87533 8.29074 9.38342 6.97378 11.1643 6.14813C12.9451 5.32249 14.9247 5.0225 16.8702 5.28342C18.8157 5.54435 20.6463 6.35535 22.1467 7.62106C23.3915 8.67116 24.366 9.99802 24.996 11.4897C25.2108 11.9984 25.7671 12.2949 26.2943 12.1303L29.3413 11.1792Z" fill="white" />
                        </svg>
                    ) : (
                        'View Report'
                    )}
                </button>

                <button
                    onClick={onClose}
                    className="px-3 text-sm border border-black  py-2 bg-white text-black rounded hover:bg-slate-100"
                >
                    Cancel
                </button>
            </div>
        </Modal>
    );
}
