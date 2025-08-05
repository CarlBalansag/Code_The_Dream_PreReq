import React from "react";

export default function CirclePlayButton({
  size = 45,
  trackUri,
  trackId,
  accessToken,
  setCurrentTrackId,
  currentTrackId,
}) {
  const handleClick = async () => {
    try {
      console.log("🔘 Play button clicked");
      console.log("🎵 Track URI:", trackUri);
      console.log("📌 Track ID:", trackId);
      console.log("🪪 Access Token:", accessToken ? "Available ✅" : "Missing ❌");

      // Step 1: Get available Spotify devices
      const deviceRes = await fetch("https://api.spotify.com/v1/me/player/devices", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const deviceData = await deviceRes.json();
      console.log("📱 Devices response:", deviceData);

      const activeDevice = deviceData.devices.find((d) => d.is_active);

      if (!activeDevice) {
        console.warn("⚠️ No active Spotify device found.");
        alert("No active Spotify device found. Open Spotify on a device and try again.");
        return;
      }

      console.log("✅ Active Device:", activeDevice.name, `(${activeDevice.id})`);

      // Step 2: Send request to play the selected track
      const playRes = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${activeDevice.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uris: [trackUri] }),
        }
      );

      console.log("🎬 Playback response status:", playRes.status);

      if (playRes.status === 204) {
        console.log("✅ Track is playing.");
        setCurrentTrackId(trackId); // Update current playing track
      } else {
        const errorText = await playRes.text();
        console.error("❌ Failed to play track. Response:", errorText);
      }
    } catch (error) {
      console.error("🔥 Exception during playback:", error);
    }
  };

  const isActive = currentTrackId === trackId;

  return (
    <>
      <style>
        {`
        .circle-button-container {
          --color: #ffffff;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          user-select: none;
          fill: var(--color);
          cursor: pointer;
        }

        .circle-button-container .play,
        .circle-button-container .pause {
          position: absolute;
          animation: keyframes-fill 0.3s;
        }

        .circle-button-container .pause {
          display: none;
        }

        .circle-button-container input:checked ~ .play {
          display: none;
        }

        .circle-button-container input:checked ~ .pause {
          display: block;
        }

        .circle-button-container input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          height: 0;
          width: 0;
        }

        @keyframes keyframes-fill {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
        }
      `}
      </style>

      <label
        onClick={handleClick}
        className={`circle-button-container transition duration-200 ${
          isActive ? "scale-110" : "opacity-80 hover:opacity-100"
        }`}
        style={{ fontSize: `${size}px` }}
      >
        <input type="checkbox" defaultChecked />
        <svg
          viewBox="0 0 384 512"
          height="1em"
          xmlns="http://www.w3.org/2000/svg"
          className="play"
        >
          <path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z" />
        </svg>
        <svg
          viewBox="0 0 320 512"
          height="1em"
          xmlns="http://www.w3.org/2000/svg"
          className="pause"
        >
          <path d="M48 64C21.5 64 0 85.5 0 112V400c0 26.5 21.5 48 48 48H80c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H48zm192 0c-26.5 0-48 21.5-48 48V400c0 26.5 21.5 48 48 48h32c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H240z" />
        </svg>
      </label>
    </>
  );
}
