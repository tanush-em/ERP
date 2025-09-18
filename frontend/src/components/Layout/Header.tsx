'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useStudentNotifications } from '@/hooks/useApi';
import { cn, getUserDisplayName } from '@/lib/utils';
import Button from '@/components/ui/Button';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Get notifications for students
  const { data: notificationsData } = useStudentNotifications(
    user?.role === 'student' ? { limit: 5 } : undefined
  );

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  const handleProfileClick = () => {
    if (user?.role === 'admin') {
      router.push('/admin/profile');
    } else {
      router.push('/student/profile');
    }
  };

  const handleSettingsClick = () => {
    if (user?.role === 'admin') {
      router.push('/admin/settings');
    } else {
      router.push('/student/settings');
    }
  };

  const handleNotificationsClick = () => {
    if (user?.role === 'admin') {
      router.push('/admin/notifications');
    } else {
      router.push('/student/notifications');
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-secondary-200">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left side - Menu button and title */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Bars3Icon className="h-5 w-5" />
          </Button>
          
          <div className="ml-4 lg:ml-0">
            <h1 className="text-lg font-semibold text-secondary-900">
              {user?.role === 'admin' ? 'Admin Dashboard' : 'Student Portal'}
            </h1>
          </div>
        </div>

        {/* Right side - Notifications and user menu */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          {user?.role === 'student' && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNotificationsClick}
                className="relative"
              >
                <BellIcon className="h-5 w-5" />
                {notificationsData?.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notificationsData.unreadCount > 9 ? '9+' : notificationsData.unreadCount}
                  </span>
                )}
              </Button>
            </div>
          )}

          {/* User menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.profile.firstName?.[0]}{user?.profile.lastName?.[0]}
                </span>
              </div>
              <span className="hidden md:block text-secondary-700 font-medium">
                {getUserDisplayName(user)}
              </span>
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-1 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-1 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  {/* User info */}
                  <div className="px-4 py-2 border-b border-secondary-100">
                    <p className="text-sm font-medium text-secondary-900">
                      {getUserDisplayName(user)}
                    </p>
                    <p className="text-sm text-secondary-500 capitalize">
                      {user?.role}
                    </p>
                    {user?.role === 'student' && user.profile.rollNumber && (
                      <p className="text-xs text-secondary-400">
                        {user.profile.rollNumber}
                      </p>
                    )}
                  </div>

                  {/* Menu items */}
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleProfileClick}
                        className={cn(
                          'flex items-center w-full px-4 py-2 text-sm text-left',
                          active ? 'bg-secondary-50 text-secondary-900' : 'text-secondary-700'
                        )}
                      >
                        <UserCircleIcon className="mr-3 h-4 w-4" />
                        Profile
                      </button>
                    )}
                  </Menu.Item>

                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleSettingsClick}
                        className={cn(
                          'flex items-center w-full px-4 py-2 text-sm text-left',
                          active ? 'bg-secondary-50 text-secondary-900' : 'text-secondary-700'
                        )}
                      >
                        <Cog6ToothIcon className="mr-3 h-4 w-4" />
                        Settings
                      </button>
                    )}
                  </Menu.Item>

                  <div className="border-t border-secondary-100">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                          className={cn(
                            'flex items-center w-full px-4 py-2 text-sm text-left',
                            active ? 'bg-red-50 text-red-900' : 'text-red-700',
                            isLoggingOut && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                          {isLoggingOut ? 'Signing out...' : 'Sign out'}
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  );
};

export default Header;
