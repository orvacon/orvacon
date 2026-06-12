import type { PlopTypes } from "@turbo/gen";

/**
 * orvacon workspace generators.
 *
 *   turbo gen connector   # connectors/<name>  -> @orvacon/connector-<name>
 *   turbo gen kit         # packages/<name>    -> @orvacon/<name>
 *   turbo gen adapter     # adapters/<name>    -> @orvacon/adapter-<name>
 *
 * Replaces the old scripts/scaffold.sh. Each generator creates a JIT internal
 * package (exports point at ./src) that takes @orvacon/paykit as a peer.
 */
export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator("connector", {
    description: "New gateway connector (@orvacon/connector-<name>)",
    prompts: [
      { type: "input", name: "name", message: "connector name (e.g. iyzico):" },
      { type: "input", name: "description", message: "one-line description:" },
    ],
    actions: [
      {
        type: "add",
        path: "connectors/{{dashCase name}}/package.json",
        templateFile: "templates/connector/package.json.hbs",
      },
      {
        type: "add",
        path: "connectors/{{dashCase name}}/tsconfig.json",
        templateFile: "templates/library.tsconfig.json.hbs",
      },
      {
        type: "add",
        path: "connectors/{{dashCase name}}/src/index.ts",
        templateFile: "templates/connector/index.ts.hbs",
      },
    ],
  });

  plop.setGenerator("kit", {
    description: "New kit / plugin (@orvacon/<name>)",
    prompts: [
      { type: "input", name: "name", message: "kit name (e.g. taxkit):" },
      { type: "input", name: "description", message: "one-line description:" },
    ],
    actions: [
      {
        type: "add",
        path: "packages/{{dashCase name}}/package.json",
        templateFile: "templates/kit/package.json.hbs",
      },
      {
        type: "add",
        path: "packages/{{dashCase name}}/tsconfig.json",
        templateFile: "templates/library.tsconfig.json.hbs",
      },
      {
        type: "add",
        path: "packages/{{dashCase name}}/src/index.ts",
        templateFile: "templates/kit/index.ts.hbs",
      },
    ],
  });

  plop.setGenerator("adapter", {
    description: "New database adapter (@orvacon/adapter-<name>)",
    prompts: [
      { type: "input", name: "name", message: "adapter name (e.g. supabase):" },
      { type: "input", name: "description", message: "one-line description:" },
      { type: "input", name: "dbDep", message: "database peer dependency (e.g. @supabase/supabase-js):" },
      { type: "input", name: "dbRange", message: "its semver range (e.g. ^2):" },
    ],
    actions: [
      {
        type: "add",
        path: "adapters/{{dashCase name}}/package.json",
        templateFile: "templates/adapter/package.json.hbs",
      },
      {
        type: "add",
        path: "adapters/{{dashCase name}}/tsconfig.json",
        templateFile: "templates/library.tsconfig.json.hbs",
      },
      {
        type: "add",
        path: "adapters/{{dashCase name}}/src/index.ts",
        templateFile: "templates/adapter/index.ts.hbs",
      },
    ],
  });
}
