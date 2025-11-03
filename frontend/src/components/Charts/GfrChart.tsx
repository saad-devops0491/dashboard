// src/components/Charts/GfrChart.tsx
import React, { useMemo, useState } from 'react';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Info, ExternalLink, MoreHorizontal } from 'lucide-react';
import { DeviceChartData, HierarchyChartData } from '../../services/api'; // <-- make sure HierarchyChartData is exported from services/api
import { useTheme } from '../../hooks/useTheme';
import ChartModal from './ChartModel';

interface GFRChartProps {
  chartData?: DeviceChartData | null;
  hierarchyChartData?: HierarchyChartData | null;
}

export default function GFRChart({ chartData, hierarchyChartData }: GFRChartProps) {
  const { theme } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Transform API data to chart format - handle both device and hierarchy data
  const data = useMemo(() => {
    const seenTimes = new Map<string, number>();
    const getUniqueTime = (timestamp: string): string => {
      const time = new Date(timestamp).toLocaleTimeString();
      const count = seenTimes.get(time) || 0;
      seenTimes.set(time, count + 1);
      return count === 0 ? time : `${time}.${count}`;
    };

    if (chartData?.chartData) {
      // Device data
      return chartData.chartData.map(point => ({
        time: getUniqueTime(point.timestamp),
        line: point.gfr || 0,
        standard: point.gfr || 0,
      }));
    } else if (hierarchyChartData?.chartData) {
      // Hierarchy aggregated data
      return hierarchyChartData.chartData.map(point => ({
        time: getUniqueTime(point.timestamp),
        line: point.totalGfr || 0,
        standard: point.totalGfr || 0,
      }));
    }

    // Return empty array if no data
    return [];
  }, [chartData, hierarchyChartData]);

  const latestValue = data.length > 0 ? data[data.length - 1].line : 0;
  const isHierarchyData = !!hierarchyChartData;

  const renderChart = (height: number, isFullScreen = false) => (
    <ResponsiveContainer
      width="100%"
      height={height}
      style={{ outline: 'none', border: 'none' }}
    >
      <LineChart
        data={data}
        margin={{ top: 30, right: 20, left: 10, bottom: 30 }}
      >
        <CartesianGrid
          stroke={theme === 'dark' ? '#2C3A65' : '#E5E7EB'}
          strokeDasharray="3 3"
        />
        <XAxis
          dataKey="time"
          stroke={theme === 'dark' ? '#A2AED4' : '#6B7280'}
          tickMargin={15}
          interval={Math.floor(data.length / (isFullScreen ? 15 : 8))}
        />
        <YAxis
          stroke={theme === 'dark' ? '#A2AED4' : '#6B7280'}
          domain={data.length > 0 ? ['dataMin - 500', 'dataMax + 500'] : [0, 1000]}
          tickMargin={15}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: theme === 'dark' ? '#1E1E2F' : '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            color: theme === 'dark' ? '#FFFFFF' : '#000000',
          }}
          cursor={false}
        />
        <Line
          type="monotone"
          dataKey="line"
          stroke="#FE44CC"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="standard"
          stroke="#4D3DF7"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <div className={`p-4 rounded-2xl shadow-md ${
      theme === 'dark' ? 'bg-[#162345]' : 'bg-white border border-gray-200'
    }`}>
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-2">
          <h2 className={`text-sm font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {isHierarchyData ? 'Total GFR (l/min)' : 'GFR (bpd)'}
          </h2>
          <Info size={16} className={theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} />
        </div>
        <div className={`flex items-center gap-2 border px-2 py-1 rounded-lg ${
          theme === 'dark'
            ? 'text-gray-300 border-[#A2AED4]'
            : 'text-gray-600 border-gray-300'
        }`}>
          <ExternalLink
            size={20}
            className="cursor-pointer hover:text-white transition-colors"
            onClick={() => setIsModalOpen(true)}
          />
          <MoreHorizontal
            size={20}
            className="cursor-pointer hover:text-white"
          />
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <p className={`text-lg font-medium ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              No GFR data available
            </p>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            }`}>
              This device type may not support gas flow rate measurements
            </p>
          </div>
        </div>
      ) : (
        <>
      <div className="flex gap-6 py-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-4 h-[2px] bg-pink-500 rounded" />
          <span className={theme === 'dark' ? 'text-[#A2AED4]' : 'text-gray-600'}>
            {isHierarchyData ? 'Total Production' : 'Line Condition'}
          </span>
          <span className="text-emerald-300 text-xs">{latestValue.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-[2px] bg-indigo-500 rounded" />
          <span className={theme === 'dark' ? 'text-[#A2AED4]' : 'text-gray-600'}>
            Standard Condition
          </span>
          <span className="text-emerald-300 text-xs">{(latestValue * 0.98).toFixed(2)}</span>
        </div>
        {isHierarchyData && hierarchyChartData && (
          <div className="flex items-center gap-2">
            <span className="w-4 h-[2px] bg-green-500 rounded" />
            <span className={theme === 'dark' ? 'text-[#A2AED4]' : 'text-gray-600'}>
              Devices: {hierarchyChartData.totalDevices}
            </span>
          </div>
        )}
      </div>

      {renderChart(350, false)}
        </>
      )}

      <ChartModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isHierarchyData ? 'Total GFR (l/min)' : 'GFR (bpd)'}
      >
        <div className="flex gap-6 py-3 text-sm mb-4">
          <div className="flex items-center gap-2">
            <span className="w-4 h-[2px] bg-pink-500 rounded" />
            <span className={theme === 'dark' ? 'text-[#A2AED4]' : 'text-gray-600'}>
              {isHierarchyData ? 'Total Production' : 'Line Condition'}
            </span>
            <span className="text-emerald-300 text-xs">{latestValue.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-[2px] bg-indigo-500 rounded" />
            <span className={theme === 'dark' ? 'text-[#A2AED4]' : 'text-gray-600'}>
              Standard Condition
            </span>
            <span className="text-emerald-300 text-xs">{(latestValue * 0.98).toFixed(2)}</span>
          </div>
          {isHierarchyData && hierarchyChartData && (
            <div className="flex items-center gap-2">
              <span className="w-4 h-[2px] bg-green-500 rounded" />
              <span className={theme === 'dark' ? 'text-[#A2AED4]' : 'text-gray-600'}>
                Devices: {hierarchyChartData.totalDevices}
              </span>
            </div>
          )}
        </div>
        {renderChart(window.innerHeight * 0.7, true)}
      </ChartModal>
    </div>
  );
}