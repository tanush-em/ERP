'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  ClockIcon,
  BoltIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useApi } from '@/hooks/useApi';
import { Scatter, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const AnomalyDetector = ({ refreshInterval = 30000 }) => {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(24);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const { request } = useApi();

  const fetchAnomalies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await request(`/api/mcp/analytics/anomalies?hours=${timeRange}`);
      
      if (response.success) {
        setAnomalies(response.data.anomalies || []);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching anomalies:', error);
    } finally {
      setLoading(false);
    }
  }, [request, timeRange]);

  // Auto-refresh functionality
  useEffect(() => {
    fetchAnomalies();
    
    let intervalId;
    if (autoRefresh) {
      intervalId = setInterval(fetchAnomalies, refreshInterval);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchAnomalies, autoRefresh, refreshInterval]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-red-500 bg-red-50 border-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <ShieldExclamationIcon className="h-5 w-5 text-red-600" />;
      case 'high':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      case 'low':
        return <BoltIcon className="h-5 w-5 text-blue-600" />;
      default:
        return <ChartBarIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'high_operation_volume':
        return <ChartBarIcon className="h-4 w-4" />;
      case 'high_failure_rate':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'slow_operations':
        return <ClockIcon className="h-4 w-4" />;
      case 'high_cpu_usage':
      case 'high_memory_usage':
      case 'sustained_high_cpu':
        return <BoltIcon className="h-4 w-4" />;
      default:
        return <AdjustmentsHorizontalIcon className="h-4 w-4" />;
    }
  };

  const filteredAnomalies = anomalies.filter(anomaly => {
    if (severityFilter !== 'all' && anomaly.severity !== severityFilter) {
      return false;
    }
    if (typeFilter !== 'all' && anomaly.type !== typeFilter) {
      return false;
    }
    return true;
  });

  const groupAnomaliesByType = () => {
    const groups = {};
    filteredAnomalies.forEach(anomaly => {
      if (!groups[anomaly.type]) {
        groups[anomaly.type] = [];
      }
      groups[anomaly.type].push(anomaly);
    });
    return groups;
  };

  const getAnomalyChartData = () => {
    const data = filteredAnomalies.map(anomaly => ({
      x: new Date(anomaly.timestamp),
      y: anomaly.value,
      severity: anomaly.severity,
      type: anomaly.type,
      description: anomaly.description
    }));

    const severityColors = {
      critical: 'rgba(239, 68, 68, 0.8)',
      high: 'rgba(245, 101, 101, 0.8)',
      medium: 'rgba(251, 191, 36, 0.8)',
      low: 'rgba(59, 130, 246, 0.8)'
    };

    return {
      datasets: [{
        label: 'Anomalies',
        data: data,
        backgroundColor: data.map(point => severityColors[point.severity] || 'rgba(156, 163, 175, 0.8)'),
        borderColor: data.map(point => severityColors[point.severity]?.replace('0.8', '1') || 'rgba(156, 163, 175, 1)'),
        borderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            return new Date(context[0].parsed.x).toLocaleString();
          },
          label: (context) => {
            const point = context.raw;
            return [
              `Type: ${point.type}`,
              `Severity: ${point.severity}`,
              `Value: ${point.y}`,
              `Description: ${point.description}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
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
          text: 'Value'
        }
      }
    }
  };

  const getAnomalyStats = () => {
    const stats = {
      total: filteredAnomalies.length,
      critical: filteredAnomalies.filter(a => a.severity === 'critical').length,
      high: filteredAnomalies.filter(a => a.severity === 'high').length,
      medium: filteredAnomalies.filter(a => a.severity === 'medium').length,
      low: filteredAnomalies.filter(a => a.severity === 'low').length,
      types: [...new Set(filteredAnomalies.map(a => a.type))].length
    };
    return stats;
  };

  const stats = getAnomalyStats();
  const groupedAnomalies = groupAnomaliesByType();
  const uniqueTypes = [...new Set(anomalies.map(a => a.type))];

  if (loading && anomalies.length === 0) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
              <span>Anomaly Detection</span>
            </h2>
            {lastUpdate && (
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(parseInt(e.target.value))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value={1}>Last Hour</option>
              <option value={6}>Last 6 Hours</option>
              <option value={24}>Last 24 Hours</option>
              <option value={72}>Last 3 Days</option>
              <option value={168}>Last Week</option>
            </select>
            
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="all">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
            
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span>Auto-refresh</span>
            </label>
            
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAnomalies}
              disabled={loading}
              className="flex items-center space-x-1"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          <div className="text-sm text-gray-500">Critical</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-red-500">{stats.high}</div>
          <div className="text-sm text-gray-500">High</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
          <div className="text-sm text-gray-500">Medium</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.low}</div>
          <div className="text-sm text-gray-500">Low</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.types}</div>
          <div className="text-sm text-gray-500">Types</div>
        </Card>
      </div>

      {/* Anomaly Timeline Chart */}
      {filteredAnomalies.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Anomaly Timeline</h3>
          <div style={{ height: '300px' }}>
            <Scatter data={getAnomalyChartData()} options={chartOptions} />
          </div>
        </Card>
      )}

      {/* Anomaly List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(groupedAnomalies).map(([type, typeAnomalies]) => (
          <Card key={type} className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              {getTypeIcon(type)}
              <span>{type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                {typeAnomalies.length}
              </span>
            </h3>
            
            <div className="space-y-3">
              {typeAnomalies.slice(0, 5).map((anomaly, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded-lg ${getSeverityColor(anomaly.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getSeverityIcon(anomaly.severity)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{anomaly.description}</p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600">
                          <span>Value: {anomaly.value}</span>
                          {anomaly.threshold && (
                            <span>Threshold: {anomaly.threshold}</span>
                          )}
                          <span>
                            {new Date(anomaly.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {typeAnomalies.length > 5 && (
                <div className="text-center text-sm text-gray-500">
                  +{typeAnomalies.length - 5} more anomalies
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* No Anomalies State */}
      {filteredAnomalies.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Anomalies Detected</h3>
          <p className="text-gray-500">
            All systems are operating within normal parameters for the selected time range.
          </p>
        </Card>
      )}

      {/* Recommendations */}
      {stats.critical > 0 || stats.high > 0 ? (
        <Card className="p-6 bg-red-50 border-red-200">
          <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center space-x-2">
            <ShieldExclamationIcon className="h-5 w-5" />
            <span>Immediate Attention Required</span>
          </h3>
          <div className="text-sm text-red-700 space-y-2">
            {stats.critical > 0 && (
              <p>• {stats.critical} critical anomalies detected - immediate investigation required</p>
            )}
            {stats.high > 0 && (
              <p>• {stats.high} high-severity anomalies need attention</p>
            )}
            <p>• Review system resources and recent changes</p>
            <p>• Consider scaling infrastructure if performance issues persist</p>
          </div>
        </Card>
      ) : stats.medium > 0 ? (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">Monitoring Recommended</h3>
          <div className="text-sm text-yellow-700 space-y-2">
            <p>• {stats.medium} medium-severity anomalies detected</p>
            <p>• Monitor trends to prevent escalation</p>
            <p>• Consider proactive optimization</p>
          </div>
        </Card>
      ) : (
        <Card className="p-6 bg-green-50 border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-3">System Health Good</h3>
          <div className="text-sm text-green-700">
            <p>No critical or high-severity anomalies detected. System is operating normally.</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AnomalyDetector;
