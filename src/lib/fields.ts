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
  { key: "language", label: "Language" },
  { key: "platforms", label: "Platforms" },
  { key: "hardware", label: "Hardware" },
  { key: "supported_ics", label: "Supported ICs" },
  { key: "license", label: "License" },
  { key: "features", label: "Features" },
  { key: "status", label: "Status" },
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

/**
 * Sectioned detail layouts (goal: per-category entry page designs).
 * Categories with sections render one titled card per section; categories
 * without fall back to the flat field list above. Sections whose fields are
 * all null are hidden entirely.
 */
export interface DetailSection {
  title: string;
  fields: DetailField[];
}

const pixelSections: DetailSection[] = [
  {
    title: "Overview",
    fields: [
      { key: "manufacturer", label: "Manufacturer" },
      { key: "data_type", label: "Data Type" },
      { key: "color_order", label: "Color Order" },
      { key: "release_year", label: "Release Year" },
      { key: "spec_update_year", label: "Spec Updated" },
      { key: "status", label: "Status" },
    ],
  },
  {
    title: "Electrical",
    fields: [
      { key: "led_voltage", label: "LED Voltage" },
      { key: "vcc_voltage", label: "VCC Voltage" },
      { key: "wattage", label: "Power / Pixel" },
      { key: "channel_current", label: "Channel Current" },
      { key: "quiescent_current", label: "Quiescent Current" },
      { key: "gpio_min", label: "Input High (min)" },
      { key: "gpio_max", label: "Input Voltage (max)" },
    ],
  },
  {
    title: "Data & Control",
    fields: [
      { key: "clocked", label: "Clocked" },
      { key: "data_bitrate", label: "Data Bitrate" },
      { key: "pwm_frequency", label: "PWM Frequency" },
      { key: "brightness_bits", label: "Brightness Bits" },
      { key: "brightness_control_method", label: "Brightness Control" },
      { key: "pixel_data_size", label: "Data Size / Pixel" },
      { key: "pixel_rate_max", label: "Max Pixel Rate" },
      { key: "max_pixels_per_string", label: "Max Pixels / String" },
      { key: "backup_data_line", label: "Backup Data Line" },
    ],
  },
  {
    title: "Physical",
    fields: [
      { key: "package_size", label: "Package Size" },
      { key: "package_sizes", label: "Available Packages" },
      { key: "pin_count", label: "Pin Count" },
    ],
  },
];

const pixelICSections: DetailSection[] = [
  {
    title: "Overview",
    fields: [
      { key: "manufacturer", label: "Manufacturer" },
      { key: "data_type", label: "Data Type" },
      { key: "channels", label: "Channels" },
      { key: "release_year", label: "Release Year" },
      { key: "status", label: "Status" },
    ],
  },
  {
    title: "Electrical",
    fields: [
      { key: "output_voltage", label: "Output Voltage" },
      { key: "supply_voltage", label: "Supply Voltage" },
      { key: "max_current", label: "Max Current" },
      { key: "current_programmable", label: "Programmable Current" },
      { key: "current_range", label: "Current Range" },
      { key: "quiescent_current", label: "Quiescent Current" },
      { key: "gpio_min", label: "Input High (min)" },
      { key: "gpio_max", label: "Input Voltage (max)" },
    ],
  },
  {
    title: "Data & Control",
    fields: [
      { key: "clocked", label: "Clocked" },
      { key: "data_bitrate", label: "Data Bitrate" },
      { key: "pwm_frequency", label: "PWM Frequency" },
      { key: "channel_bits", label: "Channel Bits" },
      { key: "aggregate_bits", label: "Aggregate Bits" },
      { key: "brightness_bits", label: "Brightness Bits" },
      { key: "brightness_control_method", label: "Brightness Control" },
      { key: "pixel_data_size", label: "Data Size / Pixel" },
      { key: "pixel_rate_max", label: "Max Pixel Rate" },
      { key: "max_pixels_per_string", label: "Max Pixels / String" },
      { key: "backup_data_line", label: "Backup Data Line" },
    ],
  },
  {
    title: "Physical",
    fields: [
      { key: "package_size", label: "Package Size" },
      { key: "package_sizes", label: "Available Packages" },
      { key: "pin_count", label: "Pin Count" },
    ],
  },
];

const controllerSections: DetailSection[] = [
  {
    title: "Overview",
    fields: [
      { key: "manufacturer", label: "Manufacturer" },
      { key: "price", label: "Price" },
      { key: "release_year", label: "Release Year" },
      { key: "warranty", label: "Warranty" },
      { key: "status", label: "Status" },
      { key: "wled_compatible", label: "WLED Compatible" },
      { key: "requires_host", label: "Requires Host" },
    ],
  },
  {
    title: "Connectivity",
    fields: [
      { key: "interfaces", label: "Interfaces" },
      { key: "protocols", label: "Protocols" },
      { key: "poe_support", label: "PoE" },
      { key: "standalone", label: "Standalone" },
      { key: "storage", label: "Storage" },
    ],
  },
  {
    title: "Outputs",
    fields: [
      { key: "max_pixels", label: "Max Pixels" },
      { key: "max_pixels_rgbw", label: "Max Pixels (RGBW)" },
      { key: "max_outputs", label: "Max Outputs" },
      { key: "pixel_types", label: "Pixel Types" },
      { key: "output_connectors", label: "Output Connectors" },
      { key: "outputs", label: "Outputs" },
      { key: "auxiliary_outputs", label: "Auxiliary Outputs" },
      { key: "differential_outputs", label: "Differential Outputs" },
    ],
  },
  {
    title: "Power",
    fields: [
      { key: "max_voltage", label: "Max Voltage" },
      { key: "max_current", label: "Max Current" },
      { key: "max_current_per_output", label: "Max Current / Output" },
      { key: "buffered", label: "Buffered" },
      { key: "power_features", label: "Power Features" },
      { key: "waterproof", label: "Waterproof" },
    ],
  },
];

