export interface UpdateCheckResult {
  latestVersion: string | null;
  updateAvailable: boolean;
  updateReady: boolean;
}

interface UpdateResponse {
  error?: unknown;
  latestVersion?: unknown;
  updateAvailable?: unknown;
  updateReady?: unknown;
}

export const updateCheckStateEvent = "modbots:update-check-state";
export const automaticUpdateCheckInterval = 24 * 60 * 60 * 1_000;
export const failedUpdateCheckRetryInterval = 60 * 60 * 1_000;

const lastCheckAttemptStorageKey = "modbots.web-update.last-check-attempt";
const lastSuccessfulCheckStorageKey =
  "modbots.web-update.last-successful-check";
const lastNotifiedVersionStorageKey =
  "modbots.web-update.last-notified-version";

let checkInFlight: Promise<UpdateCheckResult> | null = null;
let manualCheckCount = 0;

const readStoredTime = (key: string): number | null => {
  const stored = Number(window.localStorage.getItem(key));
  return Number.isFinite(stored) && stored > 0 ? stored : null;
};

const signalUpdateCheckState = () => {
  window.dispatchEvent(new CustomEvent(updateCheckStateEvent));
};

const recordCheckAttempt = (successful: boolean) => {
  const checkedAt = Date.now();
  window.localStorage.setItem(lastCheckAttemptStorageKey, String(checkedAt));

  if (successful) {
    window.localStorage.setItem(
      lastSuccessfulCheckStorageKey,
      String(checkedAt),
    );
  }

  signalUpdateCheckState();
};

export const getTimeUntilAutomaticUpdateCheck = (): number => {
  const now = Date.now();
  const lastSuccessfulCheck = readStoredTime(lastSuccessfulCheckStorageKey);

  if (lastSuccessfulCheck !== null) {
    const timeUntilRegularCheck =
      lastSuccessfulCheck + automaticUpdateCheckInterval - now;

    if (timeUntilRegularCheck > 0) {
      return Math.min(timeUntilRegularCheck, automaticUpdateCheckInterval);
    }
  }

  const lastCheckAttempt = readStoredTime(lastCheckAttemptStorageKey);

  if (lastCheckAttempt === null) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      lastCheckAttempt + failedUpdateCheckRetryInterval - now,
      failedUpdateCheckRetryInterval,
    ),
  );
};

export const beginManualUpdateCheck = (): (() => void) => {
  manualCheckCount += 1;
  signalUpdateCheckState();
  let ended = false;

  return () => {
    if (ended) {
      return;
    }

    ended = true;
    manualCheckCount = Math.max(0, manualCheckCount - 1);
    signalUpdateCheckState();
  };
};

export const isManualUpdateCheckActive = (): boolean => manualCheckCount > 0;

export const wasUpdateVersionNotified = (version: string): boolean =>
  window.localStorage.getItem(lastNotifiedVersionStorageKey) === version;

export const recordNotifiedUpdateVersion = (version: string) => {
  window.localStorage.setItem(lastNotifiedVersionStorageKey, version);
};

export const checkForWebUpdate = async (
  currentVersion: string,
  requestToken: string | number = Date.now(),
): Promise<UpdateCheckResult> => {
  if (checkInFlight !== null) {
    return checkInFlight;
  }

  checkInFlight = (async () => {
    let successful = false;

    try {
      const response = await fetch(
        `/api/check-updates?currentVersion=${encodeURIComponent(currentVersion)}&check=${encodeURIComponent(requestToken)}`,
        { cache: "no-store" },
      );
      const result = (await response.json()) as UpdateResponse;

      if (!response.ok) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "GitHub could not be checked for updates.",
        );
      }

      if (
        typeof result.updateAvailable !== "boolean" ||
        typeof result.updateReady !== "boolean" ||
        !(
          result.latestVersion === null ||
          typeof result.latestVersion === "string"
        ) ||
        (result.updateAvailable && typeof result.latestVersion !== "string")
      ) {
        throw new Error("GitHub could not be checked for updates.");
      }

      successful = true;
      return {
        latestVersion: result.latestVersion,
        updateAvailable: result.updateAvailable,
        updateReady: result.updateReady,
      };
    } finally {
      recordCheckAttempt(successful);
    }
  })();

  try {
    return await checkInFlight;
  } finally {
    checkInFlight = null;
  }
};
