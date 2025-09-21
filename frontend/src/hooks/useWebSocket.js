import { useState, useEffect, useCallback, useRef } from 'react';

const useWebSocket = (serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005') => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [subscriptions, setSubscriptions] = useState(new Set());
  
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = useRef(1000);

  // Mock WebSocket connection for now
  useEffect(() => {
    // Simulate connection after a delay
    const timer = setTimeout(() => {
      setIsConnected(true);
      setSocket({ id: 'mock-socket' });
      console.log('Mock WebSocket connected');
    }, 1000);

    return () => {
      clearTimeout(timer);
      console.log('Mock WebSocket disconnected');
      setIsConnected(false);
    };
  }, [serverUrl]);

  // Mock subscribe function
  const subscribe = useCallback((stream, room = 'default', callback) => {
    console.log(`Mock subscribe to ${stream}:${room}`);
    const subscriptionKey = `${stream}:${room}`;
    setSubscriptions(prev => new Set(prev).add(subscriptionKey));
    
    // Mock some data updates
    const mockData = {
      stream,
      data: {
        recent_operations: [
          { _id: '1', operationType: 'test_operation', status: 'completed', timestamp: new Date() }
        ]
      }
    };
    
    // Simulate periodic updates
    const interval = setInterval(() => {
      callback(mockData);
    }, 5000);
    
    return () => {
      clearInterval(interval);
      setSubscriptions(prev => {
        const newSet = new Set(prev);
        newSet.delete(subscriptionKey);
        return newSet;
      });
    };
  }, []);

  // Mock unsubscribe function
  const unsubscribe = useCallback((stream, room = 'default') => {
    console.log(`Mock unsubscribe from ${stream}:${room}`);
    const subscriptionKey = `${stream}:${room}`;
    setSubscriptions(prev => {
      const newSet = new Set(prev);
      newSet.delete(subscriptionKey);
      return newSet;
    });
  }, []);

  // Mock get initial data
  const getInitialData = useCallback(async (stream) => {
    console.log(`Mock getting initial data for ${stream}`);
    return Promise.resolve({
      recent_operations: [
        { _id: '1', operationType: 'mock_operation', status: 'completed', timestamp: new Date() }
      ]
    });
  }, []);

  // Mock emit function
  const emit = useCallback((event, data) => {
    console.log(`Mock emit ${event}:`, data);
  }, []);

  // Mock on function
  const on = useCallback((event, callback) => {
    console.log(`Mock listening to ${event}`);
    return () => console.log(`Mock stopped listening to ${event}`);
  }, []);

  // Mock ping function
  const ping = useCallback(() => {
    console.log('Mock ping');
  }, []);

  // Mock get status
  const getStatus = useCallback(() => {
    return {
      isConnected,
      connectionError,
      socketId: socket?.id,
      subscriptions: Array.from(subscriptions),
      reconnectAttempts: reconnectAttempts.current
    };
  }, [isConnected, connectionError, socket, subscriptions]);

  // Mock reconnect
  const reconnect = useCallback(() => {
    console.log('Mock reconnect');
    setIsConnected(false);
    setTimeout(() => setIsConnected(true), 1000);
  }, []);

  return {
    socket,
    isConnected,
    connectionError,
    subscribe,
    unsubscribe,
    getInitialData,
    emit,
    on,
    ping,
    getStatus,
    reconnect,
    subscriptions: Array.from(subscriptions)
  };
};

export { useWebSocket };
