
// components/Topbar.tsx
import React, { useEffect, useState } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/firebase'; // Adjust the import based on your firebase configuration
import { useRouter } from 'next/router';
import { Divide } from 'lucide-react';

// Define the structure of the user data, including formData
interface UserData {
    name: string;
    formData: {
        name: string;
        reportee: string;
    };
    status: string;
}

const Topbar: React.FC<{ toggleSidebar: () => void }> = ({ toggleSidebar }) => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [type, setType] = useState<string>("");
    const router = useRouter();

    useEffect(() => {
        // Retrieve the uuid and type from sessionStorage
        const sessionData = sessionStorage.getItem('userSession');
        if (sessionData) {
            const { uuid, type } = JSON.parse(sessionData);

            // Fetch user data from Firestore
            const fetchUserData = async () => {
                try {
                    const userDocRef = doc(db, 'users', uuid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        // Assuming the document structure matches the UserData type
                        setUserData(userDoc.data() as UserData);
                        setType(type);  // Set the user type
                    } else {
                        console.log("No such document!");
                    }
                } catch (error) {
                    console.error("Error fetching user data: ", error);
                }
            };

            fetchUserData();
        }
    }, []);

    const handleLogout = async (event: React.MouseEvent) => {
        event.preventDefault();
        try {
            // Remove the entire user session data from sessionStorage
            sessionStorage.removeItem('userSession');

            // Redirect based on userType
            const redirectPath = '/';
            router.replace(redirectPath);
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

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
    return (
        <header className="bg-transparent border-b px-4 py-3 flex justify-between">
            <div className="ml-5">
                {userData ? (
                    type === 'client' ? (
                        // Render for client type
                        <div>
                            <h1 className="font-semibold text-[16px]">Hi, {maskName(userData.formData.reportee)} 👋</h1>
                            <p className="text-[13px] text-[#4F4F4F] font-semibold">
                                Here is your status for today
                            </p>
                        </div>
                    ) : (
                        // Render for other types
                        <div>
                            <h1 className="font-semibold text-[16px]">Hi, {userData.name} 👋</h1>
                            <p className="text-[13px] text-[#4F4F4F] font-semibold">
                                Here is your status for today: {userData.status}
                            </p>
                        </div>
                    )
                ) : (
                    <h1 className="font-semibold text-[16px]">Loading...</h1>
                )}
            </div>
            
            {type === 'client' ? (
                <div className='flex items-center' >
                <button onClick={handleLogout} className='md:hidden'>
                <svg className='ml-5' width="15" height="18" viewBox="0 0 15 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.2857 1H2.85714C2.3646 1 1.89223 1.1873 1.54394 1.5207C1.19566 1.8541 1 2.30628 1 2.77778V15.2222C1 15.6937 1.19566 16.1459 1.54394 16.4793C1.89223 16.8127 2.3646 17 2.85714 17H10.2857M14 9L10.2857 5.44444M14 9L10.2857 12.5556M14 9H4.71429" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
            ): (
                <div></div>
            )}
            
        </header>
    );
};

export default Topbar;
