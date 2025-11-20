"use client";

// Reusable DotsContainer component
export default function LoadingDots({ size = 20, color = '#1DB954', activeColor = '#1ed760' }) {
  const dotStyle = (index) => ({
    height: `${size}px`,
    width: `${size}px`,
    marginRight: index === 4 ? '0' : `${size / 2}px`,
    borderRadius: `${size / 2}px`,
    backgroundColor: color,
    animation: 'pulse 1.5s infinite ease-in-out',
    animationDelay: getAnimationDelay(index),
  });

  const getAnimationDelay = (index) => {
    const delays = ['-0.3s', '-0.1s', '0.1s', '0.3s', '0.5s'];
    return delays[index];
  };

  return (
    <>
      <div className="flex items-center justify-center">
        {[0, 1, 2, 3, 4].map((index) => (
          <div key={index} style={dotStyle(index)} />
        ))}
      </div>
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(0.8);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(0.8);
            opacity: 0.7;
          }
        }
      `}</style>
    </>
  );
}