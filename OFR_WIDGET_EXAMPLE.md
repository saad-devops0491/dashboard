# OFR Widget Complete Lifecycle Example

This document provides a detailed walkthrough of how the OFR (Oil Flow Rate) widget works in the fixed system, from creation to real-time data display.

---

## 1. Widget Creation & Database Setup

### Admin creates OFR Chart Widget

```bash
POST /api/widgets/create-widget
Content-Type: application/json
Authorization: Bearer {admin-token}

{
  "deviceTypeId": 1,          // MPFM device type
  "widgetTypeId": "uuid-2",   // line_chart type
  "propertyIds": [5],         // OFR property ID
  "displayName": "OFR Production Chart"
}
```

### Backend Response

```json
{
  "success": true,
  "data": {
    "widgetId": "550e8400-e29b-41d4-a716-446655440000",
    "widgetName": "OFR Production Chart",
    "dataSourceConfig": {
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
}
```

### Database Tables After Creation

**widget_types:**
```
id           | name        | component_name      | default_config
-------------|-------------|---------------------|----------------
uuid-2       | line_chart  | CustomLineChart     | {}
```

**widget_definitions:**
```
id           | name                    | widget_type_id | data_source_config
-------------|------------------------|----------------|--------------------
550e8400...  | OFR Production Chart    | uuid-2         | {
             |                        |                | "deviceTypeId": 1,
             |                        |                | "numberOfSeries": 1,
             |                        |                | "seriesConfig": [{
             |                        |                |   "propertyId": 5,
             |                        |                |   "displayName": "OFR",
             |                        |                |   "dataSourceProperty": "ofr"
             |                        |                | }]
             |                        |                | }
```

**dashboard_layouts:**
```
id     | dashboard_id | widget_definition_id | layout_config  | display_order
-------|--------------|----------------------|----------------|---------------
123    | dash-1       | 550e8400...          | {x:0, y:4,     | 5
       |              |                      |  w:4, h:2}     |
```

---

## 2. Frontend Initialization

### User Logs In & Dashboard Loads

```typescript
// App.tsx or DashboardLayout.tsx
const DashboardContainer = () => {
  const [selectedHierarchy, setSelectedHierarchy] = useState(null);

  // When user selects "Region A"
  const handleHierarchySelect = (hierarchyNode: HierarchyNode) => {
    setSelectedHierarchy({
      id: 5,
      name: "Region A",
      level: "region"
    });
  };

  return (
    <DashboardContent
      selectedHierarchy={selectedHierarchy}
      // ... other props
    />
  );
};
```

### DashboardContent Component

```typescript
// DashboardContent.tsx
const DashboardContent: React.FC<DashboardContentProps> = ({
  selectedHierarchy,
  // ... other props
}) => {
  useEffect(() => {
    // Step 1: Load dashboard widgets configuration
    const loadDashboardWidgets = async () => {
      const dashboardsResponse = await apiService.getDashboards(token);
      const firstDashboard = dashboardsResponse.data[0];

      const widgetsResponse = await apiService.getDashboardWidgets(
        firstDashboard.id,
        token
      );

      setWidgets(widgetsResponse.data.widgets);
      // ✅ Widgets array now includes OFR chart widget config
    };

    loadDashboardWidgets();
  }, [token]);

  useEffect(() => {
    // Step 2: Load hierarchy metrics data
    if (selectedHierarchy) {
      console.log('[DASHBOARD] Loading metrics for hierarchy: Region A');

      loadHierarchyMetricsData(selectedHierarchy.id);
      // Calls: GET /api/charts/hierarchy/5?timeRange=day
      // Returns: totalOfr, totalWfr, totalGfr (for KPI cards)
    }
  }, [selectedHierarchy, token]);

  useEffect(() => {
    // Step 3: Load flow rate data (for KPI cards display)
    if (selectedHierarchy) {
      console.log('[DASHBOARD] Loading flow rate data for hierarchy: Region A');

      loadHierarchyFlowRateData(selectedHierarchy.id);
      // Calls: GET /api/charts/hierarchy/5?timeRange={timeRange}
    }
  }, [selectedHierarchy, timeRange, token]);

  // Step 4: Render dashboard with widgets
  return (
    <DynamicDashboard
      dashboardId={dashboardConfig.id}
      widgets={widgets}
    >
      {(widget) => (
        <WidgetRenderer
          widget={widget}
          selectedHierarchy={selectedHierarchy} // ✅ Pass context
          chartData={flowRateChartData}
          hierarchyChartData={flowRateHierarchyChartData}
          timeRange={timeRange}
          lastRefresh={lastRefresh}
        />
      )}
    </DynamicDashboard>
  );
};
```

