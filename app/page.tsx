import { Configurator } from "@/components/configurator/configurator";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">
      <h1 className="mb-6 text-2xl font-semibold">Configure</h1>
      <Configurator />
    </main>
  );
}
