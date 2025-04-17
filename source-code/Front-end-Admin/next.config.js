/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    env: {
        domainApi: 'http://localhost:8080',
        // domainApi: 'https://vuquangduy.io.vn',
    }
};

module.exports = nextConfig;