**Console Output at This Stage:**
```
[DASHBOARD] ✓ Loaded 10 widgets
[DASHBOARD] Loading metrics for hierarchy: Region A
[DASHBOARD] Loading flow rate data for hierarchy: Region A
Widgets loaded:
  1. OFR Metric (KPI card)
  2. WFR Metric (KPI card)
  3. GFR Metric (KPI card)
  4. Last Refresh (KPI card)
  5. OFR Chart ← Our widget!
  6. WFR Chart
  7. GFR Chart
  8. Fractions Chart
  9. GVF/WLR Donut
  10. Production Map
```

---

## 3. Widget Rendering

### WidgetRenderer Processes OFR Chart Widget

```typescript
// WidgetRenderer.tsx
const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  widget,        // OFR Chart widget config from database
  selectedHierarchy,  // { id: 5, name: "Region A" }
  // ... other props
}) => {
  // widget =
  // {
  //   layoutId: "layout-123",
  //   widgetId: "550e8400...",
  //   name: "OFR Production Chart",
  //   component: "CustomLineChart",
  //   layoutConfig: { x: 0, y: 4, w: 4, h: 2, ... },
  //   dataSourceConfig: {
  //     deviceTypeId: 1,
  //     seriesConfig: [{
  //       displayName: "OFR",
  //       dataSourceProperty: "ofr",
  //       unit: "l/min"
  //     }]
  //   }
  // }

  switch (widget.component) {
    case 'CustomLineChart':
      return (
        <CustomLineChart
          widgetConfig={widget}
          timeRange={timeRange}
          selectedHierarchy={selectedHierarchy} // ✅ KEY: Pass context
          selectedDevice={selectedDevice}
        />
      );
  }
};
```

---

## 4. CustomLineChart Fetches Data

### useEffect Triggers Data Loading

```typescript
// CustomLineChart.tsx
const CustomLineChart: React.FC<CustomLineChartProps> = ({
  widgetConfig,        // OFR widget config
  timeRange = '1day',
  selectedHierarchy = { id: 5, name: "Region A" }, // ✅ Received from parent
  selectedDevice = null
}) => {
  const { token } = useAuth();

  // ✅ CRITICAL: Watch selectedHierarchy changes
  useEffect(() => {
    loadWidgetData();
  }, [
    widgetConfig.widgetId,
    timeRange,
    selectedHierarchy,  // ✅ When hierarchy changes, re-fetch!
    selectedDevice
  ]);

  const loadWidgetData = async () => {
    console.log('[CUSTOM LINE CHART] Fetching widget data for hierarchy: Region A');

    const timeRangeMap = {
      '1day': '24h',
      '7days': '7d',
      '1month': '30d'
    };

    // Build query params
    const params = new URLSearchParams({
      timeRange: timeRangeMap[timeRange],
      limit: '200'
    });

    // ✅ KEY: Add hierarchy to query params
    if (selectedHierarchy?.id) {
      params.append('hierarchyId', selectedHierarchy.id);
      console.log(`[CUSTOM LINE CHART] Added hierarchyId=${selectedHierarchy.id} to request`);
    }

    // Fetch widget data
    const response = await fetch(
      `http://localhost:5000/api/widgets/widget-data/${widgetConfig.widgetId}?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    // Request: GET /api/widgets/widget-data/550e8400...?hierarchyId=5&timeRange=24h&limit=200

    const result = await response.json();
    console.log('[CUSTOM LINE CHART] Response received:', result);

    if (result.success) {
      const formattedData = formatChartData(result.data);
      setChartData(formattedData.data);
      setSeriesKeys(formattedData.keys);
    }
  };
};
```

**Console Output:**
```
[CUSTOM LINE CHART] Fetching widget data for hierarchy: Region A
[CUSTOM LINE CHART] Added hierarchyId=5 to request
[CUSTOM LINE CHART] Response received: {
  success: true,
  data: {
    "OFR": {
      data: [
        { timestamp: 1704067200000, serialNumber: "DEV001", value: 95.2 },
        { timestamp: 1704067260000, serialNumber: "DEV002", value: 101.8 },
        { timestamp: 1704067320000, serialNumber: "DEV003", value: 87.3 },
        ...42 total points
      ],
      unit: "l/min"
    }
  },
  context: { hierarchyId: 5, timeRange: "24h" }
}
```

---

## 5. Backend Processing

### Backend Receives Request

```bash
GET /api/widgets/widget-data/550e8400-e29b-41d4-a716-446655440000?
    hierarchyId=5&timeRange=24h&limit=200

