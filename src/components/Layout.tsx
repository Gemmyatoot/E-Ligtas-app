import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Content from './Content';
import { ReactNode } from 'react';

type LayoutProps = {
    children: ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [mobileOpen, setMobileOpen] = useState(false);

    const toggleSidebar = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <Sidebar mobileOpen={mobileOpen} toggleSidebar={toggleSidebar} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Topbar */}
                <Topbar toggleSidebar={toggleSidebar} />

                {/* Content */}
                <Content>{children}</Content>
            </div>
        </div>
    );
};

export default Layout;
