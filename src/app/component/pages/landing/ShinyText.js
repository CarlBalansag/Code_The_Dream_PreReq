"use client";

export default function ShinyText({
  text,
  disabled = false,
  speed =8,
  className = "",
  baseColor = "#1DB954",
  shineColor = "#d4f7e3",
}) {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`shiny-text-wrapper ${className}`}
      style={{
        position: "relative",
      }}
    >
      <span
        className={disabled ? "" : "shiny-text-animated"}
        style={{
          background: `linear-gradient(
            90deg,
            ${baseColor} 0%,
            ${baseColor} 30%,
            ${shineColor} 50%,
            ${baseColor} 70%,
            ${baseColor} 100%
          )`,
          backgroundSize: `200% 100%`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          animationDuration: animationDuration,
        }}
      >
        {text}
      </span>
      <style jsx>{`
        @keyframes shiny-sweep {
          0% {
            background-position: 200% center;
          }
          100% {
            background-position: -200% center;
          }
        }
        .shiny-text-animated {
          animation: shiny-sweep ${animationDuration} ease-in-out infinite;
        }
      `}</style>
    </span>
  );
}
