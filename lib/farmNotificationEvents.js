/** Refreshes the shared in-app unread notification badge after farm changes. */
export function dispatchFarmNotificationUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("krishi:notification-update"));
  }
}
