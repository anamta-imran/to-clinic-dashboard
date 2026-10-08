"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Clock3, Eye, PhoneOff } from "lucide-react";
import { CallDetailsDrawer } from "@/components/dashboard/CallDetailsDrawer";
import { callsQuery } from "@/components/providers/ClinicDataProvider";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { SelectField } from "@/components/ui/SelectField";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fetchJson } from "@/lib/client-api";
import { usePolling } from "@/lib/hooks/usePolling";
import {
  DEFAULT_PAGE_SIZE,
  clampPageSize,
  type PageSize,
} from "@/lib/pagination";
import type {
  AppointmentResult,
  CallRecord,
  CallStatus,
  PaginatedResponse,
} from "@/lib/types";
import {
  appointmentResultVariant,
  formatDisplayDate,
  formatPhoneDisplay,
  getInitials,
} from "@/lib/utils";

const callStatuses: Array<"All" | CallStatus> = [
  "All",
  "Completed",
  "Missed",
  "In Progress",
];

const results: Array<"All" | AppointmentResult> = [
  "All",
  "Appointment Booked",
  "Information Provided",
  "Callback Requested",
  "No Action",
];

interface CallsTableProps {
  title?: string;
  subtitle?: string;
  showPanelHeader?: boolean;
  showFilters?: boolean;
}