Headers:
  Authorization: Bearer {token}
```

### Backend Route Handler

```javascript
// widgets.js - GET /api/widgets/widget-data/:widgetId
router.get('/widget-data/:widgetId', protect, async (req, res) => {
  const { widgetId } = req.params;
  const { hierarchyId, deviceId, timeRange = '24h', limit = 200 } = req.query;

  console.log(`[WIDGET DATA] Fetching data for widget ${widgetId}`);
  console.log(`[WIDGET DATA] hierarchyId: ${hierarchyId}, timeRange: ${timeRange}`);

  // Step 1: Load widget configuration
  const widgetResult = await database.query(
    `SELECT wd.data_source_config, wt.component_name
     FROM widget_definitions wd
     INNER JOIN widget_types wt ON wd.widget_type_id = wt.id
     WHERE wd.id = $1`,
    [widgetId]
  );

  const widget = widgetResult.rows[0];
  // dataSourceConfig = {
  //   deviceTypeId: 1,
  //   seriesConfig: [{
  //     displayName: "OFR",
  //     dataSourceProperty: "ofr",
  //     unit: "l/min"
  //   }]
  // }

  console.log('[WIDGET DATA] Widget config loaded:', widget.data_source_config);

  // Step 2: Build hierarchy filter
  let deviceFilterWhere = '';
  const queryParams = [req.user.company_id, 1, parseInt(limit)];

  if (hierarchyId) {
    console.log(`[WIDGET DATA] Applying hierarchy filter: ${hierarchyId}`);

    // Recursive CTE: Find all devices under this hierarchy
    deviceFilterJoin = `
      WITH RECURSIVE hierarchy_tree AS (
        SELECT id FROM hierarchy WHERE id = $4
        UNION ALL
        SELECT h.id FROM hierarchy h
        JOIN hierarchy_tree ht ON h.parent_id = ht.id
      )
    `;

    deviceFilterWhere = `AND d.hierarchy_id IN (SELECT id FROM hierarchy_tree)`;
    queryParams.push(parseInt(hierarchyId));

    console.log('[WIDGET DATA] Recursive CTE will find all devices under hierarchy 5');
  }

  // Step 3: For each series (property) in the widget, fetch data
  for (const s of widget.data_source_config.seriesConfig) {
    console.log(`[WIDGET DATA] Loading series: ${s.displayName}, property: ${s.dataSourceProperty}`);

    // Build query for OFR data
    const seriesQuery = `
      ${deviceFilterJoin}
      SELECT
        dd.created_at as timestamp,
        dd.serial_number,
        COALESCE((dd.data->>'ofr')::numeric, 0) as value
      FROM device_data dd
      INNER JOIN device d ON dd.device_id = d.id
      WHERE d.company_id = $1
        AND d.device_type_id = $2
        ${deviceFilterWhere}
        AND dd.created_at >= NOW() - INTERVAL '24 hours'
        AND dd.data ? 'ofr'
      ORDER BY dd.created_at ASC
      LIMIT $3
    `;

    console.log('[WIDGET DATA] Executing query:', seriesQuery.substring(0, 100) + '...');

    const seriesResult = await database.query(seriesQuery, [
      s.dataSourceProperty,
      ...queryParams
    ]);

    console.log(`[WIDGET DATA] Series OFR returned ${seriesResult.rows.length} data points`);

    // Example results:
    // [
    //   { created_at: 2024-01-01 10:00:00, serial_number: 'DEV001', value: 95.2 },
    //   { created_at: 2024-01-01 10:01:00, serial_number: 'DEV002', value: 101.8 },
    //   ...
    // ]

    seriesData['OFR'] = {
      data: seriesResult.rows.map(row => ({
        timestamp: row.created_at,
        serialNumber: row.serial_number,
        value: row.value
      })),
      unit: 'l/min',
      propertyName: 'Oil Flow Rate'
    };
  }

  // Step 4: Return formatted response
  res.json({
    success: true,
    data: {
      'OFR': {
        data: [
          { timestamp: 1704067200000, serialNumber: 'DEV001', value: 95.2 },
          { timestamp: 1704067260000, serialNumber: 'DEV002', value: 101.8 },
          ...42 data points total
        ],
        unit: 'l/min',
        propertyName: 'Oil Flow Rate'
      }
    },
    context: { hierarchyId: 5, timeRange: '24h' }
  });
});
```

**Backend Console Output:**
```
[WIDGET DATA] Fetching data for widget 550e8400-e29b-41d4-a716-446655440000
[WIDGET DATA] hierarchyId: 5, timeRange: 24h
[WIDGET DATA] Widget config loaded: {...}
[WIDGET DATA] Applying hierarchy filter: 5
[WIDGET DATA] Recursive CTE will find all devices under hierarchy 5
[WIDGET DATA] Loading series: OFR, property: ofr
[WIDGET DATA] Executing query: WITH RECURSIVE hierarchy_tree AS ...
[WIDGET DATA] Series OFR returned 42 data points
[WIDGET DATA] Returning data with 1 series
```

**SQL Executed (Simplified):**
```sql
-- Find all devices under Region A (hierarchy 5)
WITH RECURSIVE hierarchy_tree AS (
  SELECT id FROM hierarchy WHERE id = 5
  UNION ALL
  SELECT h.id FROM hierarchy h
  JOIN hierarchy_tree ht ON h.parent_id = ht.id
)
-- Get OFR data from those devices in last 24 hours
SELECT
  dd.created_at,
  dd.serial_number,
  (dd.data->>'ofr')::numeric as value
