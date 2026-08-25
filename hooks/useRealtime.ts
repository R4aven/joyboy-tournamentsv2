"use client";

import { useEffect, useState, useCallback } from "react";
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
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

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

      if (error) throw error;
      setNotifications((data as Notification[]) ?? []);
    } catch (e) {
      console.error("fetch notifications", e);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev]);

          // Toast selon type
          if (newNotif.type === "challenge") {
            toast.info(`⚔️ ${newNotif.title}`, { description: newNotif.message });
          } else if (newNotif.type === "tournament") {
            toast.success(`🏆 ${newNotif.title}`, { description: newNotif.message });
          } else if (newNotif.type === "payment") {
            toast.success(`💰 ${newNotif.title}`, { description: newNotif.message });
          } else {
            toast(newNotif.title, { description: newNotif.message });
          }

          // Son ou vibration si supporté (optionnel)
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate(150);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("id", id);

        if (error) throw error;
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      } catch (e) {
        console.error(e);
      }
    },
    [supabase]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  }, [user, supabase]);

  const deleteNotification = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from("notifications").delete().eq("id", id);
        if (error) throw error;
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      } catch (e) {
        console.error(e);
      }
    },
    [supabase]
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
