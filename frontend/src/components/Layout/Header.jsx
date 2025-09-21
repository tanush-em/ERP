'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

const Header = ({ onMenuClick }) => {
  const router = useRouter();

  const handleProfileClick = () => {
    router.push('/student/profile');
  };

  const handleNotificationsClick = () => {
    router.push('/student/notifications');
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
              DEPARTMENT OF CSE - AI & ML
            </h1>
          </div>
        </div>

        {/* Right side - Notifications and user menu */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNotificationsClick}
              className="relative"
            >
              <BellIcon className="h-5 w-5" />
            </Button>
          </div>

          {/* User menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  S
                </span>
              </div>
              <span className="hidden md:block text-secondary-700 font-medium">
                Student
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
                      Student Portal
                    </p>
                    <p className="text-sm text-secondary-500">
                      Academic Dashboard
                    </p>
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