// Builds Agilist with esbuild. `node scripts/build.mjs --serve` runs a local dev server.
import * as esbuild from "esbuild";
import { cpSync, mkdirSync } from "node:fs";

const serve = process.argv.includes("--serve");
mkdirSync("dist", { recursive: true });
cpSync("public", "dist", { recursive: true });

const options = {
  entryPoints: ["src/main.tsx"],
  bundle: true,
  outfile: "dist/app.js",
  jsx: "automatic",
  minify: !serve,
  sourcemap: serve,
  target: ["es2020"],
  define: { "process.env.NODE_ENV": serve ? '"development"' : '"production"' },
  logLevel: "info",
};

if (serve) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  const { port } = await ctx.serve({ servedir: "dist", port: 5173 });
  console.log(`\n  Agilist is running at http://localhost:${port}\n`);
} else {
  await esbuild.build(options);
}
