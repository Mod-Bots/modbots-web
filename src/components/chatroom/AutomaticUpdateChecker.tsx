"use client";

import { useEffect } from "react";
import { useNotifications } from "@/notifications/NotificationProvider";
import {
  checkForWebUpdate,
  failedUpdateCheckRetryInterval,
  getTimeUntilAutomaticUpdateCheck,
  recordNotifiedUpdateVersion,
  wasUpdateVersionNotified,
} from "@/updates/update-check";

const updatePollInterval = 5_000;
const updatePollLimit = 24;

export function AutomaticUpdateChecker({
  currentVersion,
}: {
  currentVersion: string;
}) {
  const { notify } = useNotifications();

  useEffect(() => {
    let cancelled = false;
    let checkTimer: number | null = null;
    let updatePollCount = 0;

    const clearCheckTimer = () => {
      if (checkTimer !== null) {
        window.clearTimeout(checkTimer);
        checkTimer = null;
      }
    };

    const scheduleCheck = (delay: number) => {
      clearCheckTimer();

      if (!cancelled) {
        checkTimer = window.setTimeout(() => void runAutomaticCheck(), delay);
      }
    };

    const scheduleAutomaticCheck = () => {
      scheduleCheck(getTimeUntilAutomaticUpdateCheck());
    };

    const scheduleUpdatePoll = () => {
      updatePollCount += 1;

      if (updatePollCount > updatePollLimit) {
        updatePollCount = 0;
        scheduleCheck(failedUpdateCheckRetryInterval);
        return;
      }

      scheduleCheck(updatePollInterval);
    };

    const runAutomaticCheck = async () => {
      checkTimer = null;

      try {
        const result = await checkForWebUpdate(currentVersion);

        if (cancelled) {
          return;
        }

        if (result.updateReady) {
          window.location.reload();
          return;
        }

        if (result.updateAvailable && result.latestVersion !== null) {
          if (!wasUpdateVersionNotified(result.latestVersion)) {
            notify({
              title: "Web update available",
              message: `Version ${result.latestVersion}`,
            });
            recordNotifiedUpdateVersion(result.latestVersion);
          }

          scheduleUpdatePoll();
          return;
        }

        updatePollCount = 0;
        scheduleAutomaticCheck();
      } catch {
        if (cancelled) {
          return;
        }

        if (updatePollCount > 0) {
          scheduleUpdatePoll();
          return;
        }

        scheduleAutomaticCheck();
      }
    };
    scheduleAutomaticCheck();

    return () => {
      cancelled = true;
      clearCheckTimer();
    };
  }, [currentVersion, notify]);

  return null;
}
