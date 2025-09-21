'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  CogIcon,
  ServerIcon,
  ShieldCheckIcon,
  BellIcon,
  ChartBarIcon,
  CircleStackIcon,
  KeyIcon,
  GlobeAltIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    system: {
      siteName: 'College ERP System',
      timezone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
      academicYear: '2024-25'
    },
    mcp: {
      serverUrl: 'http://localhost:8000',
      enableMonitoring: true,
      enableAuditLogging: true,
      enableNotifications: true,
      rateLimitEnabled: true
    },
    security: {
      sessionTimeout: 30,
      passwordMinLength: 8,
      requireTwoFactor: false,
      enableAuditLog: true
    },
    notifications: {
      enableEmailNotifications: true,
      enableSMSNotifications: false,
      enablePushNotifications: true,
      notificationRetention: 30
    }
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('system');

  const tabs = [
    { id: 'system', name: 'System', icon: CogIcon },
    { id: 'mcp', name: 'MCP Server', icon: ServerIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'database', name: 'Database', icon: CircleStackIcon }
  ];

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // Mock save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
          <input
            type="text"
            value={settings.system.siteName}
            onChange={(e) => updateSetting('system', 'siteName', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
          <input
            type="text"
            value={settings.system.academicYear}
            onChange={(e) => updateSetting('system', 'academicYear', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
          <select
            value={settings.system.timezone}
            onChange={(e) => updateSetting('system', 'timezone', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="Asia/Kolkata">Asia/Kolkata</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
          <select
            value={settings.system.dateFormat}
            onChange={(e) => updateSetting('system', 'dateFormat', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderMCPSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">MCP Server URL</label>
          <input
            type="url"
            value={settings.mcp.serverUrl}
            onChange={(e) => updateSetting('mcp', 'serverUrl', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="http://localhost:8000"
          />
        </div>
      </div>
      
      <div className="space-y-4">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={settings.mcp.enableMonitoring}
            onChange={(e) => updateSetting('mcp', 'enableMonitoring', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-medium text-gray-700">Enable MCP Server Monitoring</span>
        </label>
        
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={settings.mcp.enableAuditLogging}
            onChange={(e) => updateSetting('mcp', 'enableAuditLogging', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-medium text-gray-700">Enable Audit Logging</span>
        </label>
        
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={settings.mcp.enableNotifications}
            onChange={(e) => updateSetting('mcp', 'enableNotifications', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-medium text-gray-700">Enable Real-time Notifications</span>
        </label>
        
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={settings.mcp.rateLimitEnabled}
            onChange={(e) => updateSetting('mcp', 'rateLimitEnabled', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-medium text-gray-700">Enable API Rate Limiting</span>
        </label>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
          <input
            type="number"
            value={settings.security.sessionTimeout}
            onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            min="5"
            max="480"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password Minimum Length</label>
          <input
            type="number"
            value={settings.security.passwordMinLength}
            onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            min="6"
            max="32"
          />
        </div>
      </div>
      
      <div className="space-y-4">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={settings.security.requireTwoFactor}
            onChange={(e) => updateSetting('security', 'requireTwoFactor', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-medium text-gray-700">Require Two-Factor Authentication</span>
        </label>
        
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={settings.security.enableAuditLog}
            onChange={(e) => updateSetting('security', 'enableAuditLog', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-medium text-gray-700">Enable Comprehensive Audit Logging</span>
        </label>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Notification Retention (days)</label>
        <input
          type="number"
          value={settings.notifications.notificationRetention}
          onChange={(e) => updateSetting('notifications', 'notificationRetention', parseInt(e.target.value))}
          className="w-full md:w-48 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          min="1"
          max="365"
        />
      </div>
      
      <div className="space-y-4">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={settings.notifications.enableEmailNotifications}
            onChange={(e) => updateSetting('notifications', 'enableEmailNotifications', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-medium text-gray-700">Enable Email Notifications</span>
        </label>
        
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={settings.notifications.enableSMSNotifications}
            onChange={(e) => updateSetting('notifications', 'enableSMSNotifications', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-medium text-gray-700">Enable SMS Notifications</span>
        </label>
        
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={settings.notifications.enablePushNotifications}
            onChange={(e) => updateSetting('notifications', 'enablePushNotifications', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-medium text-gray-700">Enable Push Notifications</span>
        </label>
      </div>
    </div>
  );

  const renderDatabaseSettings = () => (
    <div className="space-y-6">
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="font-medium text-blue-800 mb-2">Database Information</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• Database: MongoDB</p>
          <p>• Connection: Active</p>
          <p>• Collections: 10</p>
          <p>• Total Documents: ~1,500</p>
        </div>
      </Card>
      
      <div className="space-y-4">
        <Button variant="outline" className="w-full md:w-auto">
          <CircleStackIcon className="h-4 w-4 mr-2" />
          Backup Database
        </Button>
        
        <Button variant="outline" className="w-full md:w-auto">
          <ChartBarIcon className="h-4 w-4 mr-2" />
          Database Statistics
        </Button>
        
        <Button variant="outline" className="w-full md:w-auto text-red-600 hover:text-red-700">
          <ServerIcon className="h-4 w-4 mr-2" />
          Maintenance Mode
        </Button>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'system':
        return renderSystemSettings();
      case 'mcp':
        return renderMCPSettings();
      case 'security':
        return renderSecuritySettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'database':
        return renderDatabaseSettings();
      default:
        return renderSystemSettings();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 flex items-center space-x-2">
            <CogIcon className="h-8 w-8" />
            <span>System Settings</span>
          </h1>
          <p className="text-secondary-600 mt-2">Configure system preferences and MCP integration</p>
        </div>
        <Button 
          onClick={saveSettings}
          disabled={loading}
          className="flex items-center space-x-2"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <Card className="p-4 lg:col-span-1">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700 border border-primary-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </Card>

        {/* Settings Content */}
        <Card className="p-6 lg:col-span-3">
          <h3 className="text-lg font-semibold mb-6">
            {tabs.find(tab => tab.id === activeTab)?.name} Settings
          </h3>
          
          {renderTabContent()}
        </Card>
      </div>

      {/* System Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
            <div>
              <div className="font-medium text-green-800">Database</div>
              <div className="text-sm text-green-600">Connected</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <ServerIcon className="h-6 w-6 text-blue-600" />
            <div>
              <div className="font-medium text-blue-800">API Server</div>
              <div className="text-sm text-blue-600">Running</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
            <GlobeAltIcon className="h-6 w-6 text-purple-600" />
            <div>
              <div className="font-medium text-purple-800">MCP Server</div>
              <div className="text-sm text-purple-600">Operational</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
            <BellIcon className="h-6 w-6 text-yellow-600" />
            <div>
              <div className="font-medium text-yellow-800">Notifications</div>
              <div className="text-sm text-yellow-600">Active</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;
