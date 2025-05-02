import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        router.push('/client');
    }, [router]);

    return null;
}

Home.useLayout = false;