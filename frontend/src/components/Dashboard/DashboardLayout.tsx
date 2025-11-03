import React, { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import SidebarDrawer from '../Shared/SidebarDrawer';
import DashboardContent from './DashboardContent';
import DevicesPage from './DevicesPage';
import AlarmsTable from './AlarmsTable';
import { Device, HierarchyNode } from '../../services/api';
import DashboardHeader from './DashboardHeader';

const DashboardLayout: React.FC = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedHierarchy, setSelectedHierarchy] =
    useState<HierarchyNode | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleDeviceSelect = (device: Device) => {
    setSelectedDevice(device);
    setSelectedHierarchy(null);
  };

  const handleHierarchySelect = (hierarchy: HierarchyNode) => {
    setSelectedHierarchy(hierarchy);
    setSelectedDevice(null);
  };

  const handleInitialHierarchyLoad = (hierarchy: HierarchyNode) => {
    setSelectedHierarchy(hierarchy);
    setSelectedDevice(null);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div
      className={`min-h-screen w-full overflow-x-hidden ${
        theme === 'dark' ? 'bg-[#0F172A]' : 'bg-[#F7F7F7]'
      }`}
    >
      {/* Header */}
      <DashboardHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        toggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen} // pass arrow state
      />

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`
    fixed md:static top-0 left-0 h-full z-50
    transform transition-transform duration-300 ease-in-out
    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    ${theme === 'dark' ? 'bg-[#121429]' : 'bg-white'}
  `}
        >
          <SidebarDrawer
            onDeviceSelect={handleDeviceSelect}
            onHierarchySelect={handleHierarchySelect}
            onInitialHierarchyLoad={handleInitialHierarchyLoad}
            selectedDeviceId={selectedDevice?.id}
            selectedHierarchyId={selectedHierarchy?.id}
            onClose={toggleSidebar}
          />
        </div>

        {/* Backdrop for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={toggleSidebar}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 md:p-4 md:ml-0">
          {/* Main Tab Content */}
          {activeTab === 'Dashboard' && (
            <DashboardContent
              selectedDevice={selectedDevice}
              selectedHierarchy={selectedHierarchy}
            />
          )}

          {activeTab === 'Devices' && (
            <DevicesPage
              selectedHierarchy={selectedHierarchy}
              selectedDevice={selectedDevice}
            />
          )}

          {activeTab === 'Alarms' && (
            <AlarmsTable
              selectedHierarchy={selectedHierarchy}
              selectedDevice={selectedDevice}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
