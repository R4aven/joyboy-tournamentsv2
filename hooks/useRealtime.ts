"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export type Notification = {
  id: string;
  user_id: string;
  type: "match" | "tournament" | "challenge" | "payment" | "system" | string;
  title: string;
  message: string;
  is_read: boolean;
  link?: string | null;
  created_at: string;
};

export function useRealtime() {
  const { user } = useAuth();

  // Un seul client Supabase pour toute la durée de vie du hook.
  const supabase = useMemo(() => createClient(), []);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const unreadCount = notifications.reduce(
    (count, notification) => count + (notification.is_read ? 0 : 1),
    0
  );

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      setNotifications((data as Notification[]) ?? []);
    } catch (error) {
      console.error("Erreur récupération notifications :", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  /*
   * Récupération initiale des notifications.
   */
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  /*
   * Supabase Realtime
   */
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)

      /*
       * NOUVELLE NOTIFICATION
       */
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;

          setNotifications((current) => {
            // Empêche les doublons éventuels.
            if (current.some((notification) => notification.id === newNotification.id)) {
              return current;
            }

            return [newNotification, ...current].slice(0, 50);
          });

          /*
           * Toast
           */
          switch (newNotification.type) {
            case "challenge":
              toast.info(`⚔️ ${newNotification.title}`, {
                description: newNotification.message,
              });
              break;

            case "tournament":
              toast.success(`🏆 ${newNotification.title}`, {
                description: newNotification.message,
              });
              break;

            case "payment":
              toast.success(`💰 ${newNotification.title}`, {
                description: newNotification.message,
              });
              break;

            case "match":
              toast.info(`🎮 ${newNotification.title}`, {
                description: newNotification.message,
              });
              break;

            default:
              toast(newNotification.title, {
                description: newNotification.message,
              });
          }

          /*
           * Vibration mobile si disponible.
           */
          if (
            typeof navigator !== "undefined" &&
            "vibrate" in navigator
          ) {
            navigator.vibrate(150);
          }
        }
      )

      /*
       * NOTIFICATION MODIFIÉE
       */
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;

          setNotifications((current) =>
            current.map((notification) =>
              notification.id === updatedNotification.id
                ? updatedNotification
                : notification
            )
          );
        }
      )

      /*
       * NOTIFICATION SUPPRIMÉE
       */
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const deletedNotification = payload.old as Notification;

          setNotifications((current) =>
            current.filter(
              (notification) =>
                notification.id !== deletedNotification.id
            )
          );
        }
      )

      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error("Erreur Supabase Realtime notifications");
        }

        if (status === "TIMED_OUT") {
          console.error("Supabase Realtime notifications timeout");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user]);

  /*
   * Marquer UNE notification comme lue.
   */
  const markAsRead = useCallback(
    async (id: string) => {
      if (!user) return;

      try {
        const { error } = await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }

        setNotifications((current) =>
          current.map((notification) =>
            notification.id === id
              ? { ...notification, is_read: true }
              : notification
          )
        );
      } catch (error) {
        console.error("Erreur markAsRead :", error);
      }
    },
    [supabase, user]
  );

  /*
   * Marquer TOUTES les notifications comme lues.
   */
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) {
        throw error;
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );
    } catch (error) {
      console.error("Erreur markAllAsRead :", error);
    }
  }, [supabase, user]);

  /*
   * Supprimer UNE notification.
   */
  const deleteNotification = useCallback(
    async (id: string) => {
      if (!user) return;

      try {
        const { error } = await supabase
          .from("notifications")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }

        setNotifications((current) =>
          current.filter((notification) => notification.id !== id)
        );
      } catch (error) {
        console.error("Erreur deleteNotification :", error);
      }
    },
    [supabase, user]
  );

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
}