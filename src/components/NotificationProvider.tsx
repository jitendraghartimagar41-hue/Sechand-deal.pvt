import React, { createContext, useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, ShoppingBag, Truck, AlertTriangle, MessageSquare } from 'lucide-react';

interface Notification {
  id: number;
  type: 'order' | 'shipping' | 'inventory' | 'inquiry';
  title: string;
  message: string;
  is_read: number;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toast, setToast] = useState<Notification | null>(null);

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) return;

    // Initial fetch
    fetch('/api/notifications', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setNotifications(data);
        }
      })
      .catch(() => setNotifications([]));

    // WebSocket setup
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'NOTIFICATION_RECEIVED') {
        setNotifications(prev => [data.payload, ...prev]);
        setToast(data.payload);
        // Auto-hide toast
        setTimeout(() => setToast(null), 5000);
      }
    };

    return () => ws.close();
  }, []);

  const markAsRead = async (id: number) => {
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
  };

  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.is_read).length : 0;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead }}>
      {children}
      
      {/* Real-time Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-0 left-1/2 z-[100] w-[90%] max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-start gap-4"
          >
            <div className={`p-2 rounded-xl ${
              toast.type === 'order' ? 'bg-emerald-100 text-emerald-600' :
              toast.type === 'inventory' ? 'bg-amber-100 text-amber-600' :
              toast.type === 'shipping' ? 'bg-blue-100 text-blue-600' :
              'bg-purple-100 text-purple-600'
            }`}>
              {toast.type === 'order' && <ShoppingBag size={20} />}
              {toast.type === 'inventory' && <AlertTriangle size={20} />}
              {toast.type === 'shipping' && <Truck size={20} />}
              {toast.type === 'inquiry' && <MessageSquare size={20} />}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 text-sm">{toast.title}</h4>
              <p className="text-gray-600 text-xs mt-1">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
