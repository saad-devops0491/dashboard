// FlowRateCharts.tsx
import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ExternalLink, Info, MoreHorizontal, X } from 'lucide-react';
import { DeviceChartData, HierarchyChartData } from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import ChartModal from '../Charts/ChartModel';

interface FlowRateChartsProps {
  chartData?: DeviceChartData | null;
  hierarchyChartData?: HierarchyChartData | null;
  timeRange: '1day' | '7days' | '1month';
  isDeviceOffline?: boolean;
  widgetConfigs?: any[];
}

interface SingleFlowRateChartProps {
  title: string;
  unit: string;
  data: any[];
  dataKey: string;
  maxValue?: number;
  timeRange: '1day' | '7days' | '1month';
  onExpandClick?: () => void;
  onInfoClick?: () => void;
}

const formatTickByRange = (value: number, timeRange: string) => {
  const d = new Date(value);
  if (timeRange === '1day') {
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', hour12: false });
  } else if (timeRange === '7days') {
    // short weekday + day
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } else if (timeRange === '1month') {
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }
  return d.toLocaleString();
};

const FlowRateChart: React.FC<SingleFlowRateChartProps> = ({
  title,
  unit,
  data,
  dataKey,
  maxValue,
  timeRange,
  onExpandClick,
  onInfoClick,
}) => {
  const { theme } = useTheme();

  // Calculate dynamic Y-axis domain
  const yAxisDomain = React.useMemo(() => {
    if (maxValue !== undefined) {
      const upperBound = Math.ceil(maxValue * 1.2); // 20% above max value
      return [0, upperBound];
    }
    return [0, 12000];
  }, [maxValue]);

  // sensible tick count (max 8 ticks)
  const tickCount = Math.min(8, Math.max(3, Math.ceil((data?.length || 1) / 20)));

  const renderChart = (height: number, isFullScreen = false) => {
    const adjustedTickCount = isFullScreen ? Math.min(15, Math.max(5, Math.ceil((data?.length || 1) / 10))) : tickCount;

    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
          <CartesianGrid stroke={theme === 'dark' ? '#d5dae740' : '#E5E7EB'} strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(v) => formatTickByRange(v as number, timeRange)}
            stroke={theme === 'dark' ? '#A2AED4' : '#6B7280'}
            fontSize={10}
            tickMargin={12}
            tickCount={adjustedTickCount}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke={theme === 'dark' ? '#A2AED4' : '#6B7280'}
            fontSize={13}
            tickMargin={20}
            domain={yAxisDomain}
            tickFormatter={(value) => {
              if (value === 0) return '00';
              if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
              return value.toString();
            }}
          />
          <Line type="monotone" dataKey={dataKey} stroke={theme === 'dark' ? '#EC4899' : '#38BF9D'} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div
      className={`rounded-lg p-4 shadow-sm ${theme === 'dark' ? 'bg-[#162345]' : 'bg-white border border-gray-200'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-[#fff]' : 'text-[#0f0f0f]'}`}>
            {title} ({unit})
          </h3>
          <Info
            size={18}
            className={`cursor-pointer ${theme === 'dark' ? 'text-[#D0CCD8]' : 'text-[#555758]'}`}
            onClick={onInfoClick}
          />
        </div>
        <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-lg ${theme === 'dark' ? 'border-[#D0CCD8] text-gray-400 hover:text-white' : 'border-[#EAEAEA] text-gray-600 hover:text-gray-900'}`}>
          <ExternalLink
            size={16}
            className="dark:text-white cursor-pointer dark:hover:text-gray-200 transition-colors"
            onClick={onExpandClick}
          />
          <MoreHorizontal size={16} className="text-gray-400 dark:text-white cursor-pointer hover:text-gray-800 dark:hover:text-gray-200" />
        </div>
      </div>

      {/* <div className="mb-3">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-[#38BF9D] dark:bg-[#EC4899] rounded"></div>
            <span className={`text-sm font-thin ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Line Condition
            </span>
          </div>
        </div>
      </div> */}

      {renderChart(240, false)}
    </div>
  );
};

