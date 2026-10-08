import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api";
import {
  processOmniDimensionWebhook,
  validateOmniDimensionWebhook,
} from "@/lib/omnidimension/service";
import type { OmniDimensionWebhookPayload } from "@/lib/omnidimension/types";


const payloadSchema = z.record(z.string(), z.unknown());

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const validation = validateOmniDimensionWebhook({
      headers: request.headers,
      rawBody,
    });
    if (!validation.ok) {
      return jsonError(validation.reason, 401);
    }

    let parsedJson: unknown;
    try {
      parsedJson = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return jsonError("Invalid JSON payload.", 400);
    }

    const parsed = payloadSchema.safeParse(parsedJson);
    if (!parsed.success) {
      return jsonError("Unrecognized webhook payload.", 400);
    }

    const result = await processOmniDimensionWebhook(
      parsed.data as OmniDimensionWebhookPayload,
    );

    return jsonOk({
      ok: true,
      duplicate: result.duplicate,
      callId: result.callId,
      appointmentId: result.appointmentId,
      configuration: {
        agentId: process.env.OMNIDIMENSION_AGENT_ID || "264841",
        webhookSecretConfigured: Boolean(
          process.env.OMNIDIMENSION_WEBHOOK_SECRET?.trim(),
        ),
        apiKeyConfigured: Boolean(process.env.OMNIDIMENSION_API_KEY?.trim()),
      },
    });
  } catch (error) {
    console.error("POST /api/webhooks/omnidimension", error);
    return jsonError("Unable to process OmniDimension webhook.", 500);
  }
}

export async function GET() {
  return jsonOk({
    ok: true,
    message:
      "OmniDimension webhook endpoint. Configure post-call webhook URL to this path with include: summary, extracted_variables, fullConversation.",
    agentId: process.env.OMNIDIMENSION_AGENT_ID || "264841",
    requiredEnv: [
      "OMNIDIMENSION_API_KEY",
      "OMNIDIMENSION_AGENT_ID",
      "OMNIDIMENSION_WEBHOOK_SECRET",
      "DATABASE_URL",
    ],
  });
}
