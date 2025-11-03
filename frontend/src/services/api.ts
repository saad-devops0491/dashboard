// Debug environment variable loading
//console.log('Environment Variables Debug:');
//console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
//console.log('All env vars:', import.meta.env);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.28:5000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ msg: string; param: string; value: any }>;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  role: string;
  isEmailVerified: boolean;
  lastLogin?: string;
  lastLoginIP?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Hierarchy interfaces
export interface HierarchyNode {
  id: string;
  name: string;
  level: string;
  level_order: number;
  can_attach_device: boolean;
  children: HierarchyNode[];
  company_id?: string;
  parent_id?: string;
}

export interface HierarchyTree {
  [companyName: string]: {
    id: string;
    name: string;
    hierarchy: HierarchyNode[];
  };
}

export interface DashboardData {
  company: {
    id: string;
    name: string;
  };
  hierarchy: HierarchyTree;
  statistics: {
    totalDevices: number;
    totalLocations: number;
    regions: number;
    areas: number;
    fields: number;
    wells: number;
  };
  deviceTypeStats: Array<{
    type: string;
    count: number;
  }>;
  userRole: string;
  is_admin: boolean;
}

export interface Device {
  id: string;
  serial_number: string;
  type: string;
  logo?: string;
  metadata: any;
  created_at: string;
  location: string;
  company: string;
  status?: 'Online' | 'Offline';
}

export interface ChartDataPoint {
  timestamp: string;
  gfr?: number;
  gor?: number;
  gvf?: number;
  ofr?: number;
  wfr?: number;
  wlr?: number;
  pressure?: number;
  temperature?: number;
  dataPoints?: number;
  // For hierarchy aggregated data
  totalGfr?: number;
  totalGor?: number;
  totalOfr?: number;
  totalWfr?: number;
  totalGvf?: number;
  totalWlr?: number;
  avgPressure?: number;
  avgTemperature?: number;
  deviceCount?: number;
}

export interface DeviceChartData {
  device: Device;
  chartData: ChartDataPoint[];
  latestData?: {
    timestamp: string;
    data: any;
    longitude?: number;
    latitude?: number;
  };
  timeRange: string;
  totalDataPoints: number;
}

export interface HierarchyChartData {
  hierarchy: HierarchyNode;
  chartData: ChartDataPoint[];
  devices: Array<{
    id: number;
    serialNumber: string;
    deviceType: string;
    hierarchyName: string;
    metadata: any;
    latestData?: any;
    latestDataTime?: string;
  }>;
  timeRange: string;
  totalDataPoints: number;
  totalDevices: number;
}

// Device interfaces for new API structure
export interface DeviceFlowData {
  gfr: number;
  gor: number;
  ofr: number;
  wfr: number;
  gvf: number;
  wlr: number;
  pressure: number;
  temperature: number;
}

export interface DeviceLocation {
  longitude?: number;
  latitude?: number;
}

export interface EnhancedDevice {
  deviceId: number;
  deviceSerial: string;
  deviceName: string;
  deviceLogo?: string;
  wellName: string;
  hierarchyLevel?: string;
  companyName?: string;
  metadata: any;
  location: DeviceLocation;
  lastCommTime?: string;
  receivedAt?: string;
  status: 'Online' | 'Offline';
  flowData: DeviceFlowData;
  createdAt?: string;
  latestData?: any;
}

