import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { apiService, EnhancedDevice, HierarchyNode } from '../../services/api';
import {
  Wifi,
  WifiOff,
  AlarmClockCheck as AlarmCheck,
  BellRing,
  BellPlus,
} from 'lucide-react';

// Fix for default markers in React Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default icon issue
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom marker icons: now a simple filled circle (no text)
const createCustomIcon = (isOnline: boolean) => {
  const size = 24; // size in px
  const color = isOnline ? '#17F083' : '#ec4856ff'; // green for online, pink for offline

  // Using ion--location-sharp SVG with dynamic color
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
      <path fill="${color}" d="M256 32C167.67 32 96 96.51 96 176c0 128 160 304 160 304s160-176 160-304c0-79.49-71.67-144-160-144zm0 224a64 64 0 1 1 64-64 64.07 64.07 0 0 1-64 64z"/>
    </svg>
  `;

  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [size, size + 4], // slightly taller for the location pin shape
    iconAnchor: [size / 2, size + 2], // anchor at bottom center of the pin
    popupAnchor: [0, -(size + 6)], // show popup above the pin
    className: '', // no extra classes
  });
};

// Component to fit map bounds to device locations
const FitBounds: React.FC<{
  bounds?: [number, number][] | null;
  padding?: number;
}> = ({ bounds, padding = 50 }) => {
  const map = useMap();

  React.useEffect(() => {
    if (bounds && bounds.length > 0) {
      try {
        map.fitBounds(bounds as [number, number][], {
          padding: [padding, padding],
        });
      } catch (err) {
        console.warn('FitBounds: map.fitBounds threw an error', err);
      }
    }
  }, [map, JSON.stringify(bounds), padding]);

  return null;
};

interface ProductionMapProps {
  selectedHierarchy?: HierarchyNode | null;
  selectedDevice?: any | null;
  widgetConfig?: any;
}

const ProductionMap: React.FC<ProductionMapProps> = ({
  selectedHierarchy,
  selectedDevice,
  widgetConfig,
}) => {
  const { theme } = useTheme();
  const { token } = useAuth();
  const [devices, setDevices] = useState<EnhancedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverStats, setServerStats] = useState<any | null>(null); // Holds statistics returned from backend

  // refs for map and markers so we can programmatically center/open popup for selected device
  const mapRef = useRef<any | null>(null);
  const markerRefs = useRef<Record<number | string, any>>({});

  // Load devices based on selected hierarchy
  useEffect(() => {
    const loadDevices = async () => {
      if (!token) return;

      setIsLoading(true);
      setError(null);
      setServerStats(null);

      try {
        let response;

        if (
          selectedHierarchy &&
          selectedHierarchy.id !== selectedHierarchy.name
        ) {
          // Load devices for specific hierarchy
          response = await apiService.getDevicesByHierarchy(
            parseInt(selectedHierarchy.id),
            token
          );
        } else {
          // Load all devices for company
          response = await apiService.getAllDevicesEnhanced(token);
        }

        if (response.success && response.data) {
          // Filter devices that have location data
          const devicesWithLocation = response.data.devices.filter(
            (device) =>
              device.location &&
              device.location.longitude !== null &&
              device.location.latitude !== null
          );
          setDevices(devicesWithLocation);

          // Save server-provided statistics so counts reflect ALL devices (not just those with GPS)
          if (response.data.statistics) {
            setServerStats(response.data.statistics);
          } else {
            setServerStats(null);
          }
        } else {
          setError(response.message);
          setDevices([]);
          setServerStats(null);
        }
      } catch (error) {
        console.error('Failed to load devices for map:', error);
        setError('Failed to load device locations');
        setDevices([]);
        setServerStats(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadDevices();
  }, [token, selectedHierarchy]);

  // When selectedDevice changes, center map and open its popup (if available)
  useEffect(() => {
    if (!selectedDevice || !mapRef.current) return;

    let lat: number | null = null;
    let lon: number | null = null;
    if (
      selectedDevice.location &&
      selectedDevice.location.latitude != null &&
      selectedDevice.location.longitude != null
    ) {
      lat = Number(selectedDevice.location.latitude);
      lon = Number(selectedDevice.location.longitude);
    }
    if (
      (lat === null || lon === null) &&
      selectedDevice.latitude != null &&
      selectedDevice.longitude != null
    ) {
      lat = Number(selectedDevice.latitude);
      lon = Number(selectedDevice.longitude);
    }
    if (
      lat !== null &&
      lon !== null &&
      !Number.isNaN(lat) &&
      !Number.isNaN(lon)
    ) {
      try {
        mapRef.current.setView([lat, lon], 13, { animate: true });

        const keysToTry = [
          selectedDevice.id,
          selectedDevice.deviceId,
          selectedDevice.device_id,
          selectedDevice.serial_number,
          selectedDevice.deviceSerial,
        ];
        let markerRef = null;
        for (const k of keysToTry) {
          if (k != null && markerRefs.current[k]) {
            markerRef = markerRefs.current[k];
            break;
          }
        }
        if (!markerRef) {
          const found = Object.values(markerRefs.current).find((m: any) => {
            try {
              const latlng = m?.getLatLng
                ? m.getLatLng()
                : m?.leafletElement?.getLatLng
                ? m.leafletElement.getLatLng()
                : null;
              if (!latlng) return false;
              return (
                Math.abs(latlng.lat - lat!) < 0.000001 &&
                Math.abs(latlng.lng - lon!) < 0.000001
              );
            } catch {
              return false;
            }
          });
          if (found) markerRef = found;
        }

        const openPopupSafely = (m: any) => {
          if (!m) return;
          const leafletMarker = m?.leafletElement ?? m;
          if (leafletMarker && typeof leafletMarker.openPopup === 'function') {
            try {
              leafletMarker.openPopup();
            } catch (err) {
              setTimeout(() => {
                try {
                  leafletMarker.openPopup();
                } catch (e) {
                  /* ignore */
                }
              }, 300);
            }
          }
        };

        openPopupSafely(markerRef);
      } catch (err) {
        console.warn('Could not center/open popup for selectedDevice', err);
      }
    }
  }, [selectedDevice, mapRef.current, markerRefs.current]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate bounds for map fitting
  const mapBounds = useMemo(() => {
    if (devices.length === 0) return null;

    return devices.map(
      (device) =>
        [device.location.latitude!, device.location.longitude!] as [
          number,
          number
        ]
    );
  }, [devices]);

  // Calculate statistics: prefer server-provided values (accurate across full dataset)
  const statistics = useMemo(() => {
    const totalDevices = serverStats?.totalDevices ?? devices.length;
    const onlineDevices =
      serverStats?.onlineDevices ??
      devices.filter((device) => device.status === 'Online').length;
    const offlineDevices =
      serverStats?.offlineDevices ?? totalDevices - onlineDevices;
    const deviceTypes =
      serverStats?.deviceTypes ??
      new Set(devices.map((device) => device.deviceName)).size;
    const totalAlarms = serverStats?.totalAlarms ?? 0;

    return {
      totalDevices,
      onlineDevices,
      offlineDevices,
      deviceTypes,
      totalAlarms,
    };
  }, [devices, serverStats]);

  // Default center (Saudi Arabia)
  const defaultCenter: [number, number] = [24.7136, 46.6753];

  // If selectedDevice has coords, use them as the initial center to avoid jumpy behavior
  const initialCenter: [number, number] = (() => {
    const sd = selectedDevice;
    if (sd) {
      if (
        sd.location &&
        sd.location.latitude != null &&
        sd.location.longitude != null
      ) {
        return [Number(sd.location.latitude), Number(sd.location.longitude)];
      }
      if (sd.latitude != null && sd.longitude != null) {
        return [Number(sd.latitude), Number(sd.longitude)];
      }
    }
    return mapBounds && mapBounds.length > 0 ? mapBounds[0] : defaultCenter;
  })();

  // Map tile URL based on theme (use more natural tiles in dark mode)
  const tileUrl =
    theme === 'dark'
      ? 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'
      : 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png';

  if (isLoading) {
    return (
      <div
        className={`rounded-lg ${
          theme === 'dark' ? 'bg-[#162345]' : 'bg-white border border-gray-200'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-center h-80">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <span
                className={`${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}
              >
                Loading device locations...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg ${
        theme === 'dark' ? 'bg-[#162345]' : 'bg-white border border-gray-200'
      }`}
    >
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between p-6 border-b ${
          theme === 'dark' ? 'border-[#b4c9e37d]' : 'border-gray-200'
        }`}
      >
        <h2
          className={`text-xl font-medium ${
            theme === 'dark' ? 'text-[#fff]' : 'text-[#0f0f0f]'
          }`}
        >
          {selectedHierarchy && selectedHierarchy.id !== selectedHierarchy.name
            ? `${selectedHierarchy.name} - Device Locations`
            : 'Production Map - All Devices'}
        </h2>
        <div className="flex md:items-center justify-end gap-4  mt-4 md:mt-0">
          <div className="flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 512 512"
              className="inline-block"
            >
              <path
                fill={theme === 'dark' ? '#17F083' : '#38BF9D'}
                d="M256 32C167.67 32 96 96.51 96 176c0 128 160 304 160 304s160-176 160-304c0-79.49-71.67-144-160-144zm0 224a64 64 0 1 1 64-64 64.07 64.07 0 0 1-64 64z"
              />
            </svg>
            <span
              className={`text-base ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Online
            </span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 512 512"
              className="inline-block"
            >
              <path
                fill={theme === 'dark' ? '#ec4856ff' : '#ec4856ff'}
                d="M256 32C167.67 32 96 96.51 96 176c0 128 160 304 160 304s160-176 160-304c0-79.49-71.67-144-160-144zm0 224a64 64 0 1 1 64-64 64.07 64.07 0 0 1-64 64z"
              />
            </svg>
            <span
              className={`text-base ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Offline
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {/* Map */}
        <div
          className={`col-span-2 relative h-80 rounded-bl-lg overflow-hidden ${
            theme === 'dark' ? 'bg-[#21212b]' : 'bg-gray-100'
          }`}
        >
          {error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p
                  className={`text-lg font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {error}
                </p>
              </div>
            </div>
          ) : devices.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p
                  className={`text-lg font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  No devices with location data found
                </p>
                <p
                  className={`text-sm ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  }`}
                >
                  {selectedHierarchy &&
                  selectedHierarchy.id !== selectedHierarchy.name
                    ? `No devices in ${selectedHierarchy.name} have location coordinates`
                    : 'No devices have been configured with GPS coordinates'}
                </p>
              </div>
            </div>
          ) : (
            <MapContainer
              center={initialCenter}
              zoom={mapBounds && mapBounds.length > 0 ? 10 : 6}
              style={{ height: '100%', width: '100%' }}
              className="z-10"
              scrollWheelZoom={true}
              whenCreated={(mapInstance) => {
                mapRef.current = mapInstance;
              }}
            >
              <TileLayer url={tileUrl} />
              <FitBounds bounds={mapBounds} padding={50} />

              {devices.map((device) => (
                <Marker
                  key={device.deviceId}
                  position={[
                    device.location.latitude!,
                    device.location.longitude!,
                  ]}
                  icon={createCustomIcon(device.status === 'Online')}
                  ref={(ref) => {
                    if (ref) {
                      markerRefs.current[device.deviceId] = ref;
                      try {
                        markerRefs.current[device.deviceSerial] = ref;
                      } catch {}
                      try {
                        markerRefs.current[device.id] = ref;
                      } catch {}
                    } else {
                      delete markerRefs.current[device.deviceId];
                    }
                  }}
                >
                  <Popup
                    className={theme === 'dark' ? 'dark-popup' : 'light-popup'}
                  >
                    <div
                      className={`p-3 min-w-[250px] ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      <div className="font-semibold text-lg mb-2">
                        {device.deviceSerial}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span
                            className={
                              theme === 'dark'
                                ? 'text-gray-300'
                                : 'text-gray-600'
                            }
                          >
                            Type:
                          </span>
                          <span className="font-medium">
                            {device.deviceName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span
                            className={
                              theme === 'dark'
                                ? 'text-gray-300'
                                : 'text-gray-600'
                            }
                          >
                            Well:
                          </span>
                          <span className="font-medium">{device.wellName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span
                            className={
                              theme === 'dark'
                                ? 'text-gray-300'
                                : 'text-gray-600'
                            }
                          >
                            Status:
                          </span>
                          <span
                            className={`font-medium ${
                              device.status === 'Online'
                                ? 'dark:text-[#17F083] text-[#38BF9D]'
                                : 'dark:text-[#EC4899] text-[#F56C44]'
                            }`}
                          >
                            {device.status}
                          </span>
                        </div>
                        {device.lastCommTime && (
                          <div className="flex justify-between">
                            <span
                              className={
                                theme === 'dark'
                                  ? 'text-gray-300'
                                  : 'text-gray-600'
                              }
                            >
                              Last Comm:
                            </span>
                            <span className="font-medium text-xs">
                              {new Date(device.lastCommTime).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {device.deviceName === 'MPFM' && (
                          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-white-500">OFR:</span>
                                <span className="ml-1 font-medium">
                                  {device.flowData.ofr.toFixed(1)}
                                </span>
                              </div>
                              <div>
                                <span className="text-white-500">WFR:</span>
                                <span className="ml-1 font-medium">
                                  {device.flowData.wfr.toFixed(1)}
                                </span>
                              </div>
                              <div>
                                <span className="text-white-500">GFR:</span>
                                <span className="ml-1 font-medium">
                                  {device.flowData.gfr.toFixed(1)}
                                </span>
                              </div>
                              <div>
                                <span className="text-white-500">GVF:</span>
                                <span className="ml-1 font-medium">
                                  {device.flowData.gvf.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Statistics */}
        <div className="space-y-4 p-4">
          <div className="flex md:flex-col flex-row md:gap-0 gap-8">
            <div
              className={`text-6xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
            >
              {statistics.totalDevices}
            </div>
            <div
              className={`text-base italic mt-3 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              {selectedHierarchy &&
              selectedHierarchy.id !== selectedHierarchy.name
                ? `Devices in ${selectedHierarchy.name}`
                : 'Total Devices with Location'}
            </div>
          </div>

          <div className="flex items-center gap-5 py-2 pl-3">
            <BellRing className="text-[#F56C44] dark:text-[#46B8E9] w-5 h-5" />
            <span
              className={`font-bold text-lg ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
            >
              {statistics.totalAlarms}
            </span>
            <span
              className={`text-sm ${
                theme === 'dark' ? 'text-white' : 'text-gray-600'
              } ml-2`}
            >
              Total Alarms
            </span>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-5 py-2 pl-3">
              <Wifi className="text-[#38BF9D] dark:text-[#17F083] w-5 h-5" />
              <span
                className={`font-bold text-lg ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}
              >
                {statistics.onlineDevices}
              </span>
              <span
                className={`text-sm ${
                  theme === 'dark' ? 'text-white' : 'text-gray-600'
                } ml-2`}
              >
                Online
              </span>
            </div>

            <div className="flex items-center gap-5 py-2 pl-3">
              <WifiOff className="text-[#ec4856ff] dark:text-[#ec4856ff] w-5 h-5" />
              <span
                className={`font-bold text-lg ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}
              >
                {statistics.offlineDevices}
              </span>
              <span
                className={`text-sm ${
                  theme === 'dark' ? 'text-white' : 'text-gray-600'
                } ml-2`}
              >
                Offline
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for Leaflet controls/popups */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .leaflet-control-zoom { border: none !important; }
          .leaflet-control-zoom a {
            background-color: ${
              theme === 'dark' ? '#151e35' : 'white'
            } !important;
            color: ${theme === 'dark' ? '#e2e8f0' : '#1e271f'} !important;
            border: 1px solid ${
              theme === 'dark' ? '#242835' : '#F7F7F7'
            } !important;
          }
          .leaflet-control-zoom a:hover {
            background-color: ${
              theme === 'dark' ? '#162345' : '#f9fafb'
            } !important;
          }
          .leaflet-popup-content-wrapper {
            background-color: ${
              theme === 'dark' ? '#1623456e' : 'white'
            } !important;
            color: ${theme === 'dark' ? 'white' : '#162345'} !important;
            border-radius: 8px !important;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2) !important;
          }
          .leaflet-popup-tip {
            background-color: ${
              theme === 'dark' ? '#1623455e' : 'white'
            } !important;
          }
          .leaflet-container { font-family: 'Poppins', sans-serif !important; }
        `,
        }}
      />
    </div>
  );
};

export default ProductionMap;
