# Widget System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Widget Architecture](#widget-architecture)
3. [Data Loading Flow](#data-loading-flow)
4. [OFR Widget Example](#ofr-widget-example)
5. [Creating New Widgets](#creating-new-widgets)
6. [Troubleshooting](#troubleshooting)

---

## System Overview

The widget system is a **dynamic, configuration-driven dashboard engine** that allows non-technical users to:
- Create custom widgets by selecting data properties
- Arrange widgets on a grid-based dashboard
- View data at device or hierarchy levels (regions, areas, fields, wells)
- Automatically refresh data every 5 seconds

### Key Components

1. **Backend (Node.js/Express)**
   - Widget configuration storage (PostgreSQL)
   - Dynamic data fetching by widget type
   - Hierarchy-aware data aggregation
   - Real-time data streaming

2. **Frontend (React/TypeScript)**
   - Dynamic widget rendering
   - Grid layout management
   - Theme support (light/dark)
   - Responsive design

3. **Database (PostgreSQL)**
   - Widget definitions and layouts
   - Device data and aggregations
   - Hierarchy structure
   - User dashboards

---

## Widget Architecture

### Database Tables

```
┌─────────────────────────────────────────────────────────────┐
│ Widget System Database Schema                               │
└─────────────────────────────────────────────────────────────┘

widget_types
├── id (UUID, PK)
├── name (kpi, line_chart, donut_chart, etc.)
├── component_name (React component name)
├── default_config (JSON)
└── created_at

widget_definitions
├── id (UUID, PK)
├── name (OFR Chart, WFR Chart, etc.)
├── widget_type_id (FK → widget_types)
├── data_source_config (JSON - defines what data to fetch)
├── created_by (User ID)
└── created_at

dashboards
├── id (UUID, PK)
├── name (Production Dashboard)
├── created_by (User ID)
├── grid_config (JSON - 12 column grid)
└── is_active (boolean)

dashboard_layouts
├── id (UUID, PK)
├── dashboard_id (FK → dashboards)
├── widget_definition_id (FK → widget_definitions)
├── layout_config (JSON - x, y, w, h, minW, minH)
├── display_order (1, 2, 3...)
└── updated_at
```

### Data Source Configuration

Each widget has a `data_source_config` that defines:

#### For KPI Cards (MetricsCard)
```json
{
  "metric": "ofr|wfr|gfr|last_refresh",
  "title": "Oil Flow Rate",
  "unit": "l/min",
  "icon": "/oildark.png",
  "colorDark": "#4D3DF7",
  "colorLight": "#F56C44"
}
```

#### For Line Charts (CustomLineChart)
```json
{
  "deviceTypeId": 1,
  "numberOfSeries": 2,
  "seriesConfig": [
    {
      "propertyId": 5,
      "propertyName": "Oil Flow Rate",
      "displayName": "OFR",
      "dataSourceProperty": "ofr",
      "unit": "l/min",
      "dataType": "numeric"
    },
    {
      "propertyId": 6,
      "propertyName": "Water Flow Rate",
      "displayName": "WFR",
      "dataSourceProperty": "wfr",
      "unit": "l/min",
      "dataType": "numeric"
    }
  ]
}
```

---

## Data Loading Flow

### Current Architecture (BEFORE FIX)

```
┌──────────────────────────────────────────────────────────────┐
│ User selects Hierarchy (e.g., "Region A")                    │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ DashboardContent useEffect triggers                          │
│ - loadHierarchyMetricsData(hierarchyId)                      │
│ - loadHierarchyFlowRateData(hierarchyId)                     │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ Backend API calls                                             │
│ - GET /api/charts/hierarchy/:hierarchyId?timeRange=day       │
│ - GET /api/charts/hierarchy/:hierarchyId?timeRange=week      │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ Backend aggregates data from all devices in hierarchy        │
│ Returns: totalOfr, totalWfr, totalGfr, totalGvf, totalWlr   │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ Frontend receives hierarchyChartData                          │
│ Stores in state: metricsHierarchyChartData                    │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ All widgets receive SAME hierarchyChartData prop             │
│ ⚠️ PROBLEM: All widgets show identical data!                 │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ Widget Rendering                                              │
│ - MetricsCard: Shows totalOfr, totalWfr, totalGfr            │
│ - OFRChart: Shows totalOfr line                              │
│ - CustomLineChart: Shows data from /widget-data endpoint     │
└──────────────────────────────────────────────────────────────┘
```

### Fixed Architecture (AFTER FIX)

```
┌──────────────────────────────────────────────────────────────┐
│ User selects Hierarchy (e.g., "Region A")                    │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ DashboardContent useEffect triggers                          │
│ - Loads dashboard widgets config                             │
│ - Loads metrics data for display (OFR/WFR/GFR cards)         │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ WidgetRenderer renders each widget with props                │
│ - selectedHierarchy: { id, name }                            │
│ - selectedDevice: { id, serial_number }                      │
│ - chartData (for quick KPI display)                          │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ CustomLineChart receives hierarchy context                   │
│ - useEffect watches [widgetId, selectedHierarchy, timeRange]│
│ - Calls: GET /api/widgets/widget-data/:widgetId             │
│          ?hierarchyId=X&timeRange=24h                        │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ Backend processes widget-specific data fetch                 │
│ - Reads widget config (series, properties, etc.)             │
│ - If hierarchyId provided:                                   │
│   • Find all devices in hierarchy recursively                │
│   • Fetch data only from those devices                       │
│ - If deviceId provided:                                      │
│   • Fetch data from single device                            │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ CustomLineChart renders chart with fetched data              │
│ Each widget shows ITS OWN data based on configuration        │
│ ✅ FIXED: All widgets show correct hierarchy-filtered data   │
└──────────────────────────────────────────────────────────────┘
```

---

## OFR Widget Example

### Step 1: Widget Definition (Database)

**Widget Type:**
```json
{
  "id": "uuid-1",
  "name": "line_chart",
  "component_name": "CustomLineChart",
  "default_config": {}
}
```

**Widget Definition:**
```json
{
  "id": "widget-ofr-1",
  "name": "OFR Chart",
  "widget_type_id": "uuid-1",
  "data_source_config": {
    "deviceTypeId": 1,
    "numberOfSeries": 1,
    "seriesConfig": [
      {
        "propertyId": 5,
        "propertyName": "Oil Flow Rate",
        "displayName": "OFR",
        "dataSourceProperty": "ofr",
        "unit": "l/min",
        "dataType": "numeric"
      }
    ]
  }
}
```

### Step 2: Dashboard Layout (Database)

```json
{
  "id": "layout-1",
  "dashboard_id": "dash-1",
  "widget_definition_id": "widget-ofr-1",
  "layout_config": {
    "x": 0,
    "y": 4,
    "w": 4,
    "h": 2,
    "minW": 3,
    "minH": 2
  },
  "display_order": 5
}
```

### Step 3: Frontend Initialization

```typescript
// DashboardContent.tsx
useEffect(() => {
  // Loads widget config from backend
  const widgetsResponse = await apiService.getDashboardWidgets(dashboardId, token);
  setWidgets(widgetsResponse.data.widgets);
}, [token]);

// Output includes:
// {
//   layoutId: "layout-1",
//   widgetId: "widget-ofr-1",
//   name: "OFR Chart",
//   component: "CustomLineChart",
//   layoutConfig: { x: 0, y: 4, w: 4, h: 2, ... },
//   dataSourceConfig: { seriesConfig: [...] }
// }
```

### Step 4: Widget Rendering with Hierarchy

```typescript
// WidgetRenderer renders the CustomLineChart component
<CustomLineChart
  widgetConfig={widget}
  timeRange={timeRange}
  selectedHierarchy={selectedHierarchy}  // 🔧 NEW: Pass hierarchy
  selectedDevice={selectedDevice}        // 🔧 NEW: Pass device
/>
```

### Step 5: Data Fetching with Hierarchy Context

```typescript
// CustomLineChart.tsx - UPDATED
useEffect(() => {
  loadWidgetData();
  // 🔧 FIXED: Added selectedHierarchy and selectedDevice to dependencies
}, [widgetConfig.widgetId, timeRange, selectedHierarchy, selectedDevice]);

const loadWidgetData = async () => {
  const timeRangeMap = { '1day': '24h', '7days': '7d', '1month': '30d' };

  // 🔧 NEW: Build query params with hierarchy context
  const params = new URLSearchParams({
    timeRange: timeRangeMap[timeRange],
    limit: '200'
  });

  if (selectedHierarchy?.id) {
    params.append('hierarchyId', selectedHierarchy.id);
  } else if (selectedDevice?.id) {
    params.append('deviceId', selectedDevice.id);
  }

  const response = await fetch(
    `http://localhost:5000/api/widgets/widget-data/${widgetConfig.widgetId}?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const result = await response.json();
  // Widget displays data specific to selected hierarchy
};
```

### Step 6: Backend Data Aggregation

```javascript
// Backend: GET /api/widgets/widget-data/:widgetId?hierarchyId=X&timeRange=24h

const hierarchyId = req.query.hierarchyId;
const deviceId = req.query.deviceId;

let deviceFilter = '';

if (hierarchyId) {
  // 🔧 NEW: Recursive CTE to find all devices under hierarchy
  deviceFilter = `
    WITH RECURSIVE hierarchy_tree AS (
      SELECT id FROM hierarchy WHERE id = $1
      UNION ALL
      SELECT h.id FROM hierarchy h
      JOIN hierarchy_tree ht ON h.parent_id = ht.id
    )
    AND d.hierarchy_id IN (SELECT id FROM hierarchy_tree)
  `;
} else if (deviceId) {
  deviceFilter = `AND d.id = $1`;
}

// Query aggregates data from all matching devices
const seriesQuery = `
  SELECT
    dd.created_at as timestamp,
    dd.serial_number,
    COALESCE((dd.data->>$2)::numeric, 0) as value
  FROM device_data dd
  INNER JOIN device d ON dd.device_id = d.id
  WHERE d.company_id = $3
    AND d.device_type_id = $4
    ${deviceFilter}
    AND dd.created_at >= NOW() - INTERVAL '24 hours'
    AND dd.data ? $2
  ORDER BY dd.created_at ASC
  LIMIT 200
`;
```

### Step 7: Chart Display

```
When user selects "Region A":
├─ Backend finds all devices under Region A (recursively)
├─ Queries device_data for OFR values from all devices
├─ Returns aggregated time series
└─ CustomLineChart displays line showing OFR trend for Region A

When user selects a specific Device:
├─ Backend filters to just that device
├─ Queries device_data for OFR values from that device
├─ Returns device-level time series
└─ CustomLineChart displays line showing device OFR values
```

---

## Creating New Widgets

### Example: Creating a "Pressure Chart" Widget

#### Step 1: Create Widget Definition (Admin UI / Backend)

```javascript
// POST /api/widgets/create-widget
const response = await fetch('http://localhost:5000/api/widgets/create-widget', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    deviceTypeId: 1,      // MPFM type
    widgetTypeId: 'uuid-2', // line_chart type
    propertyIds: [7],     // Pressure property
    displayName: 'Pressure Chart'
  })
});
```

#### Step 2: Backend Creates Widget Config

```json
{
  "deviceTypeId": 1,
  "numberOfSeries": 1,
  "seriesConfig": [
    {
      "propertyId": 7,
      "propertyName": "Pressure",
      "displayName": "Pressure",
      "dataSourceProperty": "pressure",
      "unit": "bar",
      "dataType": "numeric"
    }
  ]
}
```

#### Step 3: Widget Auto-Added to Dashboard

The backend automatically:
- Creates widget_definition
- Creates dashboard_layout entry
- Sets displayOrder to next available
- Returns layout_id and widget_id

#### Step 4: Frontend Fetches Updated Dashboard

```typescript
// User clicks "Add Widget"
await loadDashboardWidgets(); // Refetches all widgets
// Pressure Chart now appears on dashboard!
```

---

## Troubleshooting

### Issue: All Widgets Show Identical Data

**Cause:** Widgets are receiving shared state instead of hierarchy-filtered data

**Solution:**
1. Check that CustomLineChart has `selectedHierarchy` in useEffect dependencies
2. Verify backend widget-data endpoint receives `hierarchyId` query parameter
3. Check browser DevTools Network tab - widget-data requests should include `?hierarchyId=X`

### Issue: Switching Hierarchies Doesn't Update Widgets

**Cause:** Missing dependency in useEffect

**Solution:**
1. Ensure `selectedHierarchy` is in CustomLineChart's useEffect dependency array
2. Check that DashboardContent passes updated `selectedHierarchy` prop to WidgetRenderer
3. Verify auto-refresh timer includes hierarchy context in data fetch

### Issue: Widget Shows "No Data Available"

**Causes:**
- Selected hierarchy has no devices
- No device_data records for selected time range
- Backend filter incorrectly excluding devices

**Debug Steps:**
1. Check backend logs for SQL errors
2. Verify device_hierarchy relationships in database
3. Test directly: `SELECT COUNT(*) FROM device WHERE hierarchy_id = ?`
4. Check device_data table has recent records

### Issue: Chart Renders But Data Looks Wrong

**Cause:** Multiple series being combined incorrectly

**Solution:**
1. Check seriesConfig has correct propertyNames
2. Verify dataSourceProperty values match device_data JSON keys
3. Inspect backend response in DevTools Network tab
4. Check data formatting in CustomLineChart.tsx formatChartData()

---

## Performance Optimization

### Database Indexes

Ensure these indexes exist for fast queries:

```sql
CREATE INDEX idx_device_hierarchy_id ON device(hierarchy_id);
CREATE INDEX idx_device_company_id ON device(company_id);
CREATE INDEX idx_device_data_created_at ON device_data(created_at DESC);
CREATE INDEX idx_device_data_device_id ON device_data(device_id);
CREATE INDEX idx_hierarchy_parent_id ON hierarchy(parent_id);
```

### Caching Strategy

- Metrics data: Cache for 1 second (updates every 5 seconds)
- Chart data: Cache for 5 seconds
- Widget config: Cache indefinitely (invalidate on admin changes)

### Query Optimization

- Use recursive CTE for hierarchy queries (already implemented)
- Aggregate device_data at database level, not in application
- Limit query results to last 24 hours by default
- Use LIMIT 200 for chart data to avoid memory issues

---

## Summary

The widget system is a powerful, extensible framework that:

1. **Stores** widget configurations in database (not hardcoded)
2. **Renders** widgets dynamically based on configuration
3. **Fetches** data based on selected hierarchy or device
4. **Aggregates** data from multiple devices under a hierarchy
5. **Refreshes** automatically every 5 seconds
6. **Supports** multiple widget types (KPI, Line Chart, Donut Chart, Map)

The key principle: **Each widget fetches its own data** based on the current hierarchy/device selection, rather than relying on shared state from the parent component.
