// Hand-drawn SVG stand-ins for the photos. Each scene can be rendered in two treatments:
// "photo" (full colour, film grain, vignette) for family album prints, and "wash"
// (soft watercolour with wobbly edges) for scenes illustrated from the senior's words.
import { useId, type ReactElement } from "react";
import type { SceneId } from "../data";

type Treatment = "photo" | "wash";

interface Pal {
  sky1: string; sky2: string; sun: string; far: string; mid: string; near: string;
  ground: string; water: string; a1: string; a2: string; a3: string; skin: string;
  hair: string; dark: string; light: string; skyUrl?: string;
}

// Palettes: photo = faded colour film; wash = pastel watercolour.
const PALETTES: Record<SceneId, Record<Treatment, Pal>> = {
  shipyard: {
    photo: { sky1: "#E9A15C", sky2: "#F6D9A2", sun: "#FFF1C9", far: "#9C7A6A", mid: "#5E5752", near: "#3B3836", ground: "#6B5E52", water: "#7F8C8A", a1: "#A63B2E", a2: "#2F3A40", a3: "#E8E2D4", skin: "#B98764", hair: "#1E1A18", dark: "#262423", light: "#F4EBDA" },
    wash: { sky1: "#F2C9A0", sky2: "#F8E7CB", sun: "#FFF6E0", far: "#C9B4A6", mid: "#A39C95", near: "#8A8580", ground: "#B9AC9C", water: "#B7C3C0", a1: "#D58D80", a2: "#7E8A90", a3: "#F3EEE4", skin: "#E0BFA4", hair: "#5A514C", dark: "#6D6762", light: "#FBF6EC" },
  },
  tiongbahru: {
    photo: { sky1: "#7FA8C4", sky2: "#D6E3E3", sun: "#FFFFFF", far: "#B8C7BE", mid: "#E9E1CC", near: "#CFC4AA", ground: "#A9A08E", water: "#8FA7A8", a1: "#7EAE9C", a2: "#3F4A52", a3: "#F6F1E3", skin: "#C3926E", hair: "#1F1B19", dark: "#2B2E30", light: "#FBF7EC" },
    wash: { sky1: "#B9D2E0", sky2: "#E9F0EE", sun: "#FFFFFF", far: "#D3DDD5", mid: "#F2ECDD", near: "#E2D9C6", ground: "#CBC3B2", water: "#BCCDCD", a1: "#A9CDBE", a2: "#8B949A", a3: "#FAF6EC", skin: "#E5C6AC", hair: "#615853", dark: "#77797A", light: "#FDFBF4" },
  },
  kueh: {
    photo: { sky1: "#D9C7A1", sky2: "#EFE3C6", sun: "#FFF6DD", far: "#C8B48C", mid: "#E2D3B0", near: "#8C6E4F", ground: "#B9A486", water: "#9BB4A8", a1: "#B9473B", a2: "#3E7A5B", a3: "#F3E9D2", skin: "#B98764", hair: "#1E1A18", dark: "#2E2925", light: "#FAF3E3" },
    wash: { sky1: "#EBDDC2", sky2: "#F7EFDD", sun: "#FFF8E6", far: "#E0D0B0", mid: "#EFE4CB", near: "#C2A483", ground: "#DCCDB3", water: "#BFD3C8", a1: "#DE8C7F", a2: "#86B79A", a3: "#FAF4E6", skin: "#E7C7AC", hair: "#5F544D", dark: "#7A6E64", light: "#FDF9F0" },
  },
  wedding: {
    photo: { sky1: "#C9D0C9", sky2: "#E4E1D3", sun: "#FFFFFF", far: "#D8CDB6", mid: "#B9A88A", near: "#8D7B63", ground: "#A79B87", water: "#8FA7A8", a1: "#B43A33", a2: "#2B2E33", a3: "#F7F3EA", skin: "#C3926E", hair: "#1B1817", dark: "#25262A", light: "#FBF8F0" },
    wash: { sky1: "#E1E5DF", sky2: "#F1EFE6", sun: "#FFFFFF", far: "#E8DFCC", mid: "#D3C6AE", near: "#B9AA93", ground: "#D0C6B5", water: "#BCCDCD", a1: "#DE8E86", a2: "#8B8E93", a3: "#FBF9F3", skin: "#E5C6AC", hair: "#5E5652", dark: "#7B7C80", light: "#FEFCF7" },
  },
  bus: {
    photo: { sky1: "#9DB9C9", sky2: "#E3E6DC", sun: "#FFFFFF", far: "#AFC0A9", mid: "#7E9B78", near: "#5C7458", ground: "#8E8A80", water: "#8FA7A8", a1: "#3F7A59", a2: "#E8DDBF", a3: "#B8463A", skin: "#BC8A66", hair: "#1E1A18", dark: "#262626", light: "#F7F2E6" },
    wash: { sky1: "#C8DAE3", sky2: "#F0F1EA", sun: "#FFFFFF", far: "#CFDACB", mid: "#B0C4AB", near: "#9AAE95", ground: "#C3BFB6", water: "#BCCDCD", a1: "#93BCA2", a2: "#F3EBD6", a3: "#DE958B", skin: "#E5C6AC", hair: "#5E5652", dark: "#76767A", light: "#FDFBF5" },
  },
  seaside: {
    photo: { sky1: "#6FA3C2", sky2: "#D8E7E6", sun: "#FFFBEA", far: "#7E9E9A", mid: "#5D8C95", near: "#3F6D78", ground: "#E3CFA6", water: "#4F8FA3", a1: "#C8553F", a2: "#2F4F57", a3: "#F2E7CF", skin: "#B98764", hair: "#1E1A18", dark: "#27302F", light: "#FBF6EA" },
    wash: { sky1: "#B3D0E0", sky2: "#EDF4F2", sun: "#FFFDF2", far: "#BCCFCC", mid: "#A8C4CA", near: "#94B4BB", ground: "#F1E4CA", water: "#9DC2CE", a1: "#E59A89", a2: "#7E9499", a3: "#F8F1E1", skin: "#E5C6AC", hair: "#5E5652", dark: "#757D7D", light: "#FDFAF2" },
  },
  wayang: {
    photo: { sky1: "#1C2433", sky2: "#3A3550", sun: "#F4D58A", far: "#2A2A38", mid: "#7A2A24", near: "#3B2A22", ground: "#5A4A3C", water: "#8FA7A8", a1: "#B8322A", a2: "#D9A13B", a3: "#F3E7CF", skin: "#E9D6C2", hair: "#1B1817", dark: "#1E1A18", light: "#FAF3E3" },
    wash: { sky1: "#5D6684", sky2: "#8E87A6", sun: "#F7E2A8", far: "#6F6E86", mid: "#C46F62", near: "#8A6B5A", ground: "#B9A58F", water: "#BCCDCD", a1: "#D9675C", a2: "#E8BD6A", a3: "#FAF0DC", skin: "#F3E4D4", hair: "#4E4644", dark: "#5C5350", light: "#FDF8EE" },
  },
  kampung: {
    photo: { sky1: "#8FB3C9", sky2: "#E4E6D6", sun: "#FFFBEA", far: "#7E9B78", mid: "#9C7B58", near: "#6B5038", ground: "#8E8A62", water: "#8FA7A8", a1: "#B8873F", a2: "#4F6B45", a3: "#E9DDBF", skin: "#B98764", hair: "#1E1A18", dark: "#2E2925", light: "#F7F1E2" },
    wash: { sky1: "#C3D6E2", sky2: "#F1F2EA", sun: "#FFFDF2", far: "#B8CBB3", mid: "#CDB596", near: "#A88F78", ground: "#C9C5A4", water: "#BCCDCD", a1: "#DDBB86", a2: "#97B08D", a3: "#F4ECD9", skin: "#E5C6AC", hair: "#5E5652", dark: "#76706A", light: "#FDFBF4" },
  },
  trishaw: {
    photo: { sky1: "#A9C3CF", sky2: "#EAE6D8", sun: "#FFFFFF", far: "#D9C9A8", mid: "#C98E5E", near: "#7C9A8A", ground: "#9A948A", water: "#8FA7A8", a1: "#2F5E7A", a2: "#B3473A", a3: "#F1E8D2", skin: "#B98764", hair: "#1E1A18", dark: "#262626", light: "#FAF5E8" },
    wash: { sky1: "#CFDDE3", sky2: "#F4F2EA", sun: "#FFFFFF", far: "#EADFC8", mid: "#E2BC9C", near: "#AFC3B8", ground: "#C8C4BD", water: "#BCCDCD", a1: "#8FAFC2", a2: "#DE958B", a3: "#F8F2E4", skin: "#E5C6AC", hair: "#5E5652", dark: "#77767A", light: "#FDFBF5" },
  },
  radio: {
    photo: { sky1: "#D9C7A6", sky2: "#EDE2CB", sun: "#FFF4D8", far: "#C9B48F", mid: "#7A5236", near: "#5A3C28", ground: "#A58B6C", water: "#8FA7A8", a1: "#B9473B", a2: "#3E6A5B", a3: "#E9DEC4", skin: "#B98764", hair: "#1E1A18", dark: "#2B231D", light: "#F8F1E1" },
    wash: { sky1: "#EBDFCB", sky2: "#F6EFE1", sun: "#FFF8E8", far: "#E1D2B9", mid: "#BE9C82", near: "#A3897A", ground: "#D6C6B0", water: "#BCCDCD", a1: "#DE8C7F", a2: "#93B5A8", a3: "#F6EFDF", skin: "#E7C7AC", hair: "#5F544D", dark: "#7A6E64", light: "#FDF9F0" },
  },
};

