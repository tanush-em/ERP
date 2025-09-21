'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useApi } from '@/hooks/useApi';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const MetricsDisplay = ({ 
  refreshInterval = 10000, 
  showCharts = true, 
  showKPIs = true,
  timeRange = '1h' 
}) => {
  const [metrics, setMetrics] = useState(null);
  const [operationStats, setOperationStats] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);

  const { isConnected, subscribe, unsubscribe } = useWebSocket();
  const { request } = useApi();

  // Handle real-time metrics updates
  const handleMetricsUpdate = useCallback((data) => {
    if (data.data.realtime_metrics) {
      setMetrics(data.data.realtime_metrics);
    }
  }, []);

  // Fetch metrics data
  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);

      // Get real-time metrics
      const metricsResponse = await request('/api/mcp/realtime/metrics');
      if (metricsResponse.success) {
        setMetrics(metricsResponse.data);
      }

      // Get operation statistics
      const statsResponse = await request('/api/mcp/operations/stats');
      if (statsResponse.success) {
        setOperationStats(statsResponse.data);
      }

      // Get performance history based on time range
      const hours = selectedTimeRange === '1h' ? 1 : selectedTimeRange === '6h' ? 6 : 24;
      const performanceResponse = await request(`/api/mcp/health/history?hours=${hours}&interval=5`);
      if (performanceResponse.success) {
        setPerformanceData(performanceResponse.data);
      }

    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [request, selectedTimeRange]);

  // Set up data fetching and real-time updates
  useEffect(() => {
    fetchMetrics();

    // Subscribe to real-time updates
    if (isConnected) {
      subscribe('mcp_operations', 'default', handleMetricsUpdate);
    }

    // Set up periodic refresh
    const intervalId = setInterval(fetchMetrics, refreshInterval);

    return () => {
      clearInterval(intervalId);
      if (isConnected) {
        unsubscribe('mcp_operations', 'default');
      }
    };
  }, [isConnected, refreshInterval, fetchMetrics, subscribe, unsubscribe, handleMetricsUpdate]);

  // Chart configurations
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Usage %'
        },
        min: 0,
        max: 100
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const performanceChartData = {
    labels: performanceData.map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'CPU Usage %',
        data: performanceData.map(d => d.avgCpuUsage),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Memory Usage %',
        data: performanceData.map(d => d.avgMemoryUsage),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const operationStatusData = operationStats ? {
    labels: operationStats.statusStats.map(s => s._id),
    datasets: [{
      data: operationStats.statusStats.map(s => s.count),
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',   // completed - green
        'rgba(239, 68, 68, 0.8)',   // failed - red
        'rgba(251, 191, 36, 0.8)',  // running - yellow
        'rgba(156, 163, 175, 0.8)'  // pending - gray
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  } : null;

  const getTrendIcon = (current, previous) => {
    if (!previous || current === previous) {
      return <MinusIcon className="h-4 w-4 text-gray-500" />;
    }
    if (current > previous) {
      return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />;
    }
    return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const calculateSuccessRate = () => {
    if (!operationStats?.statusStats) return 0;
    
    const completed = operationStats.statusStats.find(s => s._id === 'completed')?.count || 0;
    const total = operationStats.statusStats.reduce((sum, s) => sum + s.count, 0);
    
    return total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
  };

  if (loading && !metrics) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">System Metrics</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Time Range:</span>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {showKPIs && metrics && operationStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Operations</p>
                <p className="text-2xl font-bold">{metrics.operations?.running || 0}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <ClockIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Success Rate</p>
                <p className="text-2xl font-bold">{calculateSuccessRate()}%</p>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Operations</p>
                <p className="text-2xl font-bold">{formatNumber(operationStats.totalOperations)}</p>
              </div>
              <div className="bg-purple-100 p-2 rounded-lg">
                <ArrowTrendingUpIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Recent Activity</p>
                <p className="text-2xl font-bold">{metrics.operations?.recentActivity || 0}</p>
              </div>
              <div className="bg-orange-100 p-2 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Charts */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">System Performance</h3>
            <div style={{ height: '300px' }}>
              {performanceData.length > 0 ? (
                <Line data={performanceChartData} options={lineChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No performance data available
                </div>
              )}
            </div>
          </Card>

          {/* Operation Status Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Operation Status</h3>
            <div style={{ height: '300px' }}>
              {operationStatusData ? (
                <Doughnut 
                  data={operationStatusData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      }
                    }
                  }} 
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No operation data available
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Detailed Metrics Table */}
      {metrics && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Detailed Metrics</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2">Metric</th>
                  <th className="text-left py-2">Current</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-3 font-medium">CPU Usage</td>
                  <td className="py-3">{metrics.system?.cpu?.usage_percent?.toFixed(1)}%</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      metrics.system?.cpu?.usage_percent > 80 
                        ? 'bg-red-100 text-red-800' 
                        : metrics.system?.cpu?.usage_percent > 60
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {metrics.system?.cpu?.usage_percent > 80 ? 'High' : 
                       metrics.system?.cpu?.usage_percent > 60 ? 'Medium' : 'Normal'}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">
                    {metrics.system?.cpu?.core_count} cores
                  </td>
                </tr>
                
                <tr>
                  <td className="py-3 font-medium">Memory Usage</td>
                  <td className="py-3">{metrics.system?.memory?.usage_percent?.toFixed(1)}%</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      metrics.system?.memory?.usage_percent > 85 
                        ? 'bg-red-100 text-red-800' 
                        : metrics.system?.memory?.usage_percent > 70
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {metrics.system?.memory?.usage_percent > 85 ? 'High' : 
                       metrics.system?.memory?.usage_percent > 70 ? 'Medium' : 'Normal'}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">
                    {metrics.system?.memory?.used_gb}GB / {metrics.system?.memory?.total_gb}GB
                  </td>
                </tr>
                
                <tr>
                  <td className="py-3 font-medium">Database Connections</td>
                  <td className="py-3">{metrics.database?.connections?.current || 0}</td>
                  <td className="py-3">
                    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      Active
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">
                    {metrics.database?.connections?.available || 0} available
                  </td>
                </tr>
                
                <tr>
                  <td className="py-3 font-medium">Running Operations</td>
                  <td className="py-3">{metrics.operations?.running || 0}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      (metrics.operations?.running || 0) > 10
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {(metrics.operations?.running || 0) > 10 ? 'Busy' : 'Normal'}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">
                    {metrics.operations?.pending || 0} pending
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MetricsDisplay;
