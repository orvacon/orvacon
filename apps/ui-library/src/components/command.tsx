import { CommandSwitcher } from "@/components/command-switcher";
import { highlight } from "@/lib/highlight";

const MANAGERS = ["npm", "pnpm", "yarn", "bun"] as const;
type Manager = (typeof MANAGERS)[number];

/** Rewrite an npm-form command for the other package managers. */
function forManager(command: string, manager: Manager): string {
  const parts = command.trim().split(/\s+/);
  const rest = (from: number) => parts.slice(from).join(" ");

  if (parts[0] === "npx") {
    return {
      npm: `npx ${rest(1)}`,
      pnpm: `pnpm dlx ${rest(1)}`,
      yarn: `yarn dlx ${rest(1)}`,
      bun: `bunx ${rest(1)}`,
    }[manager];
  }
  if (parts[0] === "npm" && parts[1] === "create") {
    return {
      npm: `npm create ${rest(2)}`,
      pnpm: `pnpm create ${rest(2)}`,
      yarn: `yarn create ${rest(2)}`,
      bun: `bun create ${rest(2)}`,
    }[manager];
  }
  if (parts[0] === "npm" && (parts[1] === "install" || parts[1] === "i")) {
    const verb = manager === "npm" ? "install" : "add";
    return `${manager} ${verb} ${rest(2)}`;
  }
  return command;
}

/**
 * An install command with an npm / pnpm / yarn / bun switcher. All four variants are
 * highlighted as shell at build time; the client switcher persists the chosen manager.
 */
export async function Command({ command, className }: { command: string; className?: string }) {
  const entries = await Promise.all(
    MANAGERS.map(async (manager) => {
      const text = forManager(command, manager);
      return [manager, { text, html: await highlight(text, "bash") }] as const;
    }),
  );

  const commands = Object.fromEntries(entries.map(([m, v]) => [m, v.text])) as Record<
    Manager,
    string
  >;
  const highlighted = Object.fromEntries(entries.map(([m, v]) => [m, v.html])) as Record<
    Manager,
    string
  >;

  return <CommandSwitcher commands={commands} highlighted={highlighted} className={className} />;
}
