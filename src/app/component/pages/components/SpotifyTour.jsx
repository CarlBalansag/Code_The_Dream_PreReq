"use client";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

export default function SpotifyTour({ onComplete, premium }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  // Filter steps based on whether song is playing - memoized to prevent re-creation
  const steps = useMemo(() => premium ? [
    {
      id: 'top-artists',
      title: 'Your Top Artists',
      description: 'These are your top listened to artists. Use the buttons above to switch between the last 4 weeks, 6 months, or all-time rankings.',
      target: '[data-tour="top-artists"]',
      placement: 'bottom',
    },
    {
      id: 'top-tracks',
      title: 'Your Top Tracks',
      description: 'This is your top tracks listened. Use the buttons above to switch between the last 4 weeks, 6 months, or all-time favorites.',
      target: '[data-tour="top-tracks"]',
      placement: 'bottom',
    },
    {
      id: 'recently-played',
      title: 'Recently Played',
      description: 'These are your recently played songs, showing your most recent listening activity.',
      target: '[data-tour="recently-played"]',
      placement: 'left',
    },
    {
      id: 'connect-device',
      title: 'Connect Device to Spotify',
      description: 'These are your connected Spotify devices. If you don\'t see your device, open Spotify on the device and make sure you\'re logged in.',
      target: '[data-tour="connect-device"]',
      placement: 'bottom-left',
    },
    {
      id: 'floating-button',
      title: 'Play a Song',
      description: 'Once your device is connected and music is playing, click this button to view the song you\'re currently listening to in real time.',
      target: '#floating-action-button',
      placement: 'top-left',
    },
  ] : [
    {
      id: 'top-artists',
      title: 'Your Top Artists',
      description: 'These are your top listened to artists. Use the buttons above to switch between the last 4 weeks, 6 months, or all-time rankings.',
      target: '[data-tour="top-artists"]',
      placement: 'bottom',
    },
    {
      id: 'top-tracks',
      title: 'Your Top Tracks',
      description: 'This is your top tracks listened. Use the buttons above to switch between the last 4 weeks, 6 months, or all-time favorites.',
      target: '[data-tour="top-tracks"]',
      placement: 'bottom',
    },
    {
      id: 'recently-played',
      title: 'Recently Played',
      description: 'These are your recently played songs, showing your most recent listening activity.',
      target: '[data-tour="recently-played"]',
      placement: 'top',
    },
  ], [premium]);

  const updateTooltipPosition = useCallback((element, placement) => {
    const rect = element.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 280; // Approximate height
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let top = 0;
    let left = 0;

    switch (placement) {
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + 20;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - tooltipWidth - 20;
        break;
      case 'bottom':
        top = rect.bottom + 20;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom-right':
        top = rect.bottom + 20;
        left = rect.right - tooltipWidth;
        break;
      case 'bottom-left':
        top = rect.bottom + 20;
        left = rect.left;
        break;
      case 'top':
        top = rect.top - tooltipHeight - 20;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'top-left':
        top = rect.top - tooltipHeight - 20;
        left = rect.left - tooltipWidth - 20;
        break;
      default:
        top = rect.top;
        left = rect.right + 20;
    }

    // Constrain to viewport - horizontal
    if (left < 20) {
      left = 20;
    } else if (left + tooltipWidth > viewportWidth - 20) {
      left = viewportWidth - tooltipWidth - 20;
    }

    // Constrain to viewport - vertical with padding
    if (top < 20) {
      top = 20;
    } else if (top + tooltipHeight > viewportHeight - 20) {
      top = viewportHeight - tooltipHeight - 20;
    }

    setTooltipPosition({ top, left });
  }, []);

  useEffect(() => {
    // Add delay to let DOM settle after step change
    const timeout = setTimeout(() => {
      const element = document.querySelector(steps[currentStep]?.target);
      if (element) {
        setTargetElement(element);
        updateTooltipPosition(element, steps[currentStep].placement);

        // Scroll behavior - use scrollIntoView for all sections
        const scrollBlock = steps[currentStep]?.id === 'top-tracks' ? 'center' :
                           steps[currentStep]?.id === 'recently-played' ? 'start' : 'center';

        element.scrollIntoView({ behavior: 'smooth', block: scrollBlock });

        // For top tracks only, reset internal scroll after
        if (steps[currentStep]?.id === 'top-tracks') {
          setTimeout(() => {
            const internalScroll = element.querySelector('.overflow-y-auto');
            if (internalScroll) {
              internalScroll.scrollTop = 0;
            }
            setTargetElement(element);
            updateTooltipPosition(element, steps[currentStep].placement);
          }, 600);
        }
      }
    }, 100);

    // Debounced update function - but not for top-tracks during transition
    let debounceTimer;
    let isTopTracksTransitioning = steps[currentStep]?.id === 'top-tracks';

    const handleUpdate = () => {
      // Skip updates during top-tracks transition
      if (isTopTracksTransitioning) {
        return;
      }

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const currentElement = document.querySelector(steps[currentStep]?.target);
        if (currentElement) {
          setTargetElement(currentElement);
          updateTooltipPosition(currentElement, steps[currentStep].placement);
        }
      }, 50);
    };

    // For top-tracks, allow updates again after transition is complete
    if (isTopTracksTransitioning) {
      setTimeout(() => {
        isTopTracksTransitioning = false;
      }, 1200); // After all animations complete
    }

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      clearTimeout(timeout);
      clearTimeout(debounceTimer);
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [currentStep, steps, updateTooltipPosition]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getSpotlightStyle = () => {
    if (!targetElement) return {};
    const rect = targetElement.getBoundingClientRect();

    // Check if this is the connect-device or floating-button step for tighter padding and circular shape
    const isConnectDevice = steps[currentStep]?.id === 'connect-device';
    const isFloatingButton = steps[currentStep]?.id === 'floating-button';
    const isTopArtists = steps[currentStep]?.id === 'top-artists';
    const isTopTracks = steps[currentStep]?.id === 'top-tracks';

    const padding = (isConnectDevice || isFloatingButton) ? 2 : 8;
    // Add extra top padding for top-artists to push it down slightly
    const topOffset = isTopArtists ? 20 : 0;

    // Limit height for top tracks to show only tracks 1-2 (~200px)
    let height = rect.height + (padding * 2) - topOffset;
    if (isTopTracks && height > 200) {
      height = 236;
    }

    // Ensure minimum height for sections
    if (height < 100) {
      height = 100;
    }

    return {
      top: rect.top - padding + topOffset,
      left: rect.left - padding,
      width: rect.width + (padding * 2),
      height: height,
    };
  };

  return (
    <>
      {/* Backdrop with rectangular cutout using box-shadow */}
      {targetElement && (
        <motion.div
          className={`fixed pointer-events-none z-[9999] transition-all duration-300 ${
            steps[currentStep]?.id === 'connect-device' || steps[currentStep]?.id === 'floating-button' ? 'rounded-full' : 'rounded-xl'
          }`}
          style={{
            top: getSpotlightStyle().top,
            left: getSpotlightStyle().left,
            width: getSpotlightStyle().width,
            height: getSpotlightStyle().height,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Clickable overlay to close tour */}
      <motion.div
        className="fixed inset-0 z-[9998]"
        onClick={onComplete}
        style={{ pointerEvents: 'auto' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Spotlight Border */}
      {targetElement && (
        <motion.div
          className={`fixed z-[10000] transition-all duration-300 pointer-events-none border-4 border-[#1ed760] shadow-[0_0_30px_rgba(30,215,96,0.6)] ${
            steps[currentStep]?.id === 'connect-device' || steps[currentStep]?.id === 'floating-button' ? 'rounded-full' : 'rounded-xl'
          }`}
          style={{
            ...getSpotlightStyle(),
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Tooltip */}
      <motion.div
        className="fixed z-[10001] w-[320px] max-h-[calc(100vh-40px)] overflow-y-auto custom-scrollbar bg-gradient-to-br from-[#1DB954] to-[#1ed760] text-white rounded-xl shadow-2xl p-5 transition-all duration-300"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ duration: 0.3 }}
      >
        {/* Close Button */}
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors text-white text-xl leading-none"
        >
          ✕
        </button>

        {/* Content */}
        <div className="space-y-3 mt-2">
          <div>
            <h3 className="text-xl font-bold mb-2">
              {steps[currentStep]?.title}
            </h3>
            <p className="text-white/95 text-sm leading-relaxed">
              {steps[currentStep]?.description}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-white/20">
            {/* Progress Dots */}
            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'w-8 bg-white'
                      : 'w-2 bg-white/40'
                  }`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all font-medium text-sm"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-white text-[#1DB954] hover:bg-white/90 rounded-lg font-bold transition-all shadow-lg text-sm"
              >
                {currentStep === steps.length - 1 ? 'Got it!' : 'Next'}
              </button>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div
          className={`absolute w-4 h-4 bg-[#1DB954] transform rotate-45 ${
            steps[currentStep]?.placement === 'right' ? '-left-2 top-1/2 -translate-y-1/2' :
            steps[currentStep]?.placement === 'left' ? '-right-2 top-1/2 -translate-y-1/2' :
            steps[currentStep]?.placement === 'bottom' ? 'left-1/2 -translate-x-1/2 -top-2' :
            steps[currentStep]?.placement === 'bottom-right' ? 'right-8 -top-2' :
            steps[currentStep]?.placement === 'bottom-left' ? 'left-8 -top-2' :
            steps[currentStep]?.placement === 'top-left' ? '-right-2 bottom-6' :
            'left-1/2 -translate-x-1/2 -bottom-2'
          }`}
        />
      </motion.div>
    </>
  );
}