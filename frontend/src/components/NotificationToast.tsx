import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationToastProps {
  type: NotificationType;
  title: string;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  type,
  title,
  message,
  isVisible,
  onClose,
  autoClose = true,
  duration = 5000,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, autoClose, duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'error':
        return <XCircle className="h-6 w-6 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-6 w-6 text-yellow-500" />;
      case 'info':
        return <Info className="h-6 w-6 text-blue-500" />;
      default:
        return <Info className="h-6 w-6 text-blue-500" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-50 to-green-100 border-green-200';
      case 'error':
        return 'bg-gradient-to-r from-red-50 to-red-100 border-red-200';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
      case 'info':
        return 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200';
      default:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
    }
  };

  const getTitleColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  const getMessageColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-700';
      case 'error':
        return 'text-red-700';
      case 'warning':
        return 'text-yellow-700';
      case 'info':
        return 'text-blue-700';
      default:
        return 'text-gray-700';
    }
  };

  if (!isVisible) return null;

  return (
    // keep this fixed at top-right but let inner card choose its width
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`
          /* responsive, constrained width: use min() so it never overflows viewport */
          max-w-[420px] w-[min(420px,calc(100vw-2rem))] shadow-lg rounded-lg border backdrop-blur-sm
          ${getColorClasses()}
          transform transition-all duration-300 ease-in-out
          ${isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        `}
      >
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">{getIcon()}</div>

            {/* important: use min-w-0 so flex child doesn't overflow / collapse */}
            <div className="ml-3 min-w-0 flex-1">
              <p className={`text-sm font-semibold ${getTitleColor()}`}>
                {title}
              </p>

              {/* message: allow normal wrapping, break long words if necessary */}
              <p
                className={`mt-1 text-sm ${getMessageColor()} whitespace-normal break-words`}
                style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}
              >
                {message}
              </p>
            </div>

            <div className="ml-4 flex-shrink-0 flex">
              <button
                className={`
                  inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${type === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-600' : ''}
                  ${type === 'error' ? 'text-red-500 hover:bg-red-100 focus:ring-red-600' : ''}
                  ${type === 'warning' ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600' : ''}
                  ${type === 'info' ? 'text-blue-500 hover:bg-blue-100 focus:ring-blue-600' : ''}
                `}
                onClick={handleClose}
                aria-label="Close notification"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar for auto-close */}
        {autoClose && (
          <div className="h-1 bg-black/10 rounded-b-lg overflow-hidden">
            <div
              className={`
                h-full transition-all ease-linear
                ${type === 'success' ? 'bg-green-500' : ''}
                ${type === 'error' ? 'bg-red-500' : ''}
                ${type === 'warning' ? 'bg-yellow-500' : ''}
                ${type === 'info' ? 'bg-blue-500' : ''}
              `}
              style={{
                animation: `shrink ${duration}ms linear`,
                transformOrigin: 'left',
              }}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationToast;
