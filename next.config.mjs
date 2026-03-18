/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: process.env.NODE_ENV === 'development',
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '3001',
                pathname: '/**',
            },
        ],
    },
    async rewrites() {
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const apiUrl = base.endsWith('/api') ? base.replace(/\/api$/, '') : base;
        return [
            { source: '/api/:path*', destination: `${apiUrl}/api/:path*` },
        ];
    },
};

export default nextConfig;
