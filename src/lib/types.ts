export interface CategoryColor {
  hue: number; // OKLCH hue value (0-360)
  name: string; // Human-readable color name
}

export interface Category {
  id: string;
  name: string;
  description: string;
  path: string;
  viewType: "table" | "tile" | "both";
  color: CategoryColor;
}

// Rainbow colors distributed across 12 categories (30° apart on the color wheel)
export const CATEGORIES: Category[] = [
  {
    id: "controllers",
    name: "Controllers",
    description: "Devices that generate pixel data signals",
    path: "/controllers",
    viewType: "table",
    color: { hue: 0, name: "red" }, // Red
  },
  {
    id: "pixels",
    name: "Pixels",
    description: "Addressable LEDs with integrated ICs",
    path: "/pixels",
    viewType: "both",
    color: { hue: 30, name: "orange" }, // Orange
  },
  {
    id: "pixel-ics",
    name: "Pixel ICs",
    description: "Standalone LED driver chips",
    path: "/pixel-ics",
    viewType: "table",
    color: { hue: 55, name: "gold" }, // Gold/Yellow-orange
  },
  {
    id: "pattern-drivers",
    name: "Pattern Drivers",
    description: "Software for creating and sending LED patterns",
    path: "/pattern-drivers",
    viewType: "table",
    color: { hue: 85, name: "lime" }, // Lime/Yellow-green
  },
  {
    id: "connectors",
    name: "Connectors",
    description: "Common connectors used in LED products",
    path: "/connectors",
    viewType: "both",
    color: { hue: 145, name: "green" }, // Green
  },
  {
    id: "microboards",
    name: "DIY MicroBoards",
    description: "Microcontroller boards for driving pixels",
    path: "/microboards",
    viewType: "table",
    color: { hue: 175, name: "teal" }, // Teal
  },
  {
    id: "level-converters",
    name: "Level Converters",
    description: "Devices that translate signal levels",
    path: "/level-converters",
    viewType: "table",
    color: { hue: 200, name: "cyan" }, // Cyan
  },
  {
    id: "adapters",
    name: "Adapters",
    description: "Hardware adapters for pixel systems",
    path: "/adapters",
    viewType: "table",
    color: { hue: 230, name: "blue" }, // Blue
  },
  {
    id: "drive-libraries",
    name: "Drive Libraries",
    description: "Software libraries for driving pixels",
    path: "/drive-libraries",
    viewType: "table",
    color: { hue: 265, name: "indigo" }, // Indigo
  },
  {
    id: "pixel-decoders",
    name: "Pixel Decoders",
    description: "Devices that decode pixel protocols",
    path: "/pixel-decoders",
    viewType: "table",
    color: { hue: 295, name: "purple" }, // Purple
  },
  {
    id: "diffusive-materials",
    name: "Diffusive Materials",
    description: "Materials for diffusing LED light",
    path: "/diffusive-materials",
    viewType: "both",
    color: { hue: 325, name: "magenta" }, // Magenta
  },
  {
    id: "commercial-systems",
    name: "Commercial Systems",
    description: "Complete commercial pixel systems",
    path: "/commercial-systems",
    viewType: "table",
    color: { hue: 350, name: "rose" }, // Rose/Pink-red
  },
];
