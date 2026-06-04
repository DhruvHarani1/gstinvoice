/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['msbszkvxmavxhczpwrrq.supabase.co'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://msbszkvxmavxhczpwrrq.supabase.co https://placeholder.co https://checkout.razorpay.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://msbszkvxmavxhczpwrrq.supabase.co wss://msbszkvxmavxhczpwrrq.supabase.co https://api.razorpay.com; frame-src 'self' https://checkout.razorpay.com;",
          },
        ],
      },
    ];
  },
  // Note: Turbopack is automatically enabled in dev mode via "--turbo" script flag.
};

export default nextConfig;
