import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ExternalLink, Info, MoreHorizontal, X } from 'lucide-react';
import { DeviceChartData, HierarchyChartData } from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import ChartModal from '../Charts/ChartModel';

interface FractionsChartProps {
  chartData?: DeviceChartData | null;
  hierarchyChartData?: HierarchyChartData | null;
  isDeviceOffline?: boolean;
  widgetConfig?: any;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

const FractionsChart: React.FC<FractionsChartProps> = ({
  chartData,
  hierarchyChartData,
  isDeviceOffline = false,
  widgetConfig,
}) => {
  const { theme } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showInfoCard, setShowInfoCard] = useState(false);

  /**
   * -------------------------
   * TWEAKABLE STYLES (edit here)
   *
   * - To change label color: edit `labelColorLight` / `labelColorDark`
   * - To change label size: edit `labelSizeClass`
   * - To change label boldness: edit `labelFontWeight` (e.g. 'font-semibold' / 'font-extrabold')
   * - To change value color: edit `valueColorClass`
   * - To change value size: edit `valueSizeClass`
   * - To change value boldness: edit `valueFontWeight`
   *
   * Use Tailwind utility classes here. Example: change 'text-emerald-300' to 'text-red-500'
   * -------------------------
   */
  const labelSizeClass = 'text-sm md:text-base'; // label size (GVF / WLR)
  const labelFontWeight = 'font-bold'; // label weight (boldness)
  const labelColorLight = 'text-gray-600'; // label color when light theme
  const labelColorDark = 'text-[#A2AED4]'; // label color when dark theme

  const valueSizeClass = 'text-base md:text-lg'; // value size (numeric)
  const valueFontWeight = 'font-bold'; // value weight
  const valueColorClass = isDeviceOffline
    ? theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
    : 'text-emerald-300'; // numeric value color

  // End tweakable block
  /**
   * Note: if you use non-Tailwind colors (like hex), keep them in the labelColorDark / labelColorLight
   * as Tailwind classes or custom class names that exist in your CSS.
   */

  // Transform API data to chart format and round to 1 decimal place
  const data = useMemo(() => {
    if (chartData?.chartData) {
      return chartData.chartData.map((point) => ({
        time: new Date(point.timestamp).toLocaleTimeString('en-GB', {
          hour: '2-digit',
          hour12: false
        }),
        gvf: point.gvf != null ? round1(point.gvf) : 0,
        wlr: point.wlr != null ? round1(point.wlr) : 0,
      }));
    } else if (hierarchyChartData?.chartData) {
      return hierarchyChartData.chartData.map((point) => ({
        time: new Date(point.timestamp).toLocaleTimeString('en-GB', {
          hour: '2-digit',
          hour12: false
        }),
        gvf: point.totalGvf != null ? round1(point.totalGvf) : 0,
        wlr: point.totalWlr != null ? round1(point.totalWlr) : 0,
      }));
    }

    // Return empty array if no data
    return [];
  }, [chartData, hierarchyChartData]);

  const latestGvf = data.length > 0 ? data[data.length - 1].gvf : 0;
  const latestWlr = data.length > 0 ? data[data.length - 1].wlr : 0;
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
          tickFormatter={(value) => {
            return value;
          }}
        />
        <YAxis
          stroke={theme === 'dark' ? '#A2AED4' : '#6B7280'}
          domain={[0, 100]}
          tickMargin={15}
          tickFormatter={(value) => {
            if (value === 0) return '00';
            if (value >= 1000) return `${value / 1000}k`;
            return value.toString();
          }}
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
          dataKey="gvf"
          stroke={theme === 'dark' ? '#4D3DF7' : '#38BF9D'}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="wlr"
          stroke={theme === 'dark' ? '#FE44CC' : '#F56C44'}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <div
      className={`p-4 rounded-lg shadow-sm ${
        theme === 'dark'
          ? 'bg-[#162345] border-none'
          : 'bg-white border border-[#ececec]'
      }`}
    >
      <div className="flex items-center justify-between mb-3 relative">
        <div className="flex items-center gap-2">
          <h2
            className={`text-base font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            Fractions
          </h2>
          <Info
            size={18}
            className={`cursor-pointer ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}
            onClick={() => setShowInfoCard(!showInfoCard)}
          />
          {showInfoCard && (
            <div className={`absolute top-10 left-0 right-0 z-50 p-4 rounded-lg shadow-xl border ${theme === 'dark' ? 'bg-[#1a2847] border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-start justify-between mb-2">
                <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Production Fractions</h4>
                <button onClick={() => setShowInfoCard(false)} className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                This chart displays the composition of production fluids over time, showing the percentages of gas (GVF) and water (WLR) in the total production.
              </p>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Monitoring these fractions helps optimize production and identify changes in reservoir conditions.
              </p>
            </div>
          )}
        </div>
        <div
          className={`flex items-center gap-2 border px-3 py-1.5 rounded-lg ${
            theme === 'dark'
              ? 'text-gray-300 border-[#A2AED4]'
              : 'text-gray-600 border-gray-300'
          }`}
        >
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
            <p
              className={`text-lg font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              No fractions data available
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-2">
            <div className="flex gap-6 mb-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-4 h-[3px] dark:bg-[#4D3DF7] bg-[#38BF9D] rounded" />
                <span
                  /* Label GVF — color/size/weight are tweakable above */
                  className={`${
                    theme === 'dark' ? labelColorDark : labelColorLight
                  } ${labelSizeClass} ${labelFontWeight}`}
                >
                  GVF (%)
                </span>
                <span
                  /* Value GVF — color/size/weight are tweakable above */
                  className={`${valueColorClass} ${valueSizeClass} ${valueFontWeight}`}
                >
                  {latestGvf.toFixed(1)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-4 h-[3px] dark:bg-[#FE44CC] bg-[#F56C44] rounded" />
                <span
                  /* Label WLR — color/size/weight are tweakable above */
                  className={`${
                    theme === 'dark' ? labelColorDark : labelColorLight
                  } ${labelSizeClass} ${labelFontWeight}`}
                >
                  WLR (%)
                </span>
                <span
                  /* Value WLR — color/size/weight are tweakable above */
                  className={`${valueColorClass} ${valueSizeClass} ${valueFontWeight}`}
                >
                  {latestWlr.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {renderChart(320, false)}
        </>
      )}

      <ChartModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Fractions"
      >
        <div className="flex gap-6 py-3 text-sm mb-4">
          <div className="flex items-center gap-2">
            <span className="w-4 h-[3px] dark:bg-[#4D3DF7] bg-[#38BF9D] rounded" />
            <span
              className={`${
                theme === 'dark' ? labelColorDark : labelColorLight
              } ${labelSizeClass} ${labelFontWeight}`}
            >
              GVF (%)
            </span>
            <span
              className={`${valueColorClass} ${valueSizeClass} ${valueFontWeight}`}
            >
              {latestGvf.toFixed(1)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-4 h-[3px] dark:bg-[#FE44CC] bg-[#F56C44] rounded" />
            <span
              className={`${
                theme === 'dark' ? labelColorDark : labelColorLight
              } ${labelSizeClass} ${labelFontWeight}`}
            >
              WLR (%)
            </span>
            <span
              className={`${valueColorClass} ${valueSizeClass} ${valueFontWeight}`}
            >
              {latestWlr.toFixed(1)}
            </span>
          </div>
        </div>
        {renderChart(window.innerHeight * 0.7, true)}
      </ChartModal>
    </div>
  );
};

export default FractionsChart;
