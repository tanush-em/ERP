'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  HomeIcon,
  UserGroupIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  BellIcon,
  CogIcon,
  UserIcon,
  CpuChipIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const sidebarItems = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: HomeIcon,
    roles: ['admin'],
  },
  {
    name: 'MCP Control',
    href: '/admin/mcp',
    icon: CpuChipIcon,
    roles: ['admin'],
    description: 'MCP Server Monitoring & Control',
  },
  {
    name: 'Students',
    href: '/admin/students',
    icon: UserGroupIcon,
    roles: ['admin'],
  },
  {
    name: 'Courses',
    href: '/admin/courses',
    icon: BookOpenIcon,
    roles: ['admin'],
  },
  {
    name: 'Attendance',
    href: '/admin/attendance',
    icon: ClipboardDocumentListIcon,
    roles: ['admin'],
  },
  {
    name: 'Leave',
    href: '/admin/leave',
    icon: UserIcon,
    roles: ['admin'],
  },
  {
    name: 'Timetable',
    href: '/admin/timetable',
    icon: CalendarDaysIcon,
    roles: ['admin'],
  },
  {
    name: 'Fees',
    href: '/admin/fees',
    icon: CurrencyDollarIcon,
    roles: ['admin'],
  },
  {
    name: 'Notifications',
    href: '/admin/notifications',
    icon: BellIcon,
    roles: ['admin'],
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: CogIcon,
    roles: ['admin'],
  },
];

const Sidebar = ({ isOpen = true, onClose }) => {
  const pathname = usePathname();

  // Show all admin items since this is admin-only app
  const filteredItems = sidebarItems;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-secondary-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 bg-secondary-800">
            <h1 className="text-xl font-bold text-white">
              College ERP
            </h1>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {filteredItems.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-secondary-300 hover:bg-secondary-700 hover:text-white'
                  )}
                  onClick={onClose}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive
                        ? 'text-white'
                        : 'text-secondary-400 group-hover:text-white'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          {/* User info */}
          <div className="flex-shrink-0 p-4 border-t border-secondary-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    AD
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">
                  Administrator
                </p>
                <p className="text-xs text-secondary-400">
                  Admin
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;