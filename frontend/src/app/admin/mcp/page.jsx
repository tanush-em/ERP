'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  CpuChipIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CogIcon,
  ShieldCheckIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

// Import MCP components
import LiveFeed from '@/components/RealTime/LiveFeed';
import StatusMonitor from '@/components/RealTime/StatusMonitor';
import MetricsDisplay from '@/components/RealTime/MetricsDisplay';
import TrendAnalysis from '@/components/Analytics/TrendAnalysis';
import AnomalyDetector from '@/components/Analytics/AnomalyDetector';
import ChartBuilder from '@/components/Analytics/ChartBuilder';
import MCPController from '@/components/Admin/MCPController';
import AuditViewer from '@/components/Admin/AuditViewer';

const MCPDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    {
      id: 'overview',
      name: 'Overview',
      icon: CpuChipIcon,
      description: 'Real-time system status and metrics'
    },
    {
      id: 'operations',
      name: 'Operations',
      icon: CogIcon,
      description: 'MCP operation control and monitoring'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: ChartBarIcon,
      description: 'Trends, anomalies, and custom charts'
    },
    {
      id: 'audit',
      name: 'Audit Trail',
      icon: ShieldCheckIcon,
      description: 'Complete audit log and compliance'
    },
    {
      id: 'monitoring',
      name: 'Monitoring',
      icon: ExclamationTriangleIcon,
      description: 'System health and performance'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <LiveFeed feedType="mcp_operations" maxItems={20} />
              </div>
              <div>
                <StatusMonitor refreshInterval={10000} />
              </div>
            </div>
            <MetricsDisplay refreshInterval={15000} showCharts={true} showKPIs={true} />
          </div>
        );

      case 'operations':
        return <MCPController />;

      case 'analytics':
        return (
          <div className="space-y-8">
            {/* Analytics Navigation */}
            <Card className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setActiveAnalyticsView('trends')}
                  className={activeAnalyticsView === 'trends' ? 'bg-blue-50 border-blue-300' : ''}
                >
                  Trend Analysis
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveAnalyticsView('anomalies')}
                  className={activeAnalyticsView === 'anomalies' ? 'bg-blue-50 border-blue-300' : ''}
                >
                  Anomaly Detection
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveAnalyticsView('charts')}
                  className={activeAnalyticsView === 'charts' ? 'bg-blue-50 border-blue-300' : ''}
                >
                  Chart Builder
                </Button>
              </div>
            </Card>

            {/* Analytics Content */}
            <AnalyticsContent />
          </div>
        );

      case 'audit':
        return <AuditViewer />;

      case 'monitoring':
        return (
          <div className="space-y-6">
            <StatusMonitor refreshInterval={5000} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LiveFeed feedType="system_health" maxItems={15} />
              <AnomalyDetector refreshInterval={60000} />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const [activeAnalyticsView, setActiveAnalyticsView] = useState('trends');

  const AnalyticsContent = () => {
    switch (activeAnalyticsView) {
      case 'trends':
        return <TrendAnalysis defaultTimeRange={30} />;
      case 'anomalies':
        return <AnomalyDetector refreshInterval={60000} />;
      case 'charts':
        return <ChartBuilder />;
      default:
        return <TrendAnalysis defaultTimeRange={30} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">MCP Dashboard</h1>
          <p className="text-gray-600">
            Comprehensive monitoring and control interface for the Model Context Protocol server
          </p>
        </div>

        {/* Tab Navigation */}
        <Card className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                      ${isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon
                      className={`
                        -ml-0.5 mr-2 h-5 w-5
                        ${isActive
                          ? 'text-blue-500'
                          : 'text-gray-400 group-hover:text-gray-500'
                        }
                      `}
                    />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* Tab Description */}
          <div className="px-6 py-3 bg-gray-50">
            <p className="text-sm text-gray-600">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </Card>

        {/* Tab Content */}
        <div className="tab-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default MCPDashboard;
