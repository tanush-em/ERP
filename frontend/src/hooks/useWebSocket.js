import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const useWebSocket = (serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005') => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [subscriptions, setSubscriptions] = useState(new Set());
  
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = useRef(1000);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: reconnectDelay.current,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('WebSocket connected:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttempts.current = 0;
      reconnectDelay.current = 1000;
    });

    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
      
      reconnectAttempts.current += 1;
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, 10000);
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setConnectionError(null);
      
      // Re-subscribe to all active subscriptions
      subscriptions.forEach(subscription => {
        const [stream, room] = subscription.split(':');
        newSocket.emit('subscribe', { stream, room });
      });
    });

    newSocket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed after maximum attempts');
      setConnectionError('Failed to reconnect after maximum attempts');
    });

    // Handle connection establishment
    newSocket.on('connection_established', (data) => {
      console.log('Connection established:', data);
    });

    // Handle subscription confirmations
    newSocket.on('subscribed', (data) => {
      console.log('Subscribed to:', data);
    });

    newSocket.on('unsubscribed', (data) => {
      console.log('Unsubscribed from:', data);
    });

    // Handle errors
    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
      setConnectionError(error.message);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up WebSocket connection');
      newSocket.removeAllListeners();
      newSocket.disconnect();
    };
  }, [serverUrl]);

  // Subscribe to a data stream
  const subscribe = useCallback((stream, room = 'default', callback) => {
    if (!socket || !isConnected) {
      console.warn('Cannot subscribe: socket not connected');
      return;
    }

    const subscriptionKey = `${stream}:${room}`;
    
    // Add to subscriptions set
    setSubscriptions(prev => new Set(prev).add(subscriptionKey));
    
    // Subscribe to the stream
    socket.emit('subscribe', { stream, room });
    
    // Set up listener for stream data
    const eventName = 'stream_data';
    const wrappedCallback = (data) => {
      if (data.stream === stream) {
        callback(data);
      }
    };
    
    socket.on(eventName, wrappedCallback);
    
    // Return unsubscribe function
    return () => {
      socket.off(eventName, wrappedCallback);
      socket.emit('unsubscribe', { stream, room });
      setSubscriptions(prev => {
        const newSet = new Set(prev);
        newSet.delete(subscriptionKey);
        return newSet;
      });
    };
  }, [socket, isConnected]);

  // Unsubscribe from a data stream
  const unsubscribe = useCallback((stream, room = 'default') => {
    if (!socket) return;

    const subscriptionKey = `${stream}:${room}`;
    
    socket.emit('unsubscribe', { stream, room });
    
    // Remove from subscriptions set
    setSubscriptions(prev => {
      const newSet = new Set(prev);
      newSet.delete(subscriptionKey);
      return newSet;
    });
    
    // Remove all listeners for this stream
    socket.removeAllListeners('stream_data');
  }, [socket]);

  // Get initial data for a stream
  const getInitialData = useCallback(async (stream) => {
    if (!socket || !isConnected) {
      console.warn('Cannot get initial data: socket not connected');
      return null;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for initial data'));
      }, 10000);

      socket.emit('get_initial_data', { stream });
      
      const handleInitialData = (data) => {
        if (data.stream === stream) {
          clearTimeout(timeout);
          socket.off('initial_data', handleInitialData);
          resolve(data.data);
        }
      };

      socket.on('initial_data', handleInitialData);
    });
  }, [socket, isConnected]);

  // Send a message to the server
  const emit = useCallback((event, data) => {
    if (!socket || !isConnected) {
      console.warn('Cannot emit: socket not connected');
      return;
    }

    socket.emit(event, data);
  }, [socket, isConnected]);

  // Listen for specific events
  const on = useCallback((event, callback) => {
    if (!socket) return;

    socket.on(event, callback);
    
    // Return cleanup function
    return () => {
      socket.off(event, callback);
    };
  }, [socket]);

  // Send ping to keep connection alive
  const ping = useCallback(() => {
    if (!socket || !isConnected) return;

    socket.emit('ping');
  }, [socket, isConnected]);

  // Set up periodic ping
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(ping, 30000); // Ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [isConnected, ping]);

  // Get connection status
  const getStatus = useCallback(() => {
    return {
      isConnected,
      connectionError,
      socketId: socket?.id,
      subscriptions: Array.from(subscriptions),
      reconnectAttempts: reconnectAttempts.current
    };
  }, [isConnected, connectionError, socket, subscriptions]);

  // Force reconnect
  const reconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      socket.connect();
    }
  }, [socket]);

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
