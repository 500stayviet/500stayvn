/** @type {import('next').NextConfig} */
const nextConfig = {
  // 여기에 standalone 설정을 추가합니다. (404 해결 핵심)
  output: 'standalone', 
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;