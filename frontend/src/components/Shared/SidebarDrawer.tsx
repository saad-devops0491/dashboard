import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, ChevronRight as ChevronRightIcon, X as XIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import {
  apiService,
  DashboardData,
  HierarchyNode,
  Device,
  EnhancedDevice,
} from '../../services/api';

const regionSvg = '/region.svg';
const areaSvg   = '/area.svg';
const fieldSvg  = '/field.svg';
const wellSvg   = '/well.svg';
const deviceSvg = '/device.svg';
interface SidebarDrawerProps {
  onDeviceSelect?: (device: Device) => void;
  onHierarchySelect?: (hierarchy: HierarchyNode) => void;
  selectedDeviceId?: string | null;
  selectedHierarchyId?: string | null;
  onInitialHierarchyLoad?: (hierarchy: HierarchyNode) => void;
  onClose?: () => void;
}

const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  onDeviceSelect,
  onHierarchySelect,
  selectedDeviceId,
  selectedHierarchyId,
  onInitialHierarchyLoad,
  onClose,
}) => {
  const { token, user } = useAuth();
  const { theme } = useTheme();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [devices, setDevices] = useState<Device[]>([]);
  const [devicesByHierarchy, setDevicesByHierarchy] = useState<
    Record<string, Device[]>
  >({});
  const [enhancedDevices, setEnhancedDevices] = useState<Record<string, EnhancedDevice>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!token) return;

      try {
        const response = await apiService.getDashboardData(token);
        if (response.success && response.data) {
          setDashboardData(response.data);

          // Only auto-expand on initial load
          if (!isInitialized) {
            const companyName = Object.keys(response.data.hierarchy)[0];
            if (companyName) {
              const hierarchy = response.data.hierarchy[companyName].hierarchy;
              const expanded = [companyName];

              if (hierarchy.length > 0) {
                expanded.push(hierarchy[0].id);

                // Auto-select the first hierarchy node for initial chart loading
                if (onInitialHierarchyLoad) {
                  onInitialHierarchyLoad(hierarchy[0]);
                }

                if (hierarchy[0].children.length > 0) {
                  expanded.push(hierarchy[0].children[0].id);
                  if (hierarchy[0].children[0].children.length > 0) {
                    expanded.push(hierarchy[0].children[0].children[0].id);
                  }
                }
              }

              setExpandedItems(expanded);
            }
            setIsInitialized(true);
          }
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };

    const loadDevices = async () => {
      if (!token) return;

      try {
        const response = await apiService.getAllDevices(token);
        if (response.success && response.data) {
          setDevices(response.data.devices);

          // Group devices by their hierarchy location
          const deviceGroups: Record<string, Device[]> = {};
          response.data.devices.forEach((device) => {
            const locationKey = device.location || 'unassigned';
            if (!deviceGroups[locationKey]) {
              deviceGroups[locationKey] = [];
            }
            deviceGroups[locationKey].push(device);
          });

          setDevicesByHierarchy(deviceGroups);
        }
      } catch (error) {
        console.error('Failed to load devices:', error);
      }
    };

    const loadEnhancedDevices = async () => {
      if (!token) return;

      try {
        const response = await apiService.getAllDevicesEnhanced(token);
        if (response.success && response.data) {
          // Create a map of device serial to enhanced device for quick lookup
          const deviceMap: Record<string, EnhancedDevice> = {};
          response.data.devices.forEach(device => {
            deviceMap[device.deviceSerial] = device;
          });
          setEnhancedDevices(deviceMap);
        }
      } catch (error) {
        console.error('Failed to load enhanced devices:', error);
      }
    };

    loadDashboardData();
    loadDevices();
    loadEnhancedDevices();

    // Auto-refresh enhanced devices every 5 seconds to keep status updated
    const refreshInterval = setInterval(() => {
      loadEnhancedDevices();
    }, 5000);

    return () => clearInterval(refreshInterval);
  }, [token, isInitialized]);

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeviceClick = (device: Device) => {
    if (onDeviceSelect) {
      // Transform Device to EnhancedDevice format for compatibility
      const enhancedDevice = {
        deviceId: parseInt(device.id),
        deviceSerial: device.serial_number,
        deviceName: device.type,
        deviceLogo: device.logo,
        wellName: device.location || 'Unknown',
        metadata: device.metadata,
        location: {},
        status: 'Online' as const,
        flowData: {
          gfr: 0,
          gor: 0,
          ofr: 0,
          wfr: 0,
          gvf: 0,
          wlr: 0,
          pressure: 0,
          temperature: 0,
        },
        createdAt: device.created_at,
        companyName: device.company,
        // Keep original device data for backward compatibility
        ...device,
      };
      onDeviceSelect(enhancedDevice as any);
    }
  };

  const handleHierarchyClick = (hierarchy: HierarchyNode) => {
    if (onHierarchySelect) {
      onHierarchySelect(hierarchy);
    }
  };

  const handleArrowClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent item selection when clicking arrow
    toggleExpanded(id);
  };

  // icon image class used for <img> elements
  const iconImgClass = `w-[19px] h-[19px] object-contain ${
    theme === 'dark' ? 'filter brightness-0 invert' : 'filter brightness-0'
  }`;

  const getIconComponent = (level: string) => {
    switch (level) {
      case 'Region':
        return <img src={regionSvg} alt="region" className={iconImgClass} />;
      case 'Area':
        return <img src={areaSvg} alt="area" className={iconImgClass} />;
      case 'Field':
        return <img src={fieldSvg} alt="field" className={iconImgClass} />;
      case 'Well':
        return <img src={wellSvg} alt="well" className={iconImgClass} />;
      case 'Device':
        return <img src={deviceSvg} alt="device" className={iconImgClass} />;
      default:
        return <img src={deviceSvg} alt="icon" className={iconImgClass} />;
    }
  };

  const renderDevicesForHierarchy = (hierarchyName: string, level = 0) => {
    const hierarchyDevices = devicesByHierarchy[hierarchyName] || [];

    if (hierarchyDevices.length === 0) return null;

    return hierarchyDevices.map((device) => {
      // Get the enhanced device data to check status
      const enhancedDevice = enhancedDevices[device.serial_number];
      const isOnline = enhancedDevice?.status === 'Online';

      return (
        <div
          key={`device-${device.id}`}
          className={`flex items-center gap-2 sm:gap-3 py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 md:px-4 cursor-pointer rounded-md mt-1 transition-colors ml-4 sm:ml-6 md:ml-8
      ${
        selectedDeviceId === device.id
          ? 'dark:bg-[#6656F5] bg-[#F56C44] text-white'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-[#a79efa48] dark:hover:text-white'
      }`}
          onClick={() => handleDeviceClick(device)}
        >
          <div className="w-3 sm:w-4 shrink-0" />
          <div className="shrink-0">{getIconComponent('Device')}</div>
          <span className="text-xs sm:text-sm flex-1 truncate">{device.serial_number}</span>
          <div
            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${
              isOnline
                ? 'bg-[#17F083]'
                : 'bg-[#ec4856ff]'
            }`}
          />
        </div>
      );
    });
  };

  const renderNavigationItem = (item: HierarchyNode, level = 0) => {
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const isWell = item.level === 'Well';
    const wellDevices = isWell ? devicesByHierarchy[item.name] || [] : [];
    const hasDevices = wellDevices.length > 0;
    const isSelected = selectedHierarchyId === item.id;

    const handleItemClick = () => {
      // Only handle item selection, not expansion
      handleHierarchyClick(item);
    };

    return (
      <div key={item.id}>
        <div
          className={`flex items-center my-1 gap-2 sm:gap-3 py-2 px-3 sm:px-4 md:px-6 cursor-pointer rounded-md transition-colors ${
            isSelected
              ? 'dark:bg-[#6656F5] bg-[#F56C44] text-white'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-[#a79efa48] dark:hover:text-white'
          } ${
            level === 0
              ? 'font-semibold'
              : level === 1
              ? 'font-medium ml-2 sm:ml-3 md:ml-4'
              : level === 2
              ? 'ml-4 sm:ml-6 md:ml-8'
              : 'ml-6 sm:ml-9 md:ml-12'
          }`}
          onClick={handleItemClick}
        >
          {(hasChildren || hasDevices) && (
            <ChevronRightIcon
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform cursor-pointer hover:scale-110 shrink-0 ${
                isExpanded ? 'rotate-90' : ''
              } ${theme === 'dark' ? 'text-white' : 'text-[#555768]'}`}
              onClick={(e) => handleArrowClick(e, item.id)}
            />
          )}
          {!hasChildren && !hasDevices && <div className="w-3.5 sm:w-4 shrink-0" />}

          <div className="shrink-0">{getIconComponent(item.level)}</div>

          <span className="text-xs sm:text-sm flex-1 truncate">{item.name}</span>

          {isWell && hasDevices && (
            <span className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-[#F56C44] dark:bg-[#6656F5] text-white shrink-0">
              {wellDevices.length}
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {item.children.map((child: HierarchyNode) =>
              renderNavigationItem(child, level + 1)
            )}
          </div>
        )}

        {isWell && hasDevices && isExpanded && (
          <div>{renderDevicesForHierarchy(item.name, level + 1)}</div>
        )}
      </div>
    );
  };

  const renderCompanyHierarchy = () => {
    if (!dashboardData?.hierarchy) return null;

    return Object.entries(dashboardData.hierarchy).map(
      ([companyName, companyData]) => {
        const isExpanded = expandedItems.includes(companyName);
        const isSelected = selectedHierarchyId === companyName;

        const handleCompanyClick = () => {
          // Only handle company selection, not expansion
          const companyHierarchy: HierarchyNode = {
            id: companyName,
            name: companyName,
            level: 'Company',
            level_order: 0,
            can_attach_device: false,
            children: companyData.hierarchy,
            company_id: companyData.id,
          };
          handleHierarchyClick(companyHierarchy);
        };

        return (
          <div key={companyName}>
            <div
              className={`flex items-center gap-2 sm:gap-3 py-2 px-3 sm:px-4 cursor-pointer mt-1 rounded-md transition-colors font-medium ${
                isSelected
                  ? 'dark:bg-[#6656F5] bg-[#F56C44] text-white'
                  : theme === 'dark'
                  ? 'hover:bg-[#a79efa48] text-gray-300 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
              }`}
              onClick={handleCompanyClick}
            >
              <ChevronRightIcon
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform cursor-pointer hover:scale-110 shrink-0 ${
                  isExpanded ? 'rotate-90' : ''
                } ${theme === 'dark' ? 'text-white' : 'text-[#555768]'}`}
                onClick={(e) => handleArrowClick(e, companyName)}
              />
              <img
                src={regionSvg}
                alt="company"
                className={`w-[14px] h-[14px] sm:w-[16px] sm:h-[16px] object-contain shrink-0 ${
                  theme === 'dark' ? 'filter brightness-0 invert' : ''
                }`}
              />
              <span className="text-xs sm:text-sm truncate flex-1">{companyName}</span>
            </div>

            {isExpanded && (
              <div>
                {companyData.hierarchy.map((item: HierarchyNode) =>
                  renderNavigationItem(item, 1)
                )}
              </div>
            )}
          </div>
        );
      }
    );
  };

  return (
    <div
      className={`w-[85vw] max-w-[300px] sm:max-w-[320px] md:w-72 lg:w-80 h-screen transition-colors ${
        theme === 'dark'
          ? 'bg-[#162345]'
          : 'bg-[#fff] border-[#ececec] border-r'
      } flex flex-col overflow-hidden shadow-lg`}
    >
      {/* User Profile Section - Only visible on mobile */}
      <div className={`md:hidden px-3 sm:px-4 pt-2 sm:pt-3 pb-3 sm:pb-4 flex-shrink-0 border-b ${
        theme === 'dark' ? 'border-[#364566]' : 'border-[#ececec]'
      }`}>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Avatar */}
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-base font-semibold text-white shrink-0 ${
            theme === 'dark' ? 'bg-[#6656F5]' : 'bg-[#F56C44]'
          }`}>
            {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <h3 className={`text-xs sm:text-sm font-semibold truncate ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {user?.username || 'User'}
            </h3>
            <p className={`text-xs truncate ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {user?.email || 'user@example.com'}
            </p>
          </div>

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors shrink-0 ${
                theme === 'dark'
                  ? 'hover:bg-[#1D2147] text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              }`}
            >
              <XIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Fixed Header */}
      <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2 sm:pb-3 flex-shrink-0">
        <h1
          className={`text-base sm:text-lg mb-2 sm:mb-3 font-medium tracking-wide ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}
        >
          Production Map
        </h1>

        <div className="relative">
          <SearchIcon
            className={`absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}
          />
          <input
            placeholder="Search"
            className={`w-full pl-8 sm:pl-9 pr-2 sm:pr-3 h-8 sm:h-9 text-xs sm:text-sm rounded-lg border transition-colors ${
              theme === 'dark'
                ? 'bg-[#162345] border-[#5e728a] text-white placeholder-gray-400 focus:border-[#526d8d]'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-gray-300'
            } focus:outline-none focus:ring-1 ${
              theme === 'dark' ? 'focus:ring-[]' : 'focus:ring-gray-300'
            }`}
          />
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-3 md:px-4 pt-2 sm:pt-3 border-t border-[#ececec] dark:border-[#364566]">
        <div
          className={`scrollbar-thin ${
            theme === 'dark'
              ? 'scrollbar-thumb-white scrollbar-track-transparent'
              : 'scrollbar-thumb-[#38BF9D] scrollbar-track-transparent'
          }`}
        >
          {renderCompanyHierarchy()}
        </div>
      </div>

      {/* Fixed Footer with Version */}
      <div className={`p-2 sm:p-3 md:p-4 flex-shrink-0 border-t ${
        theme === 'dark' ? 'border-[#364566]' : 'border-[#ececec]'
      }`}>
        <div className={`flex items-center justify-center py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg ${
          theme === 'dark' ? 'bg-[#1D2147]' : 'bg-[#EAEAEA]'
        }`}>
          <span className={`text-xs font-medium ${
            theme === 'dark' ? 'text-gray-400' : 'text-[#555758]'
          }`}>
            v1.0.0
          </span>
        </div>
      </div>
    </div>
  );
};

export default SidebarDrawer;
