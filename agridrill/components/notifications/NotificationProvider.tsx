"use client";

import type { ReactNode } from "react";

import ObstacleNotificationModal from "./ObstacleNotificationModal";
import { useNotifications } from "@/hooks/useNotifications";

interface NotificationProviderProps {
  readonly children: ReactNode;
}

export default function NotificationProvider({
  children,
}: NotificationProviderProps) {
  const {
    activeNotification,
    dismissNotification,
  } = useNotifications();

  return (
    <>
      {children}

      <ObstacleNotificationModal
        open={activeNotification !== null}
        onDismiss={dismissNotification}
      />
    </>
  );
}