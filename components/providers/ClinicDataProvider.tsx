"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { buildQuery, fetchJson } from "@/lib/client-api";
import { usePolling } from "@/lib/hooks/usePolling";
import type {
  Appointment,
  DashboardResponse,
  DoctorOption,
} from "@/lib/types";

interface ClinicDataContextValue {
  doctors: DoctorOption[];
  doctorsLoading: boolean;
  refreshDoctors: () => Promise<void>;
  updateAppointment: (appointment: Appointment) => Promise<Appointment>;
  cancelAppointment: (appointment: Appointment) => Promise<Appointment>;
  dashboard: DashboardResponse | null;
  dashboardLoading: boolean;
  dashboardError: string | null;
  refreshDashboard: () => Promise<void>;
}

const ClinicDataContext = createContext<ClinicDataContextValue | null>(null);

export function ClinicDataProvider({ children }: { children: ReactNode }) {
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const refreshDoctors = useCallback(async () => {
    setDoctorsLoading(true);
    try {
      const data = await fetchJson<{ items: DoctorOption[] }>("/api/doctors");
      setDoctors(data.items);
    } catch {
      setDoctors([]);
    } finally {
      setDoctorsLoading(false);
    }
  }, []);

  const refreshDashboard = useCallback(async () => {
    try {
      setDashboardError(null);
      const data = await fetchJson<DashboardResponse>("/api/dashboard");
      setDashboard(data);
    } catch (error) {
      setDashboardError(
        error instanceof Error
          ? error.message
          : "Unable to load dashboard data.",
      );
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshDoctors();
    void refreshDashboard();
  }, [refreshDoctors, refreshDashboard]);

  usePolling(() => {
    void refreshDashboard();
  }, 20000);

  const updateAppointment = useCallback(async (appointment: Appointment) => {
    const updated = await fetchJson<Appointment>(
      `/api/appointments/${appointment.id}`,
      {
        method: "PUT",
        body: JSON.stringify({
          patient: appointment.patient,
          phone: appointment.phone,
          doctor: appointment.doctor,
          date: appointment.date,
          time: appointment.time,
          reason: appointment.reason,
          status: appointment.status,
        }),
      },
    );
    void refreshDashboard();
    return updated;
  }, [refreshDashboard]);

  const cancelAppointment = useCallback(
    async (appointment: Appointment) => {
      if (appointment.status === "Cancelled") return appointment;
      const updated = await fetchJson<Appointment>(
        `/api/appointments/${appointment.id}`,
        { method: "DELETE" },
      );
      void refreshDashboard();
      return updated;
    },
    [refreshDashboard],
  );

  return (
    <ClinicDataContext.Provider
      value={{
        doctors,
        doctorsLoading,
        refreshDoctors,
        updateAppointment,
        cancelAppointment,
        dashboard,
        dashboardLoading,
        dashboardError,
        refreshDashboard,
      }}
    >
      {children}
    </ClinicDataContext.Provider>
  );
}

export function useClinicData() {
  const context = useContext(ClinicDataContext);
  if (!context) {
    throw new Error("useClinicData must be used within ClinicDataProvider");
  }
  return context;
}

export function appointmentsQuery(params: {
  page: number;
  limit: number;
  search: string;
  status: string;
  date: string;
}) {
  return `/api/appointments${buildQuery({
    page: params.page,
    limit: params.limit,
    search: params.search || undefined,
    status: params.status !== "All" ? params.status : undefined,
    date: params.date !== "all" ? params.date : undefined,
  })}`;
}

export function callsQuery(params: {
  page: number;
  limit: number;
  search: string;
  status: string;
  result: string;
  date: string;
}) {
  return `/api/calls${buildQuery({
    page: params.page,
    limit: params.limit,
    search: params.search || undefined,
    status: params.status !== "All" ? params.status : undefined,
    result: params.result !== "All" ? params.result : undefined,
    date: params.date !== "all" ? params.date : undefined,
  })}`;
}
