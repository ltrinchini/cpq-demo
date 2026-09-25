import { purgeInactiveSandboxes } from "@/lib/db/queries";

async function main() {
  const count = await purgeInactiveSandboxes();
  console.log(`Purged ${count} inactive sandbox${count === 1 ? "" : "es"}.`);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
