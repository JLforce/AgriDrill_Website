"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface Notification {
  id: number;
  created_at: string;
  type: string;
  message: string;
  is_read: boolean;
}

interface UseNotificationsResult {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  activeNotification: Notification | null;
  dismissNotification: () => void;
}

export function useNotifications(): UseNotificationsResult {
  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [activeNotification, setActiveNotification] =
    useState<Notification | null>(null);

  useEffect(() => {
    let isMounted = true;

    const supabase = getSupabaseBrowserClient();

    const loadNotifications = async () => {
      const { data, error: fetchError } =
        await supabase
          .from("notifications")
          .select(
            "id, created_at, type, message, is_read"
          )
          .order("created_at", {
            ascending: false,
          });

      if (!isMounted) {
        return;
      }

      if (fetchError) {
        console.error(
          "Failed to load notifications:",
          fetchError
        );

        setError(
          "Failed to load notifications."
        );

        setNotifications([]);
        setIsLoading(false);

        return;
      }

      const loadedNotifications = data ?? [];

      setNotifications(loadedNotifications);
      setError(null);
      setIsLoading(false);

      /*
       * Do not automatically open the notification
       * modal for old database records.
       *
       * activeNotification is reserved for newly
       * received realtime notifications.
       */
    };

    void loadNotifications();

    /*
     * IMPORTANT:
     * Each useNotifications() instance gets its own
     * Realtime channel.
     *
     * NotificationProvider and /notification both
     * use this hook, so they must not share the same
     * channel name.
     */
    const channelName = `notifications-realtime-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;

    const channel = supabase
      .channel(channelName)

      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          if (!isMounted) {
            return;
          }

          const newNotification =
            payload.new as Notification;

          setNotifications((current) => {
            const alreadyExists = current.some(
              (notification) =>
                notification.id ===
                newNotification.id
            );

            if (alreadyExists) {
              return current;
            }

            return [
              newNotification,
              ...current,
            ];
          });

          /*
           * Newly inserted notification becomes the
           * active notification used by the global
           * NotificationProvider.
           */
          setActiveNotification(
            newNotification
          );
        }
      )

      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          if (!isMounted) {
            return;
          }

          const updatedNotification =
            payload.new as Notification;

          setNotifications((current) =>
            current.map((notification) =>
              notification.id ===
              updatedNotification.id
                ? updatedNotification
                : notification
            )
          );

          /*
           * Keep the active notification synchronized
           * if the same notification is currently open.
           */
          setActiveNotification((current) => {
            if (
              current?.id !==
              updatedNotification.id
            ) {
              return current;
            }

            return updatedNotification;
          });
        }
      )

      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          if (!isMounted) {
            return;
          }

          const deletedId = Number(
            payload.old.id
          );

          setNotifications((current) =>
            current.filter(
              (notification) =>
                notification.id !== deletedId
            )
          );

          setActiveNotification((current) =>
            current?.id === deletedId
              ? null
              : current
          );
        }
      )

      .subscribe((status) => {
        console.log(
          `Notifications Realtime [${channelName}]:`,
          status
        );
      });

    return () => {
      isMounted = false;

      void supabase.removeChannel(channel);
    };
  }, []);

  const dismissNotification = () => {
    setActiveNotification(null);
  };

  return {
    notifications,
    isLoading,
    error,
    activeNotification,
    dismissNotification,
  };
}