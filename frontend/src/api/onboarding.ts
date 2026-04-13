import { api } from "./client";
import { normalizeOnboarding, unwrapData } from "./helpers";

export async function fetchOnboardingStatus() {
  const { data } = await api.get("/onboarding");
  return normalizeOnboarding(unwrapData(data));
}
