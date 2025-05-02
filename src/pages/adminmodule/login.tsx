import { useState } from 'react';
import { useRouter } from 'next/router';
import InputField from '@/components/inputs/InputField';
import { auth, db } from '@/firebase/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useUser } from '@/context/UserContext';

const AdminLogin = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [resetPasswordMessage, setResetPasswordMessage] = useState<string>('');  // State for reset password message
    const [isForgotPassword, setIsForgotPassword] = useState<boolean>(false); // Track forgot password view
    const router = useRouter();
    const { setUserType } = useUser(); // Access the context

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const userType = userDoc.data().type;

                setUserType(userType); // Set the userType in the context

                const sessionData = {
                    uuid: user.uid,
                    email: formData.email,
                    type: userType,
                };
                sessionStorage.setItem('userSession', JSON.stringify(sessionData));

                if (userType === 'admin') {
                    router.push('/adminmodule/admin/');
                } else if (userType === 'superadmin') {
                    router.push('/adminmodule/superadmin/');
                } else if (userType === 'barangay') {
                    router.push('/adminmodule/barangay/');
                } else {
                    setError('Unauthorized user type');
                }
            } else {
                setError('User does not exist');
            }
        } catch (error) {
            setError('Login failed. Please check your credentials.');
        } finally {
            setLoading(false); // Stop loading
        }
    };

    const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formData.email) {
            setError('Please enter your email to reset your password.');
            return;
        }

        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, formData.email);
            setResetPasswordMessage('Password reset email sent. Please check your inbox.');
            setError(''); // Clear any error messages
        } catch (error) {
            setError('Failed to send password reset email. Please check the email address.');
            setResetPasswordMessage(''); // Clear the success message if error occurs
        } finally {
            setLoading(false);
        }
    };

    const handleBackToLogin = () => {
        setIsForgotPassword(false); // Switch back to login view
        setError(''); // Clear error message
        setResetPasswordMessage(''); // Clear success message
        setFormData({ email: '', password: '' }); // Clear form data
    };

    return (
        <div className='flex flex-col h-screen justify-center items-center'>
            <h1 className='text-3xl font-bold mb-4 text-center'>{isForgotPassword ? 'Reset Password' : 'Login'}</h1>
            <form onSubmit={isForgotPassword ? handleForgotPassword : handleLogin} className='w-[320px]'>
                {/* Only show email input when in forgot password mode */}
                {isForgotPassword && (
                    <>
                        <InputField
                            label="Email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </>
                )}

                {/* Only show password input when not in forgot password mode */}
                {!isForgotPassword && (
                    <>
                        <InputField
                            label="Email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        <InputField
                            label="Password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </>
                )}

                {error && <p className='text-red-500'>{error}</p>}
                {resetPasswordMessage && <p className='text-green-500'>{resetPasswordMessage}</p>} {/* Display success message */}

                <button type="submit" className="flex bg-[#272727] justify-center text-white font-bold py-2 rounded w-full hover:bg-[#272727]">
                    {loading ? (
                        <svg className='animate-spin mr-2' width="31" height="31" viewBox="0 0 31 31" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M29.3413 11.1792C29.8684 11.0146 30.1655 10.4523 29.9673 9.93683C29.0317 7.50371 27.4952 5.34041 25.4945 3.6526C23.2384 1.74938 20.4858 0.529898 17.5604 0.137549C14.6349 -0.254801 11.6583 0.196297 8.98046 1.4378C6.30263 2.6793 4.03495 4.65958 2.44408 7.14579C0.853204 9.632 0.00528502 12.5208 2.4616e-05 15.4724C-0.00523579 18.424 0.832381 21.3158 2.41438 23.8076C3.99638 26.2995 6.25699 28.2878 8.93037 29.5389C11.3012 30.6483 13.9092 31.137 16.5105 30.967C17.0616 30.931 17.4477 30.4257 17.3762 29.8781L16.9632 26.713C16.8917 26.1654 16.3894 25.7845 15.8374 25.8025C14.2191 25.8555 12.606 25.5266 11.131 24.8364C9.35307 24.0044 7.84968 22.682 6.7976 21.0249C5.74551 19.3677 5.18846 17.4446 5.19196 15.4816C5.19546 13.5187 5.75936 11.5976 6.81734 9.94415C7.87533 8.29074 9.38342 6.97378 11.1643 6.14813C12.9451 5.32249 14.9247 5.0225 16.8702 5.28342C18.8157 5.54435 20.6463 6.35535 22.1467 7.62106C23.3915 8.67116 24.366 9.99802 24.996 11.4897C25.2108 11.9984 25.7671 12.2949 26.2943 12.1303L29.3413 11.1792Z" fill="white" />
                        </svg>
                    ) : (
                        isForgotPassword ? 'Send Reset Link' : 'Login'
                    )}
                </button>
            </form>

            {/* Forgot password link */}
            {!isForgotPassword && (
                <div className="mt-4 text-center">
                    <button
                        onClick={() => setIsForgotPassword(true)} // Switch to forgot password view
                        className="text-blue-500 hover:underline"
                    >
                        Forgot Password?
                    </button>
                </div>
            )}

            {/* Back button when in forgot password mode */}
            {isForgotPassword && (
                <div className="mt-4 text-center">
                    <button
                        onClick={handleBackToLogin} // Switch back to login view
                        className="text-blue-500 hover:underline"
                    >
                        Back to Login
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminLogin;

AdminLogin.useLayout = false;
