import React, { useState, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';

interface DeviceType {
  id: number;
  typeName: string;
  logo: string;
}

interface WidgetType {
  id: string;
  name: string;
  componentName: string;
  defaultConfig: any;
  displayName: string;
}

interface Property {
  id: number;
  name: string;
  tag: string;
  dataType: string;
  unit: string;
  order: number;
}

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddWidgetModal: React.FC<AddWidgetModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { theme } = useTheme();
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [widgetTypes, setWidgetTypes] = useState<WidgetType[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  const [selectedDeviceType, setSelectedDeviceType] = useState<number | null>(null);
  const [selectedWidgetType, setSelectedWidgetType] = useState<string | null>(null);
  const [selectedProperties, setSelectedProperties] = useState<number[]>([]);
  const [widgetName, setWidgetName] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadDeviceTypes();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedDeviceType) {
      loadAvailableWidgets();
    }
  }, [selectedDeviceType]);

  const loadDeviceTypes = async () => {
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5000/api/widgets/device-types', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (result.success) {
        setDeviceTypes(result.data);
      }
    } catch (err) {
      console.error('Failed to load device types:', err);
    }
  };

  const loadAvailableWidgets = async () => {
    if (!token || !selectedDeviceType) return;

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/widgets/available-widgets?deviceTypeId=${selectedDeviceType}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      if (result.success) {
        setWidgetTypes(result.data.widgetTypes);
        setProperties(result.data.properties);
      }
    } catch (err) {
      console.error('Failed to load available widgets:', err);
      setError('Failed to load widget options');
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyToggle = (propertyId: number) => {
    setSelectedProperties((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleCreateWidget = async () => {
    if (!token || !selectedDeviceType || !selectedWidgetType || selectedProperties.length === 0) {
      setError('Please complete all steps');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/widgets/create-widget', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceTypeId: selectedDeviceType,
          widgetTypeId: selectedWidgetType,
          propertyIds: selectedProperties,
          displayName: widgetName || undefined,
        }),
      });

      const result = await response.json();
      if (result.success) {
        onSuccess();
        handleClose();
      } else {
        setError(result.message || 'Failed to create widget');
      }
    } catch (err) {
      console.error('Failed to create widget:', err);
      setError('Failed to create widget');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedDeviceType(null);
    setSelectedWidgetType(null);
    setSelectedProperties([]);
    setWidgetName('');
    setError('');
    onClose();
  };

  const canProceed = () => {
    if (step === 1) return selectedDeviceType !== null;
    if (step === 2) return selectedWidgetType !== null;
    if (step === 3) return selectedProperties.length > 0;
    return false;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        className={`relative w-full max-w-3xl rounded-lg shadow-2xl ${
          theme === 'dark' ? 'bg-[#0B1437]' : 'bg-white'
        }`}
      >
        <div className={`flex items-center justify-between border-b p-6 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Add New Widget
          </h2>
          <button
            onClick={handleClose}
            className={`rounded-lg p-2 transition-colors ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className={theme === 'dark' ? 'text-white' : 'text-gray-900'} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 flex items-center justify-center space-x-4">
            {[
              { num: 1, label: 'Device' },
              { num: 2, label: 'Widget Type' },
              { num: 3, label: 'Properties' }
            ].map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      step >= s.num
                        ? 'bg-blue-500 text-white'
                        : theme === 'dark'
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step > s.num ? <Check className="h-5 w-5" /> : s.num}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${
                    step >= s.num
                      ? 'text-blue-500'
                      : theme === 'dark'
                      ? 'text-gray-500'
                      : 'text-gray-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div
                    className={`h-1 w-16 mt-0 mb-6 ${
                      step > s.num
                        ? 'bg-blue-500'
                        : theme === 'dark'
                        ? 'bg-gray-700'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500 bg-opacity-10 border border-red-500 p-3 text-red-500">
              {error}
            </div>
          )}

          {step === 1 && (
            <div>
              <h3 className={`mb-4 text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Step 1: Select Device Type
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {deviceTypes.map((dt) => (
                  <button
                    key={dt.id}
                    onClick={() => setSelectedDeviceType(dt.id)}
                    className={`rounded-lg border-2 p-4 text-left transition-all ${
                      selectedDeviceType === dt.id
                        ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                        : theme === 'dark'
                        ? 'border-gray-700 hover:border-gray-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {dt.typeName}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className={`mb-4 text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Step 2: Select Widget Type
              </h3>
              <p className={`mb-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Choose the visualization type for your widget. Line Chart is recommended for time-series data.
              </p>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {widgetTypes.filter(wt => wt.name === 'line_chart').map((wt) => (
                    <button
                      key={wt.id}
                      onClick={() => setSelectedWidgetType(wt.id)}
                      className={`rounded-lg border-2 p-4 text-left transition-all ${
                        selectedWidgetType === wt.id
                          ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                          : theme === 'dark'
                          ? 'border-gray-700 hover:border-gray-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {wt.displayName}
                      </div>
                      <div className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Display data over time with interactive charts
                      </div>
                    </button>
                  ))}
                  {widgetTypes.filter(wt => wt.name === 'line_chart').length === 0 && (
                    <div className={`col-span-2 text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      No widget types available
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className={`mb-4 text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Step 3: Select Properties to Display
              </h3>
              <div className="mb-4">
                <label className={`mb-2 block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Widget Name (Optional)
                </label>
                <input
                  type="text"
                  value={widgetName}
                  onChange={(e) => setWidgetName(e.target.value)}
                  placeholder="Enter custom widget name"
                  className={`w-full rounded-lg border px-4 py-2 ${
                    theme === 'dark'
                      ? 'border-gray-700 bg-gray-800 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {properties.map((prop) => (
                  <button
                    key={prop.id}
                    onClick={() => handlePropertyToggle(prop.id)}
                    className={`flex w-full items-center justify-between rounded-lg border-2 p-3 text-left transition-all ${
                      selectedProperties.includes(prop.id)
                        ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                        : theme === 'dark'
                        ? 'border-gray-700 hover:border-gray-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {prop.name}
                      </div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {prop.unit} - {prop.dataType}
                      </div>
                    </div>
                    {selectedProperties.includes(prop.id) && (
                      <Check className="h-5 w-5 text-blue-500" />
                    )}
                  </button>
                ))}
              </div>
              <div className={`mt-3 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Selected: {selectedProperties.length} {selectedProperties.length === 1 ? 'property' : 'properties'}
              </div>
            </div>
          )}
        </div>

        <div className={`flex items-center justify-between border-t p-6 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className={`rounded-lg px-6 py-2 font-medium transition-colors ${
              step === 1
                ? 'cursor-not-allowed opacity-50'
                : theme === 'dark'
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            Back
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className={`rounded-lg px-6 py-2 font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed() || loading}
                className={`rounded-lg px-6 py-2 font-medium transition-colors ${
                  !canProceed() || loading
                    ? 'cursor-not-allowed opacity-50'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleCreateWidget}
                disabled={!canProceed() || loading}
                className={`flex items-center gap-2 rounded-lg px-6 py-2 font-medium transition-colors ${
                  !canProceed() || loading
                    ? 'cursor-not-allowed opacity-50'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Widget
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddWidgetModal;
