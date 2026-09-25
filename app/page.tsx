import { Configurator } from "@/components/configurator/configurator";
import { toSettingsFormValues } from "@/components/settings/types";
import { getSettings } from "@/lib/db/queries";
import { defaultSettings } from "@/lib/db/seed";
import { readVisitorId } from "@/lib/visitor";

export default async function Home() {
  const visitorId = await readVisitorId();
  const settings = visitorId ? await getSettings(visitorId) : defaultSettings();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">
      <h1 className="mb-6 text-2xl font-semibold">Configure</h1>
      <Configurator settingsFormValues={toSettingsFormValues(settings)} />
    </main>
  );
}
