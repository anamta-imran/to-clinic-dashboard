"use client";

import { motion } from "framer-motion";
import { Bot } from "lucide-react";

interface AiReceptionistBannerProps {
  callsToday: number;
}

export function AiReceptionistBanner({ callsToday }: AiReceptionistBannerProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="panel min-w-0"
    >
      <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-teal-50 text-teal-700">
            <Bot className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-text-primary">
                AI Receptionist Active
              </h2>
              <span className="inline-flex items-center gap-1.5 border border-success-border bg-success-bg px-2 py-0.5 text-[11px] font-medium text-success-text">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-50" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Live
              </span>
            </div>
            <p className="mt-0.5 text-sm text-text-secondary">
              Handling incoming calls
            </p>
          </div>
        </div>

        <div className="shrink-0 border border-border bg-canvas px-3.5 py-2">
          <p className="text-[11px] text-text-muted">Today</p>
          <p className="text-sm font-semibold text-text-primary">
            {callsToday} calls
          </p>
        </div>
      </div>
    </motion.section>
  );
}