// A simple figure seen from the front, with no facial features.
function Person({ x, y, s = 1, top, bottom, skin, hair, dress = false, bun = false }: {
  x: number; y: number; s?: number; top: string; bottom: string; skin: string; hair: string; dress?: boolean; bun?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {dress ? (
        <path d="M-9 -38 L9 -38 L16 0 L-16 0 Z" fill={top} />
      ) : (
        <>
          <rect x="-7" y="-20" width="5.5" height="20" rx="2" fill={bottom} />
          <rect x="1.5" y="-20" width="5.5" height="20" rx="2" fill={bottom} />
          <path d="M-9 -38 Q0 -41 9 -38 L8 -18 L-8 -18 Z" fill={top} />
        </>
      )}
      <rect x="-12" y="-37" width="4.5" height="17" rx="2" fill={top} />
      <rect x="7.5" y="-37" width="4.5" height="17" rx="2" fill={top} />
      <circle cx="-9.8" cy="-19" r="2.3" fill={skin} />
      <circle cx="9.8" cy="-19" r="2.3" fill={skin} />
      <rect x="-2.5" y="-43" width="5" height="6" fill={skin} />
      <circle cx="0" cy="-49" r="7" fill={skin} />
      <path d="M-7.2 -49.5 Q-7 -57.5 0 -57.5 Q7 -57.5 7.2 -49.5 Q4 -53 0 -53 Q-4 -53 -7.2 -49.5 Z" fill={hair} />
      {bun && <circle cx="0" cy="-58" r="3.6" fill={hair} />}
    </g>
  );
}

