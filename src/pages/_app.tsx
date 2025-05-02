import { AppProps } from 'next/app';
import Layout from '../components/Layout';
import { UserProvider } from '@/context/UserContext';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps & { Component: { useLayout: boolean } }) {
    const useLayout = Component.useLayout ?? true;

    return (
        <UserProvider>
            {useLayout ? (
                <Layout>
                    <Component {...pageProps} />
                </Layout>
            ) : (
                <Component {...pageProps} />
            )}
        </UserProvider>
    );
}

export default MyApp;