export interface DevicesResponse {
  hierarchy?: {
    id: number;
    name: string;
    company: string;
  };
  devices: EnhancedDevice[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  statistics: {
    totalDevices: number;
    onlineDevices: number;
    offlineDevices: number;
    deviceTypes: number;
    locations?: number;
  };
  filters: {
    availableDeviceTypes: string[];
    currentFilters: {
      search: string;
      status: string;
      deviceType: string;
    };
  };
}

// Alarm interfaces
export interface AlarmType {
  id: number;
  name: string;
  description?: string;
  severity: 'Critical' | 'Major' | 'Minor' | 'Warning';
}

export interface AlarmStatus {
  id: number;
  name: string;
  description?: string;
}

export interface DeviceAlarm {
  id: number;
  deviceSerial: string;
  deviceName?: string;
  wellName?: string;
  alarmType: AlarmType;
  alarmStatus: AlarmStatus;
  message?: string;
  severity: 'Critical' | 'Major' | 'Minor' | 'Warning';
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  acknowledgedBy?: string;
  metadata?: any;
}

export interface AlarmStatistics {
  total: number;
  active: number;
  acknowledged: number;
  resolved: number;
  by_severity: {
    critical: number;
    major: number;
    minor: number;
    warning: number;
  };
}

export interface AlarmsResponse {
  alarms: DeviceAlarm[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  statistics: AlarmStatistics;
  filters: {
    hierarchy_id?: number;
    device_serial?: string;
    alarm_type_id?: number;
    status_id?: number;
    severity?: string;
    sort_by: string;
    sort_order: string;
  };
}

class ApiService {
  private getErrorMessage(error: any): string {
    // Handle different types of errors with user-friendly messages
    if (error.errors && Array.isArray(error.errors)) {
      return error.errors.map((err: any) => err.msg).join(', ');
    }
    
    if (error.message) {
      // Handle specific error types
      if (error.message.includes('email')) {
        if (error.message.includes('domain')) {
          return 'Your email domain is not authorized. Please contact your administrator.';
        }
        if (error.message.includes('exists')) {
          return 'An account with this email already exists. Please try signing in instead.';
        }
        if (error.message.includes('invalid')) {
          return 'Please enter a valid email address.';
        }
      }
      
      if (error.message.includes('password')) {
        if (error.message.includes('weak')) {
          return 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.';
        }
        if (error.message.includes('incorrect')) {
          return 'The email or password you entered is incorrect. Please try again.';
        }
      }
      
      if (error.message.includes('verification')) {
        return 'Please verify your email address before signing in. Check your inbox for the verification link.';
      }
      
      if (error.message.includes('blocked') || error.message.includes('suspended')) {
        return 'Your account has been temporarily suspended. Please contact support for assistance.';
      }
      
      return error.message;
    }
    
    return 'An unexpected error occurred. Please try again.';
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      // If the response is not successful, format the error message
      if (!data.success && data.message) {
        return {
          ...data,
          message: this.getErrorMessage(data),
        };
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
      };
    }
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async signup(userData: SignupRequest): Promise<ApiResponse<{ user: User }>> {
    const { confirmPassword, acceptTerms, ...signupData } = userData;
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(signupData),
    });
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse> {
    return this.makeRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resendVerification(email: string): Promise<ApiResponse> {
    return this.makeRequest('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async getCurrentUser(token: string): Promise<ApiResponse<{ user: User }>> {
    return this.makeRequest('/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async logout(token: string): Promise<ApiResponse> {
    return this.makeRequest('/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Company domain validation
  async checkDomain(domain: string): Promise<ApiResponse<{ isAllowed: boolean; company: any }>> {
    return this.makeRequest(`/company/check-domain/${domain}`, {
      method: 'GET',
    });
  }

  // User profile endpoints
  async updateProfile(data: { firstName?: string; lastName?: string; company?: string }, token: string): Promise<ApiResponse<{ user: User }>> {
    return this.makeRequest('/user/profile', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: ChangePasswordRequest, token: string): Promise<ApiResponse> {
    return this.makeRequest('/user/change-password', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  async validateEmail(email: string): Promise<ApiResponse<{ valid: boolean; reason: string }>> {
    return this.makeRequest('/auth/validate-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.makeRequest(`/auth/reset-password/${token}`, {
      method: 'PUT',
      body: JSON.stringify({ password }),
    });
  }

  // Hierarchy endpoints
  async getHierarchyTree(token: string): Promise<ApiResponse<{ hierarchy: HierarchyTree }>> {
    return this.makeRequest('/hierarchy/tree', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getDashboardData(token: string): Promise<ApiResponse<DashboardData>> {
    return this.makeRequest('/hierarchy/dashboard', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getAllDevices(token: string): Promise<ApiResponse<{ devices: Device[]; total: number; company_id: number }>> {
    return this.makeRequest('/hierarchy/devices', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getDeviceById(deviceId: string, token: string): Promise<ApiResponse<{ device: Device }>> {
    return this.makeRequest(`/hierarchy/devices/${deviceId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getAllHierarchies(token: string): Promise<ApiResponse<{ hierarchies: HierarchyNode[] }>> {
    return this.makeRequest('/hierarchy', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getHierarchy(hierarchyId: string, token: string): Promise<ApiResponse<{ hierarchy: HierarchyNode }>> {
    return this.makeRequest(`/hierarchy/${hierarchyId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Charts endpoints
  async getDeviceChartData(deviceId: string, timeRange: string = 'day', token: string): Promise<ApiResponse<DeviceChartData>> {
    return this.makeRequest(`/charts/device/${deviceId}?timeRange=${timeRange}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getHierarchyChartData(hierarchyId: string, timeRange: string = 'day', token: string): Promise<ApiResponse<HierarchyChartData>> {
    return this.makeRequest(`/charts/hierarchy/${hierarchyId}?timeRange=${timeRange}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getDeviceRealtimeData(deviceId: string, token: string): Promise<ApiResponse<{ device: Device; latestData: any }>> {
    return this.makeRequest(`/charts/device/${deviceId}/realtime`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getChartsDashboardData(token: string): Promise<ApiResponse<any>> {
    return this.makeRequest('/charts/dashboard', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Enhanced Devices API endpoints
  async getDevicesByHierarchy(
    hierarchyId: number, 
    token: string, 
    filters?: {
      search?: string;
      status?: string;
      deviceType?: string;
    }
  ): Promise<ApiResponse<DevicesResponse>> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.deviceType) params.append('deviceType', filters.deviceType);
    
    const queryString = params.toString();
    const url = `/devices/hierarchy/${hierarchyId}${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getAllDevicesEnhanced(
    token: string,
    filters?: {
      search?: string;
      status?: string;
      deviceType?: string;
      page?: number;
      limit?: number;
      company_id?: number;
    }
  ): Promise<ApiResponse<DevicesResponse>> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.deviceType) params.append('deviceType', filters.deviceType);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.company_id) params.append('company_id', filters.company_id.toString());
    
    const queryString = params.toString();
    const url = `/devices${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getDeviceByIdEnhanced(deviceId: number, token: string): Promise<ApiResponse<{
    device: EnhancedDevice;
    recentHistory: Array<{
      timestamp: string;
      data: any;
      location: DeviceLocation;
    }>;
  }>> {
    return this.makeRequest(`/devices/${deviceId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async updateDeviceMetadata(deviceId: number, metadata: any, token: string): Promise<ApiResponse> {
    return this.makeRequest(`/devices/${deviceId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ metadata }),
    });
  }

  // Alarms API endpoints
  async getAlarms(
    token: string,
    filters?: {
      hierarchy_id?: number;
      device_serial?: string;
      alarm_type_id?: number;
      status_id?: number;
      severity?: string;
      page?: number;
      limit?: number;
      sort_by?: string;
      sort_order?: string;
      company_id?: number;
    }
  ): Promise<ApiResponse<AlarmsResponse>> {
    const params = new URLSearchParams();
    if (filters?.hierarchy_id) params.append('hierarchy_id', filters.hierarchy_id.toString());
    if (filters?.device_serial) params.append('device_serial', filters.device_serial);
    if (filters?.alarm_type_id) params.append('alarm_type_id', filters.alarm_type_id.toString());
    if (filters?.status_id) params.append('status_id', filters.status_id.toString());
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);
    if (filters?.sort_order) params.append('sort_order', filters.sort_order);
    if (filters?.company_id) params.append('company_id', filters.company_id.toString());
    
    const queryString = params.toString();
    const url = `/alarms${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getAlarmById(alarmId: number, token: string): Promise<ApiResponse<{ alarm: DeviceAlarm }>> {
    return this.makeRequest(`/alarms/${alarmId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async createAlarm(
    alarmData: {
      device_serial: string;
      alarm_type_id: number;
      message?: string;
      metadata?: any;
    },
    token: string
  ): Promise<ApiResponse<{ alarm: DeviceAlarm }>> {
    return this.makeRequest('/alarms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(alarmData),
    });
  }

  async updateAlarmStatus(
    alarmId: number,
    statusId: number,
    token: string
  ): Promise<ApiResponse<{ alarm: DeviceAlarm }>> {
    return this.makeRequest(`/alarms/${alarmId}/status`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status_id: statusId }),
    });
  }

  async getAlarmTypes(token: string): Promise<ApiResponse<{ alarm_types: AlarmType[] }>> {
    return this.makeRequest('/alarms/types/all', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getAlarmStatuses(token: string): Promise<ApiResponse<{ alarm_statuses: AlarmStatus[] }>> {
    return this.makeRequest('/alarms/statuses/all', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getAlarmDashboard(
    token: string,
    filters?: {
      hierarchy_id?: number;
      company_id?: number;
    }
  ): Promise<ApiResponse<{
    statistics: AlarmStatistics;
    recent_alarms: DeviceAlarm[];
    company_id: number;
    hierarchy_id?: number;
  }>> {
    const params = new URLSearchParams();
    if (filters?.hierarchy_id) params.append('hierarchy_id', filters.hierarchy_id.toString());
    if (filters?.company_id) params.append('company_id', filters.company_id.toString());
    
    const queryString = params.toString();
    const url = `/alarms/dashboard/stats${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Enhanced Charts API endpoints
  async getDeviceChartDataEnhanced(
    deviceId: number, 
    timeRange: string = 'day', 
    token: string
  ): Promise<ApiResponse<{
    device: EnhancedDevice;
    chartData: Array<{
      timestamp: string;
      gfr: number;
      gor: number;
      gvf: number;
      ofr: number;
      wfr: number;
      wlr: number;
      pressure: number;
      temperature: number;
      dataPoints: number;
    }>;
    latestData?: {
      timestamp: string;
      data: any;
      longitude?: number;
      latitude?: number;
    };
    timeRange: string;
    totalDataPoints: number;
  }>> {
    return this.makeRequest(`/charts/device/${deviceId}?timeRange=${timeRange}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getHierarchyChartDataEnhanced(
    hierarchyId: number, 
    timeRange: string = 'day', 
    token: string
  ): Promise<ApiResponse<{
    hierarchy: HierarchyNode;
    chartData: Array<{
      timestamp: string;
      totalGfr: number;
      totalGor: number;
      totalOfr: number;
      totalWfr: number;
      totalGvf: number;
      totalWlr: number;
      avgPressure: number;
      avgTemperature: number;
      deviceCount: number;
    }>;
    devices: Array<{
      id: number;
      serialNumber: string;
      deviceType: string;
      hierarchyName: string;
      metadata: any;
      latestData?: any;
      latestDataTime?: string;
    }>;
    timeRange: string;
    totalDataPoints: number;
    totalDevices: number;
  }>> {
    return this.makeRequest(`/charts/hierarchy/${hierarchyId}?timeRange=${timeRange}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getDeviceRealtimeDataEnhanced(deviceId: number, token: string): Promise<ApiResponse<{
    device: EnhancedDevice;
    latestData?: {
      timestamp: string;
      receivedAt: string;
      data: any;
      longitude?: number;
      latitude?: number;
      serialNumber: string;
      deviceType: string;
    };
  }>> {
    return this.makeRequest(`/charts/device/${deviceId}/realtime`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getChartsDashboardDataEnhanced(
    token: string,
    companyId?: number
  ): Promise<ApiResponse<{
    company: {
      id: number;
      name: string;
    };
    statistics: {
      totalDevices: number;
      totalHierarchies: number;
      hierarchyBreakdown: Array<{
        level: string;
        count: number;
      }>;
      deviceBreakdown: Array<{
        type: string;
        count: number;
      }>;
    };
    recentActivity: Array<{
      deviceSerial: string;
      deviceType: string;
      timestamp: string;
      data: any;
    }>;
    userRole: string;
  }>> {
    const params = new URLSearchParams();
    if (companyId) params.append('company_id', companyId.toString());

    const queryString = params.toString();
    const url = `/charts/dashboard${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getDashboards(token: string): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    description: string;
    version: number;
    isActive: boolean;
    widgetCount: number;
    createdAt: string;
  }>>> {
    return this.makeRequest('/widgets/user-dashboard', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then(response => {
      if (response.success && response.data) {
        const dashboard = response.data.dashboard;
        if (dashboard) {
          return {
            success: true,
            message: response.message,
            data: [{
              id: dashboard.id,
              name: dashboard.name,
              description: dashboard.description,
              version: dashboard.version,
              isActive: true,
              widgetCount: response.data.widgets?.length || 0,
              createdAt: new Date().toISOString()
            }]
          };
        }
      }
      return { success: true, message: 'No dashboards', data: [] };
    });
  }

  async getDashboardWidgets(dashboardId: string, token: string): Promise<ApiResponse<{
    dashboard: {
      id: string;
      name: string;
      description: string;
      gridConfig: any;
      version: number;
      canEdit: boolean;
    };
    widgets: Array<{
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
    }>;
  }>> {
    return this.makeRequest('/widgets/user-dashboard', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getWidgetTypes(token: string): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    componentName: string;
    defaultConfig: any;
  }>>> {
    return this.makeRequest('/widgets/types', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async updateDashboardLayouts(
    dashboardId: string,
    layouts: Array<{
      layoutId: string;
      layoutConfig: {
        x: number;
        y: number;
        w: number;
        h: number;
        minW?: number;
        minH?: number;
        static?: boolean;
      };
    }>,
    token: string
  ): Promise<ApiResponse<{ message: string }>> {
    return this.makeRequest('/widgets/update-layout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ layouts }),
    });
  }
}

export const apiService = new ApiService();