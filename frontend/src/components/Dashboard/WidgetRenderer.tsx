import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { DeviceChartData, HierarchyChartData } from '../../services/api';
import GVFWLRCharts from './GVFWLRCharts';
import ProductionMap from './ProductionMap';
import CustomLineChart from './CustomLineChart';
import { AlarmClock, Trash2 } from 'lucide-react';

interface WidgetConfig {
  layoutId: string;
  widgetId: string;
  name: string;
  description: string;
  type: string;
  component: string;
  layoutConfig: any;
  dataSourceConfig: any;
  instanceConfig: any;
  defaultConfig: any;
  displayOrder: number;
}

interface WidgetRendererProps {
  widget: WidgetConfig;
  chartData?: DeviceChartData | null;
  hierarchyChartData?: HierarchyChartData | null;
  timeRange?: '1day' | '7days' | '1month';
  lastRefresh?: Date;
  isDeviceOffline?: boolean;
  selectedDevice?: any;
  selectedHierarchy?: any;
  onDelete?: (layoutId: string) => void;
  isAdmin?: boolean;
}

const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  widget,
  chartData,
  hierarchyChartData,
  timeRange = '1day',
  lastRefresh,
  isDeviceOffline = false,
  selectedDevice,
  selectedHierarchy,
  onDelete,
  isAdmin = false,
}) => {
  const { theme } = useTheme();
  const { token } = useAuth();
  const dsConfig = widget.dataSourceConfig || {};

  const handleDelete = async () => {
    if (!onDelete || !token) return;
    if (!confirm(`Are you sure you want to delete "${widget.name}"?`)) return;
    onDelete(widget.layoutId);
  };

  // Helper to get metric value
  const getMetricValue = (metric: string) => {
    let value = 0;

    if (hierarchyChartData?.chartData && hierarchyChartData.chartData.length > 0) {
      const latest = hierarchyChartData.chartData[hierarchyChartData.chartData.length - 1];
      switch (metric) {
        case 'ofr':
          value = latest.totalOfr || 0;
          break;
        case 'wfr':
          value = latest.totalWfr || 0;
          break;
        case 'gfr':
          value = latest.totalGfr || 0;
          break;
      }
    } else if (chartData?.chartData && chartData.chartData.length > 0) {
      const latest = chartData.chartData[chartData.chartData.length - 1];
      switch (metric) {
        case 'ofr':
          value = latest.ofr || 0;
          break;
        case 'wfr':
          value = latest.wfr || 0;
          break;
        case 'gfr':
          value = latest.gfr || 0;
          break;
      }
    }

    return value;
  };

  // Check if this is a line chart widget with seriesConfig
  const isLineChartWidget = dsConfig.seriesConfig && Array.isArray(dsConfig.seriesConfig) && dsConfig.seriesConfig.length > 0;

  // Render based on component type
  switch (widget.component) {
    case 'CustomLineChart':
      return (
        <div className="h-full relative">
          {isAdmin && onDelete && (
            <button
              onClick={handleDelete}
              className={`absolute top-2 right-2 z-20 p-2 rounded-lg transition-all ${
                theme === 'dark'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
              title="Delete widget"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <CustomLineChart
            widgetConfig={widget}
            timeRange={timeRange}
            selectedHierarchy={selectedHierarchy}
            selectedDevice={selectedDevice}
          />
        </div>
      );
    case 'MetricsCard':
      if (dsConfig.metric === 'last_refresh') {
        const formattedTime = lastRefresh
          ? new Date(lastRefresh).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            })
          : '--:--:--';

        return (
          <div className="h-full">
            <div
              className={`h-full rounded-lg p-3 md:p-4 transition-all duration-300 overflow-hidden ${
                theme === 'dark' ? 'bg-[#162345]' : 'bg-white border border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: dsConfig.color || '#d82e75' }}
                >
                  <AlarmClock className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-xs md:text-sm font-semibold truncate ${
                      theme === 'dark' ? 'text-[#D0CCD8]' : 'text-[#555758]'
                    }`}
                  >
                    Last Refresh
                  </div>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1 md:mb-2 min-w-0">
                <span
                  className={`font-bold leading-none flex-shrink truncate text-2xl md:text-4xl ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {formattedTime}
                </span>
              </div>
            </div>
          </div>
        );
      }

      const value = getMetricValue(dsConfig.metric);
      return (
        <div className="h-full">
          <div
            className={`h-full rounded-lg p-3 md:p-4 transition-all duration-300 overflow-hidden ${
              theme === 'dark' ? 'bg-[#162345]' : 'bg-white border border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: theme === 'dark' ? (dsConfig.colorDark || '#4D3DF7') : (dsConfig.colorLight || '#F56C44') }}
              >
                <img src={dsConfig.icon || '/oildark.png'} alt={dsConfig.title} className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={`text-xs md:text-sm font-semibold truncate ${
                    theme === 'dark' ? 'text-[#D0CCD8]' : 'text-[#555758]'
                  }`}
                >
                  {dsConfig.title || 'Metric'}
                </div>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1 md:mb-2 min-w-0">
              <span
                className={`font-bold leading-none flex-shrink truncate text-2xl md:text-4xl ${
                  isDeviceOffline
                    ? theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    : theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}
              >
                {value.toFixed(2)}
              </span>
              <span
                className={`flex-shrink-0 leading-none text-sm md:text-base ${
                  theme === 'dark' ? 'text-[#D0CCD8]' : 'text-[#555758]'
                }`}
              >
                {dsConfig.unit || 'l/min'}
              </span>
            </div>
          </div>
        </div>
      );


    case 'GVFWLRChart':
      return (
        <div className={`h-full rounded-lg ${
          theme === 'dark' ? 'bg-[#162345]' : 'bg-white border border-gray-200'
        }`}>
          <GVFWLRCharts
            chartData={chartData}
            hierarchyChartData={hierarchyChartData}
            isDeviceOffline={isDeviceOffline}
            widgetConfig={widget}
          />
        </div>
      );

    case 'ProductionMap':
      return (
        <div className="h-full">
          <ProductionMap
            selectedHierarchy={selectedHierarchy}
            selectedDevice={selectedDevice}
            widgetConfig={widget}
          />
        </div>
      );

    default:
      return (
        <div className={`h-full rounded-lg p-4 flex items-center justify-center ${
          theme === 'dark' ? 'bg-[#162345] text-white' : 'bg-white border border-gray-200 text-gray-900'
        }`}>
          <div className="text-center">
            <p className="text-sm opacity-50">Unknown widget type:</p>
            <p className="font-semibold">{widget.component}</p>
          </div>
        </div>
      );
  }
};

export default WidgetRenderer;
