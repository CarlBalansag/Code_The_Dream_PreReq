"use client";
import { useState, useEffect } from "react";
import LiveSong, { fetchCurrentlyPlaying } from "./spotify component/live_song";
import RecentlyPlayedList from "./spotify component/recently_played_list";
import PremiumTopTracks from "./spotify component/premiumTopTracks";
import PremiumAlbum from "./spotify component/premiumAlbum";
import UserTopTracks from "./spotify component/user_top_tracks";
import UserTopArtists from "./spotify component/user_top_artists";

export default function CurrentlyPlaying({ accessToken, premium, name }) {
const [song, setSong] = useState(null);                 //data of currently playing song
const [isPlaying, setIsPlaying] = useState(false);      //Checks if a song is currently playing
const [songID, setSongID] = useState(null);             //gets the songs ID

const getSong = async () => {
  //exits function if there is no accessToken
  if (!accessToken) return;

  //gets the current playing song from the function fetchCurrentlyPlaying
  const currentSong = await fetchCurrentlyPlaying(accessToken);

  if (currentSong && currentSong.item) {    //if there is a song that is currently playing and there is song data
  setIsPlaying(currentSong.is_playing);     //update playback status
  const newSongId = currentSong.item.id;    // Get the ID of the currently playing song

  if (songID !== newSongId) {     //if the useState songID is different from the current song playing 
      setSongID(newSongId);       // Update the store SongID
      setSong(currentSong);       // Save the full song object to state
  }
  } else {                        // No song is playing – clear the song state and set playing to false
  setSong(null);
  setIsPlaying(false);
  }
};

useEffect(() => {
  if (!accessToken) return;     //If there is no access token don't continue
  getSong();                    //Gets the currently playing song 
  const interval = setInterval(() => getSong(), 3000);      // Set up an interval to fetch the song every 3 seconds
  return () => clearInterval(interval);     //Clean up the interval when component unmounts or accessToken changes
}, [accessToken]);

return (
  <div>
  {premium ? (
      song && song.item ? ( 
      <div className="flex flex-col gap-8 md:flex-row"> {/* Div is only visible when the user is a premium member and also is currently playing a song */}
          <div className="basis-1/3">
              <LiveSong song={song} isPlaying={isPlaying} accessToken={accessToken} getSong={getSong}/> {/* Component shows the currently playing song and also has playback control */}
          </div>
          <div className="basis-1/3">
              <PremiumTopTracks artistId={song.item.artists[0].id} accessToken={accessToken}/> {/* Gets the currently playing artist top music */}
          </div>
          <div className="basis-1/3">
              <PremiumAlbum artistId={song.item.artists[0].id} accessToken={accessToken}/> {/* Gets the currently playing artist albums */}
          </div>
      </div>
      ) : (
      <div className="text-center"> {/* Div is only visible when the user is a premium member and is not currently playing a song */}
          <div className="flex flex-row w-full">
            <div className="text-white p-4 text-center basis-1/3">
                <UserTopArtists accessToken={accessToken} /> {/* Gets the users top listed artist */}
            </div>
          <div className="basis-1/3">
              <UserTopTracks accessToken={accessToken} /> {/* Gets the users top listed music */}
          </div>
          <div className="basis-1/3">
              <RecentlyPlayedList accessToken={accessToken} name={name} /> {/* Gets the users recently played songs */}
          </div>
          </div>
      </div>
      )
  ) : (
      <div className="text-center"> {/* Div is visible when the user is not a premium member */}
      <p className="text-red-500 text-xl font-semibold mb-4">
          Not a Premium Member
      </p>
      <div className="flex flex-row w-full">
          <div className="text-white p-4 text-center basis-1/3">
              <UserTopArtists accessToken={accessToken} />
          </div>
          <div className="basis-1/3">
              <UserTopTracks accessToken={accessToken} />
          </div>
          <div className="basis-1/3">
              <RecentlyPlayedList accessToken={accessToken} name={name} />
          </div>
      </div>
      </div>
  )}
  </div>
);
}
