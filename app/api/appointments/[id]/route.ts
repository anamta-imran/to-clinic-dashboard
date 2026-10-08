import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api";
import {
  cancelAppointmentRecord,
  getAppointmentById,
  updateAppointmentRecord,
} from "@/lib/services/appointments";


const updateSchema = z.object({
  patient: z.string().min(1).optional(),
  phone: z.string().min(3).optional(),
  doctor: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().min(1).optional(),
  reason: z.string().min(1).optional(),
  status: z.enum(["Confirmed", "Pending", "Cancelled"]).optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const appointment = await getAppointmentById(id);
    if (!appointment) return jsonError("Appointment not found.", 404);
    return jsonOk(appointment);
  } catch (error) {
    console.error("GET /api/appointments/:id", error);
    return jsonError("Unable to load appointment.", 500);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Invalid appointment payload.", 400);
    }
    const updated = await updateAppointmentRecord(id, parsed.data);
    if (!updated) return jsonError("Appointment not found.", 404);
    return jsonOk(updated);
  } catch (error) {
    console.error("PUT /api/appointments/:id", error);
    return jsonError("Unable to update appointment.", 500);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const updated = await cancelAppointmentRecord(id);
    if (!updated) return jsonError("Appointment not found.", 404);
    return jsonOk(updated);
  } catch (error) {
    console.error("DELETE /api/appointments/:id", error);
    return jsonError("Unable to cancel appointment.", 500);
  }
}
