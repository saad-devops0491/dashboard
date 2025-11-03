import React, { useState, useEffect } from 'react';
import { useRef } from 'react';
import { Search, Grid2x2 as Grid, List, Wifi, WifiOff, Filter, RefreshCw, Download, MapPin, Settings, Eye } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { apiService, EnhancedDevice, DevicesResponse, HierarchyNode, Device } from '../../services/api';

interface DevicesPageProps {
  selectedHierarchy?: HierarchyNode | null;
  selectedDevice?: Device | null;
}

const DevicesPage: React.FC<DevicesPageProps> = ({ selectedHierarchy, selectedDevice }) => {
  const { token } = useAuth();
  const { theme } = useTheme();
  const [devicesData, setDevicesData] = useState<DevicesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setViewMode('card');
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [showFilters, setShowFilters] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const itemsPerPage = 20;

  useEffect(() => {
    const loadDevices = async () => {
      if (!token) return;

      setIsLoading(true);
      try {
        let response;

        if (selectedHierarchy && selectedHierarchy.id !== selectedHierarchy.name) {
          // Load devices for specific hierarchy
          response = await apiService.getDevicesByHierarchy(parseInt(selectedHierarchy.id), token, {
            search: searchTerm || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            deviceType: deviceTypeFilter !== 'all' ? deviceTypeFilter : undefined,
          });
        } else {
          // Load all devices for company
          response = await apiService.getAllDevicesEnhanced(token, {
            search: searchTerm || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            deviceType: deviceTypeFilter !== 'all' ? deviceTypeFilter : undefined,
            page: currentPage,
            limit: itemsPerPage,
          });
        }

        if (response.success && response.data) {
          setDevicesData(response.data);
          setError(null);
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
  }, [token, searchTerm, statusFilter, deviceTypeFilter, currentPage, selectedHierarchy]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const startAutoRefresh = () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      refreshIntervalRef.current = setInterval(() => {
        // Reload devices data
        const loadDevices = async () => {
          if (!token) return;

          try {
            let response;

            if (selectedHierarchy && selectedHierarchy.id !== selectedHierarchy.name) {
              response = await apiService.getDevicesByHierarchy(parseInt(selectedHierarchy.id), token, {
                search: searchTerm || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                deviceType: deviceTypeFilter !== 'all' ? deviceTypeFilter : undefined,
              });
            } else {
              response = await apiService.getAllDevicesEnhanced(token, {
                search: searchTerm || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                deviceType: deviceTypeFilter !== 'all' ? deviceTypeFilter : undefined,
                page: currentPage,
                limit: itemsPerPage,
              });
            }

            if (response.success && response.data) {
              setDevicesData(response.data);
              setError(null);
            }
          } catch (error) {
            console.error('Auto-refresh failed:', error);
          }
        };

        loadDevices();
      }, 5000);
    };

    startAutoRefresh();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [token, searchTerm, statusFilter, deviceTypeFilter, currentPage, selectedHierarchy]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleDeviceTypeFilter = (deviceType: string) => {
    setDeviceTypeFilter(deviceType);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDeviceTypeFilter('all');
    setCurrentPage(1);
  };

  const handleExport = () => {
    console.log('Export devices data');
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 rounded-lg ${
        theme === 'dark' ? 'bg-[#2A2D47]' : 'bg-white border border-gray-200'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Loading devices...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 rounded-lg ${
        theme === 'dark' ? 'bg-red-900/20 text-red-400 border border-red-800' : 'bg-red-50 text-red-600 border border-red-200'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <WifiOff className="w-5 h-5" />
          <span className="font-medium">Error Loading Devices</span>
        </div>
        <p className="text-sm">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!devicesData) {
    return (
      <div className="p-4 rounded-lg bg-gray-900/20 text-gray-400">
        No device data available
      </div>
    );
  }

  const { devices, statistics, pagination, filters } = devicesData;

  return (
    <div
      className={`p-3 lg:p-4 h-full overflow-y-auto overflow-x-hidden ${
        theme === 'dark' ? 'bg-[#121429]' : 'bg-gray-50'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 md:gap-3 mb-3 md:mb-4">
        <div className="min-w-0">
          <h1
            className={`text-base sm:text-lg md:text-xl font-semibold truncate ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            {selectedHierarchy &&
            selectedHierarchy.id !== selectedHierarchy.name
              ? `Devices in ${selectedHierarchy.name}`
              : 'All Devices'}
          </h1>
          <p
            className={`text-xs mt-1 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Total: {statistics.totalDevices} devices
            {selectedHierarchy &&
              selectedHierarchy.id !== selectedHierarchy.name && (
                <span className="ml-2">
                  • {selectedHierarchy.level}: {selectedHierarchy.name}
                </span>
              )}
          </p>
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* View Toggle - Hidden on mobile */}
          <div
            className={`hidden lg:flex items-center rounded-lg p-0.5 md:p-1 ${
              theme === 'dark' ? 'bg-[#162345]' : 'bg-gray-200'
            }`}
          >
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 md:px-3 lg:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors flex items-center gap-1.5 md:gap-2 ${
                viewMode === 'list'
                  ? 'dark:bg-[#6366F1] text-white bg-[#F56C44]'
                  : theme === 'dark'
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden xl:inline">List</span>
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`px-2 md:px-3 lg:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors flex items-center gap-1.5 md:gap-2 ${
                viewMode === 'card'
                  ? 'dark:bg-[#6366F1] text-white bg-[#F56C44]'
                  : theme === 'dark'
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden xl:inline">Cards</span>
            </button>
          </div>

          {/* Action Buttons - Hidden */}
          <div className="hidden md:flex"></div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mb-3 md:mb-4">
        <div
          className={`p-2 md:p-3 rounded-lg ${
            theme === 'dark'
              ? 'bg-[#162345]'
              : 'bg-white border border-gray-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 dark:bg-[#17F083] rounded-full bg-[#38BF9D]"></div>
            <span
              className={`text-xs font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Online
            </span>
          </div>
          <p
            className={`text-lg md:text-xl font-bold mt-1 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            {statistics.onlineDevices}
          </p>
        </div>
        <div
          className={`p-2 md:p-3 rounded-lg ${
            theme === 'dark'
              ? 'bg-[#162345]'
              : 'bg-white border border-gray-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 dark:bg-[#EC4899] rounded-full bg-[#555586]"></div>
            <span
              className={`text-xs font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Offline
            </span>
          </div>
          <p
            className={`text-lg md:text-xl font-bold mt-1 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            {statistics.offlineDevices}
          </p>
        </div>
        <div
          className={`p-2 md:p-3 rounded-lg ${
            theme === 'dark'
              ? 'bg-[#162345]'
              : 'bg-white border border-gray-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 dark:bg-[#46B8E9] rounded-full bg-[#F6CA58]"></div>
            <span
              className={`text-xs font-medium truncate ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              <span className="hidden sm:inline">Device </span>Types
            </span>
          </div>
          <p
            className={`text-lg md:text-xl font-bold mt-1 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            {statistics.deviceTypes}
          </p>
        </div>
        <div
          className={`p-2 md:p-3 rounded-lg ${
            theme === 'dark'
              ? 'bg-[#162345]'
              : 'bg-white border border-gray-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 dark:bg-[#4D3DF7] rounded-full bg-[#F56C44]"></div>
            <span
              className={`text-xs font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Total
            </span>
          </div>
          <p
            className={`text-lg md:text-xl font-bold mt-1 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            {statistics.totalDevices}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mb-3 md:mb-4 justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 sm:max-w-xs lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search devices"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className={`w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 text-sm md:text-base border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#6366F1] ${
              theme === 'dark'
                ? 'bg-transparent border-[#a2aed4a4] text-white placeholder-gray-400 focus:border-[#6366F1]'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#6366F1]'
            }`}
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 md:px-4 py-2 text-sm md:text-base border rounded-lg flex items-center justify-center gap-2 transition-colors shrink-0 ${
            theme === 'dark'
              ? showFilters
                ? 'bg-[#1e2139] border-[#6366F1] text-[#6366F1]'
                : 'bg-[#162345] border-[#3A3D57] text-gray-300 hover:bg-[#1e2139]'
              : showFilters
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-3 h-3 md:w-4 md:h-4" />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div
          className={`p-4 rounded-lg mb-6 border ${
            theme === 'dark'
              ? 'bg-[#1e2139] border-[#2e3147]'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-visible min-w-0">
            <div className="min-w-0">
              <label
                className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Status
              </label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6366F1] text-sm ${
                    theme === 'dark'
                      ? 'bg-[#162345] border-[#3A3D57] text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All Status</option>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </div>
            <div className="min-w-0">
              <label
                className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Device Type
              </label>
              <div className="relative">
                <select
                  value={deviceTypeFilter}
                  onChange={(e) => handleDeviceTypeFilter(e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6366F1] text-sm ${
                    theme === 'dark'
                      ? 'bg-[#162345] border-[#3A3D57] text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All Types</option>
                  {filters.availableDeviceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content - Force card view on mobile */}
      {viewMode === 'list' ? (
        <>
          {/* Mobile Card View */}
          <div className="block lg:hidden space-y-4">
            {devices.map((device) => (
              <div
                key={device.deviceId}
                className={`rounded-lg p-4 ${
                  theme === 'dark'
                    ? 'bg-[#162345]'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h3
                      className={`font-semibold text-sm ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {device.deviceName}
                    </h3>
                    <p
                      className={`text-xs mt-1 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      {device.deviceSerial}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      device.status === 'Online'
                        ? 'bg-[#38BF9D] text-white'
                        : 'bg-[#555876] text-white'
                    }`}
                  >
                    {device.status === 'Online' ? (
                      <Wifi className="w-3 h-3 mr-1" />
                    ) : (
                      <WifiOff className="w-3 h-3 mr-1" />
                    )}
                    {device.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span
                      className={`${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      Well Name:
                    </span>
                    <p
                      className={`font-medium mt-1 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {device.wellName}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      Last Comm:
                    </span>
                    <p
                      className={`font-medium mt-1 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {device.lastCommTime
                        ? new Date(device.lastCommTime).toLocaleString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      Water Cut:
                    </span>
                    <p
                      className={`font-medium mt-1 ${
                        device.status === 'Offline'
                          ? theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          : theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {device.flowData.wlr.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <span
                      className={`${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      GVF:
                    </span>
                    <p
                      className={`font-medium mt-1 ${
                        device.status === 'Offline'
                          ? theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          : theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {device.flowData.gvf.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <span
                      className={`${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      WFR:
                    </span>
                    <p
                      className={`font-medium mt-1 ${
                        device.status === 'Offline'
                          ? theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          : theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {device.flowData.wfr.toFixed(0)} l/min
                    </p>
                  </div>
                  <div>
                    <span
                      className={`${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      OFR:
                    </span>
                    <p
                      className={`font-medium mt-1 ${
                        device.status === 'Offline'
                          ? theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          : theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {device.flowData.ofr.toFixed(0)} l/min
                    </p>
                  </div>
                  <div>
                    <span
                      className={`${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      GFR:
                    </span>
                    <p
                      className={`font-medium mt-1 ${
                        device.status === 'Offline'
                          ? theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          : theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {device.flowData.gfr.toFixed(0)} l/min
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-hidden">
            <div
              className={`rounded-xl overflow-hidden shadow-lg ${
                theme === 'dark'
                  ? 'bg-[#162345]'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead
                    className={`${
                      theme === 'dark'
                        ? 'bg-[#1a2847] border-b-2 border-[#6366F1]'
                        : 'bg-gray-100 border-b-2 border-[#F56C44]'
                    }`}
                  >
                    <tr>
                      <th
                        className={`text-left px-3 py-3 text-xs font-bold uppercase tracking-wide ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}
                        style={{ width: '9%' }}
                      >
                        Device Name
                      </th>
                      <th
                        className={`text-left px-3 py-3 text-xs font-bold uppercase tracking-wide ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}
                        style={{ width: '10%' }}
                      >
                        Well Name
                      </th>
                      <th
                        className={`text-left px-3 py-3 text-xs font-bold uppercase tracking-wide ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}
                        style={{ width: '11%' }}
                      >
                        Serial
                      </th>
                      <th
                        className={`text-left px-3 py-3 text-xs font-bold uppercase tracking-wide ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}
                        style={{ width: '13%' }}
                      >
                        Last Comm. Time
                      </th>
                      <th
                        className={`text-left px-3 py-3 text-xs font-bold uppercase tracking-wide ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}
                        style={{ width: '10%' }}
                      >
                        Water Cut (%)
                      </th>
                      <th
                        className={`text-left px-3 py-3 text-xs font-bold uppercase tracking-wide ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}
                        style={{ width: '8%' }}
                      >
                        GVF (%)
                      </th>
                      <th
                        className={`text-left px-3 py-3 text-xs font-bold uppercase tracking-wide ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}
                        style={{ width: '9%' }}
                      >
                        WFR (l/min)
                      </th>
                      <th
                        className={`text-left px-3 py-3 text-xs font-bold uppercase tracking-wide ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}
                        style={{ width: '9%' }}
                      >
                        OFR (l/min)
                      </th>
                      <th
                        className={`text-left px-3 py-3 text-xs font-bold uppercase tracking-wide ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}
                        style={{ width: '7%' }}
                      >
                        GFR
                      </th>
                      <th
                        className={`text-left px-3 py-3 text-xs font-bold uppercase tracking-wide ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}
                        style={{ width: '10%' }}
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y ${
                      theme === 'dark' ? 'divide-[#1a2847]' : 'divide-gray-200'
                    }`}
                  >
                    {devices.map((device) => (
                      <tr
                        key={device.deviceId}
                        className={`transition-colors ${
                          theme === 'dark'
                            ? 'hover:bg-[#1a2847]'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <td
                          className={`px-3 py-2.5 text-xs font-medium truncate ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          {device.deviceName}
                        </td>
                        <td
                          className={`px-3 py-2.5 text-xs truncate ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                          }`}
                        >
                          {device.wellName}
                        </td>
                        <td
                          className={`px-3 py-2.5 text-xs truncate ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                          }`}
                        >
                          {device.deviceSerial}
                        </td>
                        <td
                          className={`px-3 py-2.5 text-xs truncate ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                          }`}
                        >
                          {device.lastCommTime
                            ? new Date(device.lastCommTime).toLocaleString()
                            : 'N/A'}
                        </td>
                        <td
                          className={`px-3 py-2.5 text-xs ${
                            device.status === 'Offline'
                              ? theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                              : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                          }`}
                        >
                          {device.flowData.wlr.toFixed(1)}%
                        </td>
                        <td
                          className={`px-3 py-2.5 text-xs ${
                            device.status === 'Offline'
                              ? theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                              : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                          }`}
                        >
                          {device.flowData.gvf.toFixed(1)}%
                        </td>
                        <td
                          className={`px-3 py-2.5 text-xs ${
                            device.status === 'Offline'
                              ? theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                              : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                          }`}
                        >
                          {device.flowData.wfr.toFixed(0)}
                        </td>
                        <td
                          className={`px-3 py-2.5 text-xs ${
                            device.status === 'Offline'
                              ? theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                              : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                          }`}
                        >
                          {device.flowData.ofr.toFixed(0)}
                        </td>
                        <td
                          className={`px-3 py-2.5 text-xs ${
                            device.status === 'Offline'
                              ? theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                              : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                          }`}
                        >
                          {device.flowData.gfr.toFixed(0)}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                              device.status === 'Online'
                                ? 'bg-[#38BF9D] text-white'
                                : 'bg-[#555876] text-white'
                            }`}
                          >
                            {device.status === 'Online' ? (
                              <Wifi className="w-2.5 h-2.5 mr-1 flex-shrink-0" />
                            ) : (
                              <WifiOff className="w-2.5 h-2.5 mr-1 flex-shrink-0" />
                            )}
                            <span className="truncate">{device.status}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {devices.map((device) => (
            <div
              key={device.deviceId}
              className={`rounded-xl p-6 border transition-all duration-200 hover:shadow-lg ${
                theme === 'dark'
                  ? 'bg-[#162345] border-[#1a2847] hover:border-[#6366F1]'
                  : 'bg-white border-gray-200 hover:border-[#F56C44] hover:shadow-xl'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br dark:bg-[#6366f1] rounded-xl flex items-center justify-center shadow-lg bg-[#F56C44]">
                    <span className="text-white font-bold text-sm">
                      {device.deviceSerial.slice(-2)}
                    </span>
                  </div>
                  <div>
                    <h3
                      className={`font-semibold text-sm ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {device.deviceSerial}
                    </h3>
                    <p
                      className={`text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      {device.deviceName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {device.status === 'Online' ? (
                    <Wifi className="w-4 h-4 dark:text-[#6366F1] text-[#38BF9D]" />
                  ) : (
                    <WifiOff className="w-4 h-4 dark:text-[#EC4899] text-[#555786]" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      device.status === 'Online'
                        ? 'dark:text-[#6366F1] text-[#38BF9D]'
                        : 'dark:text-[#EC4899] text-[#555786]'
                    }`}
                  >
                    {device.status}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs flex items-center gap-1 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                    Well Name:
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {device.wellName}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span
                    className={`text-xs ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    Last Comm:
                  </span>
                  <span
                    className={`text-xs ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {device.lastCommTime
                      ? new Date(device.lastCommTime).toLocaleString()
                      : 'N/A'}
                  </span>
                </div>

                <div
                  className={`grid grid-cols-2 gap-3 pt-3 border-t ${
                    theme === 'dark' ? 'border-[#1a2847]' : 'border-gray-200'
                  }`}
                >
                  <div className="text-center">
                    <span
                      className={`text-xs block ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      GVF
                    </span>
                    <p
                      className={`font-bold text-lg ${
                        device.status === 'Offline'
                          ? theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          : theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {device.flowData.gvf.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <span
                      className={`text-xs block ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      Water Cut
                    </span>
                    <p
                      className={`font-bold text-lg ${
                        device.status === 'Offline'
                          ? theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          : theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {device.flowData.wlr.toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="text-center">
                    <span
                      className={`text-xs block ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      WFR
                    </span>
                    <p
                      className={`font-semibold text-sm ${
                        device.status === 'Offline'
                          ? theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          : theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {device.flowData.wfr.toFixed(0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <span
                      className={`text-xs block ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      OFR
                    </span>
                    <p
                      className={`font-semibold text-sm ${
                        device.status === 'Offline'
                          ? theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          : theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {device.flowData.ofr.toFixed(0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <span
                      className={`text-xs block ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      GFR
                    </span>
                    <p
                      className={`font-semibold text-sm ${
                        device.status === 'Offline'
                          ? theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          : theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {device.flowData.gfr.toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <div
            className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} devices
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                currentPage === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              } ${
                theme === 'dark'
                  ? 'bg-[#162345] border-[#1a2847] text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              Previous
            </button>
            <span
              className={`px-4 py-2 text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() =>
                setCurrentPage(Math.min(pagination.pages, currentPage + 1))
              }
              disabled={currentPage === pagination.pages}
              className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                currentPage === pagination.pages
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              } ${
                theme === 'dark'
                  ? 'bg-[#162345] border-[#1a2847] text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {devices.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div
            className={`text-lg mb-2 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            No devices found
          </div>
          <div
            className={`text-sm ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            }`}
          >
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'No devices available'}
          </div>
        </div>
      )}
    </div>
  );
};

export default DevicesPage;
