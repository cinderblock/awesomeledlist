/**
 * Tile field configurations for categories that support tile view
 */

import type { TileField } from "@/components/data";
import type { BaseEntry, Pixel, Connector, DiffusiveMaterial } from "@/lib/data";

export const pixelTileFields: TileField<Pixel>[] = [
  { key: "color_order", label: "Colors" },
  { key: "led_voltage", label: "LED Voltage" },
  { key: "vcc_voltage", label: "VCC" },
  { key: "data_bitrate", label: "Data Rate" },
];

export const connectorTileFields: TileField<Connector>[] = [
  { key: "max_current", label: "Max Current" },
  { key: "max_voltage", label: "Max Voltage" },
  { key: "ip_rating", label: "IP Rating" },
  { key: "locking", label: "Locking" },
];

export const diffusiveMaterialTileFields: TileField<DiffusiveMaterial>[] = [
  { key: "material_type", label: "Type" },
  { key: "color_rendition", label: "Color" },
  { key: "light_transmission", label: "Transmission" },
  { key: "flexible", label: "Flexible" },
];

// Map category IDs to their tile field configurations
export function getTileFieldsForCategory(categoryId: string): TileField<BaseEntry>[] {
  const fieldMap: Record<string, TileField<BaseEntry>[]> = {
    pixels: pixelTileFields as TileField<BaseEntry>[],
    connectors: connectorTileFields as TileField<BaseEntry>[],
    "diffusive-materials": diffusiveMaterialTileFields as TileField<BaseEntry>[],
  };

  return fieldMap[categoryId] || [];
}
