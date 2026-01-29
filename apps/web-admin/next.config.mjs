/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@washwise/types'],
    experimental: {
        typedRoutes: true,
    },
};

export default nextConfig;
