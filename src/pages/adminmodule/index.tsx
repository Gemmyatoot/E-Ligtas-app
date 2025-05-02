// pages/index.tsx
import { useRouter } from "next/router";
import { useEffect } from "react";
export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        router.push('/client');
    }, [router]);

    return null;
}

HomePage.useLayout = false;