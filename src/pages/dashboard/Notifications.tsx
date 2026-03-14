import React, { useState, useEffect } from "react";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Calendar,
  Gift,
  Building,
  CheckCircle,
  Trash2,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "../../lib/api-client";
import { useAuthStore } from "../../store/authStore";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import { logger } from "../../utils/logger";

interface Notification {
  id: string;
  type: "reservation" | "abonnement" | "parrainage" | "domiciliation" | "promo";
  titre: string;
  message: string;
  lue: boolean;
  created_at: string;
}

type FilterType = "all" | "unread" | "reservation" | "parrainage" | "domiciliation" | "abonnement" | "promo";

const Notifications: React.FC = () => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await apiClient.getNotifications();
      const raw = response.data;
      const data: Notification[] = Array.isArray(raw)
        ? (raw as Notification[])
        : Array.isArray((raw as Record<string, unknown>)?.notifications)
        ? ((raw as Record<string, unknown>).notifications as Notification[])
        : Array.isArray((raw as Record<string, unknown>)?.data)
        ? ((raw as Record<string, unknown>).data as Notification[])
        : [];
      setNotifications(data);
    } catch (error) {
      logger.error("Erreur chargement notifications:", error instanceof Error ? error.message : String(error));
      toast.error("Impossible de charger les notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    const previous = notifications;
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, lue: true } : n)
    );
    try {
      const res = await apiClient.markNotificationRead(id);
      if (!res.success) {
        setNotifications(previous);
        toast.error("Erreur lors du marquage");
      }
    } catch (error) {
      setNotifications(previous);
      logger.error("Erreur marquage lu:", error instanceof Error ? error.message : String(error));
      toast.error("Erreur lors du marquage");
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await apiClient.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, lue: true })));
      toast.success("Toutes les notifications ont été marquées comme lues");
    } catch (error) {
      logger.error("Erreur marquage tout lu:", error instanceof Error ? error.message : String(error));
      toast.error("Erreur lors du marquage");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await apiClient.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success("Notification supprimée");
    } catch (error) {
      logger.error("Erreur suppression notification:", error instanceof Error ? error.message : String(error));
      toast.error("Erreur lors de la suppression");
    }
  };

  const deleteAllRead = async () => {
    const readNotifications = notifications.filter(n => n.lue);
    if (readNotifications.length === 0) {
      toast.error("Aucune notification lue à supprimer");
      return;
    }

    try {
      await Promise.all(
        readNotifications.map(n => apiClient.deleteNotification(n.id))
      );
      setNotifications(prev => prev.filter(n => !n.lue));
      toast.success(`${readNotifications.length} notification(s) supprimée(s)`);
    } catch (error) {
      logger.error("Erreur suppression notifications:", error instanceof Error ? error.message : String(error));
      toast.error("Erreur lors de la suppression");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "reservation":
        return <Calendar className="w-6 h-6 text-blue-600" />;
      case "abonnement":
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case "parrainage":
        return <Gift className="w-6 h-6 text-accent" />;
      case "domiciliation":
        return <Building className="w-6 h-6 text-teal-600" />;
      case "promo":
        return <Gift className="w-6 h-6 text-orange-600" />;
      default:
        return <Bell className="w-6 h-6 text-gray-600" />;
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === "all") return true;
    if (filter === "unread") return !notif.lue;
    return notif.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.lue).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? (
              <>
                Vous avez <span className="font-semibold text-accent">{unreadCount}</span> notification{unreadCount > 1 ? "s" : ""} non lue{unreadCount > 1 ? "s" : ""}
              </>
            ) : (
              "Aucune notification non lue"
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              className="flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              Tout marquer comme lu
            </Button>
          )}
          {notifications.some(n => n.lue) && (
            <Button
              onClick={deleteAllRead}
              variant="outline"
              className="flex items-center gap-2 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer les lues
            </Button>
          )}
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filtrer:</span>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "all", label: "Toutes", count: notifications.length },
              { value: "unread", label: "Non lues", count: unreadCount },
              { value: "reservation", label: "Réservations", count: notifications.filter(n => n.type === "reservation").length },
              { value: "parrainage", label: "Parrainages", count: notifications.filter(n => n.type === "parrainage").length },
              { value: "domiciliation", label: "Domiciliations", count: notifications.filter(n => n.type === "domiciliation").length },
              { value: "abonnement", label: "Abonnements", count: notifications.filter(n => n.type === "abonnement").length },
              { value: "promo", label: "Promotions", count: notifications.filter(n => n.type === "promo").length },
            ].map(({ value, label, count }) => (
              <button
                key={value}
                onClick={() => setFilter(value as FilterType)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === value
                    ? "bg-accent text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {label} {count > 0 && <span className="ml-1">({count})</span>}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Aucune notification"
          description={
            filter === "all"
              ? "Vous n'avez aucune notification pour le moment"
              : filter === "unread"
              ? "Aucune notification non lue"
              : `Aucune notification de type "${filter}"`
          }
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredNotifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={`p-5 hover:shadow-lg transition-all ${
                    !notif.lue
                      ? "bg-gradient-to-r from-accent/5 to-primary/5 border-l-4 border-accent"
                      : "border-l-4 border-transparent"
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className={`p-3 rounded-full ${!notif.lue ? "bg-white shadow-md" : "bg-gray-100"}`}>
                        {getIcon(notif.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg text-gray-900">
                              {notif.titre}
                            </h3>
                            {!notif.lue && (
                              <span className="px-2 py-0.5 bg-accent text-white text-xs font-bold rounded-full">
                                NOUVEAU
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(notif.created_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                          </span>
                          <span>
                            ({formatDistanceToNow(new Date(notif.created_at), {
                              addSuffix: true,
                              locale: fr,
                            })})
                          </span>
                        </div>
                        {!notif.lue && (
                          <Button
                            onClick={() => markAsRead(notif.id)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Marquer comme lu
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Notifications;
