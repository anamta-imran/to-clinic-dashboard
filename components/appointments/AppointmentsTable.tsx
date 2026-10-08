"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, CalendarDays, CalendarX2, Eye, Pencil } from "lucide-react";
import { AppointmentDetailsDrawer } from "@/components/dashboard/AppointmentDetailsDrawer";
import {
  appointmentsQuery,
  useClinicData,
} from "@/components/providers/ClinicDataProvider";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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
  Appointment,
  AppointmentStatus,
  PaginatedResponse,
} from "@/lib/types";
import { formatDisplayDate, formatShortDate, getInitials } from "@/lib/utils";

const statuses: Array<"All" | AppointmentStatus> = [
  "All",
  "Confirmed",
  "Pending",
  "Cancelled",
];

interface AppointmentsTableProps {
  title?: string;
  subtitle?: string;
}

export function AppointmentsTable({
  title = "Appointments",
  subtitle = "Scheduled orthopaedic consultations",
}: AppointmentsTableProps) {
  const { updateAppointment, cancelAppointment } = useClinicData();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [status, setStatus] = useState<"All" | AppointmentStatus>("All");
  const [date, setDate] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [pendingCancel, setPendingCancel] = useState<Appointment | null>(null);
  const [data, setData] = useState<PaginatedResponse<Appointment> | null>(null);
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
      const response = await fetchJson<PaginatedResponse<Appointment>>(
        appointmentsQuery({
          page,
          limit: pageSize,
          search: debouncedQuery,
          status,
          date,
        }),
      );
      setData(response);
      if (response.page !== page) setPage(response.page);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load appointments.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedQuery, status, date]);

  useEffect(() => {
    void load();
  }, [load]);

  usePolling(() => {
    void load();
  }, 30000);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, status, date, pageSize]);

  const dateOptions = data?.filters?.dates ?? [];
  const items = data?.items ?? [];
  const hasActiveFilters =
    Boolean(debouncedQuery.trim()) || status !== "All" || date !== "all";

  const openDetails = (appointment: Appointment, nextMode: "view" | "edit") => {
    setSelected(appointment);
    setMode(nextMode);
    setDrawerOpen(true);
  };

  const requestCancel = (appointment: Appointment) => {
    if (appointment.status === "Cancelled") return;
    setPendingCancel(appointment);
  };

  const confirmCancel = async () => {
    if (!pendingCancel) return;
    const updated = await cancelAppointment(pendingCancel);
    if (selected?.id === pendingCancel.id) {
      setSelected(updated);
      setDrawerOpen(false);
    }
    setPendingCancel(null);
    await load();
  };

  return (
    <>
      <section className="panel min-w-0">
        <div className="border-b border-border px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-text-primary">
              {title}
            </h2>
            <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>
          </div>
        </div>

        <div className="border-b border-border px-4 py-3 sm:px-5">
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,0.85fr)_minmax(0,1fr)]">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search patients..."
              className="sm:col-span-2 lg:col-span-1"
            />
            <SelectField
              value={status}
              onChange={(value) =>
                setStatus(value as "All" | AppointmentStatus)
              }
              aria-label="Filter by status"
            >
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All statuses" : item}
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
          </div>
        </div>

        {loading && !data ? (
          <div className="px-5 py-10 text-center text-sm text-text-muted">
            Loading appointments...
          </div>
        ) : error && !data ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-medium text-text-primary">
              Unable to load appointments.
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
            icon={CalendarX2}
            title={
              hasActiveFilters
                ? "No appointments found"
                : "No appointments scheduled"
            }
            description={
              hasActiveFilters
                ? "Try adjusting your search or filters to see matching appointments."
                : "New appointments booked by the AI receptionist will appear here."
            }
          />
        ) : (
          <>
            <div className="hidden xl:block">
              <table className="w-full min-w-0 table-fixed text-left text-sm">
                <colgroup>
                  <col className="w-[16%]" />
                  <col className="w-[18%]" />
                  <col className="w-[10%]" />
                  <col className="w-[9%]" />
                  <col className="w-[13%]" />
                  <col className="w-[12%]" />
                  <col className="w-[10%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead className="border-b border-border bg-canvas/70 text-[11px] tracking-wide text-text-muted uppercase">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">Patient</th>
                    <th className="px-3 py-2.5 font-medium">Doctor</th>
                    <th className="px-3 py-2.5 font-medium">Date</th>
                    <th className="px-3 py-2.5 font-medium">Time</th>
                    <th className="px-3 py-2.5 font-medium">Phone</th>
                    <th className="px-3 py-2.5 font-medium">Reason</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-5 py-2.5 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className="cursor-pointer transition-colors hover:bg-canvas/60"
                      onClick={() => openDetails(appointment, "view")}
                    >
                      <td className="px-5 py-2.5">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900/5 text-[11px] font-semibold text-navy-900">
                            {getInitials(appointment.patient)}
                          </div>
                          <p className="truncate font-medium text-text-primary">
                            {appointment.patient}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="truncate text-text-secondary">
                          {appointment.doctor}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 text-text-secondary">
                        {formatShortDate(appointment.date)}
                      </td>
                      <td className="px-3 py-2.5 text-text-secondary">
                        {appointment.time}
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="truncate text-text-secondary">
                          {appointment.phone}
                        </p>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="truncate text-text-secondary">
                          {appointment.reason}
                        </p>
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge
                          label={appointment.status}
                          variant={appointment.status}
                          compact
                        />
                      </td>
                      <td
                        className="px-5 py-2.5"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openDetails(appointment, "view")}
                            className="btn btn-secondary btn-sm btn-icon"
                            title="View details"
                            aria-label={`View ${appointment.patient}`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDetails(appointment, "edit")}
                            className="btn btn-secondary btn-sm btn-icon"
                            title="Edit appointment"
                            aria-label={`Edit ${appointment.patient}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={appointment.status === "Cancelled"}
                            onClick={() => requestCancel(appointment)}
                            className="btn btn-danger btn-sm btn-icon"
                            title="Cancel appointment"
                            aria-label={`Cancel ${appointment.patient}`}
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="hidden md:block xl:hidden">
              <table className="w-full min-w-0 table-fixed text-left text-sm">
                <colgroup>
                  <col className="w-[24%]" />
                  <col className="w-[24%]" />
                  <col className="w-[16%]" />
                  <col className="w-[16%]" />
                  <col className="w-[20%]" />
                </colgroup>
                <thead className="border-b border-border bg-canvas/70 text-[11px] tracking-wide text-text-muted uppercase">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Patient</th>
                    <th className="px-3 py-2.5 font-medium">Doctor</th>
                    <th className="px-3 py-2.5 font-medium">Schedule</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className="cursor-pointer hover:bg-canvas/60"
                      onClick={() => openDetails(appointment, "view")}
                    >
                      <td className="px-4 py-2.5">
                        <p className="truncate font-medium text-text-primary">
                          {appointment.patient}
                        </p>
                        <p className="truncate text-xs text-text-muted">
                          {appointment.phone}
                        </p>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="truncate text-text-secondary">
                          {appointment.doctor}
                        </p>
                        <p className="truncate text-xs text-text-muted">
                          {appointment.reason}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 text-text-secondary">
                        <p>{formatShortDate(appointment.date)}</p>
                        <p className="text-xs text-text-muted">
                          {appointment.time}
                        </p>
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge
                          label={appointment.status}
                          variant={appointment.status}
                          compact
                        />
                      </td>
                      <td
                        className="px-4 py-2.5"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openDetails(appointment, "view")}
                            className="btn btn-secondary btn-sm btn-icon"
                            title="View details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDetails(appointment, "edit")}
                            className="btn btn-secondary btn-sm btn-icon"
                            title="Edit appointment"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-border md:hidden">
              {items.map((appointment) => (
                <li key={appointment.id} className="min-w-0 px-4 py-3.5">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-900/5 text-[11px] font-semibold text-navy-900">
                      {getInitials(appointment.patient)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-text-primary">
                            {appointment.patient}
                          </p>
                          <p className="truncate text-xs text-text-muted">
                            {appointment.phone}
                          </p>
                        </div>
                        <StatusBadge
                          label={appointment.status}
                          variant={appointment.status}
                          compact
                        />
                      </div>
                      <p className="mt-2 truncate text-xs text-text-secondary">
                        {appointment.doctor}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        {formatShortDate(appointment.date)} · {appointment.time}{" "}
                        · {appointment.reason}
                      </p>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => openDetails(appointment, "view")}
                          className="btn btn-secondary btn-sm w-full"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => openDetails(appointment, "edit")}
                          className="btn btn-secondary btn-sm w-full"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={appointment.status === "Cancelled"}
                          onClick={() => requestCancel(appointment)}
                          className="btn btn-danger btn-sm w-full"
                        >
                          Cancel
                        </button>
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
                label="appointments"
              />
            ) : null}
          </>
        )}
      </section>

      <AppointmentDetailsDrawer
        appointment={selected}
        open={drawerOpen}
        mode={mode}
        onClose={() => setDrawerOpen(false)}
        onEdit={() => setMode("edit")}
        onSave={async (updated) => {
          const saved = await updateAppointment(updated);
          setSelected(saved);
          setMode("view");
          await load();
        }}
        onCancelAppointment={requestCancel}
      />

      <ConfirmDialog
        open={Boolean(pendingCancel)}
        title="Cancel appointment?"
        description={
          pendingCancel
            ? `Cancel ${pendingCancel.patient}'s appointment with ${pendingCancel.doctor} on ${formatDisplayDate(pendingCancel.date)} at ${pendingCancel.time}?`
            : ""
        }
        confirmLabel="Cancel appointment"
        cancelLabel="Keep appointment"
        onConfirm={() => void confirmCancel()}
        onCancel={() => setPendingCancel(null)}
      />
    </>
  );
}
