/**
 * Registry of known terms that get visual "pill" treatment (icon + tint)
 * wherever string arrays render as badges (tables, tiles, detail pages).
 *
 * Lookup is case/punctuation-insensitive ("Wi-Fi", "wifi" -> WiFi). Unknown
 * terms render as plain badges, so the registry is purely additive.
 */

import type { LucideIcon } from "lucide-react";
import {
  AudioLines,
  Bluetooth,
  Cable,
  CircuitBoard,
  Clock,
  HdmiPort,
  MemoryStick,
  Network,
  Radio,
  Usb,
  Wifi,
  Workflow,
  Zap,
} from "lucide-react";

export interface PillDef {
  icon?: LucideIcon;
  className?: string;
  /** Extra spellings that should match this pill */
  aliases?: string[];
}

// Tint palette (subtle, dark-mode aware)
const SKY = "border-sky-400/50 bg-sky-500/10 text-sky-700 dark:text-sky-300";
const BLUE = "border-blue-400/50 bg-blue-500/10 text-blue-700 dark:text-blue-300";
const INDIGO = "border-indigo-400/50 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300";
const VIOLET = "border-violet-400/50 bg-violet-500/10 text-violet-700 dark:text-violet-300";
const AMBER = "border-amber-400/50 bg-amber-500/10 text-amber-700 dark:text-amber-300";
const EMERALD = "border-emerald-400/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
const PINK = "border-pink-400/50 bg-pink-500/10 text-pink-700 dark:text-pink-300";
const ORANGE = "border-orange-400/50 bg-orange-500/10 text-orange-700 dark:text-orange-300";
const YELLOW = "border-yellow-400/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300";
const SLATE = "border-slate-400/50 bg-slate-500/10 text-slate-700 dark:text-slate-300";

const PILLS: Record<string, PillDef> = {
  // Physical interfaces
  Ethernet: { icon: Network, className: SKY },
  WiFi: { icon: Wifi, className: SKY, aliases: ["wi-fi"] },
  "2.4GHz": { icon: Radio, className: EMERALD },
  USB: { icon: Usb, className: INDIGO },
  Bluetooth: { icon: Bluetooth, className: BLUE, aliases: ["BLE"] },
  HDMI: { icon: HdmiPort, className: SKY },
  Serial: { icon: Cable, className: SLATE, aliases: ["TTL Serial", "UART"] },
  "Wireless DMX": { icon: Radio, className: EMERALD },
  "RF Remote": { icon: Radio, className: EMERALD },
  Audio: { icon: AudioLines, className: PINK },
  I2C: { icon: CircuitBoard, className: SLATE },
  SPI: { icon: CircuitBoard, className: SLATE },

  // Storage
  "SD Card": { icon: MemoryStick, className: AMBER, aliases: ["SD"] },
  microSD: { icon: MemoryStick, className: AMBER, aliases: ["Micro-SD", "SD (micro)"] },
  Flash: { icon: MemoryStick, className: AMBER },

  // Control protocols / ecosystems
  ArtNet: { icon: Workflow, className: VIOLET, aliases: ["Art-Net"] },
  sACN: { icon: Workflow, className: VIOLET, aliases: ["E1.31"] },
  DDP: { icon: Workflow, className: VIOLET },
  DMX: { icon: Workflow, className: VIOLET, aliases: ["DMX512", "DMX 512"] },
  FPP: { icon: Workflow, className: VIOLET },

  // Power
  PoE: { icon: Zap, className: YELLOW },
  "PoE+": { icon: Zap, className: YELLOW },
  "PoE++": { icon: Zap, className: YELLOW },

  // Pixel data types
  Clocked: { icon: Clock, className: ORANGE, aliases: ["clocked"] },
};

function normalize(term: string): string {
  return term.toLowerCase().replace(/[\s_-]+/g, "");
}

const LOOKUP = new Map<string, PillDef>();
for (const [canonical, def] of Object.entries(PILLS)) {
  LOOKUP.set(normalize(canonical), def);
  for (const alias of def.aliases ?? []) {
    LOOKUP.set(normalize(alias), def);
  }
}

/** Pill definition for a known term, or undefined for plain-badge rendering. */
export function getPill(term: string): PillDef | undefined {
  return LOOKUP.get(normalize(term));
}
