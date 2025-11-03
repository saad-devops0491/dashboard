import React, { useState, useEffect, useMemo, useRef } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import 'react-grid-layout/css/styles.css';

interface WidgetConfig {
  layoutId: string;
  widgetId: string;
  name: string;
  description: string;
  type: string;
  component: string;
  layoutConfig: {
    x: number;
    y: number;
    w: number;
    h: number;
    minW: number;
    minH: number;
    static: boolean;
  };
  dataSourceConfig: any;
  instanceConfig: any;
  defaultConfig: any;
  displayOrder: number;
}

interface DynamicDashboardProps {
  dashboardId: string;
  widgets: WidgetConfig[];
  onLayoutChange?: (layouts: Layout[]) => void;
  isEditable?: boolean;
  children: (widget: WidgetConfig) => React.ReactNode;
}

const DynamicDashboard: React.FC<DynamicDashboardProps> = ({
  dashboardId,
  widgets,
  onLayoutChange,
  isEditable = false,
  children,
}) => {
  const { theme } = useTheme();
  const { token } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track container width for responsive grid
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);

    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateWidth);
      resizeObserver.disconnect();
    };
  }, []);

  // Convert widget configs to react-grid-layout format
  const layouts = useMemo(() => {
    return widgets.map((widget) => ({
      i: widget.layoutId,
      x: widget.layoutConfig?.x ?? 0,
      y: widget.layoutConfig?.y ?? 0,
      w: widget.layoutConfig?.w ?? 4,
      h: widget.layoutConfig?.h ?? 2,
      minW: widget.layoutConfig?.minW ?? 2,
      minH: widget.layoutConfig?.minH ?? 1,
      static: isEditable ? false : (widget.layoutConfig?.static ?? false),
    }));
  }, [widgets, isEditable]);

  console.log('[GRID] Rendering', widgets.length, 'widgets in', layouts.length, 'positions');

  const handleLayoutChange = async (newLayout: Layout[]) => {
    if (!isEditable) return;

    console.log('[DYNAMIC DASHBOARD] Layout changed:', newLayout);

    // Call parent callback if provided
    if (onLayoutChange) {
      onLayoutChange(newLayout);
    }

    // Auto-save to database
    if (token) {
      try {
        setIsSaving(true);

        const layoutUpdates = newLayout.map((layout) => ({
          layoutId: layout.i,
          layoutConfig: {
            x: layout.x,
            y: layout.y,
            w: layout.w,
            h: layout.h,
            minW: layout.minW ?? 2,
            minH: layout.minH ?? 1,
            static: layout.static ?? false,
          },
        }));

        await apiService.updateDashboardLayouts(dashboardId, layoutUpdates, token);
        console.log('[DYNAMIC DASHBOARD] Layout saved to database');
      } catch (error) {
        console.error('[DYNAMIC DASHBOARD] Failed to save layout:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Create a map of layoutId to widget for quick lookup
  const widgetMap = useMemo(() => {
    const map = new Map<string, WidgetConfig>();
    widgets.forEach((widget) => {
      map.set(widget.layoutId, widget);
    });
    return map;
  }, [widgets]);

  return (
    <div ref={containerRef} className="relative w-full">
      {isSaving && (
        <div className="absolute top-2 right-2 z-50 flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500 text-white text-sm shadow-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Saving layout...</span>
        </div>
      )}

      <GridLayout
        className="layout"
        layout={layouts}
        cols={12}
        rowHeight={80}
        width={containerWidth}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        isDraggable={isEditable}
        isResizable={isEditable}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
        compactType="vertical"
        preventCollision={false}
      >
        {layouts.map((layout) => {
          const widget = widgetMap.get(layout.i);
          if (!widget) return null;

          return (
            <div
              key={layout.i}
              className={`${
                theme === 'dark' ? 'bg-[#0B1437]' : 'bg-gray-50'
              } rounded-lg overflow-hidden`}
              style={{
                transition: 'all 0.3s ease',
              }}
            >
              {isEditable && (
                <div className="drag-handle absolute top-0 left-0 right-0 h-8 bg-blue-500 bg-opacity-20 cursor-move flex items-center justify-center z-10">
                  <div className="flex gap-1">
                    <div className="w-1 h-4 bg-blue-400 rounded"></div>
                    <div className="w-1 h-4 bg-blue-400 rounded"></div>
                    <div className="w-1 h-4 bg-blue-400 rounded"></div>
                  </div>
                </div>
              )}
              <div className={isEditable ? 'mt-8' : ''}>
                {children(widget)}
              </div>
            </div>
          );
        })}
      </GridLayout>
    </div>
  );
};

export default DynamicDashboard;
