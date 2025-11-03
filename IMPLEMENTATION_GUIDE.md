# Widget Hierarchy Filtering Implementation Guide

## Overview

This guide explains the fixes implemented to resolve the issue where **all widgets showed identical constant values regardless of selected hierarchy**. Now, each widget properly loads and displays data specific to the selected hierarchy or device.

---

## Problem Fixed

### Before (Broken)
```
User selects "Region A"
    ↓
DashboardContent loads region data
    ↓
All widgets receive SAME metricsHierarchyChartData
    ↓
❌ Result: All widgets show identical data
   - OFR widget shows: 100 l/min
   - WFR widget shows: 100 l/min
   - GFR widget shows: 100 l/min
   - CustomLineChart shows: Same identical line
```

### After (Fixed)
```
User selects "Region A"
    ↓
DashboardContent passes selectedHierarchy context
    ↓
Each widget fetches ITS OWN hierarchy-filtered data
    ↓
✅ Result: Each widget shows correct data
   - OFR widget shows: 100 l/min (from Region A devices)
   - WFR widget shows: 85 l/min (from Region A devices)
   - GFR widget shows: 45 l/min (from Region A devices)
   - CustomLineChart shows: Region A trend data
   - MetricsCards show: Region A aggregated metrics
```

---

## Changes Made

### 1. Backend Changes

#### File: `/backend/routes/widgets.js`

**What Changed:** Enhanced the `GET /api/widgets/widget-data/:widgetId` endpoint to support hierarchy and device filtering.

**Key Changes:**
- Added query parameters: `hierarchyId` and `deviceId`
- Implemented recursive CTE (Common Table Expression) to find all devices under a hierarchy
- Built dynamic SQL filters based on which context is provided

**Example Request:**
```bash
GET /api/widgets/widget-data/widget-123?hierarchyId=5&timeRange=24h
GET /api/widgets/widget-data/widget-123?deviceId=10&timeRange=24h
```

**Code Changes:**
```javascript
// Before: Only fetched from all devices of the company
const seriesQuery = `
  SELECT ... FROM device_data dd
  INNER JOIN device d ON dd.device_id = d.id
  WHERE d.company_id = $2
    AND d.device_type_id = $3
`;

// After: Filters by hierarchy or device
if (hierarchyId) {
  // Recursive CTE finds all devices under hierarchy
  deviceFilterWhere = `AND d.hierarchy_id IN (SELECT id FROM hierarchy_tree)`;
} else if (deviceId) {
  // Single device filter
  deviceFilterWhere = `AND d.id = $4`;
}

const seriesQuery = `
  ${deviceFilterJoin}
  SELECT ... FROM device_data dd
  INNER JOIN device d ON dd.device_id = d.id
  WHERE d.company_id = $1
    AND d.device_type_id = $2
    ${deviceFilterWhere}
`;
```

---

### 2. Frontend Changes

#### File: `/frontend/src/components/Dashboard/CustomLineChart.tsx`

**What Changed:** Updated to receive and use hierarchy/device context when fetching data.

**Key Changes:**
- Added props: `selectedHierarchy` and `selectedDevice`
- Added these props to the useEffect dependency array
- Pass `hierarchyId` or `deviceId` query parameters to backend API call

**Before:**
```typescript
interface CustomLineChartProps {
  widgetConfig: any;
  timeRange: '1day' | '7days' | '1month';
}

useEffect(() => {
  loadWidgetData();
}, [widgetConfig.widgetId, timeRange]); // Missing hierarchy dependency!
```

**After:**
```typescript
interface CustomLineChartProps {
  widgetConfig: any;
  timeRange: '1day' | '7days' | '1month';
  selectedHierarchy?: any | null;     // ✅ NEW
  selectedDevice?: any | null;        // ✅ NEW
}

useEffect(() => {
  loadWidgetData();
}, [widgetConfig.widgetId, timeRange, selectedHierarchy, selectedDevice]); // ✅ FIXED
```

**Data Fetching:**
```typescript
// Before: No context about which hierarchy/device
const response = await fetch(
  `http://localhost:5000/api/widgets/widget-data/${widgetConfig.widgetId}?timeRange=24h&limit=200`
);

// After: Includes hierarchy context
const params = new URLSearchParams({
  timeRange: timeRangeMap[timeRange],
  limit: '200'
});

if (selectedHierarchy?.id) {
  params.append('hierarchyId', selectedHierarchy.id); // ✅ NEW
}

const response = await fetch(
  `http://localhost:5000/api/widgets/widget-data/${widgetConfig.widgetId}?${params}`
);
```

---

#### File: `/frontend/src/components/Dashboard/WidgetRenderer.tsx`

**What Changed:** Now passes `selectedHierarchy` and `selectedDevice` props to CustomLineChart.

**Before:**
```typescript
<CustomLineChart
  widgetConfig={widget}
  timeRange={timeRange}
/>
```

**After:**
```typescript
<CustomLineChart
  widgetConfig={widget}
  timeRange={timeRange}
  selectedHierarchy={selectedHierarchy}  // ✅ NEW
  selectedDevice={selectedDevice}        // ✅ NEW
