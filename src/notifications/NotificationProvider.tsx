"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type NotificationTone = "info" | "success" | "warning" | "error";

export type NotificationCategory =
  | "direct"
  | "moderation"
  | "room"
  | "conversation"
  | "research"
  | "system"
  | "study";

export type NotificationPreferences = Record<NotificationCategory, boolean>;

export const defaultNotificationPreferences: NotificationPreferences = {
  direct: true,
  moderation: true,
  room: true,
  conversation: true,
  research: true,
  system: true,
  study: true,
};

export interface AppNotification {
  category: NotificationCategory;
  createdAt: number;
  dedupeKey?: string;
  eventSequence?: string;
  id: string;
  message?: string;
  read: boolean;
  title: string;
  tone: NotificationTone;
}

export interface NotificationInput {
  category?: NotificationCategory;
  dedupeKey?: string;
  eventSequence?: string;
  message?: string;
  title: string;
  tone?: NotificationTone;
}

interface NotificationState {
  lastRoomEventSequence: string | null;
  notifications: AppNotification[];
  preferences: NotificationPreferences;
  scope: string | null;
}

interface NotificationContextValue {
  clearNotifications: () => void;
  configureScope: (scope: string | null) => void;
  dismissNotification: (id: string) => void;
  lastRoomEventSequence: string | null;
  markAllNotificationsRead: () => void;
  notificationScope: string | null;
  notifications: AppNotification[];
  notify: (notification: NotificationInput) => string | null;
  preferences: NotificationPreferences;
  recordRoomEventSequence: (sequence: string) => void;
  setCategoryEnabled: (
    category: NotificationCategory,
    enabled: boolean,
  ) => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

const notificationLimit = 100;
const storagePrefix = "modbots.web.notifications.v1.";

const emptyState = (scope: string | null): NotificationState => ({
  lastRoomEventSequence: null,
  notifications: [],
  preferences: defaultNotificationPreferences,
  scope,
});

const isNotificationCategory = (
  value: unknown,
): value is NotificationCategory =>
  value === "direct" ||
  value === "moderation" ||
  value === "room" ||
  value === "conversation" ||
  value === "research" ||
  value === "system" ||
  value === "study";

const loadState = (scope: string): NotificationState => {
  try {
    const stored = window.localStorage.getItem(`${storagePrefix}${scope}`);

    if (stored === null) {
      return emptyState(scope);
    }

    const parsed = JSON.parse(stored) as Record<string, unknown>;
    const rawPreferences =
      typeof parsed.preferences === "object" && parsed.preferences !== null
        ? (parsed.preferences as Record<string, unknown>)
        : {};
    const preferences = { ...defaultNotificationPreferences };

    for (const category of Object.keys(defaultNotificationPreferences)) {
      if (
        isNotificationCategory(category) &&
        typeof rawPreferences[category] === "boolean"
      ) {
        preferences[category] = rawPreferences[category];
      }
    }

    const notifications = Array.isArray(parsed.notifications)
      ? parsed.notifications
          .filter(
            (value): value is Record<string, unknown> =>
              Boolean(value) && typeof value === "object",
          )
          .filter(
            (value) =>
              typeof value.id === "string" &&
              typeof value.title === "string" &&
              typeof value.createdAt === "number" &&
              typeof value.read === "boolean" &&
              isNotificationCategory(value.category) &&
              (value.tone === "info" ||
                value.tone === "success" ||
                value.tone === "warning" ||
                value.tone === "error"),
          )
          .map((value) => value as unknown as AppNotification)
          .slice(-notificationLimit)
      : [];

    return {
      lastRoomEventSequence:
        typeof parsed.lastRoomEventSequence === "string"
          ? parsed.lastRoomEventSequence
          : null,
      notifications,
      preferences,
      scope,
    };
  } catch {
    return emptyState(scope);
  }
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NotificationState>(() => emptyState(null));
  const nextNotificationId = useRef(0);

  useEffect(() => {
    if (state.scope === null) {
      return;
    }

    window.localStorage.setItem(
      `${storagePrefix}${state.scope}`,
      JSON.stringify({
        lastRoomEventSequence: state.lastRoomEventSequence,
        notifications: state.notifications,
        preferences: state.preferences,
      }),
    );
  }, [state]);

  const configureScope = useCallback((scope: string | null) => {
    setState((current) => {
      if (current.scope === scope) {
        return current;
      }

      return scope === null ? emptyState(null) : loadState(scope);
    });
  }, []);

  const notify = useCallback(
    (notification: NotificationInput): string | null => {
      const category = notification.category ?? "system";

      if (!state.preferences[category]) {
        return null;
      }

      nextNotificationId.current += 1;
      const id = `notification-${Date.now()}-${nextNotificationId.current}`;

      setState((current) => {
        if (
          notification.dedupeKey !== undefined &&
          current.notifications.some(
            (candidate) => candidate.dedupeKey === notification.dedupeKey,
          )
        ) {
          return current;
        }

        return {
          ...current,
          notifications: [
            ...current.notifications,
            {
              ...notification,
              category,
              createdAt: Date.now(),
              id,
              read: false,
              tone: notification.tone ?? "info",
            },
          ].slice(-notificationLimit),
        };
      });

      return id;
    },
    [state.preferences],
  );

  const dismissNotification = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      notifications: current.notifications.filter(
        (notification) => notification.id !== id,
      ),
    }));
  }, []);

  const clearNotifications = useCallback(() => {
    setState((current) => ({ ...current, notifications: [] }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((notification) =>
        notification.read ? notification : { ...notification, read: true },
      ),
    }));
  }, []);

  const setCategoryEnabled = useCallback(
    (category: NotificationCategory, enabled: boolean) => {
      setState((current) => ({
        ...current,
        preferences: { ...current.preferences, [category]: enabled },
      }));
    },
    [],
  );

  const recordRoomEventSequence = useCallback((sequence: string) => {
    setState((current) => ({
      ...current,
      lastRoomEventSequence: sequence,
    }));
  }, []);

  const unreadCount = useMemo(
    () =>
      state.notifications.reduce(
        (count, notification) => count + Number(!notification.read),
        0,
      ),
    [state.notifications],
  );
  const value = useMemo<NotificationContextValue>(
    () => ({
      clearNotifications,
      configureScope,
      dismissNotification,
      lastRoomEventSequence: state.lastRoomEventSequence,
      markAllNotificationsRead,
      notificationScope: state.scope,
      notifications: state.notifications,
      notify,
      preferences: state.preferences,
      recordRoomEventSequence,
      setCategoryEnabled,
      unreadCount,
    }),
    [
      clearNotifications,
      configureScope,
      dismissNotification,
      markAllNotificationsRead,
      notify,
      recordRoomEventSequence,
      setCategoryEnabled,
      state,
      unreadCount,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const notifications = useContext(NotificationContext);

  if (notifications === null) {
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  }

  return notifications;
}