function Shipyard({ p }: { p: Pal }) {
  return (
    <>
      <rect width="400" height="300" fill={p.skyUrl} />
      <circle cx="304" cy="128" r="44" fill={p.sun} opacity="0.35" />
      <circle cx="304" cy="128" r="24" fill={p.sun} />
      <path d="M0 168 Q60 150 120 160 T240 156 T400 162 V178 H0 Z" fill={p.far} opacity="0.7" />
      <rect y="174" width="400" height="126" fill={p.water} />
      <g opacity="0.55" stroke={p.sun} strokeWidth="2" strokeLinecap="round">
        <path d="M284 184 H326" /><path d="M276 194 H334" /><path d="M290 204 H318" /><path d="M280 214 H330" />
      </g>
      {/* crane one */}
      <g stroke={p.near} strokeWidth="2.2" fill="none">
        <path d="M52 200 V62 M68 200 V62 M52 62 H68" />
        {[80, 100, 120, 140, 160, 180].map((y) => <path key={y} d={`M52 ${y} L68 ${y - 20}`} />)}
        <path d="M30 60 H214 M30 68 H214 M30 60 L30 68 M214 60 L214 68" />
        {[50, 80, 110, 140, 170, 200].map((x) => <path key={x} d={`M${x} 60 L${x + 15} 68`} />)}
        <path d="M60 40 L30 60 M60 40 L214 60 M60 40 V62" />
        <path d="M180 68 V118" strokeWidth="1.4" />
      </g>
      <rect x="174" y="118" width="12" height="7" fill={p.near} />
      <rect x="24" y="64" width="16" height="12" fill={p.near} />
      {/* crane two */}
      <g stroke={p.mid} strokeWidth="2" fill="none" opacity="0.85">
        <path d="M342 196 V92 M354 196 V92 M342 92 H354" />
        {[110, 130, 150, 170, 190].map((y) => <path key={y} d={`M342 ${y} L354 ${y - 16}`} />)}
        <path d="M300 90 H398 M300 96 H398" />
        <path d="M348 74 L300 90 M348 74 L398 90 M348 74 V92" />
      </g>
      {/* ship in dock */}
      <path d="M70 170 L300 170 L284 206 L92 206 Z" fill={p.a2} />
      <path d="M86 196 L292 196 L284 206 L92 206 Z" fill={p.a1} />
      <rect x="214" y="134" width="56" height="36" fill={p.a3} />
      <rect x="220" y="140" width="44" height="6" fill={p.a2} opacity="0.55" />
      <rect x="226" y="116" width="16" height="20" fill={p.a1} />
      <rect x="226" y="116" width="16" height="4" fill={p.dark} />
      <rect x="110" y="160" width="80" height="10" fill={p.a3} opacity="0.8" />
      {[120, 140, 160].map((x) => <Person key={x} x={x} y={170} s={0.28} top={p.light} bottom={p.dark} skin={p.skin} hair={p.hair} />)}
      {/* quay */}
      <path d="M0 236 L400 226 V300 H0 Z" fill={p.ground} />
      <path d="M0 236 L400 226" stroke={p.dark} strokeWidth="2" opacity="0.4" />
      <rect x="236" y="216" width="10" height="14" rx="3" fill={p.dark} />
      <rect x="312" y="212" width="10" height="14" rx="3" fill={p.dark} />
      {/* bicycle */}
      <g stroke={p.dark} strokeWidth="2.4" fill="none">
        <circle cx="146" cy="276" r="12" /><circle cx="186" cy="276" r="12" />
        <path d="M146 276 L162 256 L180 256 L186 276 M162 256 L170 276 L146 276 M180 256 L178 250 M158 252 H168" />
      </g>
      <Person x={118} y={290} s={1.05} top={p.light} bottom={p.a2} skin={p.skin} hair={p.hair} />
    </>
  );
}

