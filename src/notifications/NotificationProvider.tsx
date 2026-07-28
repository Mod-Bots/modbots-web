"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

export type NotificationTone = "info" | "success" | "warning" | "error";

export interface AppNotification {
  createdAt: number;
  id: string;
  message?: string;
  read: boolean;
  title: string;
  tone: NotificationTone;
}

export interface NotificationInput {
  message?: string;
  title: string;
  tone?: NotificationTone;
}

interface NotificationContextValue {
  clearNotifications: () => void;
  dismissNotification: (id: string) => void;
  markAllNotificationsRead: () => void;
  notifications: AppNotification[];
  notify: (notification: NotificationInput) => string;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

const notificationLimit = 50;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const nextNotificationId = useRef(0);

  const notify = useCallback((notification: NotificationInput): string => {
    nextNotificationId.current += 1;
    const id = `notification-${nextNotificationId.current}`;

    setNotifications((current) =>
      [
        ...current,
        {
          ...notification,
          createdAt: Date.now(),
          id,
          read: false,
          tone: notification.tone ?? "info",
        },
      ].slice(-notificationLimit),
    );

    return id;
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id),
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.read ? notification : { ...notification, read: true },
      ),
    );
  }, []);

  const unreadCount = useMemo(
    () =>
      notifications.reduce(
        (count, notification) => count + Number(!notification.read),
        0,
      ),
    [notifications],
  );
  const value = useMemo<NotificationContextValue>(
    () => ({
      clearNotifications,
      dismissNotification,
      markAllNotificationsRead,
      notifications,
      notify,
      unreadCount,
    }),
    [
      clearNotifications,
      dismissNotification,
      markAllNotificationsRead,
      notifications,
      notify,
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