/>
```

---

#### File: `/frontend/src/components/Dashboard/DashboardContent.tsx`

**What Changed:** Improved logging and data loading context tracking.

**Key Changes:**
- Added console logs to track which hierarchy/device is being loaded
- Improved comments explaining the data flow
- Ensured auto-refresh respects hierarchy context

**Logging Added:**
```typescript
console.log(`[DASHBOARD] Loading metrics for hierarchy: ${selectedHierarchy.name}`);
console.log('[DASHBOARD] Auto-refreshing hierarchy data');
```

---

#### File: `/frontend/src/components/Dashboard/MetricsCards.tsx`

**What Changed:** Improved logging and removed hardcoded fallback values.

**Before:**
```typescript
} else {
  // sensible defaults for empty state (you can remove/change these)
  setFlowRateData({
    totalOFR: 264.93,  // ❌ Hardcoded constant!
    totalWFR: 264.93,
    totalGFR: 264.93,
    avgGVF: 65,
    avgWLR: 85,
  });
}
```

**After:**
```typescript
} else {
  console.log('[METRICS CARDS] No data available, using defaults');
  setFlowRateData({
    totalOFR: 0,   // ✅ Reset to zero when no data
    totalWFR: 0,
    totalGFR: 0,
    avgGVF: 0,
    avgWLR: 0,
  });
}
```

---

## How It Works Now

### Complete Data Flow with Fixes

```
┌─────────────────────────────────────────────────────────┐
│ 1. User selects Hierarchy (e.g., "Region A")            │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 2. DashboardLayout passes selectedHierarchy to          │
│    DashboardContent component                           │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 3. DashboardContent loads metrics data for entire       │
│    hierarchy (for KPI cards display)                    │
│    - GET /api/charts/hierarchy/5?timeRange=day          │
│    - Loads MetricsCards with aggregated data            │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 4. DashboardContent renders DynamicDashboard with all  │
│    widgets, passing:                                    │
│    - selectedHierarchy = { id: 5, name: "Region A" }    │
│    - widget configurations from database                │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 5. WidgetRenderer receives each widget config and       │
│    passes hierarchy context:                            │
│    - For MetricsCard: Uses hierarchy data from parent   │
│    - For CustomLineChart: Passes selectedHierarchy      │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 6. CustomLineChart fetches widget-specific data:        │
│    GET /api/widgets/widget-data/widget-1                │
│       ?hierarchyId=5&timeRange=24h&limit=200            │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 7. Backend processes request:                           │
│    - Reads widget config (which properties to fetch)    │
│    - Recursive CTE finds all devices under Region A     │
│    - Queries device_data only from those devices        │
│    - Aggregates or filters data based on series config  │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 8. Backend returns hierarchy-filtered data:             │
│    {                                                     │
│      "OFR": { data: [points...], unit: "l/min" },      │
│      "WFR": { data: [points...], unit: "l/min" }       │
│    }                                                     │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 9. CustomLineChart renders chart with correct data      │
│    Each widget shows data specific to Region A          │
│    ✅ Fixed: All widgets now show correct hierarchy data│
└─────────────────────────────────────────────────────────┘
```

---

## Testing the Fix

### Prerequisites
- Backend running on `http://localhost:5000`
- Frontend running (dev server or built)
- Database with hierarchy and device data

### Manual Testing Steps

#### Step 1: Verify Hierarchy Selection
```
1. Navigate to dashboard
2. Open hierarchy/device selector
3. Select a specific hierarchy (e.g., "Region A")
   - Should show dashboard header: "Region A Dashboard"
   - Console should show: "[DASHBOARD] Loading metrics for hierarchy: Region A"
```

#### Step 2: Monitor Network Requests
```
1. Open DevTools → Network tab
2. Select a hierarchy
3. Look for these API calls:
   - GET /api/charts/hierarchy/5?timeRange=day (metrics data)
   - GET /api/widgets/widget-data/widget-1?hierarchyId=5&timeRange=24h
   - GET /api/widgets/widget-data/widget-2?hierarchyId=5&timeRange=24h
   - ✅ Each request includes hierarchyId parameter
```

#### Step 3: Verify Console Logs
```
1. Open DevTools → Console tab
2. Select a hierarchy
3. Should see logs like:
   [DASHBOARD] Loading metrics for hierarchy: Region A
   [CUSTOM LINE CHART] Fetching widget data for hierarchy: Region A
   [METRICS CARDS] Using hierarchy chart data: {...}
   [WIDGET DATA] Applying hierarchy filter: 5
   [WIDGET DATA] Loading series: OFR, property: ofr, deviceTypeId: 1
   [WIDGET DATA] Series OFR returned 42 data points
```

#### Step 4: Compare Widgets
```
1. Select "Region A"
   - Note values in OFR, WFR, GFR cards
   - Note the line chart pattern
2. Select a different hierarchy (e.g., "Region B")
   - OFR, WFR, GFR cards should CHANGE
   - Line chart should show DIFFERENT trend
   - ✅ All widgets updated to reflect new hierarchy
3. Select a specific device
   - All widgets should show device-level data
   - Single device data should differ from hierarchy aggregates
```

