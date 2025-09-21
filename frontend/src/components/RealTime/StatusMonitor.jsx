'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { 
  CpuChipIcon,
  CircleStackIcon,
  ServerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  SignalIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useApi } from '@/hooks/useApi';

const StatusMonitor = ({ refreshInterval = 5000 }) => {
  const [systemHealth, setSystemHealth] = useState(null);
  const [mcpServerStatus, setMcpServerStatus] = useState(null);
  const [connectionPool, setConnectionPool] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  const { isConnected, subscribe, unsubscribe } = useWebSocket();
  const { request } = useApi();

  // Handle real-time health updates
  const handleHealthUpdate = useCallback((data) => {
    if (data.data.current_metrics) {
      setSystemHealth(data.data.current_metrics);
    }
    if (data.data.alerts) {
      setAlerts(data.data.alerts);
    }
    setLastUpdate(new Date());
  }, []);

  // Fetch initial data and set up real-time updates
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Get current system health
        const healthResponse = await request('/api/mcp/health/current');
        if (healthResponse.success) {
          setSystemHealth(healthResponse.data);
        }

        // Get MCP server status
        const mcpResponse = await request('/api/mcp/health/mcp-server');
        if (mcpResponse.success) {
          setMcpServerStatus(mcpResponse.data);
        }

        // Get connection pool status
        const poolResponse = await request('/api/mcp/realtime/connection-pool');
        if (poolResponse.success) {
          setConnectionPool(poolResponse.data);
        }

        // Get current alerts
        const alertsResponse = await request('/api/mcp/health/alerts');
        if (alertsResponse.success) {
          setAlerts(alertsResponse.data);
        }

        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error fetching initial health data:', error);
      }
    };

    fetchInitialData();

    // Subscribe to real-time health updates
    if (isConnected) {
      subscribe('system_health', 'default', handleHealthUpdate);
    }

    // Set up periodic refresh for data that doesn't come via WebSocket
    const intervalId = setInterval(fetchInitialData, refreshInterval);

    return () => {
      clearInterval(intervalId);
      if (isConnected) {
        unsubscribe('system_health', 'default');
      }
    };
  }, [isConnected, refreshInterval, request, subscribe, unsubscribe, handleHealthUpdate]);

  const getHealthStatus = (value, thresholds = { warning: 70, critical: 85 }) => {
    if (value >= thresholds.critical) return 'critical';
    if (value >= thresholds.warning) return 'warning';
    return 'healthy';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'warning': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <XCircleIcon className="h-5 w-5 text-red-600" />;
      default: return <ClockIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatUptime = (seconds) => {
    if (!seconds) return 'Unknown';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <ServerIcon className="h-5 w-5" />
            <span>System Status</span>
          </h3>
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-500">
              {lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : 'Loading...'}
            </span>
          </div>
        </div>

        {systemHealth ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CPU Usage */}
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <CpuChipIcon className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">CPU</span>
                </div>
                {getStatusIcon(getHealthStatus(systemHealth.cpu?.usage_percent))}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Usage</span>
                  <span className="font-medium">{systemHealth.cpu?.usage_percent?.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      getHealthStatus(systemHealth.cpu?.usage_percent) === 'critical' 
                        ? 'bg-red-500' 
                        : getHealthStatus(systemHealth.cpu?.usage_percent) === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${systemHealth.cpu?.usage_percent}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  Cores: {systemHealth.cpu?.core_count}
                </div>
              </div>
            </div>

            {/* Memory Usage */}
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <CircleStackIcon className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">Memory</span>
                </div>
                {getStatusIcon(getHealthStatus(systemHealth.memory?.usage_percent))}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Usage</span>
                  <span className="font-medium">{systemHealth.memory?.usage_percent?.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      getHealthStatus(systemHealth.memory?.usage_percent) === 'critical' 
                        ? 'bg-red-500' 
                        : getHealthStatus(systemHealth.memory?.usage_percent) === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${systemHealth.memory?.usage_percent}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  {systemHealth.memory?.used_gb}GB / {systemHealth.memory?.total_gb}GB
                </div>
              </div>
            </div>

            {/* Disk Usage */}
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <CircleStackIcon className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Disk</span>
                </div>
                {getStatusIcon(getHealthStatus(systemHealth.disk?.usage_percent))}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Usage</span>
                  <span className="font-medium">{systemHealth.disk?.usage_percent?.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      getHealthStatus(systemHealth.disk?.usage_percent) === 'critical' 
                        ? 'bg-red-500' 
                        : getHealthStatus(systemHealth.disk?.usage_percent) === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${systemHealth.disk?.usage_percent}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  {systemHealth.disk?.used_gb}GB / {systemHealth.disk?.total_gb}GB
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </Card>

      {/* MCP Server Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold flex items-center space-x-2 mb-4">
          <SignalIcon className="h-5 w-5" />
          <span>MCP Server</span>
        </h3>

        {mcpServerStatus ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(mcpServerStatus.status)}`}>
                  {mcpServerStatus.status.toUpperCase()}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Recent Operations</span>
                <span className="text-sm">{mcpServerStatus.recentOperations}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Error Rate</span>
                <span className="text-sm">{mcpServerStatus.errorRate}%</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Uptime</span>
                <span className="text-sm">{mcpServerStatus.uptime}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Check</span>
                <span className="text-sm">
                  {new Date(mcpServerStatus.lastCheck).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}
      </Card>

      {/* Database Connection Pool */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold flex items-center space-x-2 mb-4">
          <CircleStackIcon className="h-5 w-5" />
          <span>Database Connections</span>
        </h3>

        {connectionPool ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{connectionPool.current}</div>
              <div className="text-sm text-gray-500">Current</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{connectionPool.available}</div>
              <div className="text-sm text-gray-500">Available</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{connectionPool.active}</div>
              <div className="text-sm text-gray-500">Active</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{connectionPool.totalCreated}</div>
              <div className="text-sm text-gray-500">Total Created</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}
      </Card>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold flex items-center space-x-2 mb-4">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
            <span>Active Alerts</span>
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              {alerts.length}
            </span>
          </h3>

          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  alert.level === 'critical' 
                    ? 'bg-red-50 border-red-200' 
                    : alert.level === 'warning'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(alert.level === 'critical' ? 'critical' : 'warning')}
                    <span className="font-medium text-sm">{alert.type}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default StatusMonitor;