FROM device_data dd
INNER JOIN device d ON dd.device_id = d.id
WHERE d.company_id = 'company-1'
  AND d.device_type_id = 1
  AND d.hierarchy_id IN (SELECT id FROM hierarchy_tree)  -- ✅ Only Region A devices
  AND dd.created_at >= NOW() - INTERVAL '24 hours'
  AND dd.data ? 'ofr'
ORDER BY dd.created_at ASC
LIMIT 200;
```

**Example Results from Database:**
```
created_at          | serial_number | value
--------------------|---------------|--------
2024-01-01 10:00:00 | MPFM-001     | 95.2
2024-01-01 10:01:00 | MPFM-002     | 101.8
2024-01-01 10:02:00 | MPFM-003     | 87.3
2024-01-01 10:03:00 | MPFM-001     | 96.5
2024-01-01 10:04:00 | MPFM-002     | 99.1
...42 total rows
```

---

## 6. Frontend Chart Rendering

### Data Formatting

```typescript
// CustomLineChart.tsx
const formatChartData = (seriesData) => {
  const dataMap = {};
  const keys = [];
  const units = {};

  // Input: seriesData['OFR'] = { data: [...], unit: 'l/min' }
  Object.entries(seriesData).forEach(([seriesName, series]) => {
    keys.push(seriesName); // keys = ['OFR']
    units[seriesName] = series.unit; // units = { OFR: 'l/min' }

    series.data.forEach((point) => {
      const timestamp = new Date(point.timestamp).getTime();
      if (!dataMap[timestamp]) {
        dataMap[timestamp] = { timestamp };
      }
      dataMap[timestamp]['OFR'] = point.value;
    });
  });

  return {
    data: [
      { timestamp: 1704067200000, OFR: 95.2 },
      { timestamp: 1704067260000, OFR: 101.8 },
      { timestamp: 1704067320000, OFR: 87.3 },
      ...
    ],
    keys: ['OFR'],
    units: { OFR: 'l/min' }
  };
};

setChartData(formattedData.data);
setSeriesKeys(formattedData.keys);
setUnits(formattedData.units);
```

### Chart Rendering

```typescript
// CustomLineChart.tsx - renderChart()
<ResponsiveContainer width="100%" height={240}>
  <LineChart data={chartData}>
    <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
    <XAxis
      dataKey="timestamp"
      type="number"
      scale="time"
      tickFormatter={(v) => new Date(v).toLocaleTimeString()}
    />
    <YAxis domain={[0, 110]} />
    <Tooltip />
    <Line
      type="monotone"
      dataKey="OFR"
      stroke="#EC4899"
      strokeWidth={2}
      dot={false}
    />
  </LineChart>
