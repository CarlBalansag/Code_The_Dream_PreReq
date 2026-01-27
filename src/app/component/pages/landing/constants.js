// Demo data for LivePulse (Personal Dashboard Preview)
// Artist images are fetched from Spotify API via /api/landing/artist-images
// This is fallback data shown before API responds
export const MOCK_TOP_ARTISTS = [
  { id: '1', name: 'Frank Ocean', plays: 342, imageUrl: null },
  { id: '2', name: 'Taylor Swift', plays: 287, imageUrl: null },
  { id: '3', name: 'Bruno Mars', plays: 219, imageUrl: null },
  { id: '4', name: 'SZA', plays: 186, imageUrl: null },
  { id: '5', name: 'Drake', plays: 164, imageUrl: null }
];

export const MOCK_RECENT_TRACKS = [
  { id: 'r1', title: 'I Just Might', artist: 'Bruno Mars', imageUrl: 'https://i.scdn.co/image/ab67616d0000b273e2887a1b6b98fc6c73bab12b' },
  { id: 'r2', title: 'Back to friends', artist: 'Sombr', imageUrl: 'https://i.scdn.co/image/ab67616d0000b2739d24f74c1e2d8a12b1e591ec' },
  { id: 'r3', title: 'Lose My Mind', artist: 'Don Toliver', imageUrl: 'https://i.scdn.co/image/ab67616d0000b273c63a12b4d7de1d527566e61c' },
  { id: 'r4', title: 'NOKIA', artist: 'Drake', imageUrl: 'https://i.scdn.co/image/ab67616d0000b273b5a28a256eae6dc0424fef59' }
];

export const MOCK_TOP_TRACKS_LIST = [
  { rank: 1, title: 'Blinding Lights', artist: 'The Weeknd', imageUrl: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36', plays: '3286 plays' },
  { rank: 2, title: 'Pink + White', artist: 'Frank Ocean', imageUrl: 'https://i.scdn.co/image/ab67616d0000b273c5649add07ed3720be9d5526', plays: '2956 plays' },
  { rank: 3, title: 'Love Galore', artist: 'SZA', imageUrl: 'https://i.scdn.co/image/ab67616d0000b2734c79d5ec52a6d0302f3add25', plays: '1153 plays' },
  { rank: 4, title: 'From Time', artist: 'Drake', imageUrl: 'https://i.scdn.co/image/ab67616d0000b273a90d170c61fb7d063d47161d', plays: '670 plays' }
];

export const GLOBAL_ARTISTS = [
    { id: 'g1', name: 'Taylor Swift', listeners: '46.8K streams', trend: '+5%', img: 'https://i.scdn.co/image/ab6761610000e5eb5a00969a4698c3132a15fbb0' },
    { id: 'g2', name: 'The Weeknd', listeners: '42.1K streams', trend: '+2%', img: 'https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb' },
    { id: 'g3', name: 'Drake', listeners: '38.5K streams', trend: '+1.5%', img: 'https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9' },
    { id: 'g4', name: 'Bad Bunny', listeners: '35.2K streams', trend: '-0.5%', img: 'https://i.scdn.co/image/ab6761610000e5eb9ad5ec74941a6368c8c56b8f' },
    { id: 'g5', name: 'Rihanna', listeners: '32.8K streams', trend: '+8%', img: 'https://i.scdn.co/image/ab6761610000e5eb01893e3703f110580e37700a' },
];

export const GLOBAL_TRACKS = [
    { id: 'gt1', title: 'Cruel Summer', artist: 'Taylor Swift', plays: '1.3M streams', img: 'https://i.scdn.co/image/ab67616d0000b273e787cffec20aa2a396a61647' },
    { id: 'gt2', title: 'Starboy', artist: 'The Weeknd', plays: '1.2M streams', img: 'https://i.scdn.co/image/ab67616d0000b2734718e28d24527d97746352ac' },
    { id: 'gt3', title: 'As It Was', artist: 'Harry Styles', plays: '1.1M streams', img: 'https://i.scdn.co/image/ab67616d0000b273b46f74097655d7f353caab14' },
    { id: 'gt4', title: 'Kill Bill', artist: 'SZA', plays: '980K streams', img: 'https://i.scdn.co/image/ab67616d0000b27370abc9f6b8a4d7a979c21d9d' },
    { id: 'gt5', title: 'Flowers', artist: 'Miley Cyrus', plays: '890K streams', img: 'https://i.scdn.co/image/ab67616d0000b27358039b51ec5ff23b1a0b6b69' },
];
