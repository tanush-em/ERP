'use client';

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ChartBarIcon,
  PlusIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';
import { useApi } from '@/hooks/useApi';
import { Line, Bar, Doughnut, Pie, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
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
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ChartBuilder = () => {
  const [charts, setCharts] = useState([]);
  const [selectedChart, setSelectedChart] = useState(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [currentConfig, setCurrentConfig] = useState({
    title: '',
    type: 'line',
    metrics: [
      {
        id: Date.now(),
        collection: 'mcp_operations',
        aggregation: 'count',
        field: '',
        filters: {},
        timeRange: 24,
        label: 'Operations Count'
      }
    ],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      showLegend: true,
      showTooltips: true,
      showGrid: true
    }
  });
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);

  const { request } = useApi();

  const collectionOptions = [
    { value: 'mcp_operations', label: 'MCP Operations' },
    { value: 'audit_trail', label: 'Audit Trail' },
    { value: 'system_health', label: 'System Health' },
    { value: 'students', label: 'Students' },
    { value: 'courses', label: 'Courses' },
    { value: 'attendance', label: 'Attendance' },
    { value: 'scores', label: 'Scores' },
    { value: 'fees', label: 'Fees' },
    { value: 'notifications', label: 'Notifications' }
  ];

  const aggregationOptions = [
    { value: 'count', label: 'Count' },
    { value: 'sum', label: 'Sum' },
    { value: 'avg', label: 'Average' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' }
  ];

  const chartTypes = [
    { value: 'line', label: 'Line Chart', component: Line },
    { value: 'bar', label: 'Bar Chart', component: Bar },
    { value: 'doughnut', label: 'Doughnut Chart', component: Doughnut },
    { value: 'pie', label: 'Pie Chart', component: Pie },
    { value: 'radar', label: 'Radar Chart', component: Radar }
  ];

  const addMetric = () => {
    setCurrentConfig(prev => ({
      ...prev,
      metrics: [
        ...prev.metrics,
        {
          id: Date.now(),
          collection: 'mcp_operations',
          aggregation: 'count',
          field: '',
          filters: {},
          timeRange: 24,
          label: `Metric ${prev.metrics.length + 1}`
        }
      ]
    }));
  };

  const removeMetric = (metricId) => {
    setCurrentConfig(prev => ({
      ...prev,
      metrics: prev.metrics.filter(m => m.id !== metricId)
    }));
  };

  const updateMetric = (metricId, updates) => {
    setCurrentConfig(prev => ({
      ...prev,
      metrics: prev.metrics.map(m => 
        m.id === metricId ? { ...m, ...updates } : m
      )
    }));
  };

  const generatePreview = useCallback(async () => {
    if (currentConfig.metrics.length === 0) return;

    try {
      setLoading(true);
      
      // Build metrics configuration for API
      const metricsConfig = {};
      currentConfig.metrics.forEach((metric, index) => {
        metricsConfig[`metric_${index}`] = {
          collection: metric.collection,
          aggregation: metric.aggregation,
          field: metric.field,
          filters: metric.filters,
          timeRange: metric.timeRange
        };
      });

      const response = await request('/api/mcp/analytics/custom-metrics', {
        method: 'POST',
        data: metricsConfig
      });

      if (response.success) {
        // Transform data for chart display
        const chartData = transformDataForChart(response.data.metrics);
        setPreviewData(chartData);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
    } finally {
      setLoading(false);
    }
  }, [currentConfig, request]);

  const transformDataForChart = (metricsData) => {
    const labels = currentConfig.metrics.map(m => m.label);
    const values = Object.values(metricsData).map(metric => metric.value || 0);
    
    const colors = [
      'rgba(59, 130, 246, 0.8)',   // blue
      'rgba(34, 197, 94, 0.8)',    // green
      'rgba(251, 191, 36, 0.8)',   // yellow
      'rgba(239, 68, 68, 0.8)',    // red
      'rgba(147, 51, 234, 0.8)',   // purple
      'rgba(75, 85, 99, 0.8)',     // gray
      'rgba(236, 72, 153, 0.8)',   // pink
      'rgba(14, 165, 233, 0.8)'    // sky
    ];

    const borderColors = colors.map(color => color.replace('0.8', '1'));

    if (['pie', 'doughnut'].includes(currentConfig.type)) {
      return {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors.slice(0, values.length),
          borderColor: borderColors.slice(0, values.length),
          borderWidth: 2
        }]
      };
    } else if (currentConfig.type === 'radar') {
      return {
        labels: labels,
        datasets: [{
          label: currentConfig.title || 'Custom Metrics',
          data: values,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(59, 130, 246, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(59, 130, 246, 1)'
        }]
      };
    } else {
      // Line and bar charts
      return {
        labels: labels,
        datasets: [{
          label: currentConfig.title || 'Custom Metrics',
          data: values,
          backgroundColor: currentConfig.type === 'line' 
            ? 'rgba(59, 130, 246, 0.1)'
            : colors.slice(0, values.length),
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          fill: currentConfig.type === 'line',
          tension: 0.4
        }]
      };
    }
  };

  const saveChart = () => {
    if (!currentConfig.title.trim()) {
      alert('Please provide a title for the chart');
      return;
    }

    const newChart = {
      id: Date.now(),
      ...currentConfig,
      createdAt: new Date(),
      data: previewData
    };

    setCharts(prev => [...prev, newChart]);
    setSelectedChart(newChart);
    setIsBuilding(false);
    
    // Reset form
    setCurrentConfig({
      title: '',
      type: 'line',
      metrics: [
        {
          id: Date.now(),
          collection: 'mcp_operations',
          aggregation: 'count',
          field: '',
          filters: {},
          timeRange: 24,
          label: 'Operations Count'
        }
      ],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        showLegend: true,
        showTooltips: true,
        showGrid: true
      }
    });
    setPreviewData(null);
  };

  const duplicateChart = (chart) => {
    const duplicated = {
      ...chart,
      id: Date.now(),
      title: `${chart.title} (Copy)`,
      createdAt: new Date()
    };
    setCharts(prev => [...prev, duplicated]);
  };

  const deleteChart = (chartId) => {
    setCharts(prev => prev.filter(c => c.id !== chartId));
    if (selectedChart?.id === chartId) {
      setSelectedChart(null);
    }
  };

  const exportChartConfig = (chart) => {
    const config = {
      title: chart.title,
      type: chart.type,
      metrics: chart.metrics,
      options: chart.options
    };
    
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chart-${chart.title.replace(/\s+/g, '-').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: currentConfig.options.showLegend,
          position: 'top',
        },
        tooltip: {
          enabled: currentConfig.options.showTooltips,
        },
        title: {
          display: !!currentConfig.title,
          text: currentConfig.title
        }
      },
      scales: ['pie', 'doughnut', 'radar'].includes(currentConfig.type) ? {} : {
        x: {
          display: currentConfig.options.showGrid,
        },
        y: {
          display: currentConfig.options.showGrid,
        }
      }
    };
  };

  const renderChart = (chartConfig, data) => {
    const ChartComponent = chartTypes.find(t => t.value === chartConfig.type)?.component || Line;
    
    return (
      <div style={{ height: '300px' }}>
        <ChartComponent 
          data={data} 
          options={{
            ...getChartOptions(),
            plugins: {
              ...getChartOptions().plugins,
              title: {
                display: !!chartConfig.title,
                text: chartConfig.title
              }
            }
          }} 
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <ChartBarIcon className="h-6 w-6" />
            <span>Chart Builder</span>
          </h2>
          
          <Button
            onClick={() => setIsBuilding(true)}
            className="flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Create Chart</span>
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Builder Panel */}
        {isBuilding && (
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Build Custom Chart</h3>
              
              {/* Basic Configuration */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Chart Title</label>
                  <input
                    type="text"
                    value={currentConfig.title}
                    onChange={(e) => setCurrentConfig(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Enter chart title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Chart Type</label>
                  <select
                    value={currentConfig.type}
                    onChange={(e) => setCurrentConfig(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    {chartTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Metrics Configuration */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Metrics</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addMetric}
                    className="flex items-center space-x-1"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Add Metric</span>
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {currentConfig.metrics.map((metric, index) => (
                    <div key={metric.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-sm">Metric {index + 1}</span>
                        {currentConfig.metrics.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeMetric(metric.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-1">Label</label>
                          <input
                            type="text"
                            value={metric.label}
                            onChange={(e) => updateMetric(metric.id, { label: e.target.value })}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium mb-1">Collection</label>
                          <select
                            value={metric.collection}
                            onChange={(e) => updateMetric(metric.id, { collection: e.target.value })}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          >
                            {collectionOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium mb-1">Aggregation</label>
                          <select
                            value={metric.aggregation}
                            onChange={(e) => updateMetric(metric.id, { aggregation: e.target.value })}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          >
                            {aggregationOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium mb-1">Time Range (hours)</label>
                          <input
                            type="number"
                            value={metric.timeRange}
                            onChange={(e) => updateMetric(metric.id, { timeRange: parseInt(e.target.value) || 24 })}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            min="1"
                            max="8760"
                          />
                        </div>
                      </div>
                      
                      {['sum', 'avg', 'min', 'max'].includes(metric.aggregation) && (
                        <div className="mt-3">
                          <label className="block text-xs font-medium mb-1">Field</label>
                          <input
                            type="text"
                            value={metric.field}
                            onChange={(e) => updateMetric(metric.id, { field: e.target.value })}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            placeholder="Field name for aggregation"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart Options */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Chart Options</h4>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={currentConfig.options.showLegend}
                      onChange={(e) => setCurrentConfig(prev => ({
                        ...prev,
                        options: { ...prev.options, showLegend: e.target.checked }
                      }))}
                      className="rounded"
                    />
                    <span className="text-sm">Show Legend</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={currentConfig.options.showTooltips}
                      onChange={(e) => setCurrentConfig(prev => ({
                        ...prev,
                        options: { ...prev.options, showTooltips: e.target.checked }
                      }))}
                      className="rounded"
                    />
                    <span className="text-sm">Show Tooltips</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={currentConfig.options.showGrid}
                      onChange={(e) => setCurrentConfig(prev => ({
                        ...prev,
                        options: { ...prev.options, showGrid: e.target.checked }
                      }))}
                      className="rounded"
                    />
                    <span className="text-sm">Show Grid</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3">
                <Button
                  onClick={generatePreview}
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  <EyeIcon className="h-4 w-4" />
                  <span>{loading ? 'Loading...' : 'Preview'}</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={saveChart}
                  disabled={!previewData}
                  className="flex items-center space-x-2"
                >
                  <DocumentDuplicateIcon className="h-4 w-4" />
                  <span>Save Chart</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsBuilding(false);
                    setPreviewData(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </Card>

            {/* Preview */}
            {previewData && (
              <Card className="p-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">Preview</h3>
                {renderChart(currentConfig, previewData)}
              </Card>
            )}
          </div>
        )}

        {/* Saved Charts */}
        <div className={isBuilding ? 'lg:col-span-1' : 'lg:col-span-3'}>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Saved Charts ({charts.length})</h3>
            
            {charts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No custom charts created yet</p>
                <p className="text-sm">Create your first chart to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {charts.map(chart => (
                  <div key={chart.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{chart.title}</h4>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedChart(selectedChart?.id === chart.id ? null : chart)}
                          className="flex items-center space-x-1"
                        >
                          <EyeIcon className="h-3 w-3" />
                          <span>{selectedChart?.id === chart.id ? 'Hide' : 'View'}</span>
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => duplicateChart(chart)}
                          className="flex items-center space-x-1"
                        >
                          <DocumentDuplicateIcon className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportChartConfig(chart)}
                          className="flex items-center space-x-1"
                        >
                          <CodeBracketIcon className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteChart(chart.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500 mb-2">
                      <span>{chart.type} chart • {chart.metrics.length} metrics • </span>
                      <span>Created {chart.createdAt.toLocaleDateString()}</span>
                    </div>
                    
                    {selectedChart?.id === chart.id && chart.data && (
                      <div className="mt-4">
                        {renderChart(chart, chart.data)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChartBuilder;
