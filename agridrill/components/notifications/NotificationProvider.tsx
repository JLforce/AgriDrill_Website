"use client";

import type { ReactNode } from "react";

import ObstacleNotificationModal from "./ObstacleNotificationModal";
import SeedlingEmptyModal from "./SeedlingEmptyModal";
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

  const isObstacleNotification =
    activeNotification?.type === "obstacle_detected";

  const isSeedlingEmptyNotification =
    activeNotification?.type === "seedling_empty";

  return (
    <>
      {children}

      <ObstacleNotificationModal
        open={isObstacleNotification}
        onDismiss={dismissNotification}
      />

      <SeedlingEmptyModal
        open={isSeedlingEmptyNotification}
        onClose={dismissNotification}
      />
    </>
  );
}