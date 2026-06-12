/**
 * Detail field configurations for each data category
 */

import type { DetailField } from "@/components/data";

export const controllerFields: DetailField[] = [
  { key: "manufacturer", label: "Manufacturer" },
  { key: "max_pixels", label: "Max Pixels" },
  { key: "max_outputs", label: "Max Outputs" },
  { key: "interfaces", label: "Interfaces" },
  { key: "protocols", label: "Protocols" },
  { key: "price", label: "Price" },
  { key: "storage", label: "Storage" },
  { key: "poe_support", label: "PoE" },
  { key: "standalone", label: "Standalone" },
  { key: "pixel_types", label: "Pixel Types" },
  { key: "max_voltage", label: "Max Voltage" },
  { key: "max_current", label: "Max Current" },
  { key: "buffered", label: "Buffered" },
  { key: "output_connectors", label: "Output Connectors" },
  { key: "outputs", label: "Outputs" },
  { key: "waterproof", label: "Waterproof" },
  { key: "auxiliary_outputs", label: "Auxiliary Outputs" },
  { key: "wled_compatible", label: "WLED Compatible" },
  { key: "warranty", label: "Warranty" },
  { key: "release_year", label: "Release Year" },
  { key: "status", label: "Status" },
];

export const pixelFields: DetailField[] = [
  { key: "manufacturer", label: "Manufacturer" },
  { key: "color_order", label: "Color Order" },
  { key: "led_voltage", label: "LED Voltage" },
  { key: "vcc_voltage", label: "VCC Voltage" },
  { key: "clocked", label: "Clocked" },
  { key: "pwm_frequency", label: "PWM Frequency" },
  { key: "brightness_bits", label: "Brightness Bits" },
  { key: "data_bitrate", label: "Data Bitrate" },
  { key: "data_type", label: "Data Type" },
  { key: "backup_data_line", label: "Backup Data Line" },
  { key: "package_size", label: "Package Size" },
];

export const pixelICFields: DetailField[] = [
  { key: "channels", label: "Channels" },
  { key: "clocked", label: "Clocked" },
  { key: "pwm_frequency", label: "PWM Frequency" },
  { key: "data_bitrate", label: "Data Bitrate" },
  { key: "data_type", label: "Data Type" },
  { key: "package_size", label: "Package Size" },
];

export const patternDriverFields: DetailField[] = [
  { key: "developer", label: "Developer" },
  { key: "price", label: "Price" },
  { key: "platforms", label: "Platforms" },
  { key: "live", label: "Live Output" },
  { key: "designer", label: "Pattern Designer" },
  { key: "visualizer", label: "Visualizer" },
  { key: "protocols.artnet", label: "Art-Net" },
  { key: "protocols.sacn", label: "sACN" },
  { key: "protocols.dmx", label: "DMX" },
  { key: "protocols.ddp", label: "DDP" },
  { key: "status", label: "Status" },
];

export const connectorFields: DetailField[] = [
  { key: "manufacturer", label: "Manufacturer" },
  { key: "outline", label: "Outline" },
  { key: "max_current", label: "Max Current" },
  { key: "max_voltage", label: "Max Voltage" },
  { key: "ip_rating", label: "IP Rating" },
  { key: "locking", label: "Locking" },
];

export const microboardFields: DetailField[] = [
  { key: "manufacturer", label: "Manufacturer" },
  { key: "soc", label: "SoC" },
  { key: "cpu", label: "CPU" },
  { key: "clock_speed", label: "Clock Speed" },
  { key: "flash", label: "Flash" },
  { key: "ram", label: "RAM" },
  { key: "wifi", label: "WiFi" },
  { key: "ethernet", label: "Ethernet" },
  { key: "price", label: "Price" },
];

export const levelConverterFields: DetailField[] = [
  { key: "manufacturer", label: "Manufacturer" },
  { key: "max_channels", label: "Max Channels" },
  { key: "price", label: "Price" },
];

export const adapterFields: DetailField[] = [
  { key: "manufacturer", label: "Manufacturer" },
  { key: "max_channels", label: "Max Channels" },
  { key: "pixel_types", label: "Pixel Types" },
  { key: "parent", label: "Parent System" },
  { key: "price", label: "Price" },
];

export const driveLibraryFields: DetailField[] = [
  { key: "developer", label: "Developer" },
  { key: "hardware", label: "Hardware" },
  { key: "features", label: "Features" },
];

export const pixelDecoderFields: DetailField[] = [
  { key: "manufacturer", label: "Manufacturer" },
  { key: "max_channels", label: "Max Channels" },
  { key: "pixel_types", label: "Pixel Types" },
  { key: "output_connectors", label: "Output Connectors" },
  { key: "outputs", label: "Outputs" },
  { key: "diy_or_ots", label: "DIY/OTS" },
  { key: "price", label: "Price" },
];

export const diffusiveMaterialFields: DetailField[] = [
  { key: "material_type", label: "Material Type" },
  { key: "color_rendition", label: "Color Rendition" },
  { key: "light_transmission", label: "Light Transmission" },
  { key: "flexible", label: "Flexible" },
  { key: "price_range", label: "Price Range" },
];

export const commercialSystemFields: DetailField[] = [
  { key: "manufacturer", label: "Manufacturer" },
  { key: "pixels_per_run", label: "Pixels Per Run" },
  { key: "color_type", label: "Color Type" },
  { key: "price_range", label: "Price Range" },
];

// Map category IDs to their field configurations
export function getFieldsForCategory(categoryId: string): DetailField[] {
  const fieldMap: Record<string, DetailField[]> = {
    controllers: controllerFields,
    pixels: pixelFields,
    "pixel-ics": pixelICFields,
    "pattern-drivers": patternDriverFields,
    connectors: connectorFields,
    microboards: microboardFields,
    "level-converters": levelConverterFields,
    adapters: adapterFields,
    "drive-libraries": driveLibraryFields,
    "pixel-decoders": pixelDecoderFields,
    "diffusive-materials": diffusiveMaterialFields,
    "commercial-systems": commercialSystemFields,
  };

  return fieldMap[categoryId] || [];
}
