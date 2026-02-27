import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

// Workaround: when Turbopack doesn't set opts.from, @tailwindcss/postcss computes
// the CSS resolution base as path.dirname(process.cwd()) = the repo root (no node_modules there).
// __tw_resolve is a documented hook in @tailwindcss/node that overrides CSS package resolution.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const req = createRequire(__filename);

if (typeof globalThis.__tw_resolve !== "function") {
  globalThis.__tw_resolve = (id, base) => {
    try {
      // Resolve from this file's directory (app/) so node_modules/tailwindcss is found
      const pkgJsonPath = req.resolve(
        id.includes("/") ? `${id.split("/")[0]}/package.json` : `${id}/package.json`
      );
      const pkgDir = path.dirname(pkgJsonPath);

      if (id.includes("/")) {
        // e.g. "shadcn/tailwind.css" → node_modules/shadcn/tailwind.css
        const subPath = id.split("/").slice(1).join("/");
        const resolved = path.join(pkgDir, subPath);
        return fs.existsSync(resolved) ? resolved : null;
      } else {
        // e.g. "tailwindcss" → use the "style" field from package.json
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
        const styleEntry = typeof pkg.style === "string" ? pkg.style : "index.css";
        const resolved = path.join(pkgDir, styleEntry);
        return fs.existsSync(resolved) ? resolved : null;
      }
    } catch {
      return null;
    }
  };
}

const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
