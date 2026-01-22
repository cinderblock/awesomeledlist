/**
 * Column configurations for each data category
 */

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ExternalLink, FileText, ShoppingCart, Youtube } from "lucide-react";
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

// Link configuration for external URLs
interface LinkConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
}

// Helper to extract domain from URL for tooltip
function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

// Helper to render link icons for an entry
function renderLinks(item: BaseEntry, linkConfigs: LinkConfig[]) {
  const links = linkConfigs
    .map((config) => {
      const value = item[config.key];
      if (typeof value !== "string" || !value.startsWith("http")) return null;
      return { ...config, url: value };
    })
    .filter(Boolean) as (LinkConfig & { url: string })[];

  if (links.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {links.map((link) => (
          <Tooltip key={link.key}>
            <TooltipTrigger asChild>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary rounded p-1 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {link.icon}
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {link.label}: {getDomain(link.url)}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

// Default links (url field)
const defaultLinks: LinkConfig[] = [
  { key: "url", label: "Product page", icon: <ExternalLink className="h-4 w-4" /> },
];

// Links with datasheet
const datasheetLinks: LinkConfig[] = [
  { key: "url", label: "Product page", icon: <ExternalLink className="h-4 w-4" /> },
  { key: "datasheet_url", label: "Datasheet", icon: <FileText className="h-4 w-4" /> },
];

// Links for connectors (with suppliers)
const connectorLinks: LinkConfig[] = [
  { key: "url", label: "Product page", icon: <ExternalLink className="h-4 w-4" /> },
  { key: "digikey_url", label: "DigiKey", icon: <ShoppingCart className="h-4 w-4" /> },
  { key: "mouser_url", label: "Mouser", icon: <ShoppingCart className="h-4 w-4" /> },
];

// Links for drive libraries (with YouTube)
const libraryLinks: LinkConfig[] = [
  { key: "url", label: "Project page", icon: <ExternalLink className="h-4 w-4" /> },
  { key: "youtube_url", label: "YouTube", icon: <Youtube className="h-4 w-4" /> },
];

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
  {
    key: "links",
    label: "",
    sortable: false,
    render: (_, item) => renderLinks(item as BaseEntry, defaultLinks),
  },
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
  {
    key: "links",
    label: "",
    sortable: false,
    render: (_, item) => renderLinks(item as BaseEntry, datasheetLinks),
  },
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
  {
    key: "links",
    label: "",
    sortable: false,
    render: (_, item) => renderLinks(item as BaseEntry, datasheetLinks),
  },
  { key: "name", label: "Name" },
  { key: "channels", label: "Channels" },
  { key: "clocked", label: "Clocked", render: renderBool },
  { key: "pwm_frequency", label: "PWM Freq" },
  { key: "data_bitrate", label: "Data Rate" },
  { key: "package_size", label: "Package" },
];

export const patternDriverColumns: Column<PatternDriver>[] = [
  {
    key: "links",
    label: "",
    sortable: false,
    render: (_, item) => renderLinks(item as BaseEntry, defaultLinks),
  },
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
  {
    key: "links",
    label: "",
    sortable: false,
    render: (_, item) => renderLinks(item as BaseEntry, connectorLinks),
  },
  { key: "name", label: "Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "outline", label: "Outline" },
  { key: "max_current", label: "Max Current" },
  { key: "max_voltage", label: "Max Voltage" },
  { key: "ip_rating", label: "IP Rating" },
  { key: "locking", label: "Locking" },
];

export const microboardColumns: Column<Microboard>[] = [
  {
    key: "links",
    label: "",
    sortable: false,
    render: (_, item) => renderLinks(item as BaseEntry, defaultLinks),
  },
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
  {
    key: "links",
    label: "",
    sortable: false,
    render: (_, item) => renderLinks(item as BaseEntry, defaultLinks),
  },
  { key: "name", label: "Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "max_channels", label: "Channels" },
  { key: "pixel_types", label: "Pixel Types" },
  { key: "price", label: "Price" },
];

export const driveLibraryColumns: Column<DriveLibrary>[] = [
  {
    key: "links",
    label: "",
    sortable: false,
    render: (_, item) => renderLinks(item as BaseEntry, libraryLinks),
  },
  { key: "name", label: "Name" },
  { key: "developer", label: "Developer" },
  { key: "hardware", label: "Hardware" },
  { key: "features", label: "Features" },
];

export const diffusiveMaterialColumns: Column<DiffusiveMaterial>[] = [
  {
    key: "links",
    label: "",
    sortable: false,
    render: (_, item) => renderLinks(item as BaseEntry, defaultLinks),
  },
  { key: "name", label: "Name" },
  { key: "material_type", label: "Type" },
  { key: "color_rendition", label: "Color Rendition" },
  { key: "light_transmission", label: "Transmission" },
  { key: "flexible", label: "Flexible" },
  { key: "price_range", label: "Price Range" },
];

export const commercialSystemColumns: Column<CommercialSystem>[] = [
  {
    key: "links",
    label: "",
    sortable: false,
    render: (_, item) => renderLinks(item as BaseEntry, defaultLinks),
  },
  { key: "name", label: "Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "pixels_per_run", label: "Pixels/Run", render: formatNumber },
  { key: "color_type", label: "Color Type" },
  { key: "price_range", label: "Price Range" },
];

// Level converters and pixel decoders use generic columns
export const levelConverterColumns: Column<BaseEntry>[] = [
  {
    key: "links",
    label: "",
    sortable: false,
    render: (_, item) => renderLinks(item, defaultLinks),
  },
  { key: "name", label: "Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "max_channels", label: "Channels" },
  { key: "price", label: "Price" },
];

export const pixelDecoderColumns: Column<BaseEntry>[] = [
  {
    key: "links",
    label: "",
    sortable: false,
    render: (_, item) => renderLinks(item, defaultLinks),
  },
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
