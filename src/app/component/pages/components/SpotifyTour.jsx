"use client";
import { useState, useEffect, useMemo } from 'react';

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
      placement: 'left',
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
      placement: 'top',
    },
    {
      id: 'recently-played',
      title: 'Recently Played',
      description: 'These are your recently played songs, showing your most recent listening activity.',
      target: '[data-tour="recently-played"]',
      placement: 'top',
    },
  ], [premium]);

  useEffect(() => {
    const element = document.querySelector(steps[currentStep]?.target);
    if (element) {
      setTargetElement(element);
      updateTooltipPosition(element, steps[currentStep].placement);
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep, steps]);

  const updateTooltipPosition = (element, placement) => {
    const rect = element.getBoundingClientRect();
    let top = 0;
    let left = 0;

    switch (placement) {
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + 20;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - 420;
        break;
      case 'bottom':
        top = rect.bottom + 20;
        left = rect.left + rect.width / 2 - 200;
        break;
      case 'bottom-right':
        top = rect.bottom + 20;
        left = rect.right - 400;
        break;
      case 'bottom-left':
        top = rect.bottom + 20;
        left = rect.left;
        break;
      case 'top':
        top = rect.top - 220;
        left = rect.left + rect.width / 2 - 200;
        break;
      case 'top-left':
        top = rect.top - 200;
        left = rect.left - 420;
        break;
      default:
        top = rect.top;
        left = rect.right + 20;
    }

    setTooltipPosition({ top, left });
  };

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
    const padding = (isConnectDevice || isFloatingButton) ? 2 : 8;

    return {
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + (padding * 2),
      height: rect.height + (padding * 2),
    };
  };

  return (
    <>
      {/* Backdrop with rectangular cutout using box-shadow */}
      {targetElement && (
        <div
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
        />
      )}

      {/* Clickable overlay to close tour */}
      <div 
        className="fixed inset-0 z-[9998]" 
        onClick={onComplete}
        style={{ pointerEvents: 'auto' }}
      />

      {/* Spotlight Border */}
      {targetElement && (
        <div
          className={`fixed z-[10000] transition-all duration-300 pointer-events-none border-4 border-[#1ed760] shadow-[0_0_30px_rgba(30,215,96,0.6)] ${
            steps[currentStep]?.id === 'connect-device' || steps[currentStep]?.id === 'floating-button' ? 'rounded-full' : 'rounded-xl'
          }`}
          style={{
            ...getSpotlightStyle(),
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="fixed z-[10001] w-[400px] bg-gradient-to-br from-[#1DB954] to-[#1ed760] text-white rounded-xl shadow-2xl p-6 transition-all duration-300"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          transform: steps[currentStep]?.placement === 'right' || steps[currentStep]?.placement === 'left' 
            ? 'translateY(-50%)' 
            : 'none',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors text-white text-xl leading-none"
        >
          ✕
        </button>

        {/* Content */}
        <div className="space-y-4 mt-2">
          <div>
            <h3 className="text-2xl font-bold mb-2">
              {steps[currentStep]?.title}
            </h3>
            <p className="text-white/95 text-base leading-relaxed">
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
            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all font-medium"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-5 py-2.5 bg-white text-[#1DB954] hover:bg-white/90 rounded-lg font-bold transition-all shadow-lg"
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
      </div>
    </>
  );
}