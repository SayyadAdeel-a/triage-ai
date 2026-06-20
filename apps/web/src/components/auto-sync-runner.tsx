"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { syncEmailsAction, syncLinkedInAction } from "@/app/actions";
import { useRouter } from "next/navigation";

export function AutoSyncRunner({
  initialEmailAutoSync = false,
  initialLinkedinAutoSync = false,
  initialEmailInterval = 30,
  initialLinkedinInterval = 60,
}: {
  initialEmailAutoSync?: boolean;
  initialLinkedinAutoSync?: boolean;
  initialEmailInterval?: number;
  initialLinkedinInterval?: number;
}) {
  const [emailAutoSync, setEmailAutoSync] = useState(initialEmailAutoSync);
  const [linkedinAutoSync, setLinkedinAutoSync] = useState(initialLinkedinAutoSync);
  const [syncIntervalMins, setSyncIntervalMins] = useState(initialEmailInterval);
  const [linkedinIntervalMins, setLinkedinIntervalMins] = useState(initialLinkedinInterval);
  const router = useRouter();
  
  const emailIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const linkedinIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setEmailAutoSync(initialEmailAutoSync);
    setLinkedinAutoSync(initialLinkedinAutoSync);
    setSyncIntervalMins(initialEmailInterval);
    setLinkedinIntervalMins(initialLinkedinInterval);
  }, [initialEmailAutoSync, initialLinkedinAutoSync, initialEmailInterval, initialLinkedinInterval]);

  const performEmailSync = useCallback(async () => {
    try {
      const res = await syncEmailsAction();
      if (res.success) router.refresh();
    } catch (e) {
      console.error("Auto-sync Email failed:", e);
    }
  }, [router]);

  const performLinkedinSync = useCallback(async () => {
    try {
      const res = await syncLinkedInAction();
      if (res.success) router.refresh();
    } catch (e) {
      console.error("Auto-sync LinkedIn failed:", e);
    }
  }, [router]);

  useEffect(() => {
    if (emailAutoSync) {
      emailIntervalRef.current = setInterval(performEmailSync, syncIntervalMins * 60 * 1000);
    }
    return () => {
      if (emailIntervalRef.current) clearInterval(emailIntervalRef.current);
    };
  }, [emailAutoSync, syncIntervalMins, performEmailSync]);

  useEffect(() => {
    if (linkedinAutoSync) {
      linkedinIntervalRef.current = setInterval(performLinkedinSync, linkedinIntervalMins * 60 * 1000);
    }
    return () => {
      if (linkedinIntervalRef.current) clearInterval(linkedinIntervalRef.current);
    };
  }, [linkedinAutoSync, linkedinIntervalMins, performLinkedinSync]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        if (emailIntervalRef.current) clearInterval(emailIntervalRef.current);
        if (linkedinIntervalRef.current) clearInterval(linkedinIntervalRef.current);
      } else {
        if (emailAutoSync) {
          emailIntervalRef.current = setInterval(performEmailSync, syncIntervalMins * 60 * 1000);
        }
        if (linkedinAutoSync) {
          linkedinIntervalRef.current = setInterval(performLinkedinSync, linkedinIntervalMins * 60 * 1000);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [emailAutoSync, linkedinAutoSync, syncIntervalMins, linkedinIntervalMins, performEmailSync, performLinkedinSync]);

  return null;
}
