'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ClockIcon,
  UserIcon,
  CommandLineIcon,
  EyeIcon,
  ArrowUturnLeftIcon
} from '@heroicons/react/24/outline';
import { useApi } from '@/hooks/useApi';
import toast from 'react-hot-toast';

const AuditViewer = () => {
  const [auditData, setAuditData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    collection: '',
    operationType: '',
    startDate: '',
    endDate: '',
    entityId: '',
    userId: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    hasMore: false
  });
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [rollbackCandidates, setRollbackCandidates] = useState([]);
  const [suspiciousActivity, setSuspiciousActivity] = useState([]);
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [rollbackReason, setRollbackReason] = useState('');

  const { request } = useApi();

  const fetchAuditData = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: ((page - 1) * pagination.limit).toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      });

      const response = await request(`/api/mcp/audit/changes?${params}`);
      
      if (response.success) {
        setAuditData(response.data.changes);
        setPagination(prev => ({
          ...prev,
          page,
          total: response.data.total,
          hasMore: response.data.hasMore
        }));
      }
    } catch (error) {
      console.error('Error fetching audit data:', error);
      toast.error('Failed to fetch audit data');
    } finally {
      setLoading(false);
    }
  }, [request, filters, pagination.limit]);

  const fetchRollbackCandidates = useCallback(async () => {
    try {
      const response = await request('/api/mcp/audit/rollback-candidates?hours=24');
      if (response.success) {
        setRollbackCandidates(response.data.candidates || []);
      }
    } catch (error) {
      console.error('Error fetching rollback candidates:', error);
    }
  }, [request]);

  const fetchSuspiciousActivity = useCallback(async () => {
    try {
      const response = await request('/api/mcp/audit/suspicious-activity?hours=24');
      if (response.success) {
        setSuspiciousActivity(response.data.suspiciousPatterns || []);
      }
    } catch (error) {
      console.error('Error fetching suspicious activity:', error);
    }
  }, [request]);

  useEffect(() => {
    fetchAuditData();
    fetchRollbackCandidates();
    fetchSuspiciousActivity();
  }, [fetchAuditData, fetchRollbackCandidates, fetchSuspiciousActivity]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const applyFilters = () => {
    fetchAuditData(1);
  };

  const clearFilters = () => {
    setFilters({
      collection: '',
      operationType: '',
      startDate: '',
      endDate: '',
      entityId: '',
      userId: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const performRollback = async (auditId) => {
    if (!rollbackReason.trim()) {
      toast.error('Please provide a reason for the rollback');
      return;
    }

    try {
      const response = await request(`/api/mcp/audit/rollback/${auditId}`, {
        method: 'POST',
        data: { reason: rollbackReason }
      });

      if (response.success) {
        toast.success('Rollback completed successfully');
        setShowRollbackModal(false);
        setRollbackReason('');
        fetchAuditData(pagination.page);
        fetchRollbackCandidates();
      } else {
        throw new Error(response.error || 'Rollback failed');
      }
    } catch (error) {
      toast.error(`Rollback failed: ${error.message}`);
    }
  };

  const exportAuditData = async () => {
    try {
      const params = new URLSearchParams({
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      });

      // This would typically trigger a file download
      const response = await request(`/api/mcp/audit/changes?${params}&export=true`);
      
      if (response.success) {
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit-log-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        toast.success('Audit data exported successfully');
      }
    } catch (error) {
      toast.error('Failed to export audit data');
    }
  };

  const getOperationIcon = (operationType) => {
    switch (operationType) {
      case 'create':
        return <UserIcon className="h-4 w-4 text-green-600" />;
      case 'update':
        return <ClockIcon className="h-4 w-4 text-blue-600" />;
      case 'delete':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />;
      case 'rollback':
        return <ArrowUturnLeftIcon className="h-4 w-4 text-purple-600" />;
      default:
        return <CommandLineIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getOperationColor = (operationType) => {
    switch (operationType) {
      case 'create':
        return 'bg-green-50 border-green-200';
      case 'update':
        return 'bg-blue-50 border-blue-200';
      case 'delete':
        return 'bg-red-50 border-red-200';
      case 'rollback':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <ShieldCheckIcon className="h-6 w-6" />
            <span>Audit Trail Viewer</span>
          </h2>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={exportAuditData}
              className="flex items-center space-x-1"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              <span>Export</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAuditData(pagination.page)}
              disabled={loading}
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <span className="font-medium">Filters</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Collection</label>
            <select
              value={filters.collection}
              onChange={(e) => handleFilterChange('collection', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="">All Collections</option>
              <option value="students">Students</option>
              <option value="courses">Courses</option>
              <option value="attendance">Attendance</option>
              <option value="scores">Scores</option>
              <option value="fees">Fees</option>
              <option value="mcp_operations">MCP Operations</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Operation</label>
            <select
              value={filters.operationType}
              onChange={(e) => handleFilterChange('operationType', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="">All Operations</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="rollback">Rollback</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="datetime-local"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="datetime-local"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Entity ID</label>
            <input
              type="text"
              value={filters.entityId}
              onChange={(e) => handleFilterChange('entityId', e.target.value)}
              placeholder="Entity ID"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">User ID</label>
            <input
              type="text"
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              placeholder="User ID"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-3 mt-4">
          <Button
            onClick={applyFilters}
            disabled={loading}
            className="flex items-center space-x-1"
          >
            <MagnifyingGlassIcon className="h-4 w-4" />
            <span>Apply Filters</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={clearFilters}
            disabled={loading}
          >
            Clear Filters
          </Button>
          
          <div className="text-sm text-gray-500">
            Showing {auditData.length} of {pagination.total} entries
          </div>
        </div>
      </Card>

      {/* Rollback Candidates Alert */}
      {rollbackCandidates.length > 0 && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-2 mb-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">Rollback Candidates Available</span>
          </div>
          <p className="text-sm text-yellow-700 mb-3">
            {rollbackCandidates.length} operations can be safely rolled back within the last 24 hours.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRollbackModal(true)}
            className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
          >
            View Rollback Candidates
          </Button>
        </Card>
      )}

      {/* Suspicious Activity Alert */}
      {suspiciousActivity.length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center space-x-2 mb-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-800">Suspicious Activity Detected</span>
          </div>
          <p className="text-sm text-red-700 mb-3">
            {suspiciousActivity.length} suspicious patterns detected in the last 24 hours.
          </p>
          <div className="space-y-2">
            {suspiciousActivity.slice(0, 3).map((activity, index) => (
              <div key={index} className="text-sm text-red-700">
                • {activity.description} ({activity.severity} severity)
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Audit Trail Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Audit Trail</h3>
        
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : auditData.length > 0 ? (
          <div className="space-y-3">
            {auditData.map((entry, index) => (
              <div
                key={entry._id || index}
                className={`p-4 border rounded-lg ${getOperationColor(entry.operationType)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getOperationIcon(entry.operationType)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-1">
                        <span className="font-medium text-sm">
                          {entry.operationType.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600">
                          {entry.collectionName}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          #{entry.entityId?.slice(-8)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                        {entry.userId && (
                          <span>User: {entry.userId}</span>
                        )}
                        {entry.mcpCommand && (
                          <span>Command: {entry.mcpCommand}</span>
                        )}
                      </div>
                      
                      {entry.changeHash && (
                        <div className="mt-1">
                          <span className="text-xs text-gray-400 font-mono">
                            Hash: {entry.changeHash.slice(0, 16)}...
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {entry.rolledBack && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                        ROLLED BACK
                      </span>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEntry(
                        selectedEntry?._id === entry._id ? null : entry
                      )}
                    >
                      <EyeIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {selectedEntry?._id === entry._id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {entry.beforeState && (
                        <div>
                          <h5 className="font-medium text-sm mb-2">Before State</h5>
                          <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                            {formatValue(entry.beforeState)}
                          </pre>
                        </div>
                      )}
                      
                      {entry.afterState && (
                        <div>
                          <h5 className="font-medium text-sm mb-2">After State</h5>
                          <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                            {formatValue(entry.afterState)}
                          </pre>
                        </div>
                      )}
                    </div>
                    
                    {entry.metadata && (
                      <div className="mt-3">
                        <h5 className="font-medium text-sm mb-2">Metadata</h5>
                        <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                          {formatValue(entry.metadata)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <ShieldCheckIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No audit entries found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        )}
        
        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAuditData(pagination.page - 1)}
                disabled={pagination.page === 1 || loading}
              >
                Previous
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAuditData(pagination.page + 1)}
                disabled={!pagination.hasMore || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Rollback Modal */}
      {showRollbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Rollback Candidates</h3>
            
            <div className="space-y-3 mb-6">
              {rollbackCandidates.map((candidate, index) => (
                <div key={candidate._id || index} className="p-3 border border-gray-200 rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">
                        {candidate.operationType} - {candidate.collectionName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(candidate.timestamp).toLocaleString()}
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedEntry(candidate);
                        setRollbackReason('');
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      Rollback
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {selectedEntry && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Rollback Reason</label>
                <textarea
                  value={rollbackReason}
                  onChange={(e) => setRollbackReason(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 h-20 resize-none"
                  placeholder="Enter reason for rollback..."
                />
              </div>
            )}
            
            <div className="flex items-center space-x-3">
              {selectedEntry && (
                <Button
                  onClick={() => performRollback(selectedEntry._id)}
                  disabled={!rollbackReason.trim()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Confirm Rollback
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => {
                  setShowRollbackModal(false);
                  setSelectedEntry(null);
                  setRollbackReason('');
                }}
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AuditViewer;
