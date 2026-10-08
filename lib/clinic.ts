export const clinicInfo = {
  name: "T.O. Clinic",
  type: "Orthopaedic and Trauma Clinic",
  location: "Gulshan-e-Iqbal, Karachi, Pakistan",
  receptionistName: "AI Receptionist",
} as const;

export const APPOINTMENT_REASONS = [
  "Knee Pain",
  "Back Pain",
  "Joint Pain",
  "Follow-up",
  "Sports Injury",
  "Shoulder Pain",
] as const;

export const DEFAULT_DOCTORS = [
  { name: "Dr. Khan Shah Azam", specialty: "Orthopaedic Surgery" },
  { name: "Dr. Faisal Ali Khan", specialty: "Trauma & Orthopaedics" },
  { name: "Dr. Osama Bin Zia", specialty: "Orthopaedic Surgery" },
  { name: "Dr. M. Afaque Alam", specialty: "Orthopaedics" },
  { name: "Dr. Khadim Hussain", specialty: "Orthopaedic & Trauma" },
] as const;
