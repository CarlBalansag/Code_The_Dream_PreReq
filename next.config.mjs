/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        NEXT_PUBLIC_SPOTIFY_CLIENT_ID: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
        SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
        SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
    },
    images: {
        domains: ['i.scdn.co'],
    },
    async redirects() {
        return [
            {
                source: '/',
                destination: '/home',
                permanent: false, // or true if you want a 308 redirect
            },
        ];
    },
};

export default nextConfig;
