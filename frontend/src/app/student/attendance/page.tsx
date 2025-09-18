'use client';

import React from 'react';
import Layout from '@/components/Layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

const StudentAttendancePage: React.FC = () => {
  return (
    <Layout requiredRole="student">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-secondary-900">My Attendance</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-primary-600" />
              Attendance Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <ClipboardDocumentListIcon className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 mb-2">
                Attendance Coming Soon
              </h3>
              <p className="text-secondary-600">
                This page will display your attendance records, percentages, and detailed reports.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default StudentAttendancePage;
