'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface FeeRecord {
  _id: string;
  student: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
      rollNumber: string;
    };
  };
  feeType: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  paymentDate?: string;
  paymentMethod?: string;
  academicYear: string;
}

const FeesPage = () => {
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [newFee, setNewFee] = useState({
    studentId: '',
    feeType: 'tuition',
    amount: 0,
    dueDate: '',
    academicYear: new Date().getFullYear().toString()
  });

  useEffect(() => {
    fetchFeeRecords();
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchFeeRecords();
  }, [statusFilter]);

  const fetchFeeRecords = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/admin/fees?${params}`);
      if (response.ok) {
        const data = await response.json();
        setFeeRecords(data.fees || []);
      }
    } catch (error) {
      console.error('Failed to fetch fee records:', error);
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

  const handleAddFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/fees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFee),
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewFee({
          studentId: '',
          feeType: 'tuition',
          amount: 0,
          dueDate: '',
          academicYear: new Date().getFullYear().toString()
        });
        fetchFeeRecords();
      }
    } catch (error) {
      console.error('Failed to add fee:', error);
    }
  };

  const recordPayment = async (feeId: string) => {
    try {
      const response = await fetch(`/api/admin/fees/${feeId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod: 'cash',
          transactionId: `TXN-${Date.now()}`
        }),
      });

      if (response.ok) {
        fetchFeeRecords();
      }
    } catch (error) {
      console.error('Failed to record payment:', error);
    }
  };

  const getStatusColor = (record: FeeRecord) => {
    if (record.isPaid) return 'bg-green-100 text-green-800';
    if (new Date(record.dueDate) < new Date()) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (record: FeeRecord) => {
    if (record.isPaid) return 'Paid';
    if (new Date(record.dueDate) < new Date()) return 'Overdue';
    return 'Pending';
  };

  const totalAmount = feeRecords.reduce((sum, record) => sum + record.amount, 0);
  const paidAmount = feeRecords.filter(r => r.isPaid).reduce((sum, record) => sum + record.amount, 0);
  const pendingAmount = totalAmount - paidAmount;

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
        <h1 className="text-3xl font-bold text-secondary-900">Fee Management</h1>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center">
          <CurrencyDollarIcon className="h-5 w-5 mr-2" />
          Add Fee Record
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Total Amount</p>
              <p className="text-2xl font-semibold text-secondary-900">₹{totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Paid</p>
              <p className="text-2xl font-semibold text-secondary-900">₹{paidAmount.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Pending</p>
              <p className="text-2xl font-semibold text-secondary-900">₹{pendingAmount.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Overdue</p>
              <p className="text-2xl font-semibold text-secondary-900">
                {feeRecords.filter(r => !r.isPaid && new Date(r.dueDate) < new Date()).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </Card>

      {/* Fee Records Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Fee Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {feeRecords.map((record) => (
                <tr key={record._id} className="hover:bg-secondary-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-secondary-900">
                        {record.student.profile.firstName} {record.student.profile.lastName}
                      </div>
                      <div className="text-sm text-secondary-500">
                        {record.student.profile.rollNumber}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 capitalize">
                    {record.feeType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                    ₹{record.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                    {new Date(record.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record)}`}>
                      {getStatusText(record)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {!record.isPaid && (
                      <Button
                        onClick={() => recordPayment(record._id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Record Payment
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Fee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-secondary-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleAddFee}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-secondary-900 mb-4">
                    Add Fee Record
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Student
                      </label>
                      <select
                        value={newFee.studentId}
                        onChange={(e) => setNewFee({...newFee, studentId: e.target.value})}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      >
                        <option value="">Select Student</option>
                        {students.map((student) => (
                          <option key={student._id} value={student._id}>
                            {student.profile.rollNumber} - {student.profile.firstName} {student.profile.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Fee Type
                        </label>
                        <select
                          value={newFee.feeType}
                          onChange={(e) => setNewFee({...newFee, feeType: e.target.value})}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="tuition">Tuition Fee</option>
                          <option value="library">Library Fee</option>
                          <option value="lab">Lab Fee</option>
                          <option value="exam">Exam Fee</option>
                          <option value="hostel">Hostel Fee</option>
                          <option value="transport">Transport Fee</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Amount
                        </label>
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={newFee.amount}
                          onChange={(e) => setNewFee({...newFee, amount: parseFloat(e.target.value)})}
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Due Date
                        </label>
                        <Input
                          type="date"
                          value={newFee.dueDate}
                          onChange={(e) => setNewFee({...newFee, dueDate: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Academic Year
                        </label>
                        <Input
                          type="text"
                          placeholder="Academic Year"
                          value={newFee.academicYear}
                          onChange={(e) => setNewFee({...newFee, academicYear: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-secondary-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <Button type="submit" className="w-full sm:ml-3 sm:w-auto">
                    Add Fee Record
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

export default FeesPage;
