/**
 * Column configurations for each data category
 */

import { Badge } from "@/components/ui/badge";
import type { Column } from "@/components/data";
import type {
  Controller,
  Pixel,
  PixelIC,
  PatternDriver,
  Connector,
  Microboard,
  Adapter,
  DriveLibrary,
  DiffusiveMaterial,
  CommercialSystem,
  BaseEntry,
} from "@/lib/data";

// Helper for rendering arrays as badges (limited to 3)
function renderBadgeArray(v: unknown) {
  if (!Array.isArray(v)) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {v.slice(0, 3).map((i, idx) => (
        <Badge key={idx} variant="outline" className="text-xs">
          {String(i)}
        </Badge>
      ))}
      {v.length > 3 && (
        <Badge variant="secondary" className="text-xs">
          +{v.length - 3}
        </Badge>
      )}
    </div>
  );
}

// Helper for status badges
function renderStatus(v: unknown) {
  if (!v) return null;
  const status = String(v).toLowerCase();
  const variant =
    status === "active" ? "default" : status === "discontinued" ? "secondary" : "outline";
  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  );
}

// Helper for boolean badges
function renderBool(v: unknown) {
  if (v === true) return <Badge variant="default">Yes</Badge>;
  if (v === false) return <Badge variant="secondary">No</Badge>;
  return null;
}

// Helper for formatting numbers
function formatNumber(v: unknown) {
  if (v == null) return "-";
  return Number(v).toLocaleString();
}

export const controllerColumns: Column<Controller>[] = [
  { key: "name", label: "Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "max_pixels", label: "Max Pixels", render: formatNumber },
  { key: "max_outputs", label: "Outputs" },
  { key: "interfaces", label: "Interfaces", render: renderBadgeArray },
  { key: "price", label: "Price" },
  { key: "wled_compatible", label: "WLED", render: renderBool },
  { key: "status", label: "Status", render: renderStatus },
];

export const pixelColumns: Column<Pixel>[] = [
  { key: "name", label: "Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "color_order", label: "Color Order" },
  { key: "led_voltage", label: "LED Voltage" },
  { key: "vcc_voltage", label: "VCC" },
  { key: "clocked", label: "Clocked", render: renderBool },
  { key: "data_bitrate", label: "Data Rate" },
  { key: "package_size", label: "Package" },
];

export const pixelICColumns: Column<PixelIC>[] = [
  { key: "name", label: "Name" },
  { key: "channels", label: "Channels" },
  { key: "clocked", label: "Clocked", render: renderBool },
  { key: "pwm_frequency", label: "PWM Freq" },
  { key: "data_bitrate", label: "Data Rate" },
  { key: "package_size", label: "Package" },
];

export const patternDriverColumns: Column<PatternDriver>[] = [
  { key: "name", label: "Name" },
  { key: "developer", label: "Developer" },
  { key: "price", label: "Price" },
  { key: "platforms", label: "Platforms", render: renderBadgeArray },
  { key: "live", label: "Live", render: renderBool },
  { key: "designer", label: "Designer", render: renderBool },
  { key: "visualizer", label: "Visualizer", render: renderBool },
  { key: "status", label: "Status", render: renderStatus },
];

export const connectorColumns: Column<Connector>[] = [
  { key: "name", label: "Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "outline", label: "Outline" },
  { key: "max_current", label: "Max Current" },
  { key: "max_voltage", label: "Max Voltage" },
  { key: "ip_rating", label: "IP Rating" },
  { key: "locking", label: "Locking" },
];

export const microboardColumns: Column<Microboard>[] = [
  { key: "name", label: "Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "soc", label: "SoC" },
  { key: "cpu", label: "CPU" },
  { key: "clock_speed", label: "Clock" },
  { key: "flash", label: "Flash" },
  { key: "ram", label: "RAM" },
  { key: "wifi", label: "WiFi" },
  { key: "ethernet", label: "Ethernet" },
  { key: "price", label: "Price" },
];

export const adapterColumns: Column<Adapter>[] = [
  { key: "name", label: "Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "max_channels", label: "Channels" },
  { key: "pixel_types", label: "Pixel Types" },
  { key: "price", label: "Price" },
];

export const driveLibraryColumns: Column<DriveLibrary>[] = [
  { key: "name", label: "Name" },
  { key: "developer", label: "Developer" },
  { key: "hardware", label: "Hardware" },
  { key: "features", label: "Features" },
];

export const diffusiveMaterialColumns: Column<DiffusiveMaterial>[] = [
  { key: "name", label: "Name" },
  { key: "material_type", label: "Type" },
  { key: "color_rendition", label: "Color Rendition" },
  { key: "light_transmission", label: "Transmission" },
  { key: "flexible", label: "Flexible" },
  { key: "price_range", label: "Price Range" },
];

export const commercialSystemColumns: Column<CommercialSystem>[] = [
  { key: "name", label: "Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "pixels_per_run", label: "Pixels/Run", render: formatNumber },
  { key: "color_type", label: "Color Type" },
  { key: "price_range", label: "Price Range" },
];

// Level converters and pixel decoders use generic columns
export const levelConverterColumns: Column<BaseEntry>[] = [
  { key: "name", label: "Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "max_channels", label: "Channels" },
  { key: "price", label: "Price" },
];

export const pixelDecoderColumns: Column<BaseEntry>[] = [
  { key: "name", label: "Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "max_channels", label: "Channels" },
  { key: "pixel_types", label: "Pixel Types" },
  { key: "outputs", label: "Outputs" },
  { key: "price", label: "Price" },
];

// Map category IDs to their column configurations
export function getColumnsForCategory(categoryId: string): Column<BaseEntry>[] {
  const columnMap: Record<string, Column<BaseEntry>[]> = {
    controllers: controllerColumns as Column<BaseEntry>[],
    pixels: pixelColumns as Column<BaseEntry>[],
    "pixel-ics": pixelICColumns as Column<BaseEntry>[],
    "pattern-drivers": patternDriverColumns as Column<BaseEntry>[],
    connectors: connectorColumns as Column<BaseEntry>[],
    microboards: microboardColumns as Column<BaseEntry>[],
    "level-converters": levelConverterColumns,
    adapters: adapterColumns as Column<BaseEntry>[],
    "drive-libraries": driveLibraryColumns as Column<BaseEntry>[],
    "pixel-decoders": pixelDecoderColumns,
    "diffusive-materials": diffusiveMaterialColumns as Column<BaseEntry>[],
    "commercial-systems": commercialSystemColumns as Column<BaseEntry>[],
  };

  return columnMap[categoryId] || [{ key: "name", label: "Name" }];
}

// Search keys for each category
export function getSearchKeysForCategory(categoryId: string): string[] {
  const searchKeyMap: Record<string, string[]> = {
    controllers: ["name", "manufacturer", "notes"],
    pixels: ["name", "manufacturer", "notes"],
    "pixel-ics": ["name", "notes"],
    "pattern-drivers": ["name", "developer", "notes"],
    connectors: ["name", "manufacturer", "notes"],
    microboards: ["name", "manufacturer", "soc"],
    "level-converters": ["name", "manufacturer", "notes"],
    adapters: ["name", "manufacturer", "notes"],
    "drive-libraries": ["name", "developer", "hardware"],
    "pixel-decoders": ["name", "manufacturer", "notes"],
    "diffusive-materials": ["name", "material_type", "notes"],
    "commercial-systems": ["name", "manufacturer", "notes"],
  };

  return searchKeyMap[categoryId] || ["name"];
}
