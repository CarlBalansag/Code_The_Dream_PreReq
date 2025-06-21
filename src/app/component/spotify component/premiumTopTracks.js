"use client";
import { useEffect, useState } from "react";
import CirclePlayButton from "./circle_play_button"; //future feature for playing preview tracks

// Component to show top tracks for a given artist
export default function PremiumTopTracks({ artistId, accessToken }) {
const [tracks, setTracks] = useState([]);           //UseState to store track data
const [artistName, setArtistName] = useState("");   //UseState to store the artist's name

useEffect(() => {
  // Fetch top tracks from Spotify
  const fetchArtistTopTracks = async () => {
  try {
      const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        console.error("Error fetching artist's top tracks:", res.status);
      return;
      }

      const data = await res.json();

      // Format each track's data for use in UI
      const formattedTracks = data.tracks.map((track) => ({
        id: track.id,
        name: track.name,
        album: track.album.name,
        image: track.album.images[0]?.url || "",
        preview_url: track.preview_url,
      }));

      setTracks(formattedTracks); //Save formatted tracks to state
  } catch (error) {
      console.error("Error fetching artist top tracks:", error);
  }
  };

  // Fetch the artist's name
  const fetchArtistName = async () => {
  try {
      const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
      console.error("Error fetching artist name:", res.status);
      return;
      }

      const data = await res.json();
      setArtistName(data.name);
  } catch (error) {
      console.error("Error fetching artist info:", error);
  }
  };

  // Only fetch data if required props are available
  if (artistId && accessToken) {
  fetchArtistTopTracks();
  fetchArtistName();
  }
}, [artistId, accessToken]); // Refetch if artist or token changes

// Show fallback message if no tracks are available
if (!tracks || tracks.length === 0) {
  return <p className="text-white">No tracks available.</p>;
}

return (
  <div className="custom-scrollbar p-4 rounded-md overflow-y-auto w-full max-w-lg" style={{ maxHeight: "800px" }}>
  <p className="text-[#1DB954] text-xl font-semibold mb-2 text-center">
      Top Tracks for {artistName}
  </p>
  <ul className="space-y-4">
      {tracks.map((track, index) => (
        <li key={track.id} className="bg-[#212121] rounded-lg p-3 flex items-center space-x-4">
            <img src={track.image} alt={track.name} className="w-16 h-16 rounded-md object-cover" />
            <div className="flex items-center w-full">
              <div className="flex-grow">
                  <p className="text-white font-semibold text-md">{index + 1}. {track.name}</p>
                  <p className="text-sm text-gray-400">{track.album}</p>
              </div>
              <div className="ml-auto">
                  {/* <CirclePlayButton /> */}
              </div>
            </div>
        </li>
      ))}
  </ul>
  </div>
);
}