export function CallsTable({
  title = "Recent Calls",
  subtitle = "AI receptionist conversations",
  showPanelHeader = true,
  showFilters = true,
}: CallsTableProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [status, setStatus] = useState<"All" | CallStatus>("All");
  const [result, setResult] = useState<"All" | AppointmentResult>("All");
  const [date, setDate] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [data, setData] = useState<PaginatedResponse<CallRecord> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchJson<PaginatedResponse<CallRecord>>(
        callsQuery({
          page,
          limit: pageSize,
          search: debouncedQuery,
          status,
          result,
          date,
        }),
      );
      setData(response);
      if (response.page !== page) setPage(response.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load calls.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedQuery, status, result, date]);

  useEffect(() => {
    void load();
  }, [load]);

  usePolling(() => {
    void load();
  }, 30000);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, status, result, date, pageSize]);

  const dateOptions = data?.filters?.dates ?? [];
  const items = data?.items ?? [];
  const hasActiveFilters =
    Boolean(debouncedQuery.trim()) ||
    status !== "All" ||
    result !== "All" ||
    date !== "all";

  const openCall = async (call: CallRecord) => {
    setSelectedCall(call);
    setDrawerOpen(true);
    try {
      const detailed = await fetchJson<CallRecord>(`/api/calls/${call.id}`);
      setSelectedCall(detailed);
    } catch {
      // Keep list payload if detail fetch fails.
    }
  };

  return (
    <>
      <section className="panel min-w-0">
        {showPanelHeader ? (
          <div className="border-b border-border px-4 py-4 sm:px-5">
            <div className="min-w-0">
              <h2 className="text-base font-semibold tracking-tight text-text-primary">
                {title}
              </h2>
              <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>
            </div>
          </div>
        ) : null}

        <div className="border-b border-border px-4 py-3 sm:px-5">
          <div
            className={`grid gap-2.5 ${
              showFilters
                ? "sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.9fr)]"
                : ""
            }`}
          >
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search patients/calls..."
              className={showFilters ? "sm:col-span-2 xl:col-span-1" : ""}
            />
            {showFilters ? (
              <>
                <SelectField
                  value={status}
                  onChange={(value) => setStatus(value as "All" | CallStatus)}
                  aria-label="Filter by call status"
                >
                  {callStatuses.map((item) => (
                    <option key={item} value={item}>
                      {item === "All" ? "All call statuses" : item}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  value={result}
                  onChange={(value) =>
                    setResult(value as "All" | AppointmentResult)
                  }
                  aria-label="Filter by appointment result"
                >
                  {results.map((item) => (
                    <option key={item} value={item}>
                      {item === "All" ? "All results" : item}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  value={date}
                  onChange={setDate}
                  icon={CalendarDays}
                  aria-label="Filter by date"
                >
                  <option value="all">All days</option>
                  {dateOptions.map((option) => (
                    <option key={option} value={option}>
                      {formatDisplayDate(option)}
                    </option>
                  ))}
                </SelectField>
              </>
            ) : null}
          </div>
        </div>

        {loading && !data ? (
          <div className="px-5 py-10 text-center text-sm text-text-muted">
            Loading calls...
          </div>
        ) : error && !data ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-medium text-text-primary">
              Unable to load calls.
            </p>
            <p className="mt-1 text-sm text-text-muted">Please try again.</p>
            <button
              type="button"
              onClick={() => void load()}
              className="btn btn-primary mt-4"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={PhoneOff}
            title={hasActiveFilters ? "No calls found" : "No calls recorded yet"}
            description={
              hasActiveFilters
                ? "Try a different search or filter combination."
                : "Incoming calls answered by the AI receptionist will show up here."
            }
          />
        ) : (
          <>
            <div className="hidden lg:block">
              <table className="w-full min-w-0 table-fixed text-left text-sm">
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[14%]" />
                  <col className="w-[18%]" />
                  <col className="w-[10%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[8%]" />
                </colgroup>
                <thead className="border-b border-border bg-canvas/70 text-[11px] tracking-wide text-text-muted uppercase">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">Patient</th>
                    <th className="px-3 py-2.5 font-medium">Phone</th>
                    <th className="px-3 py-2.5 font-medium">Date / Time</th>
                    <th className="px-3 py-2.5 font-medium">Duration</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-3 py-2.5 font-medium">Result</th>
                    <th className="px-5 py-2.5 text-right font-medium">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((call) => (
                    <tr
                      key={call.id}
                      className="transition-colors hover:bg-canvas/60"
                    >
                      <td className="px-5 py-2.5">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[11px] font-semibold text-teal-700">
                            {getInitials(call.patient)}
                          </div>
                          <p className="truncate font-medium text-text-primary">
                            {call.patient}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="truncate text-text-secondary">
                          {formatPhoneDisplay(call.phone)}
                        </p>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="truncate text-text-secondary">
                          {call.dateLabel}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 text-text-secondary">
                        {call.duration}
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge
                          label={call.callStatus}
                          variant={call.callStatus}
                          compact
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge
                          label={call.appointmentResult}
                          variant={appointmentResultVariant(
                            call.appointmentResult,
                          )}
                          compact
                        />
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => void openCall(call)}
                          className="btn btn-secondary btn-sm btn-icon"
                          title="View call details"
                          aria-label={`View call details for ${call.patient}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-border lg:hidden">
              {items.map((call) => (
                <li key={call.id} className="min-w-0 px-4 py-3.5 sm:px-5">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[11px] font-semibold text-teal-700">
                      {getInitials(call.patient)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-text-primary">
                            {call.patient}
                          </p>
                          <p className="truncate text-xs text-text-muted">
                            {formatPhoneDisplay(call.phone)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void openCall(call)}
                          className="btn btn-secondary btn-sm btn-icon shrink-0"
                          title="View call details"
                          aria-label={`View call details for ${call.patient}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary">
                        <span className="truncate">{call.dateLabel}</span>
                        <span className="text-border-strong">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3 w-3 text-text-muted" />
                          {call.duration}
                        </span>
                      </div>

                      <div className="mt-2.5 flex min-w-0 flex-wrap gap-1.5">
                        <StatusBadge
                          label={call.callStatus}
                          variant={call.callStatus}
                          compact
                        />
                        <StatusBadge
                          label={call.appointmentResult}
                          variant={appointmentResultVariant(
                            call.appointmentResult,
                          )}
                          compact
                        />
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {data ? (
              <Pagination
                page={data.page}
                pageSize={clampPageSize(data.pageSize)}
                totalItems={data.totalItems}
                totalPages={data.totalPages}
                startIndex={data.startIndex}
                endIndex={data.endIndex}
                onPageChange={setPage}
                onPageSizeChange={(size) => setPageSize(clampPageSize(size))}
                label="calls"
              />
            ) : null}
          </>
        )}
      </section>

      <CallDetailsDrawer
        call={selectedCall}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
