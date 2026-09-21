"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Notification } from "@/types/notification";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeNotification, setActiveNotification] =
    useState<Notification | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    let mounted = true;

    const loadNotifications = async () => {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (fetchError) {
        console.error(
          "Failed to load notifications:",
          fetchError
        );

        if (mounted) {
          setError("Failed to load notifications.");
          setIsLoading(false);
        }

        return;
      }

      if (mounted) {
        setNotifications(data ?? []);
        setIsLoading(false);
      }
    };

    loadNotifications();

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const notification = payload.new as Notification;

          setNotifications((current) => [
            notification,
            ...current,
          ]);

          if (
            notification.type === "obstacle_detected" ||
            notification.type === "seedling_empty"
          ) {
            setActiveNotification(notification);
        }
        }
      )
      .subscribe((status) => {
        console.log(
          "Notification Realtime status:",
          status
        );
      });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const dismissNotification = async () => {
    if (!activeNotification) {
      return;
    }

    const notificationId = activeNotification.id;

    setActiveNotification(null);

    const supabase = getSupabaseBrowserClient();

    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (updateError) {
      console.error(
        "Failed to mark notification as read:",
        updateError
      );

      return;
    }

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              is_read: true,
            }
          : notification
      )
    );
  };

  return {
    notifications,
    activeNotification,
    dismissNotification,
    isLoading,
    error,
  };
}