const FlowRateCharts: React.FC<FlowRateChartsProps> = ({ chartData, hierarchyChartData, timeRange, isDeviceOffline = false, widgetConfigs = [] }) => {
  const [modalOpen, setModalOpen] = useState<'ofr' | 'wfr' | 'gfr' | null>(null);
  const [showInfoCard, setShowInfoCard] = useState<'ofr' | 'wfr' | 'gfr' | null>(null);
  const { theme } = useTheme();

  const lastChartDataRef = useRef<any>(null);
  const lastHierarchyDataRef = useRef<any>(null);
  const cachedOfrDataRef = useRef<any[]>([]);
  const cachedWfrDataRef = useRef<any[]>([]);
  const cachedGfrDataRef = useRef<any[]>([]);

  const shouldUpdateData = () => {
    const currentData = chartData?.chartData || hierarchyChartData?.chartData;
    const lastData = lastChartDataRef.current || lastHierarchyDataRef.current;

    if (!currentData || currentData.length === 0) return false;
    if (!lastData || lastData.length === 0) return true;

    const currentLatest = currentData[currentData.length - 1]?.timestamp;
    const lastLatest = lastData[lastData.length - 1]?.timestamp;

    return currentLatest !== lastLatest || currentData.length !== lastData.length;
  };

  useEffect(() => {
    if (chartData?.chartData) {
      lastChartDataRef.current = chartData.chartData;
      lastHierarchyDataRef.current = null;
    } else if (hierarchyChartData?.chartData) {
      lastHierarchyDataRef.current = hierarchyChartData.chartData;
      lastChartDataRef.current = null;
    }
  }, [chartData, hierarchyChartData]);

  const ofrData = useMemo(() => {
    if (!shouldUpdateData() && cachedOfrDataRef.current.length > 0) {
      return cachedOfrDataRef.current;
    }

    let newData: any[] = [];
    if (chartData?.chartData) {
      newData = chartData.chartData.map((point) => ({
        timestamp: new Date(point.timestamp).getTime(),
        line: point.ofr || 0,
        standard: point.ofr || 0,
      }));
    } else if (hierarchyChartData?.chartData) {
      newData = hierarchyChartData.chartData.map((point) => ({
        timestamp: new Date(point.timestamp).getTime(),
        line: point.totalOfr || 0,
        standard: point.totalOfr || 0,
      }));
    }

    cachedOfrDataRef.current = newData;
    return newData;
  }, [chartData, hierarchyChartData]);

  const wfrData = useMemo(() => {
    if (!shouldUpdateData() && cachedWfrDataRef.current.length > 0) {
      return cachedWfrDataRef.current;
    }

    let newData: any[] = [];
    if (chartData?.chartData) {
      newData = chartData.chartData.map((point) => ({
        timestamp: new Date(point.timestamp).getTime(),
        line: point.wfr || 0,
        standard: point.wfr || 0,
      }));
    } else if (hierarchyChartData?.chartData) {
      newData = hierarchyChartData.chartData.map((point) => ({
        timestamp: new Date(point.timestamp).getTime(),
        line: point.totalWfr || 0,
        standard: point.totalWfr || 0,
      }));
    }

    cachedWfrDataRef.current = newData;
    return newData;
  }, [chartData, hierarchyChartData]);

  const gfrData = useMemo(() => {
    if (!shouldUpdateData() && cachedGfrDataRef.current.length > 0) {
      return cachedGfrDataRef.current;
    }

    let newData: any[] = [];
    if (chartData?.chartData) {
      newData = chartData.chartData.map((point) => ({
        timestamp: new Date(point.timestamp).getTime(),
        line: point.gfr || 0,
        standard: point.gfr || 0,
      }));
    } else if (hierarchyChartData?.chartData) {
      newData = hierarchyChartData.chartData.map((point) => ({
        timestamp: new Date(point.timestamp).getTime(),
        line: point.totalGfr || 0,
        standard: point.totalGfr || 0,
      }));
    }

    cachedGfrDataRef.current = newData;
    return newData;
  }, [chartData, hierarchyChartData]);

  // Calculate max values for OFR and WFR to ensure same scale
  const ofrWfrMaxValue = useMemo(() => {
    const ofrMax = Math.max(...ofrData.map(d => d.line), 0);
    const wfrMax = Math.max(...wfrData.map(d => d.line), 0);
    return Math.max(ofrMax, wfrMax);
  }, [ofrData, wfrData]);

  const gfrMaxValue = useMemo(() => {
    return Math.max(...gfrData.map(d => d.line), 0);
  }, [gfrData]);

  const renderModalChart = (data: any[], dataKey: string, maxValue: number | undefined, title: string) => {
    const yAxisDomain = maxValue !== undefined ? [0, Math.ceil(maxValue * 1.2)] : [0, 12000];
    const adjustedTickCount = Math.min(15, Math.max(5, Math.ceil((data?.length || 1) / 10)));

    return (
      <>
        {/* <div className="mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-[#38BF9D] dark:bg-[#EC4899] rounded"></div>
            <span className={`text-sm font-thin ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Line Condition
            </span>
          </div>
        </div> */}
        <ResponsiveContainer width="100%" height={window.innerHeight * 0.65}>
          <LineChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid stroke={theme === 'dark' ? '#d5dae740' : '#E5E7EB'} strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(v) => formatTickByRange(v as number, timeRange)}
              stroke={theme === 'dark' ? '#A2AED4' : '#6B7280'}
              fontSize={12}
              tickMargin={12}
              tickCount={adjustedTickCount}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke={theme === 'dark' ? '#A2AED4' : '#6B7280'}
              fontSize={13}
              tickMargin={20}
              domain={yAxisDomain}
              tickFormatter={(value) => {
                if (value === 0) return '00';
                if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
                return value.toString();
              }}
            />
            <Line type="monotone" dataKey={dataKey} stroke={theme === 'dark' ? '#EC4899' : '#38BF9D'} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </>
    );
  };

  const getChartConfig = (metric: string) => {
    if (widgetConfigs.length === 0) return null;
    return widgetConfigs.find(w => w.dataSourceConfig?.metric === metric);
  };

  const ofrConfig = getChartConfig('ofr');
  const wfrConfig = getChartConfig('wfr');
  const gfrConfig = getChartConfig('gfr');

  return (
    <>
      <div className="w-full">
        {ofrConfig && (
          <div className="relative h-full">
            <FlowRateChart
              title={ofrConfig.dataSourceConfig?.title || "OFR"}
              unit={ofrConfig.dataSourceConfig?.unit || "l/min"}
              data={ofrData}
              dataKey="line"
              maxValue={ofrWfrMaxValue}
              timeRange={timeRange}
              onExpandClick={() => setModalOpen('ofr')}
              onInfoClick={() => setShowInfoCard('ofr')}
            />
          {showInfoCard === 'ofr' && (
            <div className={`absolute top-16 left-4 right-4 z-50 p-4 rounded-lg shadow-xl border ${theme === 'dark' ? 'bg-[#1a2847] border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-start justify-between mb-2">
                <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Oil Flow Rate (OFR)</h4>
                <button onClick={() => setShowInfoCard(null)} className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Oil Flow Rate measures the volume of oil flowing through the system per unit time, typically measured in liters per minute (l/min) or barrels per day (bpd).
              </p>
            </div>
          )}
          </div>
        )}
        {wfrConfig && (
          <div className="relative h-full">
            <FlowRateChart
              title={wfrConfig.dataSourceConfig?.title || "WFR"}
              unit={wfrConfig.dataSourceConfig?.unit || "l/min"}
              data={wfrData}
              dataKey="line"
              maxValue={ofrWfrMaxValue}
              timeRange={timeRange}
              onExpandClick={() => setModalOpen('wfr')}
              onInfoClick={() => setShowInfoCard('wfr')}
            />
          {showInfoCard === 'wfr' && (
            <div className={`absolute top-16 left-4 right-4 z-50 p-4 rounded-lg shadow-xl border ${theme === 'dark' ? 'bg-[#1a2847] border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-start justify-between mb-2">
                <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Water Flow Rate (WFR)</h4>
                <button onClick={() => setShowInfoCard(null)} className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Water Flow Rate measures the volume of water flowing through the system per unit time. This is important for monitoring water production and managing water cut in oil wells.
              </p>
            </div>
          )}
          </div>
        )}
        {gfrConfig && (
          <div className="relative h-full">
            <FlowRateChart
              title={gfrConfig.dataSourceConfig?.title || "GFR"}
              unit={gfrConfig.dataSourceConfig?.unit || "l/min"}
              data={gfrData}
              dataKey="line"
              maxValue={gfrMaxValue}
              timeRange={timeRange}
              onExpandClick={() => setModalOpen('gfr')}
              onInfoClick={() => setShowInfoCard('gfr')}
            />
          {showInfoCard === 'gfr' && (
            <div className={`absolute top-16 left-4 right-4 z-50 p-4 rounded-lg shadow-xl border ${theme === 'dark' ? 'bg-[#1a2847] border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-start justify-between mb-2">
                <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Gas Flow Rate (GFR)</h4>
                <button onClick={() => setShowInfoCard(null)} className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Gas Flow Rate measures the volume of gas flowing through the system per unit time. Monitoring GFR is essential for optimizing gas production and understanding reservoir performance.
              </p>
            </div>
          )}
          </div>
        )}
      </div>

      <ChartModal
        isOpen={modalOpen === 'ofr'}
        onClose={() => setModalOpen(null)}
        title={`${ofrConfig?.dataSourceConfig?.title || 'OFR'} (${ofrConfig?.dataSourceConfig?.unit || 'l/min'})`}
      >
        {renderModalChart(ofrData, 'line', ofrWfrMaxValue, ofrConfig?.dataSourceConfig?.title || 'OFR')}
      </ChartModal>

      <ChartModal
        isOpen={modalOpen === 'wfr'}
        onClose={() => setModalOpen(null)}
        title={`${wfrConfig?.dataSourceConfig?.title || 'WFR'} (${wfrConfig?.dataSourceConfig?.unit || 'l/min'})`}
      >
        {renderModalChart(wfrData, 'line', ofrWfrMaxValue, wfrConfig?.dataSourceConfig?.title || 'WFR')}
      </ChartModal>

      <ChartModal
        isOpen={modalOpen === 'gfr'}
        onClose={() => setModalOpen(null)}
        title={`${gfrConfig?.dataSourceConfig?.title || 'GFR'} (${gfrConfig?.dataSourceConfig?.unit || 'l/min'})`}
      >
        {renderModalChart(gfrData, 'line', gfrMaxValue, gfrConfig?.dataSourceConfig?.title || 'GFR')}
      </ChartModal>
    </>
  );
};

export default FlowRateCharts;