#### Step 5: Test Auto-Refresh
```
1. Select a hierarchy
2. Wait 5 seconds (auto-refresh interval)
3. Console should show:
   [DASHBOARD] Auto-refresh triggered
   [DASHBOARD] Auto-refreshing hierarchy data
   ✅ Data updates while hierarchy is selected
```

#### Step 6: Test Time Range Switch
```
1. Select a hierarchy
2. Change time range (1 day → 7 days → 1 month)
3. Verify:
   - Widgets re-fetch with new timeRange parameter
   - Charts show longer/shorter time periods
   - ✅ Time range changes work with hierarchy context
```

---

## Debugging Guide

### Issue: Widgets Still Show Same Data

**Check:**
1. Browser console for errors
2. Network tab - ensure `hierarchyId` parameter is in requests
3. Backend logs - search for `[WIDGET DATA]` messages

**Solution:**
```bash
# Backend console should show:
[WIDGET DATA] Applying hierarchy filter: 5
[WIDGET DATA] Series OFR returned 42 data points

# If not seeing this, the hierarchyId is not being passed
# Check CustomLineChart is receiving selectedHierarchy prop
```

### Issue: CustomLineChart Shows "No Data Available"

**Check:**
1. Is the selected hierarchy empty (no devices)?
2. Do devices have data for the selected time range?
3. Backend SQL query - verify RECURSIVE CTE works

**Debug SQL:**
```sql
-- Check if devices exist under hierarchy
WITH RECURSIVE hierarchy_tree AS (
  SELECT id FROM hierarchy WHERE id = 5
  UNION ALL
  SELECT h.id FROM hierarchy h
  JOIN hierarchy_tree ht ON h.parent_id = ht.id
)
SELECT COUNT(*) FROM device WHERE hierarchy_id IN (SELECT id FROM hierarchy_tree);

-- Check if device_data exists
SELECT COUNT(*) FROM device_data
WHERE device_id IN (
  SELECT d.id FROM device d
  WHERE d.hierarchy_id IN (SELECT id FROM hierarchy_tree)
);
```

### Issue: Backend Returns 404 Widget Not Found

**Check:**
1. Widget exists in database: `SELECT * FROM widget_definitions WHERE id = 'widget-id';`
2. Widget has proper data_source_config with seriesConfig
3. Widget is associated with dashboard layout

---

## Files Changed Summary

| File | Changes | Lines Changed |
|------|---------|---------------|
| `/backend/routes/widgets.js` | Added hierarchy/device filtering to widget-data endpoint | ~90 |
| `/frontend/.../CustomLineChart.tsx` | Added hierarchy props, updated dependency array, modified API call | ~35 |
| `/frontend/.../WidgetRenderer.tsx` | Pass hierarchy context to CustomLineChart | ~3 |
| `/frontend/.../DashboardContent.tsx` | Added logging for data loading context | ~15 |
| `/frontend/.../MetricsCards.tsx` | Improved logging, fixed hardcoded defaults | ~20 |

---

## Deployment Checklist

- [ ] Backend code deployed
- [ ] Frontend code deployed (run `npm run build` first)
- [ ] Verify widget-data endpoint accepts hierarchyId parameter
- [ ] Test with different hierarchies
- [ ] Verify auto-refresh works with hierarchy context
- [ ] Monitor backend logs for errors
- [ ] Check browser console for hierarchy context logs

---

## Future Enhancements

1. **Caching:** Add Redis caching for widget-data requests to reduce database load
2. **Error Handling:** Show user-friendly error when hierarchy has no devices
3. **Performance:** Implement pagination for large device lists under hierarchy
4. **Real-time:** Use WebSockets for real-time widget updates instead of polling
5. **Analytics:** Track which hierarchies users access most frequently

---

## Quick Reference

### API Endpoint Changes

**Widget Data Endpoint**
```
GET /api/widgets/widget-data/:widgetId

Query Parameters:
- timeRange (required): '24h', '7d', '30d'
- hierarchyId (optional): Get data for all devices under hierarchy
- deviceId (optional): Get data for specific device
- limit (optional): Max results, default 200

Examples:
GET /api/widgets/widget-data/w1?hierarchyId=5&timeRange=24h
GET /api/widgets/widget-data/w1?deviceId=10&timeRange=7d
GET /api/widgets/widget-data/w1?timeRange=30d
```

### Component Props

**CustomLineChart**
```typescript
interface CustomLineChartProps {
  widgetConfig: any;                    // Widget config from database
  timeRange: '1day' | '7days' | '1month'; // Selected time range
  selectedHierarchy?: any | null;       // Current hierarchy selection
  selectedDevice?: any | null;          // Current device selection
}
```

---

## Support

For issues or questions:
1. Check browser console for errors
2. Review backend logs (search for `[WIDGET DATA]`)
3. Verify network requests include hierarchy context
4. Run database queries to verify data exists
