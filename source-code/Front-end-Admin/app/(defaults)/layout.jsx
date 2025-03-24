"use client"
import ContentAnimation from '@/components/layouts/content-animation';
import Footer from '@/components/layouts/footer';
import Header from '@/components/layouts/header';
import MainContainer from '@/components/layouts/main-container';
import Overlay from '@/components/layouts/overlay';
import ScrollToTop from '@/components/layouts/scroll-to-top';
import Setting from '@/components/layouts/setting';
import Sidebar from '@/components/layouts/sidebar';
import Portals from '@/components/portals';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DefaultLayout({ children }) {
    const router = useRouter();
    

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        const loginTime = parseInt(sessionStorage.getItem('loginTime'), 10);
        const expiresAt = parseInt(sessionStorage.getItem('expireAT'), 10);

        if (!token) {
            router.push('/auth/boxed-signin'); 
        } else {
            const currentTime = Math.floor(Date.now() / 1000);
            const elapsedTime = currentTime - loginTime;
            const remainingTime = expiresAt - elapsedTime;

            if (remainingTime <= 0) {
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('loginTime');
                sessionStorage.removeItem('expireAT');
                alert('Hết phiên đăng nhập');
                router.push('/auth/boxed-signin');
            } else {
                const timeoutId = setTimeout(() => {
                    sessionStorage.removeItem('token');
                    sessionStorage.removeItem('loginTime');
                    sessionStorage.removeItem('expireAT');
                    alert('Hết phiên đăng nhập');
                    router.push('/auth/boxed-signin');
                }, remainingTime * 1000);

                return () => clearTimeout(timeoutId);
            }
        }
    }, [router]);

    return (
        <>
                {/* BEGIN MAIN CONTAINER */}
                <div className="relative">
                    <Overlay />
                    <ScrollToTop />

                    {/* BEGIN APP SETTING LAUNCHER */}
                    {/* <Setting /> */}
                    {/* END APP SETTING LAUNCHER */}

                    <MainContainer>
                        {/* BEGIN SIDEBAR */}
                        <Sidebar />
                        {/* END SIDEBAR */}
                        <div className="main-content flex min-h-screen flex-col">
                            {/* BEGIN TOP NAVBAR */}
                            <Header />
                            {/* END TOP NAVBAR */}

                            {/* BEGIN CONTENT AREA */}
                            <ContentAnimation>{children}</ContentAnimation>
                            {/* END CONTENT AREA */}

                            {/* BEGIN FOOTER */}
                            <Footer />
                            {/* END FOOTER */}
                            <Portals />
                        </div>
                    </MainContainer>
                </div>
            </>
    );
}