function TiongBahru({ p }: { p: Pal }) {
  return (
    <>
      <rect width="400" height="300" fill={p.skyUrl} />
      <g fill={p.sun} opacity="0.75">
        <ellipse cx="90" cy="46" rx="44" ry="11" /><ellipse cx="120" cy="38" rx="28" ry="10" />
        <ellipse cx="300" cy="60" rx="38" ry="9" />
      </g>
      {/* spiral staircase */}
      <rect x="20" y="82" width="34" height="170" fill={p.near} />
      <g stroke={p.a3} strokeWidth="2.5" fill="none" opacity="0.9">
        {[96, 124, 152, 180, 208, 236].map((y) => <path key={y} d={`M20 ${y} Q37 ${y - 14} 54 ${y} Q37 ${y + 14} 20 ${y + 28}`} />)}
      </g>
      {/* main block with a curved end */}
      <path d="M50 92 H280 Q326 92 326 140 V250 H50 Z" fill={p.mid} />
      {[132, 172, 212].map((y) => (
        <g key={y}>
          <rect x="50" y={y} width="250" height="7" fill={p.a1} />
          <path d={`M300 ${y} H320 Q326 ${y} 326 ${y + 4} V${y + 7} H300 Z`} fill={p.a1} />
        </g>
      ))}
      {[100, 140, 180, 220].map((y) =>
        [64, 104, 144, 184, 224].map((x) => (
          <g key={`${x}-${y}`}>
            <rect x={x} y={y + 2} width="26" height="24" fill={p.a3} />
            <rect x={x + 3} y={y + 5} width="9" height="18" fill={p.a2} opacity="0.75" />
            <rect x={x + 14} y={y + 5} width="9" height="18" fill={p.a2} opacity="0.75" />
          </g>
        )),
      )}
      {[100, 140, 180, 220].map((y) => <rect key={y} x="272" y={y + 2} width="40" height="24" rx="10" fill={p.a2} opacity="0.6" />)}
      <rect x="258" y="70" width="10" height="182" fill={p.a3} />
      <path d="M50 88 H280 Q330 88 330 136 V92 Q330 84 322 84 H50 Z" fill={p.a3} />
      {/* five foot way and road */}
      <rect y="250" width="400" height="14" fill={p.near} />
      <rect y="264" width="400" height="36" fill={p.ground} />
      <path d="M0 282 H400" stroke={p.a3} strokeWidth="2" strokeDasharray="18 14" opacity="0.6" />
      {/* angsana tree */}
      <rect x="352" y="160" width="9" height="92" fill={p.dark} />
      <g fill={p.a1}>
        <circle cx="356" cy="140" r="36" opacity="0.95" /><circle cx="330" cy="160" r="22" /><circle cx="384" cy="160" r="24" />
      </g>
      <g fill={p.dark} opacity="0.2"><circle cx="366" cy="152" r="22" /></g>
      <Person x={150} y={262} s={0.62} top={p.a3} bottom={p.a2} skin={p.skin} hair={p.hair} />
      <circle cx="168" cy="258" r="5" fill={p.a1} />
    </>
  );
}

