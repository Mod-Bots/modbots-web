"use client";

import { useEffect, useState } from "react";

export const useLaunchUid = (): string | null => {
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    setUid(new URLSearchParams(window.location.search).get("uid"));
  }, []);

  return uid;
};

export const uidQuery = (uid: string | null): string =>
  uid === null ? "" : `?uid=${encodeURIComponent(uid)}`;
