// AI-written drawings arrive as SVG text. Nothing from the model is trusted: it is parsed,
// rebuilt from a short list of harmless shapes and attributes, and shown as an <img>, which
// never runs scripts. Anything else (text, images, links, styles, scripts) is dropped.
const TAGS = new Set(["svg", "g", "rect", "circle", "ellipse", "path", "line", "polyline", "polygon", "defs", "lineargradient", "radialgradient", "stop"]);
const ATTRS = new Set([
  "viewbox", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "d", "points", "fill", "stroke", "stroke-width",
  "stroke-linecap", "stroke-linejoin", "opacity", "fill-opacity", "stroke-opacity", "transform", "width", "height", "id", "offset",
  "stop-color", "stop-opacity", "gradientunits", "gradienttransform",
]);
const SAFE_VALUE = /^[\w\s#.,%()\-+:]*$/;

export function cleanSvg(raw: string): string | null {
  try {
    const start = raw.indexOf("<svg");
    const end = raw.lastIndexOf("</svg>");
    if (start < 0 || end < 0) return null;
    const doc = new DOMParser().parseFromString(raw.slice(start, end + 6), "image/svg+xml");
    if (doc.querySelector("parsererror")) return null;
    const root = doc.documentElement;
    let count = 0;
    const walk = (el: Element): string => {
      const name = el.localName.toLowerCase();
      if (!TAGS.has(name)) return "";
      if (++count > 160) return "";
      const attrs = [...el.attributes]
        .filter((a) => ATTRS.has(a.name.toLowerCase()) && SAFE_VALUE.test(a.value) && !/url\s*\(\s*(?!#)/i.test(a.value))
        .map((a) => `${a.name}="${a.value}"`)
        .join(" ");
      const kids = [...el.children].map(walk).join("");
      return `<${el.localName} ${attrs}>${kids}</${el.localName}>`;
    };
    const body = walk(root);
    if (count < 5 || count > 160) return null;
    return body.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ').replace(/<svg ([^>]*)viewBox="[^"]*"/, "<svg $1").replace("<svg ", '<svg viewBox="0 0 400 300" ');
  } catch {
    return null;
  }
}

export const svgUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
