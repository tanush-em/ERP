'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  CurrencyDollarIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const FeesPage = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    // Mock data for now
    setTimeout(() => {
      setFees([
        {
          _id: '1',
          student: {
            profile: {
              firstName: 'John',
              lastName: 'Doe',
              rollNumber: 'CS001'
            }
          },
          feeType: 'tuition',
          amount: 50000,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          isPaid: false,
          academicYear: '2024-25'
        },
        {
          _id: '2',
          student: {
            profile: {
              firstName: 'Jane',
              lastName: 'Smith',
              rollNumber: 'CS002'
            }
          },
          feeType: 'tuition',
          amount: 50000,
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          isPaid: true,
          paymentDate: new Date().toISOString(),
          paymentMethod: 'online',
          academicYear: '2024-25'
        },
        {
          _id: '3',
          student: {
            profile: {
              firstName: 'Bob',
              lastName: 'Wilson',
              rollNumber: 'CS003'
            }
          },
          feeType: 'library',
          amount: 5000,
          dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          isPaid: false,
          academicYear: '2024-25'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusIcon = (fee) => {
    if (fee.isPaid) {
      return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
    }
    
    const isOverdue = new Date(fee.dueDate) < new Date();
    if (isOverdue) {
      return <XCircleIcon className="h-5 w-5 text-red-600" />;
    }
    
    return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
  };

  const getStatusColor = (fee) => {
    if (fee.isPaid) {
      return 'bg-green-100 text-green-800';
    }
    
    const isOverdue = new Date(fee.dueDate) < new Date();
    if (isOverdue) {
      return 'bg-red-100 text-red-800';
    }
    
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (fee) => {
    if (fee.isPaid) return 'PAID';
    
    const isOverdue = new Date(fee.dueDate) < new Date();
    return isOverdue ? 'OVERDUE' : 'PENDING';
  };

  const filteredFees = fees.filter(fee => {
    const matchesSearch = 
      fee.student.profile.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.student.profile.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.student.profile.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || 
      (statusFilter === 'paid' && fee.isPaid) ||
      (statusFilter === 'pending' && !fee.isPaid && new Date(fee.dueDate) >= new Date()) ||
      (statusFilter === 'overdue' && !fee.isPaid && new Date(fee.dueDate) < new Date());
    
    return matchesSearch && matchesStatus;
  });

  const calculateTotals = () => {
    const total = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const paid = fees.filter(fee => fee.isPaid).reduce((sum, fee) => sum + fee.amount, 0);
    const pending = total - paid;
    
    return { total, paid, pending };
  };

  const totals = calculateTotals();

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
            <CurrencyDollarIcon className="h-8 w-8" />
            <span>Fee Management</span>
          </h1>
          <p className="text-secondary-600 mt-2">Manage student fees and payments</p>
        </div>
        <Button className="flex items-center space-x-2">
          <PlusIcon className="h-4 w-4" />
          <span>Create Fee Record</span>
        </Button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">₹{totals.total.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Total Fees</div>
        </Card>
        
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-green-600">₹{totals.paid.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Collected</div>
        </Card>
        
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-red-600">₹{totals.pending.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </Card>

      {/* Fees Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fee Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFees.map((fee) => (
                <tr key={fee._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-600">
                          {fee.student.profile.firstName[0]}{fee.student.profile.lastName[0]}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {fee.student.profile.firstName} {fee.student.profile.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {fee.student.profile.rollNumber}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {fee.feeType.charAt(0).toUpperCase() + fee.feeType.slice(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{fee.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(fee.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(fee)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(fee)}`}>
                        {getStatusText(fee)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {!fee.isPaid && (
                        <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                          Record Payment
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <DocumentTextIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredFees.length === 0 && (
            <div className="text-center py-12">
              <CurrencyDollarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No fee records found</p>
              <p className="text-sm text-gray-400">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default FeesPage;
