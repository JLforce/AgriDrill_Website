export type AIIntent =
  | "general"
  | "machine_status"
  | "telemetry"
  | "operation"
  | "notification";

function normalizeMessage(message: string) {
  return message
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .trim();
}

export function detectAIIntent(message: string): AIIntent {
  const normalizedMessage = normalizeMessage(message);

  const machineStatusKeywords = [
    "machine status",
    "current status",
    "current machine",
    "machine currently",
    "is the machine running",
    "is the machine stopped",
    "machine state",
    "what is the machine status",
    "what's the machine status",
    "what is the current machine status",
    "what's the current machine status",
  ];

  const telemetryKeywords = [
    "how many holes",
    "hole count",
    "holes drilled",
    "how many seedlings",
    "seed count",
    "seedlings planted",
    "latest telemetry",
    "ir1",
    "ir4",
    "drive value",
    "drive speed",
  ];

  const operationKeywords = [
    "latest operation",
    "last operation",
    "previous operation",
    "operation history",
    "operation status",
    "what happened during the operation",
    "what happened in the latest operation",
    "how many obstacles",
    "obstacles in the latest operation",
    "obstacles in the last operation",
    "holes completed in the operation",
    "holes in the latest operation",
    "seeds in the latest operation",
    "seedlings in the latest operation",
  ];

  const notificationKeywords = [
    "latest alert",
    "latest notification",
    "recent alert",
    "recent notification",
    "machine alert",
    "machine notification",
    "was an obstacle detected",
    "obstacle alert",
    "obstacle notification",
    "seedling empty",
    "seedling alert",
    "seedling notification",
    "empty seedling",
    "conveyor alert",
    "conveyor notification",
  ];

  if (
    machineStatusKeywords.some((keyword) =>
      normalizedMessage.includes(keyword)
    )
  ) {
    return "machine_status";
  }

  if (
    telemetryKeywords.some((keyword) =>
      normalizedMessage.includes(keyword)
    )
  ) {
    return "telemetry";
  }

  if (
    operationKeywords.some((keyword) =>
      normalizedMessage.includes(keyword)
    )
  ) {
    return "operation";
  }

  if (
    notificationKeywords.some((keyword) =>
      normalizedMessage.includes(keyword)
    )
  ) {
    return "notification";
  }

  return "general";
}