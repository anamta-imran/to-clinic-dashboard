"use client";

import { motion } from "framer-motion";
import {
  CalendarCheck2,
  CalendarPlus,
  Clock3,
  Phone,
  type LucideIcon,
} from "lucide-react";

interface MetricItem {
  id: string;
  label: string;
  value: string;
  context: string;
  icon: LucideIcon;
}

interface MetricCardsProps {
  todaysAppointments: number;
  callsToday: number;
  bookedToday: number;
  callTimeToday: string;
}

export function MetricCards({
  todaysAppointments,
  callsToday,
  bookedToday,
  callTimeToday,
}: MetricCardsProps) {
  const cards: MetricItem[] = [
    {
      id: "todays-appointments",
      label: "Today's Appointments",
      value: String(todaysAppointments),
      context: "On today's schedule",
      icon: CalendarCheck2,
    },
    {
      id: "calls-today",
      label: "Calls Today",
      value: String(callsToday),
      context: "Handled by AI receptionist",
      icon: Phone,
    },
    {
      id: "booked-today",
      label: "Appointments Booked Today",
      value: String(bookedToday),
      context: "Booked from inbound calls",
      icon: CalendarPlus,
    },
    {
      id: "call-time-today",
      label: "Call Time Today",
      value: callTimeToday,
      context: "Total conversation time",
      icon: Clock3,
    },
  ];

  return (
    <section className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <motion.article
            key={metric.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
            className="panel min-w-0 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium tracking-wide text-text-muted uppercase">
                  {metric.label}
                </p>
                <p className="mt-1.5 text-3xl font-semibold tracking-tight text-text-primary">
                  {metric.value}
                </p>
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-navy-900/5 text-navy-900">
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-xs text-text-secondary">{metric.context}</p>
          </motion.article>
        );
      })}
    </section>
  );
}
