/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@washwise/types'],
    // Environment variables exposed to the browser
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    },
    // Production optimizations
    poweredByHeader: false,
    compress: true,
    output: 'standalone',
    // Set workspace root for monorepo
    outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
