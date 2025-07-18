"use client";

// Button component to skip to the next track on Spotify
export default function Next_Button({ size = 50, thickness = 8, accessToken, refreshSong }) {
  const handleClick = async () => {   // Function that sends a request to Spotify to skip to the next track
    try {
      const res = await fetch("https://api.spotify.com/v1/me/player/next", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`, // Authorization with user's access token
        },
      });

      // Check if request was successful
      if (!res.ok) {
        console.error("Failed to skip to next track:", res.status);
      } else {
        console.log("Skipped to next track!");

      //refresh song info after skipping
      if (refreshSong) {
          setTimeout(() => {
              refreshSong(); //Call parent callback to update UI
          }, 600); // Wait a moment for Spotify to update
      };
      }
    } catch (error) {
        console.error("Error skipping to next track:", error);
    }
  };

return (
    <div
    className="arrow"
    onClick={handleClick}
    style={{
        width: `${size}px`,
        height: `${size * 1.2}px`,
        marginTop: "2.9px",
    }}
    >
    <div
        className="arrow-top"
        style={{
        height: `${thickness}px`,
        }}
    ></div>
    <div
        className="arrow-bottom"
        style={{
        height: `${thickness}px`,
        }}
    ></div>

    <style jsx>{`
        .arrow {
        cursor: pointer;
        position: relative;
        transition: transform 0.1s;
        display: flex;
        justify-content: center;
        align-items: center;
        }

        .arrow-top,
        .arrow-bottom {
        background-color: #666;
        width: 100%;
        position: absolute;
        top: 50%;
        }

        .arrow-top:after,
        .arrow-bottom:after {
        content: "";
        background-color: #fff;
        height: 100%;
        position: absolute;
        top: 0;
        transition: all 0.15s;
        }

        .arrow-top {
        transform: rotate(45deg);
        transform-origin: bottom right;
        }

        .arrow-top:after {
        left: 100%;
        right: 0;
        transition-delay: 0s;
        }

        .arrow-bottom {
        transform: rotate(-45deg);
        transform-origin: top right;
        }

        .arrow-bottom:after {
        left: 0;
        right: 100%;
        transition-delay: 0.15s;
        }

        .arrow:hover .arrow-top:after {
        left: 0;
        transition-delay: 0.15s;
        }

        .arrow:hover .arrow-bottom:after {
        right: 0;
        transition-delay: 0s;
        }

        .arrow:active {
        transform: scale(0.9);
        }
    `}</style>
    </div>
);
}
