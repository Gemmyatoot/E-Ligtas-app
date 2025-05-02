// next.config.mjs

// Next.js configuration
export default {
    // Configuration for image optimization
    images: {
        domains: ['firebasestorage.googleapis.com'], // Allow images from this domain
    },
    // Additional Next.js configurations can go here
    reactStrictMode: true, // Optional: Enables React's Strict Mode for development
    swcMinify: true, // Optional: Enables the SWC compiler for minifying the JavaScript
    
    // Disable ESLint during build
    eslint: {
        ignoreDuringBuilds: true,  // This will disable ESLint during the build process
    },
};
