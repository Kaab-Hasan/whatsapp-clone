/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable server-side WebSocket support
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // External packages for server components (updated syntax)
  serverExternalPackages: ['socket.io', 'socket.io-client'],
};

module.exports = nextConfig; 