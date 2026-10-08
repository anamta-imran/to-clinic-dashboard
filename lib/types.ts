export type AppointmentStatus = "Confirmed" | "Pending" | "Cancelled";

export type CallStatus = "Completed" | "Missed" | "In Progress";

export type AppointmentResult =
  | "Appointment Booked"
  | "Information Provided"
  | "Callback Requested"
  | "No Action";

export type AppointmentSource = "OMNIDIMENSION" | "MANUAL" | "DASHBOARD";

export interface Appointment {
  id: string;
  patient: string;
  doctor: string;
  date: string;
  time: string;
  phone: string;
  reason: string;
  status: AppointmentStatus;
  source?: AppointmentSource;
  callId?: string | null;
  doctorId?: string;
  patientId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TranscriptLine {
  speaker: "AI" | "Patient";
  text: string;
}

export interface CallRecord {
  id: string;
  patient: string;
  phone: string;
  dateLabel: string;
  datetime: string;
  duration: string;
  callStatus: CallStatus;
  appointmentResult: AppointmentResult;
  appointment?: {
    doctor: string;
    date: string;
    time: string;
    reason: string;
  };
  transcript: TranscriptLine[];
  summary?: string | null;
  omnidimCallId?: string | null;
}

export type ActivityType =
  | "call_received"
  | "info_collected"
  | "appointment_booked"
  | "appointment_updated"
  | "appointment_cancelled"
  | "call_completed";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  callId?: string | null;
  appointmentId?: string | null;
  createdAt?: string;
}

export interface MetricCard {
  id: string;
  label: string;
  value: string;
  description: string;
  trend: string;
  icon: "calendar" | "calendar-check" | "phone" | "clock";
}

export interface DoctorOption {
  id: string;
  name: string;
  specialty?: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  filters?: {
    dates?: string[];
  };
}

export interface DashboardResponse {
  metrics: {
    todaysAppointments: number;
    callsToday: number;
    bookedToday: number;
    callTimeTodaySeconds: number;
    callTimeToday: string;
  };
  upcomingAppointments: Appointment[];
  recentCalls: CallRecord[];
  recentActivity: ActivityItem[];
  generatedAt: string;
}
