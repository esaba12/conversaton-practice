import "server-only";
import { AppError } from "@/lib/schemas/errors";

function configured() {
  const projectId = process.env.SPECTRUM_PROJECT_ID;
  const projectSecret = process.env.SPECTRUM_PROJECT_SECRET;
  const line = process.env.PHOTON_LINE_E164;
  if (!projectId || !projectSecret || !line) throw new AppError("NOT_CONFIGURED", "Text practice is not configured yet.", 503);
  return { projectId, projectSecret, line };
}

export function photonLine(): string {
  return configured().line;
}

export function assertPhotonConfigured() {
  configured();
}

// Sends into the DM for a phone that already texted this line. spectrum-ts 12.10.1.
export async function sendImessage(phone: string, body: string | { cardUrl: string }) {
  const { projectId, projectSecret } = configured();
  const { Spectrum, app } = await import("spectrum-ts");
  const { imessage } = await import("spectrum-ts/providers/imessage");
  const spectrum = await Spectrum({ projectId, projectSecret, providers: [imessage.config()] });
  try {
    const platform = imessage(spectrum);
    const person = await platform.user(phone);
    const space = await platform.space.create(person);
    await space.send(typeof body === "string" ? body : app(body.cardUrl, { live: true }));
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("PROVIDER_UNAVAILABLE", "The text could not be sent. Try again shortly.", 503, true);
  } finally {
    await spectrum.stop().catch(() => undefined);
  }
}