const connectorSections: DetailSection[] = [
  {
    title: "Overview",
    fields: [
      { key: "manufacturer", label: "Manufacturer" },
      { key: "outline", label: "Outline" },
      { key: "gendered", label: "Gendered" },
      { key: "year_introduced", label: "Introduced" },
      { key: "aliases", label: "Aliases" },
      { key: "common_applications", label: "Common Applications" },
    ],
  },
  {
    title: "Ratings",
    fields: [
      { key: "max_current", label: "Max Current" },
      { key: "max_voltage", label: "Max Voltage" },
      { key: "ip_rating", label: "IP Rating" },
    ],
  },
  {
    title: "Mechanical",
    fields: [
      { key: "locking", label: "Locking" },
      { key: "panel_mount", label: "Panel Mount" },
      { key: "wire_to_wire", label: "Wire-to-Wire" },
      { key: "pcb_mount", label: "PCB Mount" },
      { key: "pitch", label: "Pitch" },
      { key: "min_pins", label: "Min Pins" },
      { key: "max_pins", label: "Max Pins" },
      { key: "rows", label: "Rows" },
    ],
  },
  {
    title: "Termination",
    fields: [
      { key: "solder", label: "Solder" },
      { key: "screw_terminal", label: "Screw Terminal" },
      { key: "crimp", label: "Crimp" },
      { key: "crimp_tool", label: "Crimp Tool" },
      { key: "crimp_tool_cost", label: "Crimp Tool Cost" },
      { key: "idc", label: "IDC" },
      { key: "smallest_gauge", label: "Smallest Gauge" },
      { key: "largest_gauge", label: "Largest Gauge" },
    ],
  },
  {
    title: "Wiring",
    fields: [
      { key: "pinout", label: "Pinout" },
      { key: "convention", label: "Convention" },
      { key: "colors", label: "Colors" },
    ],
  },
];

const microboardSections: DetailSection[] = [
  {
    title: "Overview",
    fields: [
      { key: "manufacturer", label: "Manufacturer" },
      { key: "price", label: "Price" },
      { key: "release_year", label: "Release Year" },
    ],
  },
  {
    title: "Compute",
    fields: [
      { key: "soc", label: "SoC" },
      { key: "cpu", label: "CPU" },
      { key: "isa", label: "ISA" },
      { key: "clock_speed", label: "Clock Speed" },
      { key: "flash", label: "Flash" },
      { key: "ram", label: "RAM" },
      { key: "linux", label: "Runs Linux" },
    ],
  },
  {
    title: "Connectivity",
    fields: [
      { key: "wifi", label: "WiFi" },
      { key: "ethernet", label: "Ethernet" },
      { key: "bluetooth", label: "Bluetooth" },
      { key: "usb", label: "USB" },
      { key: "ttl_serial", label: "TTL Serial" },
      { key: "poe", label: "PoE" },
    ],
  },
  {
    title: "Power & I/O",
    fields: [
      { key: "min_input_voltage", label: "Min Input Voltage" },
      { key: "max_input_voltage", label: "Max Input Voltage" },
      { key: "gpio_voltage", label: "GPIO Voltage" },
      { key: "max_outputs", label: "Max Outputs" },
      { key: "storage", label: "Storage" },
      { key: "bms", label: "BMS" },
      { key: "imu", label: "IMU" },
    ],
  },
];

const patternDriverSections: DetailSection[] = [
  {
    title: "Overview",
    fields: [
      { key: "developer", label: "Developer" },
      { key: "price", label: "Price" },
      { key: "license_type", label: "License" },
      { key: "platforms", label: "Platforms" },
      { key: "language", label: "Language" },
      { key: "status", label: "Status" },
    ],
  },
  {
    title: "Capabilities",
    fields: [
      { key: "live", label: "Live Output" },
      { key: "designer", label: "Pattern Designer" },
      { key: "visualizer", label: "Visualizer" },
      { key: "programmatic", label: "Programmatic" },
      { key: "integrations", label: "Integrations" },
    ],
  },
  {
    title: "Protocols & Outputs",
    fields: [
      { key: "protocols.artnet", label: "Art-Net" },
      { key: "protocols.sacn", label: "sACN" },
      { key: "protocols.dmx", label: "DMX" },
      { key: "protocols.ddp", label: "DDP" },
      { key: "protocols.kinet", label: "KiNET" },
      { key: "protocols.opc", label: "OPC" },
      { key: "protocols.spi", label: "SPI" },
      { key: "gpio", label: "GPIO" },
      { key: "serial", label: "Serial" },
      { key: "other_outputs", label: "Other Outputs" },
    ],
  },
  {
    title: "Inputs",
    fields: [
      { key: "video_input", label: "Video Input" },
      { key: "audio_input", label: "Audio Input" },
      { key: "adc_input", label: "ADC Input" },
      { key: "other_inputs", label: "Other Inputs" },
    ],
  },
  {
    title: "Try It",
    fields: [
      { key: "demo_available", label: "Demo Available" },
      { key: "demo_limitations", label: "Demo Limitations" },
    ],
  },
];

/** Sectioned layout for a category, or null to use the flat field list. */
export function getSectionsForCategory(categoryId: string): DetailSection[] | null {
  const sectionMap: Record<string, DetailSection[]> = {
    pixels: pixelSections,
    "pixel-ics": pixelICSections,
    controllers: controllerSections,
    connectors: connectorSections,
    microboards: microboardSections,
    "pattern-drivers": patternDriverSections,
  };

  return sectionMap[categoryId] ?? null;
}

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
