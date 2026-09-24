"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Notification } from "@/types/notification";

const NOTIFICATIONS_CHANNEL = "notifications-realtime";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeNotification, setActiveNotification] =
    useState<Notification | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    let mounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

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

    const setupRealtime = async () => {
      /*
       * Supabase reuses an existing channel when the same topic
       * already exists on the client. Remove a stale existing
       * notifications channel before creating a fresh one.
       */
      const existingChannel = supabase
        .getChannels()
        .find(
          (currentChannel) =>
            currentChannel.topic ===
            `realtime:${NOTIFICATIONS_CHANNEL}`
        );

      if (existingChannel) {
        await supabase.removeChannel(existingChannel);
      }

      if (!mounted) {
        return;
      }

      channel = supabase
        .channel(NOTIFICATIONS_CHANNEL)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
          },
          (payload) => {
            if (!mounted) {
              return;
            }

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
        .subscribe((status, realtimeError) => {
          console.log(
            "Notification Realtime status:",
            status
          );

          if (realtimeError) {
            console.error(
              "Notification Realtime error:",
              realtimeError
            );
          }
        });
    };

    loadNotifications();
    void setupRealtime();

    return () => {
      mounted = false;

      if (channel) {
        void supabase.removeChannel(channel);
        channel = null;
      }
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