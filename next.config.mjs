/** @type {import('next').NextConfig} */
const nextConfig = {
<<<<<<< HEAD
    env: {
        NEXT_PUBLIC_SPOTIFY_CLIENT_ID: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
        SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
        SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
    },
    images: {
        domains: ['i.scdn.co'],
    },
=======
  env: {
    NEXT_PUBLIC_SPOTIFY_CLIENT_ID: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
  },
  images: {
    domains: [
      'i.scdn.co',
      'scontent-dub4-1.xx.fbcdn.net',
      'scontent-lhr6-1.xx.fbcdn.net',
      'via.placeholder.com',
    ],
  },
>>>>>>> 5625fef1c0320696788e336f69741fec7df9774c
};

export default nextConfig;
