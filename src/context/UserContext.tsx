import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface UserContextType {
    userType: string | null;
    setUserType: (type: string | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    // State to hold userType
    const [userType, setUserType] = useState<string | null>(null);

    useEffect(() => {
        // This code runs only in the browser
        const storedUserType = localStorage.getItem('userType');
        setUserType(storedUserType); // Initialize userType from localStorage if available

        // Update localStorage whenever userType changes
        return () => {
            if (userType) {
                localStorage.setItem('userType', userType);
            } else {
                localStorage.removeItem('userType'); // Clear localStorage if userType is null
            }
        };
    }, []); // Runs once on mount

    useEffect(() => {
        // Update localStorage whenever userType changes
        if (userType) {
            localStorage.setItem('userType', userType);
        } else {
            localStorage.removeItem('userType'); // Clear localStorage if userType is null
        }
    }, [userType]);

    return (
        <UserContext.Provider value={{ userType, setUserType }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
