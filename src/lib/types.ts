export interface Category {
  id: string;
  name: string;
  description: string;
  path: string;
  viewType: "table" | "tile" | "both";
}

export const CATEGORIES: Category[] = [
  {
    id: "controllers",
    name: "Controllers",
    description: "Devices that generate pixel data signals",
    path: "/controllers",
    viewType: "table",
  },
  {
    id: "pixels",
    name: "Pixels",
    description: "Addressable LEDs with integrated ICs",
    path: "/pixels",
    viewType: "both",
  },
  {
    id: "pixel-ics",
    name: "Pixel ICs",
    description: "Standalone LED driver chips",
    path: "/pixel-ics",
    viewType: "table",
  },
  {
    id: "pattern-drivers",
    name: "Pattern Drivers",
    description: "Software for creating and sending LED patterns",
    path: "/pattern-drivers",
    viewType: "table",
  },
  {
    id: "connectors",
    name: "Connectors",
    description: "Common connectors used in LED products",
    path: "/connectors",
    viewType: "both",
  },
  {
    id: "microboards",
    name: "DIY MicroBoards",
    description: "Microcontroller boards for driving pixels",
    path: "/microboards",
    viewType: "table",
  },
  {
    id: "level-converters",
    name: "Level Converters",
    description: "Devices that translate signal levels",
    path: "/level-converters",
    viewType: "table",
  },
  {
    id: "adapters",
    name: "Adapters",
    description: "Hardware adapters for pixel systems",
    path: "/adapters",
    viewType: "table",
  },
  {
    id: "drive-libraries",
    name: "Drive Libraries",
    description: "Software libraries for driving pixels",
    path: "/drive-libraries",
    viewType: "table",
  },
  {
    id: "pixel-decoders",
    name: "Pixel Decoders",
    description: "Devices that decode pixel protocols",
    path: "/pixel-decoders",
    viewType: "table",
  },
  {
    id: "diffusive-materials",
    name: "Diffusive Materials",
    description: "Materials for diffusing LED light",
    path: "/diffusive-materials",
    viewType: "both",
  },
  {
    id: "commercial-systems",
    name: "Commercial Systems",
    description: "Complete commercial pixel systems",
    path: "/commercial-systems",
    viewType: "table",
  },
];
