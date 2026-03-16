import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  X,
  Check,
  Calendar,
  Gift,
  Building,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { apiClient } from "../../lib/api-client";
import { useAuthStore } from "../../store/authStore";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import toast from "react-hot-toast";

interface Notification {
  id: string;
  type: "reservation" | "abonnement" | "parrainage" | "domiciliation" | "promo";
  titre: string;
  message: string;
  lue: boolean;
  created_at: string;
}

const NotificationCenter: React.FC = () => {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const response = await apiClient.getNotifications();
      const data = (response.data as Notification[]) || [];
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.lue).length);
    } catch {
      // silent for polling
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, loadNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await apiClient.markNotificationRead(id);
      loadNotifications();
    } catch {
      toast.error("Erreur lors du marquage");
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await apiClient.markAllNotificationsRead();
      loadNotifications();
    } catch {
      toast.error("Erreur lors du marquage");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await apiClient.deleteNotification(id);
      loadNotifications();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "reservation":
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case "abonnement":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "parrainage":
        return <Gift className="w-5 h-5 text-accent" />;
      case "domiciliation":
        return <Building className="w-5 h-5 text-teal-600" />;
      case "promo":
        return <Gift className="w-5 h-5 text-orange-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-accent transition-colors rounded-lg hover:bg-gray-100"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-accent/5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-gray-900">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Tout marquer comme lu
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notif.lue ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {notif.titre}
                            </h4>
                            <button
                              onClick={() => deleteNotification(notif.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {notif.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(notif.created_at), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </span>
                            {!notif.lue && (
                              <button
                                onClick={() => markAsRead(notif.id)}
                                className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                Marquer comme lu
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

                    <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Fermer
              </button>
              <Link
                to="/app/notifications"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Tout voir
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
