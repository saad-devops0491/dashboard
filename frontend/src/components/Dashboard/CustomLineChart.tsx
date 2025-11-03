import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ExternalLink, Info, MoreHorizontal } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import ChartModal from '../Charts/ChartModel';

interface CustomLineChartProps {
  widgetConfig: any;
  timeRange: '1day' | '7days' | '1month';
}

interface SeriesData {
  data: Array<{
    timestamp: string;
    serialNumber: string;
    value: number;
  }>;
  unit: string;
  propertyName: string;
}

const formatTickByRange = (value: number, timeRange: string) => {
  const d = new Date(value);
  if (timeRange === '1day') {
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', hour12: false });
  } else if (timeRange === '7days') {
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } else if (timeRange === '1month') {
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }
  return d.toLocaleString();
};

const CHART_COLORS = ['#EC4899', '#38BF9D', '#F59E0B', '#8B5CF6', '#EF4444', '#10B981'];

const CustomLineChart: React.FC<CustomLineChartProps> = ({ widgetConfig, timeRange }) => {
  const { theme } = useTheme();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState<any[]>([]);
  const [seriesKeys, setSeriesKeys] = useState<string[]>([]);
  const [units, setUnits] = useState<{ [key: string]: string }>({});
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadWidgetData();
  }, [widgetConfig.widgetId, timeRange]);

  const loadWidgetData = async () => {
    if (!token || !widgetConfig.widgetId) return;

    setLoading(true);
    setError('');

    try {
      const timeRangeMap: { [key: string]: string } = {
        '1day': '24h',
        '7days': '7d',
        '1month': '30d',
      };

      const response = await fetch(
        `http://localhost:5000/api/widgets/widget-data/${widgetConfig.widgetId}?timeRange=${timeRangeMap[timeRange]}&limit=200`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      console.log('Widget data response:', result);

      if (result.success && result.data) {
        const formattedData = formatChartData(result.data);
        console.log('Formatted chart data:', formattedData);
        setChartData(formattedData.data);
        setSeriesKeys(formattedData.keys);
        setUnits(formattedData.units);
      } else {
        setError(result.message || 'Failed to load widget data');
      }
    } catch (err) {
      console.error('Failed to load widget data:', err);
      setError('Failed to load widget data');
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = (seriesData: { [key: string]: SeriesData }) => {
    const dataMap: { [timestamp: string]: any } = {};
    const keys: string[] = [];
    const unitsMap: { [key: string]: string } = {};

    Object.entries(seriesData).forEach(([seriesName, series]) => {
      keys.push(seriesName);
      unitsMap[seriesName] = series.unit || '';

      if (series.data && Array.isArray(series.data)) {
        series.data.forEach((point) => {
          const timestamp = new Date(point.timestamp).getTime();
          if (!dataMap[timestamp]) {
            dataMap[timestamp] = { timestamp };
          }
          dataMap[timestamp][seriesName] = point.value;
        });
      }
    });

    const data = Object.values(dataMap).sort((a, b) => a.timestamp - b.timestamp);

    return { data, keys, units: unitsMap };
  };

  const getYAxisDomain = () => {
    if (chartData.length === 0) return [0, 100];

    let maxValue = 0;
    seriesKeys.forEach((key) => {
      chartData.forEach((point) => {
        if (point[key] > maxValue) maxValue = point[key];
      });
    });

    return [0, Math.ceil(maxValue * 1.2)];
  };

  const renderChart = (height: number, isFullScreen = false) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center" style={{ height }}>
          <p className="text-red-500">{error}</p>
        </div>
      );
    }

    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center" style={{ height }}>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            No data available for this time range
          </p>
        </div>
      );
    }

    const yAxisDomain = getYAxisDomain();
    const tickCount = isFullScreen
      ? Math.min(15, Math.max(5, Math.ceil(chartData.length / 10)))
      : Math.min(8, Math.max(3, Math.ceil(chartData.length / 20)));

    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
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
            tickCount={tickCount}
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
              return value.toFixed(0);
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
              border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
              borderRadius: '8px',
            }}
            labelStyle={{ color: theme === 'dark' ? '#F3F4F6' : '#111827' }}
            formatter={(value: any, name: string) => [
              `${parseFloat(value).toFixed(2)} ${units[name] || ''}`,
              name,
            ]}
            labelFormatter={(label) => new Date(label).toLocaleString()}
          />
          {isFullScreen && <Legend />}
          {seriesKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const getChartTitle = () => {
    if (widgetConfig.name) return widgetConfig.name;
    if (seriesKeys.length > 0) {
      return seriesKeys.join(', ');
    }
    return 'Custom Chart';
  };

  const getChartUnit = () => {
    if (seriesKeys.length === 1) {
      return units[seriesKeys[0]] || '';
    }
    return 'Multiple';
  };

  return (
    <>
      <div
        className={`h-full rounded-lg p-4 shadow-sm ${
          theme === 'dark' ? 'bg-[#162345]' : 'bg-white border border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {getChartTitle()} {getChartUnit() && `(${getChartUnit()})`}
            </h3>
            <Info
              size={18}
              className={`cursor-pointer ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
              onClick={() => {}}
            />
          </div>
          <div
            className={`flex items-center gap-2 border px-3 py-1.5 rounded-lg cursor-pointer ${
              theme === 'dark'
                ? 'border-gray-600 text-gray-400 hover:text-white'
                : 'border-gray-300 text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setModalOpen(true)}
          >
            <ExternalLink size={16} />
            <MoreHorizontal size={16} />
          </div>
        </div>

        {seriesKeys.length > 1 && (
          <div className="mb-3 flex flex-wrap gap-3">
            {seriesKeys.map((key, index) => (
              <div key={key} className="flex items-center gap-2">
                <div
                  className="w-4 h-1 rounded"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                ></div>
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {key}
                </span>
              </div>
            ))}
          </div>
        )}

        {renderChart(240, false)}
      </div>

      {modalOpen && (
        <ChartModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={getChartTitle()}
          chart={renderChart(600, true)}
        />
      )}
    </>
  );
};

export default CustomLineChart;
