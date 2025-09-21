// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';

// Generic API request function
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  if (finalOptions.body && typeof finalOptions.body === 'object') {
    finalOptions.body = JSON.stringify(finalOptions.body);
  }

  try {
    const response = await fetch(url, finalOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
}

// Admin API functions
export const adminApi = {
  // Dashboard
  getDashboardStats: () => apiRequest('/api/admin/dashboard/stats'),
  
  // Students
  getStudents: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/admin/students${queryString ? `?${queryString}` : ''}`);
  },
  
  createStudent: (studentData) => apiRequest('/api/admin/students', {
    method: 'POST',
    body: studentData,
  }),
  
  updateStudent: (studentId, studentData) => apiRequest(`/api/admin/students/${studentId}`, {
    method: 'PUT',
    body: studentData,
  }),
  
  deleteStudent: (studentId) => apiRequest(`/api/admin/students/${studentId}`, {
    method: 'DELETE',
  }),
  
  // Courses
  getCourses: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/admin/courses${queryString ? `?${queryString}` : ''}`);
  },
  
  createCourse: (courseData) => apiRequest('/api/admin/courses', {
    method: 'POST',
    body: courseData,
  }),
  
  updateCourse: (courseId, courseData) => apiRequest(`/api/admin/courses/${courseId}`, {
    method: 'PUT',
    body: courseData,
  }),
  
  deleteCourse: (courseId) => apiRequest(`/api/admin/courses/${courseId}`, {
    method: 'DELETE',
  }),
  
  // Attendance
  getAttendance: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/admin/attendance${queryString ? `?${queryString}` : ''}`);
  },
  
  markAttendance: (attendanceData) => apiRequest('/api/admin/attendance', {
    method: 'POST',
    body: attendanceData,
  }),
  
  // Scores
  getScores: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/admin/scores${queryString ? `?${queryString}` : ''}`);
  },
  
  addScores: (scoresData) => apiRequest('/api/admin/scores', {
    method: 'POST',
    body: scoresData,
  }),
  
  // Fees
  getFees: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/admin/fees${queryString ? `?${queryString}` : ''}`);
  },
  
  createFee: (feeData) => apiRequest('/api/admin/fees', {
    method: 'POST',
    body: feeData,
  }),
  
  recordPayment: (feeId, paymentData) => apiRequest(`/api/admin/fees/${feeId}/payment`, {
    method: 'POST',
    body: paymentData,
  }),
  
  // Notifications
  getNotifications: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/admin/notifications${queryString ? `?${queryString}` : ''}`);
  },
  
  broadcastNotification: (notificationData) => apiRequest('/api/admin/notifications/broadcast', {
    method: 'POST',
    body: notificationData,
  }),
  
  // Timetable
  getTimetable: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/admin/timetable${queryString ? `?${queryString}` : ''}`);
  },
  
  createTimetableEntry: (timetableData) => apiRequest('/api/admin/timetable', {
    method: 'POST',
    body: timetableData,
  }),
  
  // Enrollments
  getEnrollments: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/admin/enrollments${queryString ? `?${queryString}` : ''}`);
  },
  
  createEnrollment: (enrollmentData) => apiRequest('/api/admin/enrollments', {
    method: 'POST',
    body: enrollmentData,
  }),
};

