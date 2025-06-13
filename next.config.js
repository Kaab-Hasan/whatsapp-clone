/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable server-side WebSocket support
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // External packages for server components
  serverExternalPackages: ['socket.io', 'socket.io-client', 'bcrypt'],
  // Disable edge runtime for API routes
  runtime: 'nodejs',
};

module.exports = nextConfig; 