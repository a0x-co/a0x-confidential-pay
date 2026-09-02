"use client";

import { useEffect, useState } from "react";

export function ExpiryCountdown({
  iat,
  ttlSeconds,
}: {
  iat: number;
  ttlSeconds: number;
}) {
  const [now, setNow] = useState<number>(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = Math.max(0, iat + ttlSeconds - now);
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return <span>expires {mm}:{ss}</span>;
}