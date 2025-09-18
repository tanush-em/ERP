'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  HomeIcon,
  UserGroupIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  BellIcon,
  CogIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: ('admin' | 'student')[];
}

const sidebarItems: SidebarItem[] = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: HomeIcon,
    roles: ['admin'],
  },
  {
    name: 'Dashboard',
    href: '/student/dashboard',
    icon: HomeIcon,
    roles: ['student'],
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
    name: 'My Courses',
    href: '/student/courses',
    icon: BookOpenIcon,
    roles: ['student'],
  },
  {
    name: 'Attendance',
    href: '/admin/attendance',
    icon: ClipboardDocumentListIcon,
    roles: ['admin'],
  },
  {
    name: 'My Attendance',
    href: '/student/attendance',
    icon: ClipboardDocumentListIcon,
    roles: ['student'],
  },
  {
    name: 'Timetable',
    href: '/student/timetable',
    icon: CalendarDaysIcon,
    roles: ['student'],
  },
  {
    name: 'Timetable',
    href: '/admin/timetable',
    icon: CalendarDaysIcon,
    roles: ['admin'],
  },
  {
    name: 'Scores',
    href: '/admin/scores',
    icon: ChartBarIcon,
    roles: ['admin'],
  },
  {
    name: 'My Scores',
    href: '/student/scores',
    icon: ChartBarIcon,
    roles: ['student'],
  },
  {
    name: 'Fees',
    href: '/admin/fees',
    icon: CurrencyDollarIcon,
    roles: ['admin'],
  },
  {
    name: 'My Fees',
    href: '/student/fees',
    icon: CurrencyDollarIcon,
    roles: ['student'],
  },
  {
    name: 'Notifications',
    href: '/admin/notifications',
    icon: BellIcon,
    roles: ['admin'],
  },
  {
    name: 'Notifications',
    href: '/student/notifications',
    icon: BellIcon,
    roles: ['student'],
  },
  {
    name: 'Profile',
    href: '/student/profile',
    icon: UserIcon,
    roles: ['student'],
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: CogIcon,
    roles: ['admin'],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const pathname = usePathname();
  const { user } = useAuth();

  // Filter sidebar items based on user role
  const filteredItems = sidebarItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

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
          {user && (
            <div className="flex-shrink-0 p-4 border-t border-secondary-700">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user.profile.firstName?.[0]}{user.profile.lastName?.[0]}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    {user.profile.firstName} {user.profile.lastName}
                  </p>
                  <p className="text-xs text-secondary-400 capitalize">
                    {user.role}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