</ResponsiveContainer>
```

---

## 7. User Sees Chart

### Display Output

The OFR Production Chart now displays:
- **Title:** "OFR Production Chart"
- **Y-Axis:** 0 to 110 l/min
- **X-Axis:** Time (10:00, 10:05, 10:10, ..., 10:45)
- **Line:** Pink line showing OFR values from all Region A devices
- **Legend:** "OFR" with unit "l/min"
- **Last Value:** 98.7 l/min (latest in time series)

---

## 8. User Switches Hierarchy

### User Selects "Region B"

```typescript
handleHierarchySelect({
  id: 6,
  name: "Region B",
  level: "region"
});
```

### useEffect Re-triggers

```typescript
// CustomLineChart.tsx
useEffect(() => {
  loadWidgetData(); // Re-fetches because selectedHierarchy changed!
}, [
  widgetConfig.widgetId,
  timeRange,
  selectedHierarchy, // ✅ Changed from Region A to Region B
  selectedDevice
]);
```

### New API Request

```bash
GET /api/widgets/widget-data/550e8400...?hierarchyId=6&timeRange=24h&limit=200
```

### Backend Returns Different Data

- Region B has different devices (MPFM-004, MPFM-005, MPFM-006)
- Different OFR values
- Different time series pattern

### Chart Updates

- Line changes to show Region B trend
- Values update to Region B device readings
- User sees Region B-specific data

**✅ FIXED: Each widget now shows correct hierarchy data!**

---

## 9. Auto-Refresh Cycle

### Every 5 Seconds

```typescript
// DashboardContent.tsx - Auto-refresh timer
setInterval(() => {
  console.log('[DASHBOARD] Auto-refresh triggered');

  if (selectedHierarchy) {
    // Re-fetch the same data for current hierarchy
    loadHierarchyMetricsData(selectedHierarchy.id);
    loadHierarchyFlowRateData(selectedHierarchy.id);
  }
}, 5000);
```

### CustomLineChart Auto-Refresh

Since the data fetch happens in `useEffect` and the interval keeps the hierarchy context, the widget automatically re-fetches with the same `hierarchyId` every 5 seconds.

The backend recursive CTE ensures it always fetches from the currently selected hierarchy's devices, maintaining data consistency.

---

## Complete Request/Response Flow

### User Action: Select Region A

```
┌─────────────────────────────────┐
│ User clicks "Region A"          │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│ setSelectedHierarchy(5)         │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────────┐
│ GET /api/charts/hierarchy/5?timeRange=day                   │
│ → Returns: totalOfr, totalWfr, totalGfr                     │
│ → For KPI cards display                                      │
└─────────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────────┐
│ DashboardContent renders WidgetRenderer for each widget     │
│ Passes: selectedHierarchy = { id: 5, name: "Region A" }     │
└─────────────────────────────────────────────────────────────┘
           ↓
┌──────────────────────────────────────────────────────────────┐
│ CustomLineChart receives hierarchy context in props          │
│ useEffect detects selectedHierarchy change                  │
│ Calls loadWidgetData()                                       │
└──────────────────────────────────────────────────────────────┘
           ↓
┌───────────────────────────────────────────────────────────────────────┐
│ GET /api/widgets/widget-data/550e8400...?hierarchyId=5&timeRange=24h │
└───────────────────────────────────────────────────────────────────────┘
           ↓
┌──────────────────────────────────────────────────────────────┐
│ Backend:                                                      │
│ 1. Load widget config (OFR series definition)                │
│ 2. Build recursive CTE: Find all devices in hierarchy 5      │
│ 3. Query device_data WHERE hierarchy_id IN (CTE results)     │
│ 4. Aggregate/filter OFR values from those devices            │
│ 5. Return { "OFR": { data: [...], unit: "l/min" } }         │
└──────────────────────────────────────────────────────────────┘
           ↓
┌──────────────────────────────────────────────────────────────┐
│ Frontend receives response with Region A OFR data            │
│ Formats data for Recharts LineChart                          │
│ Re-renders chart with new line                               │
└──────────────────────────────────────────────────────────────┘
           ↓
┌──────────────────────────────────────────────────────────────┐
│ ✅ User sees OFR chart for Region A                          │
│    - Line shows Region A device OFR trend                    │
│    - Values specific to Region A devices                     │
│    - Auto-refreshes every 5 seconds with Region A data       │
└──────────────────────────────────────────────────────────────┘
```

---

## Summary

The OFR widget now:

1. **Knows its context:** Receives `selectedHierarchy` as a prop
2. **Passes context to API:** Includes `?hierarchyId=5` in request
3. **Backend filters data:** Uses recursive CTE to find all devices under hierarchy
4. **Returns specific data:** Only OFR values from Region A devices
5. **Displays correctly:** Chart shows Region A trend, not all company data
6. **Auto-refreshes:** Every 5 seconds, fetches fresh data for same hierarchy
7. **Responds to changes:** When user switches hierarchy, widget re-fetches new data

**Result:** ✅ Each widget displays the correct data for the selected hierarchy!