// Student API functions
export const studentApi = {
  getDashboard: (studentId) => apiRequest(`/api/student/dashboard/${studentId}`),
  
  getCourses: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/student/courses${queryString ? `?${queryString}` : ''}`);
  },
  
  getAttendance: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/student/attendance${queryString ? `?${queryString}` : ''}`);
  },
  
  getScores: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/student/scores${queryString ? `?${queryString}` : ''}`);
  },
  
  getNotifications: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/student/notifications${queryString ? `?${queryString}` : ''}`);
  },
  
  markNotificationRead: (notificationId) => apiRequest(`/api/student/notifications/${notificationId}/read`, {
    method: 'PUT',
  }),
  
  getTimetable: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/student/timetable${queryString ? `?${queryString}` : ''}`);
  },
  
  getGPA: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/student/gpa${queryString ? `?${queryString}` : ''}`);
  },
  
  getTranscript: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/student/transcript${queryString ? `?${queryString}` : ''}`);
  },
};

// Common API functions
export const commonApi = {
  login: (credentials) => apiRequest('/api/common/login', {
    method: 'POST',
    body: credentials,
  }),
  
  logout: () => apiRequest('/api/common/logout', {
    method: 'POST',
  }),
  
  getProfile: () => apiRequest('/api/common/profile'),
  
  updateProfile: (profileData) => apiRequest('/api/common/profile', {
    method: 'PUT',
    body: profileData,
  }),
  
  changePassword: (passwordData) => apiRequest('/api/common/change-password', {
    method: 'PUT',
    body: passwordData,
  }),
};

// Dashboard API functions
export const dashboardApi = {
  getStudentDashboard: (studentId) => studentApi.getDashboard(studentId),
  getAdminDashboard: () => adminApi.getDashboardStats(),
  getQuickStats: () => adminApi.getDashboardStats(),
};

// MCP API functions
export const mcpApi = {
  // Operations
  getOperations: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/mcp/operations${queryString ? `?${queryString}` : ''}`);
  },
  
  createOperation: (operationData) => apiRequest('/api/mcp/operations', {
    method: 'POST',
    body: operationData,
  }),
  
  updateOperationStatus: (operationId, statusData) => apiRequest(`/api/mcp/operations/${operationId}/status`, {
    method: 'PUT',
    body: statusData,
  }),
  
  getOperationStats: () => apiRequest('/api/mcp/operations/stats'),
  
  getLiveOperations: (limit = 20) => apiRequest(`/api/mcp/operations/live?limit=${limit}`),
  
  // Health
  getCurrentHealth: () => apiRequest('/api/mcp/health/current'),
  getHealthSummary: () => apiRequest('/api/mcp/health/summary'),
  getHealthHistory: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/mcp/health/history${queryString ? `?${queryString}` : ''}`);
  },
  getHealthAlerts: () => apiRequest('/api/mcp/health/alerts'),
  getMcpServerStatus: () => apiRequest('/api/mcp/health/mcp-server'),
  
  // Audit
  getAuditChanges: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/mcp/audit/changes${queryString ? `?${queryString}` : ''}`);
  },
  
  getEntityAuditTrail: (collection, entityId) => apiRequest(`/api/mcp/audit/entity/${collection}/${entityId}`),
  
  rollbackChange: (auditId, reason) => apiRequest(`/api/mcp/audit/rollback/${auditId}`, {
    method: 'POST',
    body: { reason },
  }),
  
  getRollbackCandidates: (hours = 24) => apiRequest(`/api/mcp/audit/rollback-candidates?hours=${hours}`),
  
  getSuspiciousActivity: (hours = 24) => apiRequest(`/api/mcp/audit/suspicious-activity?hours=${hours}`),
  
  generateComplianceReport: (reportData) => apiRequest('/api/mcp/audit/compliance-report', {
    method: 'POST',
    body: reportData,
  }),
  
  // Analytics
  getOperationTrends: (days = 30) => apiRequest(`/api/mcp/analytics/trends?days=${days}`),
  
  getAnomalies: (hours = 24) => apiRequest(`/api/mcp/analytics/anomalies?hours=${hours}`),
  
  getPredictiveInsights: (days = 30) => apiRequest(`/api/mcp/analytics/predictions?days=${days}`),
  
  getPerformanceReport: (days = 7) => apiRequest(`/api/mcp/analytics/performance-report?days=${days}`),
  
  calculateCustomMetrics: (metricConfig) => apiRequest('/api/mcp/analytics/custom-metrics', {
    method: 'POST',
    body: metricConfig,
  }),
  
  // Notifications
  getRecentNotifications: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/mcp/notifications${queryString ? `?${queryString}` : ''}`);
  },
  
  sendCustomNotification: (notificationData) => apiRequest('/api/mcp/notifications', {
    method: 'POST',
    body: notificationData,
  }),
  
  getNotificationSettings: () => apiRequest('/api/mcp/notifications/settings'),
  
  updateNotificationRule: (ruleName, settings) => apiRequest(`/api/mcp/notifications/settings/${ruleName}`, {
    method: 'PUT',
    body: settings,
  }),
  
  // Real-time
  getRealtimeMetrics: () => apiRequest('/api/mcp/realtime/metrics'),
  getConnectionPoolStatus: () => apiRequest('/api/mcp/realtime/connection-pool'),
  
  // Change Streams
  getChangeStreamStatus: () => apiRequest('/api/mcp/change-streams/status'),
  getChangeStatistics: (hours = 24) => apiRequest(`/api/mcp/change-streams/statistics?hours=${hours}`),
  configureChangeStream: (collection, config) => apiRequest(`/api/mcp/change-streams/configure/${collection}`, {
    method: 'PUT',
    body: config,
  }),
  
  // WebSocket
  getWebSocketStats: () => apiRequest('/api/mcp/websocket/stats'),
  configureWebSocketStream: (streamName, config) => apiRequest(`/api/mcp/websocket/configure/${streamName}`, {
    method: 'PUT',
    body: config,
  }),
};

// Export all APIs
export default {
  admin: adminApi,
  student: studentApi,
  common: commonApi,
  dashboard: dashboardApi,
  mcp: mcpApi,
};