function KuehStall({ p }: { p: Pal }) {
  return (
    <>
      <rect width="400" height="300" fill={p.skyUrl} />
      {/* shophouse */}
      <rect x="30" y="20" width="340" height="190" fill={p.mid} />
      <rect x="30" y="20" width="340" height="12" fill={p.near} opacity="0.5" />
      {[60, 160, 260].map((x) => (
        <g key={x}>
          <rect x={x} y="42" width="76" height="62" rx="30" fill={p.a2} opacity="0.85" />
          {[52, 62, 72, 82, 92].map((y) => <path key={y} d={`M${x + 6} ${y} H${x + 70}`} stroke={p.a3} strokeWidth="2" opacity="0.6" />)}
        </g>
      ))}
      <rect x="120" y="112" width="160" height="22" rx="3" fill={p.a3} />
      <rect x="132" y="119" width="136" height="8" rx="2" fill={p.near} opacity="0.35" />
      {/* striped awning (red, as first drawn) */}
      <path d="M20 140 H380 L364 172 H36 Z" fill={p.a3} />
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M${20 + i * 40} 140 H${40 + i * 40} L${38 + i * 40} 172 H${22 + i * 40} Z`} fill={p.a1} opacity="0.85" />
      ))}
      <path d="M36 172 Q46 180 56 172 Q66 180 76 172 Q86 180 96 172 Q106 180 116 172 Q126 180 136 172 Q146 180 156 172 Q166 180 176 172 Q186 180 196 172 Q206 180 216 172 Q226 180 236 172 Q246 180 256 172 Q266 180 276 172 Q286 180 296 172 Q306 180 316 172 Q326 180 336 172 Q346 180 356 172 Q364 178 364 172" fill="none" stroke={p.a1} strokeWidth="3" opacity="0.8" />
      <rect x="0" y="210" width="400" height="90" fill={p.ground} />
      {/* mother behind the stall */}
      <Person x={152} y={248} s={1.15} top={p.a2} bottom={p.dark} skin={p.skin} hair={p.hair} bun />
      {/* stall table */}
      <rect x="70" y="222" width="190" height="10" rx="2" fill={p.near} />
      <rect x="82" y="232" width="8" height="52" fill={p.near} />
      <rect x="240" y="232" width="8" height="52" fill={p.near} />
      {/* trays of kueh */}
      {[[100, 214], [150, 210], [204, 214]].map(([cx, cy], i) => (
        <g key={i}>
          <ellipse cx={cx} cy={cy} rx="24" ry="8" fill={p.a3} stroke={p.near} strokeWidth="1.5" />
          {i === 0 && [0, 1, 2].map((k) => (
            <g key={k}>
              <rect x={cx - 15 + k * 10} y={cy - 9} width="8" height="3" fill={p.a1} />
              <rect x={cx - 15 + k * 10} y={cy - 6} width="8" height="3" fill={p.light} />
              <rect x={cx - 15 + k * 10} y={cy - 3} width="8" height="3" fill={p.a2} />
            </g>
          ))}
          {i === 1 && [0, 1, 2, 3].map((k) => <circle key={k} cx={cx - 12 + k * 8} cy={cy - 4} r="3.6" fill={p.a2} />)}
          {i === 2 && [0, 1, 2].map((k) => <rect key={k} x={cx - 14 + k * 10} y={cy - 8} width="8" height="6" rx="2" fill={p.light} stroke={p.near} strokeWidth="0.8" />)}
        </g>
      ))}
      {/* the boy carrying a tray */}
      <Person x={300} y={278} s={0.7} top={p.light} bottom={p.a2} skin={p.skin} hair={p.hair} />
      <ellipse cx="300" cy="244" rx="18" ry="5" fill={p.a3} stroke={p.near} strokeWidth="1.2" />
      {/* marble coffee table */}
      <ellipse cx="350" cy="256" rx="26" ry="7" fill={p.light} stroke={p.near} strokeWidth="1.2" />
      <rect x="347" y="262" width="6" height="26" fill={p.dark} />
      <rect x="340" y="246" width="9" height="9" rx="2" fill={p.light} stroke={p.near} strokeWidth="1" />
    </>
  );
}

function Wedding({ p }: { p: Pal }) {
  return (
    <>
      <rect width="400" height="300" fill={p.far} />
      {/* house front */}
      <rect x="0" y="0" width="400" height="214" fill={p.mid} />
      <rect x="120" y="40" width="160" height="174" fill={p.near} />
      <rect x="132" y="52" width="136" height="162" fill={p.dark} opacity="0.75" />
      <path d="M120 40 H280 V56 H120 Z" fill={p.a1} />
      {/* red paper diamond on the door */}
      <rect x="185" y="92" width="30" height="30" transform="rotate(45 200 107)" fill={p.a1} />
      <rect x="194" y="101" width="12" height="12" transform="rotate(45 200 107)" fill={p.light} opacity="0.25" />
      {/* lanterns */}
      {[70, 330].map((x) => (
        <g key={x}>
          <path d={`M${x} 0 V30`} stroke={p.dark} strokeWidth="1.5" />
          <ellipse cx={x} cy="50" rx="18" ry="22" fill={p.a1} />
          <rect x={x - 8} y="26" width="16" height="5" fill={p.dark} />
          <rect x={x - 8} y="70" width="16" height="5" fill={p.dark} />
          <path d={`M${x - 4} 75 V90 M${x} 75 V92 M${x + 4} 75 V90`} stroke={p.a1} strokeWidth="1.5" />
        </g>
      ))}
      {/* tiled floor in perspective */}
      <rect y="214" width="400" height="86" fill={p.ground} />
      <g stroke={p.near} strokeWidth="1.2" opacity="0.45">
        {[-200, -120, -40, 40, 120, 200, 280, 360, 440, 520, 600].map((x) => <path key={x} d={`M200 214 L${x} 300`} />)}
        {[226, 242, 264, 292].map((y) => <path key={y} d={`M0 ${y} H400`} />)}
      </g>
      {/* couple */}
      <Person x={172} y={268} s={1.45} top={p.a2} bottom={p.a2} skin={p.skin} hair={p.hair} />
      <path d="M168.5 210 L172 226 L175.5 210 Z" fill={p.light} />
      <Person x={226} y={268} s={1.45} top={p.a3} bottom={p.a3} skin={p.skin} hair={p.hair} dress />
      <path d="M216 186 Q226 178 236 186 L252 262 L200 262 Z" fill={p.a3} opacity="0.55" />
      <g>
        <circle cx="214" cy="236" r="6" fill={p.a1} /><circle cx="221" cy="232" r="5" fill={p.a1} /><circle cx="219" cy="240" r="5" fill={p.a1} />
      </g>
    </>
  );
}

function Bus({ p }: { p: Pal }) {
  return (
    <>
      <rect width="400" height="300" fill={p.skyUrl} />
      <path d="M0 170 Q80 140 160 160 T320 150 T400 160 V200 H0 Z" fill={p.far} />
      <rect y="196" width="400" height="104" fill={p.ground} />
      <path d="M0 250 H400" stroke={p.light} strokeWidth="3" strokeDasharray="22 16" opacity="0.6" />
      {/* palm */}
      <path d="M352 200 Q346 140 356 92" stroke={p.dark} strokeWidth="6" fill="none" />
      <g fill={p.near}>
        <path d="M356 92 Q320 80 296 100 Q326 90 356 96 Z" /><path d="M356 92 Q392 76 400 98 Q384 88 356 96 Z" />
        <path d="M356 92 Q340 60 318 58 Q342 72 354 96 Z" /><path d="M356 92 Q372 58 394 60 Q370 72 358 96 Z" />
      </g>
      {/* bus */}
      <path d="M40 120 Q40 104 58 104 H268 Q290 104 292 126 L296 214 H40 Z" fill={p.a2} />
      <rect x="40" y="168" width="256" height="46" fill={p.a1} />
      <path d="M40 166 H296" stroke={p.dark} strokeWidth="2" opacity="0.4" />
      {[54, 98, 142, 186, 230].map((x) => <rect key={x} x={x} y="118" width="38" height="36" rx="4" fill={p.dark} opacity="0.7" />)}
      <rect x="252" y="114" width="36" height="44" rx="6" fill={p.dark} opacity="0.6" />
      <rect x="62" y="108" width="80" height="8" rx="2" fill={p.a3} />
      {[90, 250].map((x) => (
        <g key={x}><circle cx={x} cy="216" r="20" fill={p.dark} /><circle cx={x} cy="216" r="8" fill={p.light} opacity="0.7" /></g>
      ))}
      {/* stop and waiting friends */}
      <path d="M318 262 V160" stroke={p.dark} strokeWidth="3" />
      <rect x="306" y="150" width="24" height="16" rx="3" fill={p.a3} />
      <Person x={330} y={276} s={0.92} top={p.light} bottom={p.dark} skin={p.skin} hair={p.hair} />
      <Person x={360} y={278} s={0.95} top={p.a1} bottom={p.dark} skin={p.skin} hair={p.hair} />
      <Person x={386} y={276} s={0.9} top={p.light} bottom={p.near} skin={p.skin} hair={p.hair} />
    </>
  );
}

function Seaside({ p }: { p: Pal }) {
  return (
    <>
      <rect width="400" height="300" fill={p.skyUrl} />
      <circle cx="80" cy="70" r="20" fill={p.sun} />
      <rect y="150" width="400" height="80" fill={p.water} />
      <path d="M0 150 H400" stroke={p.light} strokeWidth="1.5" opacity="0.6" />
      <g stroke={p.light} strokeWidth="1.5" opacity="0.45" strokeLinecap="round">
        <path d="M30 172 H70" /><path d="M120 186 H170" /><path d="M250 176 H290" /><path d="M200 204 H240" />
      </g>
      {/* kelong on stilts */}
      <g fill={p.a2}>
        <rect x="270" y="112" width="70" height="22" />
        <path d="M262 112 L305 92 L348 112 Z" />
        {[274, 290, 306, 322, 336].map((x) => <rect key={x} x={x} y="134" width="3" height="30" />)}
      </g>
      {/* sand */}
      <path d="M0 220 Q120 206 220 218 T400 214 V300 H0 Z" fill={p.ground} />
      {/* casuarina */}
      <path d="M40 300 Q46 230 34 160" stroke={p.dark} strokeWidth="5" fill="none" />
      <g fill={p.near}><ellipse cx="34" cy="160" rx="30" ry="40" /><ellipse cx="54" cy="196" rx="22" ry="26" /></g>
      {/* picnic mat */}
      <path d="M150 262 L300 252 L320 286 L140 296 Z" fill={p.a1} />
      <g stroke={p.light} strokeWidth="2" opacity="0.55"><path d="M168 260 L162 294 M196 258 L192 292 M224 256 L222 290 M252 254 L252 289 M280 253 L284 287" /></g>
      <rect x="210" y="236" width="18" height="30" rx="3" fill={p.a3} />
      <path d="M210 244 H228 M210 252 H228" stroke={p.dark} strokeWidth="1.2" />
      <Person x={180} y={262} s={1} top={p.light} bottom={p.a2} skin={p.skin} hair={p.hair} />
      <Person x={262} y={262} s={0.98} top={p.a1} bottom={p.a1} skin={p.skin} hair={p.hair} dress bun />
      <Person x={300} y={268} s={0.55} top={p.a3} bottom={p.a2} skin={p.skin} hair={p.hair} />
    </>
  );
}


function Wayang({ p }: { p: Pal }) {
  const lanterns = [40, 100, 160, 240, 300, 360];
  return (
    <>
      <rect width="400" height="300" fill={p.skyUrl} />
      <g fill={p.sun} opacity="0.8">
        <circle cx="60" cy="30" r="1.2" /><circle cx="140" cy="18" r="1" /><circle cx="330" cy="26" r="1.3" /><circle cx="250" cy="14" r="0.9" />
      </g>
      {/* temple roof on the left */}
      <path d="M-10 92 Q30 70 90 66 L60 86 L-10 96 Z" fill={p.near} />
      <path d="M-10 96 H70 V220 H-10 Z" fill={p.far} />
      {/* lantern string */}
      <path d="M0 52 Q100 76 200 58 T400 54" stroke={p.dark} strokeWidth="1.2" fill="none" />
      {lanterns.map((x, i) => {
        const y = 56 + Math.sin(i * 1.3) * 6 + (i % 2) * 6;
        return (
          <g key={x}>
            <circle cx={x} cy={y + 8} r="13" fill={p.sun} opacity="0.18" />
            <ellipse cx={x} cy={y + 8} rx="6.5" ry="8" fill={p.a1} />
          </g>
        );
      })}
      {/* stage */}
      <rect x="90" y="86" width="250" height="122" fill={p.mid} />
      <path d="M90 86 H340 V100 Q215 120 90 100 Z" fill={p.a1} />
      <path d="M90 86 H340" stroke={p.a2} strokeWidth="4" />
      <rect x="90" y="86" width="14" height="122" fill={p.a2} opacity="0.85" />
      <rect x="326" y="86" width="14" height="122" fill={p.a2} opacity="0.85" />
      <rect x="84" y="208" width="262" height="14" fill={p.near} />
      <path d="M84 208 H346" stroke={p.a2} strokeWidth="2" />
      {/* performer: wide sleeves, headdress flags, painted face in colour only */}
      <g transform="translate(215 204)">
        <path d="M-6 -88 L-22 -112 M6 -88 L22 -112 M0 -90 V-118" stroke={p.a2} strokeWidth="2.5" />
        <path d="M-22 -112 l-6 -10 l10 3 z M22 -112 l6 -10 l-10 3 z" fill={p.a1} />
        <path d="M-16 -60 Q0 -66 16 -60 L28 0 H-28 Z" fill={p.a2} />
        <path d="M-16 -58 Q-44 -46 -50 -22 L-30 -20 Q-26 -40 -14 -46 Z" fill={p.a3} />
        <path d="M16 -58 Q44 -70 54 -50 L38 -40 Q30 -50 14 -46 Z" fill={p.a3} />
        <path d="M-8 -60 L8 -60 L4 -40 L-4 -40 Z" fill={p.a1} />
        <rect x="-3" y="-66" width="6" height="7" fill={p.skin} />
        <ellipse cx="0" cy="-76" rx="9" ry="11" fill={p.skin} />
        <path d="M-9 -78 Q0 -70 9 -78 L7 -72 Q0 -66 -7 -72 Z" fill={p.a1} />
        <path d="M-10 -82 Q0 -98 10 -82 Q0 -88 -10 -82 Z" fill={p.a2} />
      </g>
      {/* audience in front */}
      <rect y="222" width="400" height="78" fill={p.ground} />
      {[30, 76, 124, 300, 348].map((x, i) => (
        <g key={x}>
          <rect x={x - 12} y="268" width="24" height="5" fill={p.near} />
          <rect x={x - 10} y="273" width="3" height="20" fill={p.near} />
          <rect x={x + 7} y="273" width="3" height="20" fill={p.near} />
          <path d={`M${x - 13} 268 Q${x} ${246 - (i % 2) * 4} ${x + 13} 268 Z`} fill={p.dark} />
          <circle cx={x} cy={238 - (i % 2) * 4} r="9" fill={p.dark} />
        </g>
      ))}
      {/* the small boy and his father at the front */}
      <path d="M178 276 Q192 250 206 276 Z" fill={p.dark} />
      <circle cx="192" cy="244" r="10" fill={p.dark} />
      <path d="M220 280 Q228 264 236 280 Z" fill={p.dark} />
      <circle cx="228" cy="260" r="6.5" fill={p.dark} />
    </>
  );
}

function Kampung({ p }: { p: Pal }) {
  return (
    <>
      <rect width="400" height="300" fill={p.skyUrl} />
      <circle cx="320" cy="58" r="22" fill={p.sun} opacity="0.85" />
      <path d="M0 170 Q80 140 160 160 T400 150 V210 H0 Z" fill={p.far} />
      {/* coconut palms */}
      {[[40, 60], [350, 40]].map(([x, top]) => (
        <g key={x}>
          <path d={`M${x} 230 Q${x + 8} 150 ${x + 4} ${top + 10}`} stroke={p.near} strokeWidth="6" fill="none" />
          {[-60, -20, 20, 60, 100].map((a) => (
            <path key={a} d={`M${x + 4} ${top + 10} q${Math.cos((a * Math.PI) / 180) * 30} ${Math.sin((a * Math.PI) / 180) * 18 - 4} ${Math.cos((a * Math.PI) / 180) * 50} ${Math.abs(Math.sin((a * Math.PI) / 180)) * 22 + 10}`} stroke={p.a2} strokeWidth="5" fill="none" strokeLinecap="round" />
          ))}
        </g>
      ))}
      <rect y="210" width="400" height="90" fill={p.ground} />
      {/* house on stilts with an attap roof */}
      <g transform="translate(110 96)">
        {[8, 60, 112, 164].map((x) => <rect key={x} x={x} y="96" width="7" height="44" fill={p.near} />)}
        <rect x="0" y="40" width="180" height="62" fill={p.mid} />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => <path key={i} d={`M${i * 20 + 4} 40 V102`} stroke={p.near} strokeWidth="1.5" opacity="0.6" />)}
        <path d="M-18 44 L90 -8 L198 44 Z" fill={p.a1} />
        <path d="M-18 44 L90 -8 L198 44" stroke={p.near} strokeWidth="3" fill="none" />
        <rect x="76" y="56" width="30" height="46" fill={p.dark} opacity="0.8" />
        <rect x="22" y="56" width="34" height="24" fill={p.a3} />
        <rect x="128" y="56" width="34" height="24" fill={p.a3} />
        {/* steps */}
        <path d="M80 102 L70 140 M104 102 L94 140 M72 116 H100 M70 128 H98" stroke={p.near} strokeWidth="3" />
      </g>
      {/* chickens */}
      {[60, 92, 300].map((x, i) => (
        <g key={x} transform={`translate(${x} ${262 + (i % 2) * 6})`}>
          <ellipse cx="0" cy="0" rx="9" ry="6.5" fill={p.light} />
          <circle cx="8" cy="-6" r="4" fill={p.light} />
          <path d="M11 -7 l4 1 l-4 1 z" fill={p.a1} />
        </g>
      ))}
      <Person x={262} y={276} s={0.9} top={p.a3} bottom={p.a2} skin={p.skin} hair={p.hair} />
    </>
  );
}

function Trishaw({ p }: { p: Pal }) {
  return (
    <>
      <rect width="400" height="300" fill={p.skyUrl} />
      {/* shophouses */}
      {[0, 100, 200, 300].map((x, i) => (
        <g key={x}>
          <rect x={x} y="40" width="100" height="170" fill={i % 2 ? p.far : p.mid} />
          <path d={`M${x} 40 H${x + 100} V52 H${x} Z`} fill={p.light} opacity="0.7" />
          {[14, 58].map((wx) => (
            <g key={wx}>
              <rect x={x + wx} y="66" width="28" height="40" rx="12" fill={p.near} opacity="0.85" />
              <rect x={x + wx} y="66" width="28" height="40" rx="12" fill="none" stroke={p.light} strokeWidth="2" />
            </g>
          ))}
          <rect x={x} y="124" width="100" height="10" fill={p.a2} opacity="0.85" />
          <rect x={x + 10} y="140" width="80" height="70" fill={p.dark} opacity="0.35" />
        </g>
      ))}
      {/* five-foot way and road */}
      <rect y="210" width="400" height="90" fill={p.ground} />
      <path d="M0 226 H400" stroke={p.light} strokeWidth="2" opacity="0.4" />
      {/* the trishaw: sidecar with hood, rider on the bicycle */}
      <g transform="translate(150 268)">
        <circle cx="0" cy="0" r="22" fill="none" stroke={p.dark} strokeWidth="3.5" />
        <circle cx="96" cy="0" r="22" fill="none" stroke={p.dark} strokeWidth="3.5" />
        <circle cx="0" cy="0" r="3" fill={p.dark} /><circle cx="96" cy="0" r="3" fill={p.dark} />
        <path d="M-30 -18 H34 L28 -48 H-24 Z" fill={p.a1} />
        <path d="M-34 -48 Q0 -96 38 -48 Z" fill={p.a1} opacity="0.85" />
        <path d="M34 -18 L96 0 M60 -10 L72 -54 L86 -56 M72 -54 L66 -54" stroke={p.dark} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <Person x={0} y={-20} s={0.62} top={p.a3} bottom={p.a2} skin={p.skin} hair={p.hair} />
        <Person x={74} y={-30} s={0.72} top={p.light} bottom={p.near} skin={p.skin} hair={p.hair} />
      </g>
      <Person x={46} y={250} s={0.8} top={p.a2} bottom={p.dark} skin={p.skin} hair={p.hair} />
      <Person x={350} y={246} s={0.78} top={p.a3} bottom={p.a1} skin={p.skin} hair={p.hair} dress bun />
    </>
  );
}

function Radio({ p }: { p: Pal }) {
  return (
    <>
      <rect width="400" height="300" fill={p.sky2} />
      {/* wall and window */}
      <rect width="400" height="200" fill={p.far} />
      <rect x="260" y="30" width="110" height="90" fill={p.sky1} />
      <path d="M315 30 V120 M260 75 H370" stroke={p.near} strokeWidth="4" />
      <rect x="260" y="30" width="110" height="90" fill="none" stroke={p.near} strokeWidth="5" />
      <rect y="200" width="400" height="100" fill={p.ground} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <path key={i} d={`M${i * 56} 200 L${i * 56 - 40} 300`} stroke={p.near} strokeWidth="1.2" opacity="0.35" />)}
      {/* shelf with the Rediffusion box */}
      <rect x="40" y="140" width="170" height="10" fill={p.near} />
      <g transform="translate(70 62)">
        <rect x="0" y="0" width="110" height="78" rx="10" fill={p.mid} />
        <rect x="10" y="10" width="62" height="58" rx="30" fill={p.near} />
        {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M16 ${18 + i * 10} H66`} stroke={p.mid} strokeWidth="3" opacity="0.7" />)}
        <circle cx="90" cy="26" r="8" fill={p.a3} />
        <circle cx="90" cy="52" r="8" fill={p.a3} />
      </g>
      {/* sound */}
      {[0, 1, 2].map((i) => <path key={i} d={`M${196 + i * 12} ${84 - i * 6} q10 17 0 34`} stroke={p.dark} strokeWidth="2" fill="none" opacity={0.5 - i * 0.12} />)}
      {/* family listening: a rattan chair and figures */}
      <path d="M210 270 Q214 214 250 210 Q286 214 290 270" fill={p.a1} opacity="0.75" />
      <Person x={250} y={262} s={0.95} top={p.a3} bottom={p.a2} skin={p.skin} hair={p.hair} />
      <Person x={120} y={272} s={0.62} top={p.a2} bottom={p.near} skin={p.skin} hair={p.hair} />
      <Person x={340} y={268} s={0.9} top={p.a1} bottom={p.a1} skin={p.skin} hair={p.hair} dress bun />
    </>
  );
}

