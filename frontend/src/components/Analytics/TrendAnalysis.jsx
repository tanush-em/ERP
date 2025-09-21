'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  FunnelIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { useApi } from '@/hooks/useApi';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TrendAnalysis = ({ defaultTimeRange = 30 }) => {
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(defaultTimeRange);
  const [selectedMetric, setSelectedMetric] = useState('operations');
  const [chartType, setChartType] = useState('line');

  const { request } = useApi();

  const fetchTrendData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await request(`/api/mcp/analytics/trends?days=${timeRange}`);
      
      if (response.success) {
        setTrendData(response.data);
      }
    } catch (error) {
      console.error('Error fetching trend data:', error);
    } finally {
      setLoading(false);
    }
  }, [request, timeRange]);

  useEffect(() => {
    fetchTrendData();
  }, [fetchTrendData]);

  const processOperationsData = useCallback(() => {
    const dailyOps = trendData.dailyOperations || [];
    
    // Group by date and status
    const dateMap = new Map();
    
    dailyOps.forEach(item => {
      const date = item._id.date;
      const status = item._id.status;
      const count = item.count;
      
      if (!dateMap.has(date)) {
        dateMap.set(date, { completed: 0, failed: 0, running: 0, pending: 0 });
      }
      
      dateMap.get(date)[status] = count;
    });

    const sortedDates = Array.from(dateMap.keys()).sort();
    
    return {
      labels: sortedDates,
      datasets: [
        {
          label: 'Completed',
          data: sortedDates.map(date => dateMap.get(date).completed),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: chartType === 'area',
          tension: 0.4
        },
        {
          label: 'Failed',
          data: sortedDates.map(date => dateMap.get(date).failed),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: chartType === 'area',
          tension: 0.4
        },
        {
          label: 'Running',
          data: sortedDates.map(date => dateMap.get(date).running),
          borderColor: 'rgb(251, 191, 36)',
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          fill: chartType === 'area',
          tension: 0.4
        }
      ]
    };
  }, [trendData, chartType]);

  const processPerformanceData = useCallback(() => {
    const perfData = trendData.performance || [];
    
    return {
      labels: perfData.map(item => item._id),
      datasets: [
        {
          label: 'Avg Execution Time (ms)',
          data: perfData.map(item => item.avgExecutionTime),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: chartType === 'area',
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Max Execution Time (ms)',
          data: perfData.map(item => item.maxExecutionTime),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: false,
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Operation Count',
          data: perfData.map(item => item.operationCount),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: false,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    };
  }, [trendData, chartType]);

  const processOperationTypesData = useCallback(() => {
    const typeData = trendData.operationTypes || [];
    
    // Group by date and operation type
    const dateMap = new Map();
    const operationTypes = new Set();
    
    typeData.forEach(item => {
      const date = item._id.date;
      const opType = item._id.operationType;
      const count = item.count;
      
      operationTypes.add(opType);
      
      if (!dateMap.has(date)) {
        dateMap.set(date, {});
      }
      
      dateMap.get(date)[opType] = count;
    });

    const sortedDates = Array.from(dateMap.keys()).sort();
    const colors = [
      'rgb(59, 130, 246)',
      'rgb(34, 197, 94)',
      'rgb(251, 191, 36)',
      'rgb(239, 68, 68)',
      'rgb(147, 51, 234)',
      'rgb(75, 85, 99)'
    ];
    
    return {
      labels: sortedDates,
      datasets: Array.from(operationTypes).map((opType, index) => ({
        label: opType,
        data: sortedDates.map(date => dateMap.get(date)[opType] || 0),
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length].replace('rgb', 'rgba').replace(')', ', 0.1)'),
        fill: chartType === 'area',
        tension: 0.4
      }))
    };
  }, [trendData, chartType]);

  const processChartData = useCallback(() => {
    if (!trendData) return null;

    switch (selectedMetric) {
      case 'operations':
        return processOperationsData();
      case 'performance':
        return processPerformanceData();
      case 'types':
        return processOperationTypesData();
      default:
        return null;
    }
  }, [trendData, selectedMetric, processOperationsData, processPerformanceData, processOperationTypesData]);

  const getChartOptions = () => {
    const baseOptions = {
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
            text: 'Date'
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    };

    if (selectedMetric === 'performance') {
      baseOptions.scales.y = {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Execution Time (ms)'
        }
      };
      baseOptions.scales.y1 = {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Operation Count'
        },
        grid: {
          drawOnChartArea: false,
        },
      };
    } else {
      baseOptions.scales.y = {
        display: true,
        title: {
          display: true,
          text: 'Count'
        }
      };
    }

    return baseOptions;
  };

  const calculateTrendDirection = (data) => {
    if (!data || data.length < 2) return 'neutral';
    
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg * 1.1) return 'up';
    if (secondAvg < firstAvg * 0.9) return 'down';
    return 'neutral';
  };

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'up':
        return <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />;
      case 'down':
        return <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />;
      default:
        return <ChartBarIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const exportData = () => {
    if (!trendData) return;
    
    const dataStr = JSON.stringify(trendData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trend-analysis-${timeRange}days-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const chartData = processChartData();

  if (loading) {
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
      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              <ChartBarIcon className="h-6 w-6" />
              <span>Trend Analysis</span>
            </h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4 text-gray-500" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(parseInt(e.target.value))}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={60}>Last 60 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-4 w-4 text-gray-500" />
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="operations">Operations Status</option>
                <option value="performance">Performance Metrics</option>
                <option value="types">Operation Types</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-1 border border-gray-300 rounded">
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1 text-sm ${chartType === 'line' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
              >
                Line
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-1 text-sm ${chartType === 'area' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
              >
                Area
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 text-sm ${chartType === 'bar' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
              >
                Bar
              </button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={exportData}
              className="flex items-center space-x-1"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              <span>Export</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTrendData}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Trend Summary Cards */}
      {trendData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Operations</p>
                <p className="text-2xl font-bold">
                  {trendData.dailyOperations?.reduce((sum, item) => sum + item.count, 0) || 0}
                </p>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Average Daily Operations</p>
                <p className="text-2xl font-bold">
                  {Math.round((trendData.dailyOperations?.reduce((sum, item) => sum + item.count, 0) || 0) / timeRange)}
                </p>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                {getTrendIcon(calculateTrendDirection(
                  trendData.dailyOperations?.map(item => item.count) || []
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Success Rate</p>
                <p className="text-2xl font-bold">
                  {(() => {
                    const completed = trendData.dailyOperations?.filter(item => item._id.status === 'completed').reduce((sum, item) => sum + item.count, 0) || 0;
                    const total = trendData.dailyOperations?.reduce((sum, item) => sum + item.count, 0) || 0;
                    return total > 0 ? `${((completed / total) * 100).toFixed(1)}%` : '0%';
                  })()}
                </p>
              </div>
              <div className="bg-purple-100 p-2 rounded-lg">
                <ArrowTrendingUpIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Main Chart */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">
            {selectedMetric === 'operations' && 'Operations Trend by Status'}
            {selectedMetric === 'performance' && 'Performance Metrics Over Time'}
            {selectedMetric === 'types' && 'Operation Types Distribution'}
          </h3>
          <p className="text-sm text-gray-500">
            Data for the last {timeRange} days
          </p>
        </div>
        
        <div style={{ height: '400px' }}>
          {chartData ? (
            chartType === 'bar' ? (
              <Bar data={chartData} options={getChartOptions()} />
            ) : (
              <Line data={chartData} options={getChartOptions()} />
            )
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No trend data available
            </div>
          )}
        </div>
      </Card>

      {/* Insights */}
      {trendData && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Trend Analysis</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Operations trend is {calculateTrendDirection(trendData.dailyOperations?.map(item => item.count) || [])} over the selected period</li>
                <li>• Peak activity typically occurs on {/* Add peak day analysis */} weekdays</li>
                <li>• {trendData.operationTypes?.length || 0} different operation types detected</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Monitor performance during peak hours</li>
                <li>• Consider scaling resources based on trends</li>
                <li>• Investigate any unusual spikes or drops</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TrendAnalysis;
