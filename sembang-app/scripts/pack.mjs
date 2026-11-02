// Packs dist/ into one file, dist/Agilist.html, that opens without a server.
// Run `node scripts/build.mjs` first. For the microphone, serve it from localhost (see sembang-computer).
import { readFileSync, writeFileSync } from "node:fs";

const css = readFileSync("dist/app.css", "utf8");
const js = readFileSync("dist/app.js", "utf8").replaceAll("</script", "<\/script");
const fonts = "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap";
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Agilist</title>
<meta name="description" content="A conversation aid for caregivers of elderly people in Singapore.">
<link rel="stylesheet" href="${fonts}"><style>${css}</style></head><body><div id="root"></div><script>${js}</script></body></html>`;
writeFileSync("dist/Agilist.html", html);
console.log(`dist/Agilist.html (${Math.round(html.length / 1024)} KB)`);
