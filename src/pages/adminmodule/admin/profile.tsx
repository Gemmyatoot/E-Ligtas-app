    import React, { useEffect, useState } from 'react';
    import { auth, db } from '@/firebase/firebase';
    import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
    import { doc, getDoc } from 'firebase/firestore';

    const ProfilePage = () => {
        const [newPassword, setNewPassword] = useState("");
        const [currentPassword, setCurrentPassword] = useState("");
        const [message, setMessage] = useState("");
        const [userEmail, setUserEmail] = useState("");
        const [userName, setUserName] = useState("");
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            const fetchUserData = async () => {
                if (auth.currentUser) {
                    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
                    if (userDoc.exists()) {
                        const { name, email } = userDoc.data();
                        setUserName(name || "No name provided");
                        setUserEmail(email || "No email provided");
                    }
                    setLoading(false);
                }
            };
            fetchUserData();
        }, []);

        const handlePasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            
            if (!auth.currentUser) {
                setMessage("No user is logged in.");
                return;
            }
        
            const user = auth.currentUser;
            
            if (!user.email) {
                setMessage("No email associated with the current user.");
                return;
            }
        
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
        
            try {
                await reauthenticateWithCredential(user, credential);
                await updatePassword(user, newPassword);
                setMessage("Password updated successfully.");
            } catch (error) {
                // Ensure the error is properly typed
                if (error instanceof Error && (error as any).code === 'auth/wrong-password') {
                    setMessage("Current password is incorrect.");
                } else if (error instanceof Error) {
                    setMessage(`Error: ${error.message}`);
                } else {
                    setMessage("An unknown error occurred.");
                }
            }
        };

        if (loading) return <p className="text-center text-gray-500">Loading...</p>;

        return (
            <div className="flex items-center justify-center bg-gray-100 min-h-screen">
                <div className="w-full max-w-md p-8 bg-white shadow-md rounded-lg">
                    <h1 className="text-3xl font-semibold text-center text-gray-800 mb-6">Profile</h1>

                    {/* User icon with the first letter of the name in uppercase */}
                    <div className="flex items-center justify-center mb-6">
                        <div className="flex items-center justify-center w-16 h-16 bg-blue-600 text-white font-bold text-2xl rounded-full">
                            {userName ? userName.charAt(0).toUpperCase() : "?"}
                        </div>
                    </div>

                    {/* Display user details */}
                    <div className="mb-6 text-center">
                        <p className="text-gray-800"><strong>Name:</strong> {userName}</p>
                        <p className="text-gray-800"><strong>Email:</strong> {userEmail}</p>
                    </div>

                    {/* Password update form */}
                    <form onSubmit={handlePasswordChange} className="flex flex-col space-y-4">
                        <label className="text-gray-700 font-medium">
                            Current Password:
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </label>
                        <label className="text-gray-700 font-medium">
                            New Password:
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </label>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition duration-200"
                        >
                            Change Password
                        </button>
                    </form>
                    {message && (
                        <p className="mt-4 text-center text-gray-700">
                            {message}
                        </p>
                    )}
                </div>
            </div>
        );
    };

    export default ProfilePage;
