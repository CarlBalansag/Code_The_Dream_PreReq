/**
 * RADAR CHART IMPLEMENTATION REFERENCE
 * Chart.js Radar Chart with Clickable Labels and Modal Integration
 *
 * Installation Required:
 * npm install chart.js react-chartjs-2
 *
 * Features:
 * - Styled labels (color, font, size)
 * - Clickable labels that open modals
 * - Custom plugin for label interactivity
 */

'use client';
import { useState } from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip
} from 'chart.js';

// Register Chart.js components
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

export default function RadarChartComponent() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState(null);

  const openModal = (artistName) => {
    setSelectedArtist(artistName);
    setModalOpen(true);
    console.log('Opening modal for:', artistName);
  };

  // Custom plugin to make labels clickable
  const clickableLabelsPlugin = {
    id: 'clickableLabels',
    afterEvent(chart, args) {
      const event = args.event;
      if (event.type !== 'click') return;

      const scale = chart.scales.r;
      const labelItems = scale._pointLabelItems || [];

      labelItems.forEach((item, index) => {
        // Calculate distance from click to label center
        const distance = Math.sqrt(
          Math.pow(event.x - item.x, 2) +
          Math.pow(event.y - item.y, 2)
        );

        // If click is within 30px radius of label, trigger modal
        if (distance < 30) {
          openModal(chart.data.labels[index]);
        }
      });
    }
  };

  // Chart data
  const data = {
    labels: ['Artist 1', 'Artist 2', 'Artist 3', 'Artist 4', 'Artist 5'],
    datasets: [{
      label: 'Play Count',
      data: [65, 59, 90, 81, 56],
      backgroundColor: 'rgba(29, 185, 84, 0.2)', // Spotify green with transparency
      borderColor: 'rgb(29, 185, 84)',
      borderWidth: 2,
      pointBackgroundColor: 'rgb(29, 185, 84)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgb(29, 185, 84)',
    }]
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        beginAtZero: true,
        // Point labels are the axis labels (artist names)
        pointLabels: {
          color: '#1DB954',              // Spotify green
          font: {
            size: 14,
            weight: 'bold',
            family: 'Arial, sans-serif'
          },
          padding: 15,                   // Space from chart
          // Make cursor pointer to indicate clickability
          callback: function(label) {
            return label;  // You can format label here
          }
        },
        // Grid styling
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        // Angle lines (lines from center to labels)
        angleLines: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        // Ticks (the numbers on the scale)
        ticks: {
          color: '#fff',
          backdropColor: 'transparent',
        }
      }
    },
    plugins: {
      legend: {
        display: false,  // Hide default legend
      },
      tooltip: {
        enabled: true,
      }
    },
    // Add hover cursor for the entire canvas
    onHover: (event, activeElements) => {
      event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Radar
        data={data}
        options={options}
        plugins={[clickableLabelsPlugin]}
      />

      {/* Replace with your actual ArtistModal component */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-xl font-bold">{selectedArtist}</h2>
            <button
              onClick={() => setModalOpen(false)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/*
 * ALTERNATIVE APPROACH: Canvas Event Handling
 * If the plugin approach doesn't work, use direct canvas event handling:
 */

// import { useRef, useEffect } from 'react';
//
// const chartRef = useRef(null);
//
// useEffect(() => {
//   const canvas = chartRef.current;
//   if (!canvas) return;
//
//   const handleClick = (e) => {
//     const chart = ChartJS.getChart(canvas);
//     if (!chart) return;
//
//     const rect = canvas.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;
//
//     const scale = chart.scales.r;
//     const labelItems = scale._pointLabelItems || [];
//
//     labelItems.forEach((item, index) => {
//       const distance = Math.sqrt(
//         Math.pow(x - item.x, 2) + Math.pow(y - item.y, 2)
//       );
//       if (distance < 30) {
//         openModal(chart.data.labels[index]);
//       }
//     });
//   };
//
//   canvas.addEventListener('click', handleClick);
//   return () => canvas.removeEventListener('click', handleClick);
// }, []);
//
// return <Radar ref={chartRef} data={data} options={options} />;


/*
 * STYLING OPTIONS REFERENCE:
 *
 * pointLabels: {
 *   color: '#1DB954',                    // Label text color
 *   font: {
 *     size: 14,                          // Font size
 *     family: 'Arial',                   // Font family
 *     weight: 'bold',                    // Font weight: 'normal', 'bold', '600', etc.
 *     style: 'normal',                   // 'normal', 'italic', 'oblique'
 *     lineHeight: 1.2                    // Line height
 *   },
 *   padding: 10,                         // Distance from chart
 *   backdropColor: 'rgba(0,0,0,0.5)',   // Background behind label
 *   backdropPadding: 2,                  // Padding of backdrop
 *   display: true,                       // Show/hide labels
 *   centerPointLabels: false,            // Center labels on angle lines
 *   callback: function(label, index) {   // Custom label formatting
 *     return label.substring(0, 10);     // Truncate long labels
 *   }
 * }
 */
