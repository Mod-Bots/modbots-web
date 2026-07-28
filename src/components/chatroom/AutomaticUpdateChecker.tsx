"use client";

import { useEffect } from "react";
import { useNotifications } from "@/notifications/NotificationProvider";
import {
  checkForWebUpdate,
  getTimeUntilAutomaticUpdateCheck,
  isManualUpdateCheckActive,
  recordNotifiedUpdateVersion,
  updateCheckStateEvent,
  wasUpdateVersionNotified,
} from "@/updates/update-check";

export function AutomaticUpdateChecker({
  currentVersion,
}: {
  currentVersion: string;
}) {
  const { notify } = useNotifications();

  useEffect(() => {
    let cancelled = false;
    let checkTimer: number | null = null;

    const clearCheckTimer = () => {
      if (checkTimer !== null) {
        window.clearTimeout(checkTimer);
        checkTimer = null;
      }
    };

    const runAutomaticCheck = async () => {
      checkTimer = null;

      if (cancelled || isManualUpdateCheckActive()) {
        return;
      }

      try {
        const result = await checkForWebUpdate(currentVersion);

        if (
          cancelled ||
          isManualUpdateCheckActive() ||
          !result.updateAvailable ||
          result.latestVersion === null ||
          wasUpdateVersionNotified(result.latestVersion)
        ) {
          return;
        }

        notify({
          title: "Web update available",
          message: `Version ${result.latestVersion}`,
        });
        recordNotifiedUpdateVersion(result.latestVersion);
      } catch {
        // The shared check timestamp schedules a quiet retry after a failure.
      }
    };

    const scheduleAutomaticCheck = () => {
      clearCheckTimer();

      if (cancelled || isManualUpdateCheckActive()) {
        return;
      }

      checkTimer = window.setTimeout(
        () => void runAutomaticCheck(),
        getTimeUntilAutomaticUpdateCheck(),
      );
    };

    window.addEventListener(updateCheckStateEvent, scheduleAutomaticCheck);
    scheduleAutomaticCheck();

    return () => {
      cancelled = true;
      clearCheckTimer();
      window.removeEventListener(updateCheckStateEvent, scheduleAutomaticCheck);
    };
  }, [currentVersion, notify]);

  return null;
}
