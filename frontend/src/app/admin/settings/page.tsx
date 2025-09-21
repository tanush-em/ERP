'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  CogIcon,
  DatabaseIcon,
  BellIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

const AdminSettings = () => {
  const settingsSections = [
    {
      title: 'System Configuration',
      description: 'Manage system-wide settings and configurations',
      icon: CogIcon,
      items: [
        'Academic Year Settings',
        'Semester Configuration',
        'Grading System Setup',
        'Attendance Policies',
      ],
    },
    {
      title: 'Database Management',
      description: 'Database backup, restore, and maintenance',
      icon: DatabaseIcon,
      items: [
        'Database Backup',
        'Data Export/Import',
        'System Maintenance',
        'Performance Monitoring',
      ],
    },
    {
      title: 'Notification Settings',
      description: 'Configure system notifications and alerts',
      icon: BellIcon,
      items: [
        'Email Notifications',
        'SMS Alerts',
        'System Announcements',
        'Reminder Settings',
      ],
    },
    {
      title: 'User Management',
      description: 'Manage admin users and permissions',
      icon: UserGroupIcon,
      items: [
        'Admin Accounts',
        'Role Permissions',
        'Access Control',
        'Password Policies',
      ],
    },
    {
      title: 'Security Settings',
      description: 'Security configurations and audit logs',
      icon: ShieldCheckIcon,
      items: [
        'Security Policies',
        'Audit Logs',
        'Session Management',
        'Data Encryption',
      ],
    },
    {
      title: 'Reports & Analytics',
      description: 'Configure reporting and analytics settings',
      icon: DocumentTextIcon,
      items: [
        'Report Templates',
        'Analytics Dashboard',
        'Data Visualization',
        'Export Settings',
      ],
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-secondary-900">System Settings</h1>
        <Button variant="primary">
          Save All Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {settingsSections.map((section) => (
          <Card key={section.title} className="p-6">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-primary-100 rounded-lg">
                <section.icon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  {section.title}
                </h3>
                <p className="text-sm text-secondary-600 mb-4">
                  {section.description}
                </p>
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary-50 transition-colors"
                    >
                      <span className="text-sm text-secondary-700">{item}</span>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* System Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          System Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-secondary-50 rounded-lg">
            <p className="text-sm text-secondary-600">Version</p>
            <p className="text-lg font-semibold text-secondary-900">2.1.0</p>
          </div>
          <div className="text-center p-4 bg-secondary-50 rounded-lg">
            <p className="text-sm text-secondary-600">Last Updated</p>
            <p className="text-lg font-semibold text-secondary-900">Today</p>
          </div>
          <div className="text-center p-4 bg-secondary-50 rounded-lg">
            <p className="text-sm text-secondary-600">Status</p>
            <p className="text-lg font-semibold text-green-600">Healthy</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminSettings;
