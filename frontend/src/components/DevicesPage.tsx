import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { apiService, Device } from '../services/api';

function DevicesPage() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDevices = async () => {
      if (!token) return;
      
      setIsLoading(true);
      try {
        const response = await apiService.getAllDevices(token);
        if (response.success && response.data) {
          setDevices(response.data.devices);
        } else {
          setError(response.message);
        }
      } catch (error) {
        setError('Failed to load devices');
        console.error('Failed to load devices:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDevices();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className={`ml-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Loading devices...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 rounded-lg ${
        theme === 'dark' ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'
      }`}>
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2
          className={`text-2xl font-medium mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}
        >
          Devices ({devices.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => (
          <div
            key={device.id}
            className={`p-6 rounded-lg border transition-colors hover:shadow-lg ${
              theme === 'dark'
                ? 'bg-[#162345] border-gray-600 hover:bg-[#1a2847]'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3
                  className={`font-semibold text-lg ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {device.serial_number}
                </h3>
                <p
                  className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {device.type}
                </p>
              </div>
              {device.logo && (
                <img
                  src={device.logo}
                  alt={device.type}
                  className="w-8 h-8 object-contain"
                />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span
                  className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  Location:
                </span>
                <span
                  className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {device.location || 'Not assigned'}
                </span>
              </div>

              <div className="flex justify-between">
                <span
                  className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  Company:
                </span>
                <span
                  className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {device.company}
                </span>
              </div>

              <div className="flex justify-between">
                <span
                  className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  Created:
                </span>
                <span
                  className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {new Date(device.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {device.metadata && Object.keys(device.metadata).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <p
                  className={`text-xs font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  Metadata:
                </p>
                <div className="text-xs space-y-1">
                  {Object.entries(device.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span
                        className={
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }
                      >
                        {key}:
                      </span>
                      <span
                        className={
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }
                      >
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {devices.length === 0 && (
        <div
          className={`text-center py-8 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          No devices found.
        </div>
      )}
    </div>
  );
}

export default DevicesPage;
