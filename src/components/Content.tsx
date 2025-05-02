// components/Content.tsx
import { ReactNode } from 'react';

type ContentProps = {
    children: ReactNode;
};

const Content: React.FC<ContentProps> = ({ children }) => {
    return <main className="flex-1 md:px-4 md:pt-4 bg-gray-100 h-[100vh] md:max-h-[90dvh] overflow-auto">{children}</main>;
};

export default Content;
