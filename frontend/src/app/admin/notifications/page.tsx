'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  BellIcon,
  PlusIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface NotificationRecord {
  _id: string;
  user: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
      rollNumber: string;
    };
  };
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'general',
    recipients: [] as string[]
  });

  useEffect(() => {
    fetchNotifications();
    fetchStudents();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/admin/students');
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newNotification),
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewNotification({
          title: '',
          message: '',
          type: 'general',
          recipients: []
        });
        fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const handleRecipientChange = (studentId: string, checked: boolean) => {
    if (checked) {
      setNewNotification(prev => ({
        ...prev,
        recipients: [...prev.recipients, studentId]
      }));
    } else {
      setNewNotification(prev => ({
        ...prev,
        recipients: prev.recipients.filter(id => id !== studentId)
      }));
    }
  };

  const selectAllStudents = () => {
    setNewNotification(prev => ({
      ...prev,
      recipients: students.map(s => s._id)
    }));
  };

  const clearAllStudents = () => {
    setNewNotification(prev => ({
      ...prev,
      recipients: []
    }));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'announcement':
        return 'bg-blue-100 text-blue-800';
      case 'academic':
        return 'bg-green-100 text-green-800';
      case 'fee':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalNotifications = notifications.length;
  const readNotifications = notifications.filter(n => n.isRead).length;
  const unreadNotifications = totalNotifications - readNotifications;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-secondary-900">Notifications Management</h1>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Send Notification
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <BellIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Total Sent</p>
              <p className="text-2xl font-semibold text-secondary-900">{totalNotifications}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Read</p>
              <p className="text-2xl font-semibold text-secondary-900">{readNotifications}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-100">
              <ExclamationCircleIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Unread</p>
              <p className="text-2xl font-semibold text-secondary-900">{unreadNotifications}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Notifications List */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-secondary-200">
          <h2 className="text-lg font-semibold text-secondary-900">
            Recent Notifications
          </h2>
        </div>
        <div className="divide-y divide-secondary-200">
          {notifications.map((notification) => (
            <div key={notification._id} className="p-6 hover:bg-secondary-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-medium text-secondary-900 mr-3">
                      {notification.title}
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(notification.type)}`}>
                      {notification.type}
                    </span>
                  </div>
                  <p className="text-secondary-600 mb-2">{notification.message}</p>
                  <div className="flex items-center text-sm text-secondary-500">
                    <span>Sent to: {notification.user.profile.firstName} {notification.user.profile.lastName}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                    notification.isRead 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {notification.isRead ? 'Read' : 'Unread'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Send Notification Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-secondary-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={handleSendNotification}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-secondary-900 mb-4">
                    Send Notification
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Title
                        </label>
                        <Input
                          type="text"
                          placeholder="Notification Title"
                          value={newNotification.title}
                          onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Type
                        </label>
                        <select
                          value={newNotification.type}
                          onChange={(e) => setNewNotification({...newNotification, type: e.target.value})}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="general">General</option>
                          <option value="urgent">Urgent</option>
                          <option value="announcement">Announcement</option>
                          <option value="academic">Academic</option>
                          <option value="fee">Fee Related</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Message
                      </label>
                      <textarea
                        placeholder="Notification Message"
                        value={newNotification.message}
                        onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        rows={4}
                        required
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-secondary-700">
                          Recipients ({newNotification.recipients.length} selected)
                        </label>
                        <div className="space-x-2">
                          <button
                            type="button"
                            onClick={selectAllStudents}
                            className="text-sm text-primary-600 hover:text-primary-800"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={clearAllStudents}
                            className="text-sm text-secondary-600 hover:text-secondary-800"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>
                      <div className="max-h-40 overflow-y-auto border border-secondary-300 rounded-md p-3 space-y-2">
                        {students.map((student) => (
                          <label key={student._id} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={newNotification.recipients.includes(student._id)}
                              onChange={(e) => handleRecipientChange(student._id, e.target.checked)}
                              className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                            />
                            <span className="text-sm text-secondary-900">
                              {student.profile.rollNumber} - {student.profile.firstName} {student.profile.lastName}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-secondary-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <Button 
                    type="submit" 
                    className="w-full sm:ml-3 sm:w-auto"
                    disabled={newNotification.recipients.length === 0}
                  >
                    Send Notification
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="mt-3 w-full sm:mt-0 sm:w-auto bg-white text-secondary-900 border border-secondary-300 hover:bg-secondary-50"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
