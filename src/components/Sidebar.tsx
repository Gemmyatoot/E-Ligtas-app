import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import routesData from '@/data/routes.json';

type Route = {
    name: string;
    path: string;
    icon: string;
};

type RoutesData = {
    users: {
        client: {
            routes: Route[];
        };
        admin: {
            routes: Route[];
        };
        superadmin: {
            routes: Route[];
        };
    };
};

type UserSession = {
    uuid: string;
    email: string;
    id: string;
    type: string;
};

interface SidebarProps {
    mobileOpen?: boolean;
    toggleSidebar?: () => void;
}

const typedRoutesData = routesData as RoutesData;

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, toggleSidebar }) => {
    const router = useRouter();
    const [isHovered, setIsHovered] = useState(false);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [userSession, setUserSession] = useState<UserSession | null>(null);
    const [transactionId, setTransactionId] = useState<string | null>(null);
    const [screenWidth, setScreenWidth] = useState<number>(0); // Default to 0

    // Handle screen width only on the client side
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setScreenWidth(window.innerWidth);

            const handleResize = () => setScreenWidth(window.innerWidth);
            window.addEventListener('resize', handleResize);

            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    // Fetch user session from sessionStorage
    useEffect(() => {
        const sessionData = sessionStorage.getItem('userSession');
        if (sessionData) {
            const session = JSON.parse(sessionData) as UserSession;
            setUserSession(session);
            setTransactionId(session.id);
        }
    }, []);

    // Update routes based on user type
    useEffect(() => {
        if (userSession) {
            const { type } = userSession;
            const userRoutes = typedRoutesData.users[type as keyof typeof typedRoutesData.users]?.routes || [];
            setRoutes(userRoutes);
        }
    }, [userSession]);

    // Handle user logout
    const handleLogout = async (event: React.MouseEvent) => {
        event.preventDefault();
        try {
            sessionStorage.removeItem('userSession');
            const auth = getAuth();
            await signOut(auth);
            const redirectPath = userSession?.type === 'client' ? '/client' : '/adminmodule/login';
            router.replace(redirectPath);
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    // Copy incident ID to clipboard
    const copyID = () => {
        navigator.clipboard.writeText(transactionId || '');
    };

    // Determine sidebar width and visibility
    const sidebarWidth = mobileOpen ? 'w-64' : isHovered ? 'w-64' : 'w-16';
    const isSidebarHidden = userSession?.type === 'client' && screenWidth < 768 && !mobileOpen;

    if (isSidebarHidden) {
        return null;
    }

    return (
        <aside
            className={`h-[100%] bg-white border-r text-[#272727] transition-all duration-300 sticky ${sidebarWidth}`}
            onMouseEnter={() => !mobileOpen && setIsHovered(true)}
            onMouseLeave={() => !mobileOpen && setIsHovered(false)}
        >
            <div className="relative p-4 h-16 flex justify-center items-center">
                {(isHovered || mobileOpen) ? (
                    <img src="/images/dswd.png" alt="Logo" className="h-10" />
                ) : (
                    <img src="/icons/dswd.png" alt="Small Logo" className="w-10" />
                )}

                {toggleSidebar && (
                    <div
                        onClick={toggleSidebar}
                        className={`flex justify-center items-center px-1 py-2 absolute -right-5 rounded border bg-white ${
                            isHovered || mobileOpen ? '' : 'rotate-180'
                        }`}
                    >
                        <svg width="22" height="14" viewBox="0 0 22 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 9H3C2.44 9 2 8.56 2 8C2 7.44 2.44 7 3 7H21C21.56 7 22 7.44 22 8C22 8.56 21.56 9 21 9Z" fill="#878787" />
                            <path
                                d="M8 16C7.86885 16.0016 7.73881 15.9757 7.61826 15.9241C7.4977 15.8724 7.38929 15.7961 7.3 15.7L0.3 8.7C-0.1 8.3 -0.1 7.68 0.3 7.28L7.3 0.3C7.7 -0.1 8.32 -0.1 8.72 0.3C9.12 0.7 9.12 1.32 8.72 1.72L2.42 8.02L8.72 14.32C9.12 14.72 9.12 15.34 8.72 15.74C8.52 15.94 8.26 16.04 8.02 16.04L8 16Z"
                                fill="#878787"
                            />
                        </svg>
                    </div>
                )}
            </div>

            {isHovered && userSession?.type === 'client' && (
                <div className="px-3 mt-3 h-[45px]">
                    <h2 className="text-[16px] font-medium">Incident ID:</h2>
                    <div className="flex justify-between">
                        <p className="text-[12px] text-[#4F4F4F]">{transactionId}</p>
                        <button onClick={copyID}>
                            <svg
                                width="17"
                                height="19"
                                viewBox="0 0 17 19"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                {/* SVG path */}
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4 mt-5 h-[60vh]">
                {routes.map((route) => (
                    <Link key={route.name} href={route.path} className="flex items-center p-3 text-[14px] text-[#4F4F4F] rounded hover:bg-[#F4F4F4]">
                        <img src={route.icon} alt={route.name} className="h-5 w-5 mr-3" />
                        {(isHovered || mobileOpen) && route.name}
                    </Link>
                ))}
            </div>

            {userSession && (
                <div onClick={handleLogout} className="h-12 flex items-center space-x-4 bg-[#FF2C2C] cursor-pointer">
                    <svg className='ml-5' width="15" height="18" viewBox="0 0 15 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.2857 1H2.85714C2.3646 1 1.89223 1.1873 1.54394 1.5207C1.19566 1.8541 1 2.30628 1 2.77778V15.2222C1 15.6937 1.19566 16.1459 1.54394 16.4793C1.89223 16.8127 2.3646 17 2.85714 17H10.2857M14 9L10.2857 5.44444M14 9L10.2857 12.5556M14 9H4.71429" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {isHovered && <p className="text-white">Logout</p>}
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
