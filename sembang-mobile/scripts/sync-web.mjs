// Re-bundles the web screens into web/html.ts after changing ../sembang-app.
// Run `npm run build` in ../sembang-app first.
import { readFileSync, writeFileSync } from "node:fs";

const app = new URL("../../sembang-app/dist/", import.meta.url);
const css = readFileSync(new URL("app.css", app), "utf8");
const js = readFileSync(new URL("app.js", app), "utf8").replaceAll("</script", "<\\/script");
const fonts = "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap";
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<title>Agilist</title><link rel="stylesheet" href="${fonts}">
<style>${css}
html, body { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
input, textarea { -webkit-user-select: text; user-select: text; }</style>
</head><body><div id="root"></div><script>${js}</script></body></html>`;
writeFileSync(
  new URL("../web/html.ts", import.meta.url),
  `// Generated from ../sembang-app. Do not edit by hand.\nconst html: string = ${JSON.stringify(html)};\nexport default html;\n`,
);
console.log(`web/html.ts updated (${Math.round(html.length / 1024)} KB)`);
