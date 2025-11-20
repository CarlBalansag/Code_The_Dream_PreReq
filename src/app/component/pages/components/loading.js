"use client";

// Reusable DotsContainer component
export default function LoadingDots({ size = 20, color = '#1DB954' }) {
  const getAnimationDelay = (index) => {
    const delays = ['-0.3s', '-0.1s', '0.1s', '0.3s', '0.5s'];
    return delays[index];
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {[0, 1, 2, 3, 4].map((index) => (
        <div
          key={index}
          className="loading-dot rounded-full"
          style={{
            width: size,
            height: size,
            backgroundColor: color,
            animationDelay: getAnimationDelay(index),
          }}
        />
      ))}
    </div>
  );
}