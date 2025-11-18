"use client";

/**
 * Consistent Empty State Component
 * Displays empty states with visual context and optional actions
 *
 * @param {React.Component} icon - Lucide icon component
 * @param {string} title - Title text
 * @param {string} description - Description text
 * @param {React.Node} action - Optional action button or element
 */
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Icon Container */}
      <div className="w-16 h-16 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center mb-4">
        {Icon && <Icon className="text-gray-500" size={32} />}
      </div>

      {/* Title */}
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>

      {/* Description */}
      <p className="text-gray-400 text-sm max-w-sm mb-4">{description}</p>

      {/* Optional Action */}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
