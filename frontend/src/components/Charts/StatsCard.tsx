import React from 'react';
import { useTheme } from '../../hooks/useTheme';

interface StatsCardProps {
  icon: string;
  title: string;
  value: string;
  unit: string;
  color: string;
  isOffline?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  title,
  value,
  unit,
  color,
  isOffline = false,
}) => {
  const { theme } = useTheme();

  return (
    <div
      className={`rounded-lg p-3 md:p-4 transition-all duration-300 overflow-hidden ${
        theme === 'dark'
          ? 'bg-[#162345]'
          : 'bg-white border border-gray-200'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: color }}
        >
          <img src={icon} alt={title} className="w-5 h-5 md:w-6 md:h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <div
            className={`text-xs md:text-sm font-semibold truncate ${
              theme === 'dark' ? 'text-[#D0CCD8]' : 'text-[#555758]'
            }`}
          >
            {title}
          </div>
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-1 md:mb-2 min-w-0">
        <span
          className={`font-bold leading-none flex-shrink truncate text-2xl md:text-4xl ${
            isOffline
              ? theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              : theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}
        >
          {value}
        </span>
        <span
          className={`flex-shrink-0 leading-none text-sm md:text-base ${
            theme === 'dark' ? 'text-[#D0CCD8]' : 'text-[#555758]'
          }`}
        >
          {unit}
        </span>
      </div>
    </div>
  );
};

export default StatsCard;
