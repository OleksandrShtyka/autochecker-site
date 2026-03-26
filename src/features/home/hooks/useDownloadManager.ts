"use client";

import { useEffect, useRef, useState } from "react";
import type { DownloadState } from "../types";

const INITIAL_STATE: DownloadState = {
  visible: false,
  label: "",
  progress: 0,
  done: false,
};

export function useDownloadManager() {
  const [downloadState, setDownloadState] = useState<DownloadState>(INITIAL_STATE);
  const timersRef = useRef<number[]>([]);
  const intervalRef = useRef<number | null>(null);

  const clearScheduledWork = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  };

  useEffect(() => clearScheduledWork, []);

  const triggerDownload = (url: string, label: string, fileName?: string) => {
    clearScheduledWork();

    setDownloadState({
      visible: true,
      label,
      progress: 8,
      done: false,
    });

    let progress = 8;
    intervalRef.current = window.setInterval(() => {
      progress = Math.min(progress + Math.random() * 18, 92);
      setDownloadState((current) => ({ ...current, progress }));
    }, 180);

    timersRef.current.push(
      window.setTimeout(() => {
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        if (fileName) {
          link.download = fileName;
        }

        document.body.appendChild(link);
        link.click();
        link.remove();
      }, 450)
    );

    timersRef.current.push(
      window.setTimeout(() => {
        if (intervalRef.current !== null) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setDownloadState((current) => ({ ...current, progress: 100, done: true }));
      }, 1800)
    );

    timersRef.current.push(
      window.setTimeout(() => {
        setDownloadState((current) => ({ ...current, visible: false }));
      }, 2800)
    );
  };

  return { downloadState, triggerDownload };
}
