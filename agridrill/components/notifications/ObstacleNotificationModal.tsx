"use client";

interface ObstacleNotificationModalProps {
  readonly open: boolean;
  readonly onDismiss: () => void;
}

export default function ObstacleNotificationModal({
  open,
  onDismiss,
}: ObstacleNotificationModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="obstacle-notification-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="text-center">
          <div className="mb-4 text-4xl" aria-hidden="true">
            🚨
          </div>

          <h2
            id="obstacle-notification-title"
            className="text-xl font-bold text-gray-900"
          >
            Obstacle Detected
          </h2>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            An obstacle has been detected by the AgriDrill system.
          </p>

          <button
            type="button"
            onClick={onDismiss}
            className="mt-6 w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}