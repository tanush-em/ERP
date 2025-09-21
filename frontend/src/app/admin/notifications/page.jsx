'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  BellIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  SpeakerWaveIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    // Mock data for now
    setTimeout(() => {
      setNotifications([
        {
          _id: '1',
          title: 'Fee Payment Reminder',
          message: 'Your tuition fee payment is due in 5 days. Please make the payment to avoid late fees.',
          type: 'fee_reminder',
          priority: 'high',
          createdAt: new Date().toISOString(),
          sentTo: 'all_students',
          status: 'sent'
        },
        {
          _id: '2',
          title: 'Exam Schedule Released',
          message: 'The mid-semester examination schedule has been released. Please check your student portal.',
          type: 'academic',
          priority: 'medium',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          sentTo: 'semester_3',
          status: 'sent'
        },
        {
          _id: '3',
          title: 'Library Hours Update',
          message: 'Library hours have been extended during exam week. New hours: 8 AM to 10 PM.',
          type: 'general',
          priority: 'low',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          sentTo: 'all_students',
          status: 'sent'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
      case 'medium':
        return <InformationCircleIcon className="h-5 w-5 text-yellow-600" />;
      case 'low':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'academic':
        return '📚';
      case 'fee_reminder':
        return '💰';
      case 'general':
        return '📢';
      case 'emergency':
        return '🚨';
      default:
        return '📝';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !typeFilter || notification.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 flex items-center space-x-2">
            <BellIcon className="h-8 w-8" />
            <span>Notifications</span>
          </h1>
          <p className="text-secondary-600 mt-2">Send and manage system notifications</p>
        </div>
        <Button className="flex items-center space-x-2">
          <SpeakerWaveIcon className="h-4 w-4" />
          <span>Send Notification</span>
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{notifications.length}</div>
          <div className="text-sm text-gray-500">Total Sent</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {notifications.filter(n => n.priority === 'high').length}
          </div>
          <div className="text-sm text-gray-500">High Priority</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {notifications.filter(n => n.status === 'sent').length}
          </div>
          <div className="text-sm text-gray-500">Successfully Sent</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {notifications.filter(n => n.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()).length}
          </div>
          <div className="text-sm text-gray-500">Today</div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Types</option>
            <option value="academic">Academic</option>
            <option value="fee_reminder">Fee Reminder</option>
            <option value="general">General</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.map((notification) => (
          <Card key={notification._id} className={`p-6 border-l-4 ${getPriorityColor(notification.priority)}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <div className="text-2xl">{getTypeIcon(notification.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                    {getPriorityIcon(notification.priority)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(notification.priority)}`}>
                      {notification.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{notification.message}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Sent to: {notification.sentTo.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>{new Date(notification.createdAt).toLocaleString()}</span>
                    <span>•</span>
                    <span className="capitalize">{notification.status}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  Resend
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredNotifications.length === 0 && (
        <Card className="p-12 text-center">
          <BellIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No notifications found</p>
          <p className="text-sm text-gray-400">Try adjusting your search criteria</p>
        </Card>
      )}
    </div>
  );
};

export default NotificationsPage;
