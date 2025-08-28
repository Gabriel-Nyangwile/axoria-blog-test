/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'scofexblogeducationpullzone.b-cdn.net',
                pathname: '/**'
            }
        ]
    }
};

export default nextConfig;
