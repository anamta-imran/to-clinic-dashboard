"use client";

import { useState } from "react";
import { Bell, Bot, Building2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { clinicInfo } from "@/lib/clinic";

export function SettingsPageView() {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);

  return (
    <AppShell
      title="Settings"
      subtitle="Clinic preferences and receptionist configuration"
      showSearch={false}
    >
      <div className="mx-auto max-w-3xl space-y-4">
        <section className="panel p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-navy-900/5 text-navy-900">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-text-primary">
                Clinic information
              </h2>
              <p className="mt-0.5 text-sm text-text-muted">
                Basic profile used across the receptionist dashboard
              </p>
            </div>
          </div>

          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-text-muted">Clinic name</dt>
              <dd className="mt-1 text-sm font-medium text-text-primary">
                {clinicInfo.name}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted">Specialty</dt>
              <dd className="mt-1 text-sm font-medium text-text-primary">
                {clinicInfo.type}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-text-muted">Location</dt>
              <dd className="mt-1 text-sm font-medium text-text-primary">
                {clinicInfo.location}
              </dd>
            </div>
          </dl>
        </section>

        <section className="panel p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-teal-50 text-teal-700">
              <Bot className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-text-primary">
                AI receptionist
              </h2>
              <p className="mt-0.5 text-sm text-text-muted">
                Control whether the receptionist answers inbound calls
              </p>
              <label className="mt-4 flex items-center justify-between gap-3 border border-border bg-canvas px-3 py-3">
                <span className="text-sm text-text-primary">
                  AI receptionist enabled
                </span>
                <input
                  type="checkbox"
                  checked={aiEnabled}
                  onChange={(e) => setAiEnabled(e.target.checked)}
                  className="h-4 w-4 accent-teal-700"
                />
              </label>
            </div>
          </div>
        </section>

        <section className="panel p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-navy-900/5 text-navy-900">
              <Bell className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-text-primary">
                Notification preferences
              </h2>
              <p className="mt-0.5 text-sm text-text-muted">
                Demo preferences for front-desk alerts
              </p>

              <div className="mt-4 space-y-2">
                <label className="flex items-center justify-between gap-3 border border-border bg-canvas px-3 py-3">
                  <span className="text-sm text-text-primary">
                    Email alerts for missed calls
                  </span>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="h-4 w-4 accent-teal-700"
                  />
                </label>
                <label className="flex items-center justify-between gap-3 border border-border bg-canvas px-3 py-3">
                  <span className="text-sm text-text-primary">
                    SMS alerts for cancellations
                  </span>
                  <input
                    type="checkbox"
                    checked={smsAlerts}
                    onChange={(e) => setSmsAlerts(e.target.checked)}
                    className="h-4 w-4 accent-teal-700"
                  />
                </label>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
