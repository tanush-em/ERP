'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  PlayIcon, 
  PauseIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useWebSocket } from '@/hooks/useWebSocket';
import { formatDistanceToNow } from 'date-fns';

const LiveFeed = ({ feedType = 'mcp_operations', maxItems = 50, autoScroll = true }) => {
  const [items, setItems] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState('all');
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(autoScroll);

  const { 
    isConnected, 
    subscribe, 
    unsubscribe, 
    getInitialData 
  } = useWebSocket();

  // Handle real-time data updates
  const handleDataUpdate = useCallback((data) => {
    if (isPaused) return;

    const newItems = Array.isArray(data.data) ? data.data : [data.data];
    
    setItems(prevItems => {
      const updated = [...newItems, ...prevItems];
      return updated.slice(0, maxItems);
    });

    // Auto-scroll to top if enabled
    if (isAutoScrollEnabled) {
      setTimeout(() => {
        const feedContainer = document.getElementById('live-feed-container');
        if (feedContainer) {
          feedContainer.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [isPaused, maxItems, isAutoScrollEnabled]);

  // Subscribe to live feed
  useEffect(() => {
    if (!isConnected) return;

    // Get initial data
    getInitialData(feedType).then(initialData => {
      if (initialData && initialData.recent_operations) {
        setItems(initialData.recent_operations.slice(0, maxItems));
      } else if (initialData && initialData.recent_changes) {
        setItems(initialData.recent_changes.slice(0, maxItems));
      }
    });

    // Subscribe to live updates
    subscribe(feedType, 'default', handleDataUpdate);

    return () => {
      unsubscribe(feedType, 'default');
    };
  }, [isConnected, feedType, maxItems, subscribe, unsubscribe, getInitialData, handleDataUpdate]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'error':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      case 'running':
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default:
        return <ExclamationTriangleIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'failed':
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'running':
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter || item.operationType === filter;
  });

  const renderFeedItem = (item, index) => {
    const isOperation = feedType === 'mcp_operations';
    const timestamp = new Date(item.timestamp || item.createdAt);
    
    return (
      <div
        key={`${item._id || item.id}-${index}`}
        className={`p-3 border rounded-lg transition-all duration-200 hover:shadow-md ${getStatusColor(item.status)}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 flex-1">
            {getStatusIcon(item.status)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm">
                  {isOperation ? item.operationType : item.collectionName}
                </span>
                {item.entityId && (
                  <span className="text-xs text-gray-500 font-mono">
                    #{item.entityId.slice(-8)}
                  </span>
                )}
              </div>
              
              {item.description && (
                <p className="text-sm text-gray-600 mt-1 truncate">
                  {item.description}
                </p>
              )}
              
              {item.errorMessage && (
                <p className="text-sm text-red-600 mt-1 truncate">
                  {item.errorMessage}
                </p>
              )}
              
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span>
                  {formatDistanceToNow(timestamp, { addSuffix: true })}
                </span>
                
                {item.executionTime && (
                  <span>
                    {item.executionTime}ms
                  </span>
                )}
                
                {item.userId && (
                  <span>
                    User: {item.userId}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold">Live Feed</h3>
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-500">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              className="flex items-center space-x-1"
            >
              {isPaused ? (
                <PlayIcon className="h-4 w-4" />
              ) : (
                <PauseIcon className="h-4 w-4" />
              )}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setItems([]);
                if (isConnected) {
                  getInitialData(feedType).then(initialData => {
                    if (initialData && initialData.recent_operations) {
                      setItems(initialData.recent_operations.slice(0, maxItems));
                    }
                  });
                }
              }}
              className="flex items-center space-x-1"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 mt-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Filter:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="running">Running</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={isAutoScrollEnabled}
              onChange={(e) => setIsAutoScrollEnabled(e.target.checked)}
              className="rounded"
            />
            <span>Auto-scroll</span>
          </label>
          
          <span className="text-sm text-gray-500">
            {filteredItems.length} of {items.length} items
          </span>
        </div>
      </div>
      
      <div 
        id="live-feed-container"
        className="flex-1 overflow-y-auto p-4 space-y-2"
        style={{ maxHeight: '600px' }}
      >
        {filteredItems.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {isPaused ? (
              <div>
                <PauseIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p>Feed is paused</p>
                <p className="text-sm">Click Resume to continue receiving updates</p>
              </div>
            ) : (
              <div>
                <ClockIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p>No items to display</p>
                <p className="text-sm">Waiting for new {feedType.replace('_', ' ')}...</p>
              </div>
            )}
          </div>
        ) : (
          filteredItems.map(renderFeedItem)
        )}
      </div>
      
      {isPaused && (
        <div className="p-2 bg-yellow-50 border-t border-yellow-200 text-center">
          <span className="text-sm text-yellow-700">
            Feed is paused - new updates are not being displayed
          </span>
        </div>
      )}
    </Card>
  );
};

export default LiveFeed;
