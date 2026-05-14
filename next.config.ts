/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    '*.ngrok-free.dev',     // Allow all ngrok subdomains
    'localhost',
    '127.0.0.1',
    '*.ngrok.io',           // Also allow older ngrok domains if needed
  ],
  // Your other config options here...
}

module.exports = nextConfig