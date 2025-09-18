'use client';

import React from 'react';
import Layout from '@/components/Layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { BellIcon } from '@heroicons/react/24/outline';

const StudentNotificationsPage: React.FC = () => {
  return (
    <Layout requiredRole="student">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-secondary-900">Notifications</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BellIcon className="h-5 w-5 mr-2 text-primary-600" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <BellIcon className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 mb-2">
                Notifications Coming Soon
              </h3>
              <p className="text-secondary-600">
                This page will display your notifications and announcements.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default StudentNotificationsPage;