const SCENES: Record<SceneId, (props: { p: Pal }) => ReactElement> = {
  shipyard: Shipyard,
  tiongbahru: TiongBahru,
  kueh: KuehStall,
  wedding: Wedding,
  bus: Bus,
  seaside: Seaside,
  wayang: Wayang,
  kampung: Kampung,
  trishaw: Trishaw,
  radio: Radio,
};

export function Scene({ scene, treatment, label }: { scene: SceneId; treatment: Treatment; label: string }) {
  const raw = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = (s: string) => `${s}${raw}`;
  const p: Pal = { ...PALETTES[scene][treatment], skyUrl: `url(#${id("sky")})` };
  const Body = SCENES[scene];

  return (
    <svg viewBox="0 0 400 300" role="img" aria-label={label} preserveAspectRatio="xMidYMid slice" className="scene-svg">
      <defs>
        <linearGradient id={id("sky")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sky1} />
          <stop offset="0.62" stopColor={p.sky2} />
        </linearGradient>
        <filter id={id("grain")} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer><feFuncA type="table" tableValues="0 0.22" /></feComponentTransfer>
        </filter>
        <radialGradient id={id("vig")} cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#1a120a" stopOpacity="0.42" />
        </radialGradient>
        <filter id={id("wash")} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="0.6" />
        </filter>
        <filter id={id("paper")} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="3" seed="3" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.45  0 0 0 0 0.3  0 0 0 0.16 0" />
        </filter>
      </defs>
      <g filter={treatment === "wash" ? `url(#${id("wash")})` : undefined} opacity={treatment === "wash" ? 0.92 : 1}>
        <Body p={p} />
      </g>
      {treatment === "photo" ? (
        <>
          <rect width="400" height="300" fill="#f2c27a" opacity="0.08" style={{ mixBlendMode: "multiply" }} />
          <rect width="400" height="300" fill={`url(#${id("vig")})`} />
          <rect width="400" height="300" filter={`url(#${id("grain")})`} />
        </>
      ) : (
        <rect width="400" height="300" filter={`url(#${id("paper")})`} />
      )}
    </svg>
  );
}
