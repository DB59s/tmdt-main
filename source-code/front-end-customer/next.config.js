/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This setting helps avoid hydration errors by suppressing them in development
  // You should remove this in production after fixing the actual issues
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 4,
  },
  env: {
    domainApi: 'http://localhost:8080'
    // domainApi: 'https://vuquangduy.io.vn'
}
}

module.exports = nextConfig
