import { api } from "./client";
import { unwrapData } from "./helpers";
import type { WhatsappTemplate } from "../types";

export async function fetchWhatsappTemplates() {
  const { data } = await api.get("/automations/whatsapp-templates");
  const payload = unwrapData<{ templates?: WhatsappTemplate[] }>(data);
  return payload.templates ?? [];
}
