import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface InfoPopupProps {
  title: string;
  description: string;
}

const InfoPopup: React.FC<InfoPopupProps> = ({ title, description }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        buttonRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popupWidth = 288;

      let left = rect.left + rect.width / 2 - popupWidth / 2;

      if (left + popupWidth > window.innerWidth - 16) {
        left = window.innerWidth - popupWidth - 16;
      }
      if (left < 16) {
        left = 16;
      }

      setPosition({
        top: rect.bottom + 8,
        left: left,
      });
    }
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        type="button"
        className={`flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer ${
          theme === 'dark' ? 'text-[#D0CCD8] hover:text-white' : 'text-[#555758] hover:text-gray-900'
        }`}
        aria-label="More information"
      >
        <Info size={16} />
      </button>

      {isOpen && createPortal(
        <div
          ref={popupRef}
          className={`fixed z-[9999] w-72 p-4 rounded-lg shadow-2xl border ${
            theme === 'dark'
              ? 'bg-[#1E2951] border-[#3A4A6B] text-white'
              : 'bg-white border-gray-200 text-gray-900'
          }`}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            animation: 'fadeIn 0.2s ease-out',
            maxWidth: 'calc(100vw - 32px)',
          }}
        >
          <div className="flex flex-col gap-2">
            <h4 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </h4>
            <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {description}
            </p>
          </div>
          {buttonRef.current && (
            <div
              className={`absolute w-3 h-3 rotate-45 border-t border-l ${
                theme === 'dark' ? 'bg-[#1E2951] border-[#3A4A6B]' : 'bg-white border-gray-200'
              }`}
              style={{
                top: '-6px',
                left: `${buttonRef.current.getBoundingClientRect().left + buttonRef.current.getBoundingClientRect().width / 2 - position.left - 6}px`,
              }}
            />
          )}
        </div>,
        document.body
      )}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default InfoPopup;
