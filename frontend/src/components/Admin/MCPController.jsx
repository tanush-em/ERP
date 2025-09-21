'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  PlayIcon,
  PauseIcon,
  StopIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CommandLineIcon,
  AdjustmentsHorizontalIcon,
  BellIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useApi } from '@/hooks/useApi';
import { useWebSocket } from '@/hooks/useWebSocket';
import toast from 'react-hot-toast';

const MCPController = () => {
  const [mcpStatus, setMcpStatus] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [showCommandModal, setShowCommandModal] = useState(false);
  const [customCommand, setCustomCommand] = useState('');
  const [notifications, setNotifications] = useState([]);

  const { request } = useApi();
  const { isConnected, subscribe, unsubscribe, emit } = useWebSocket();

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Get MCP server status
      const statusResponse = await request('/api/mcp/health/mcp-server');
      if (statusResponse.success) {
        setMcpStatus(statusResponse.data);
      }

      // Get system health
      const healthResponse = await request('/api/mcp/health/summary');
      if (healthResponse.success) {
        setSystemHealth(healthResponse.data);
      }

      // Get recent operations
      const opsResponse = await request('/api/mcp/operations/live?limit=10');
      if (opsResponse.success) {
        setOperations(opsResponse.data);
      }

      // Get recent notifications
      const notifResponse = await request('/api/mcp/notifications?hours=1&limit=5');
      if (notifResponse.success) {
        setNotifications(notifResponse.data.notifications || []);
      }

    } catch (error) {
      console.error('Error fetching MCP data:', error);
      toast.error('Failed to fetch MCP data');
    } finally {
      setLoading(false);
    }
  }, [request]);

  // Handle real-time updates
  const handleOperationUpdate = useCallback((data) => {
    if (data.data.recent_operations) {
      setOperations(data.data.recent_operations.slice(0, 10));
    }
  }, []);

  const handleNotificationUpdate = useCallback((data) => {
    if (data.data.recent_notifications) {
      setNotifications(prev => [
        ...data.data.recent_notifications.slice(0, 3),
        ...prev.slice(0, 2)
      ]);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Subscribe to real-time updates
    if (isConnected) {
      subscribe('mcp_operations', 'default', handleOperationUpdate);
      subscribe('notifications', 'default', handleNotificationUpdate);
    }

    return () => {
      if (isConnected) {
        unsubscribe('mcp_operations', 'default');
        unsubscribe('notifications', 'default');
      }
    };
  }, [isConnected, fetchData, subscribe, unsubscribe, handleOperationUpdate, handleNotificationUpdate]);

  const executeCommand = async (command, params = {}) => {
    try {
      const response = await request(`/api/mcp/operations`, {
        method: 'POST',
        data: {
          operationType: command,
          status: 'pending',
          parameters: params,
          initiatedBy: 'admin_panel'
        }
      });

      if (response.success) {
        toast.success(`Command "${command}" executed successfully`);
        fetchData(); // Refresh data
        return response.operationId;
      } else {
        throw new Error(response.error || 'Command execution failed');
      }
    } catch (error) {
      toast.error(`Failed to execute command: ${error.message}`);
      throw error;
    }
  };

  const sendCustomNotification = async () => {
    try {
      const response = await request('/api/mcp/notifications', {
        method: 'POST',
        data: {
          title: 'Admin Notification',
          message: customCommand || 'Custom notification from admin panel',
          severity: 'info',
          type: 'admin_message'
        }
      });

      if (response.success) {
        toast.success('Notification sent successfully');
        setShowCommandModal(false);
        setCustomCommand('');
      } else {
        throw new Error(response.error || 'Failed to send notification');
      }
    } catch (error) {
      toast.error(`Failed to send notification: ${error.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'warning':
      case 'running':
        return 'text-yellow-600 bg-yellow-50';
      case 'critical':
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'warning':
      case 'running':
        return <ClockIcon className="h-5 w-5 text-yellow-600 animate-pulse" />;
      case 'critical':
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <CogIcon className="h-6 w-6" />
            <span>MCP Controller</span>
          </h2>
          
          <div className="flex items-center space-x-3">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-500">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* MCP Server Status */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">MCP Server</h3>
            {mcpStatus && getStatusIcon(mcpStatus.status)}
          </div>
          
          {mcpStatus ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(mcpStatus.status)}`}>
                  {mcpStatus.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Recent Ops:</span>
                <span>{mcpStatus.recentOperations}</span>
              </div>
              <div className="flex justify-between">
                <span>Error Rate:</span>
                <span className={mcpStatus.errorRate > 10 ? 'text-red-600' : 'text-green-600'}>
                  {mcpStatus.errorRate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Uptime:</span>
                <span>{mcpStatus.uptime}</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">Loading...</div>
          )}
        </Card>

        {/* System Health */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">System Health</h3>
            {systemHealth && getStatusIcon(systemHealth.overview?.status)}
          </div>
          
          {systemHealth ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>CPU:</span>
                <span>{systemHealth.system?.cpu?.usage_percent?.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Memory:</span>
                <span>{systemHealth.system?.memory?.usage_percent?.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Disk:</span>
                <span>{systemHealth.system?.disk?.usage_percent?.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Alerts:</span>
                <span className={systemHealth.overview?.alertCount > 0 ? 'text-red-600' : 'text-green-600'}>
                  {systemHealth.overview?.alertCount || 0}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">Loading...</div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Button
              size="sm"
              className="w-full justify-start"
              onClick={() => executeCommand('health_check')}
            >
              <ShieldCheckIcon className="h-4 w-4 mr-2" />
              Health Check
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => executeCommand('system_cleanup')}
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
              System Cleanup
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => setShowCommandModal(true)}
            >
              <CommandLineIcon className="h-4 w-4 mr-2" />
              Custom Command
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => executeCommand('backup_data')}
            >
              <PlayIcon className="h-4 w-4 mr-2" />
              Backup Data
            </Button>
          </div>
        </Card>
      </div>

      {/* Recent Operations */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Operations</h3>
        
        {operations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2">Operation</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Started</th>
                  <th className="text-left py-2">Duration</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {operations.map((operation, index) => (
                  <tr key={operation._id || index} className="hover:bg-gray-50">
                    <td className="py-3">
                      <div>
                        <div className="font-medium">{operation.operationType}</div>
                        {operation.description && (
                          <div className="text-gray-500 text-xs">{operation.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(operation.status)}`}>
                        {operation.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600">
                      {new Date(operation.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 text-gray-600">
                      {operation.executionTime ? `${operation.executionTime}ms` : '-'}
                    </td>
                    <td className="py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOperation(
                          selectedOperation?._id === operation._id ? null : operation
                        )}
                      >
                        {selectedOperation?._id === operation._id ? 'Hide' : 'Details'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No recent operations found
          </div>
        )}

        {/* Operation Details */}
        {selectedOperation && (
          <Card className="mt-4 p-4 bg-gray-50">
            <h4 className="font-medium mb-3">Operation Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>ID:</strong> {selectedOperation._id}
              </div>
              <div>
                <strong>Type:</strong> {selectedOperation.operationType}
              </div>
              <div>
                <strong>Status:</strong> {selectedOperation.status}
              </div>
              <div>
                <strong>Started:</strong> {new Date(selectedOperation.timestamp).toLocaleString()}
              </div>
              {selectedOperation.completedAt && (
                <div>
                  <strong>Completed:</strong> {new Date(selectedOperation.completedAt).toLocaleString()}
                </div>
              )}
              {selectedOperation.executionTime && (
                <div>
                  <strong>Duration:</strong> {selectedOperation.executionTime}ms
                </div>
              )}
            </div>
            
            {selectedOperation.errorMessage && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                <strong className="text-red-800">Error:</strong>
                <p className="text-red-700 text-sm mt-1">{selectedOperation.errorMessage}</p>
              </div>
            )}
            
            {selectedOperation.result && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                <strong className="text-green-800">Result:</strong>
                <pre className="text-green-700 text-xs mt-1 overflow-x-auto">
                  {JSON.stringify(selectedOperation.result, null, 2)}
                </pre>
              </div>
            )}
          </Card>
        )}
      </Card>

      {/* Recent Notifications */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <BellIcon className="h-5 w-5" />
          <span>Recent Notifications</span>
        </h3>
        
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <div
                key={notification._id || index}
                className="p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                      <span>{notification.type}</span>
                      <span>{new Date(notification.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(notification.severity)}`}>
                    {notification.severity?.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No recent notifications
          </div>
        )}
      </Card>

      {/* Custom Command Modal */}
      {showCommandModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Send Custom Notification</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  value={customCommand}
                  onChange={(e) => setCustomCommand(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 h-24 resize-none"
                  placeholder="Enter your custom notification message..."
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  onClick={sendCustomNotification}
                  disabled={!customCommand.trim()}
                  className="flex-1"
                >
                  Send Notification
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCommandModal(false);
                    setCustomCommand('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MCPController;
