# Awesome LED List - Project Guidelines

## Project Overview

A static website for the addressable LED community, replacing a collaborative Google Sheets document. The site presents comprehensive reference data about LED controllers, pixels, ICs, drivers, connectors, and related products.

**Live site:** awesomeledlist.com

## Architecture

```
awesomeledlist/
├── database/           # Human-editable YAML data files + image assets
│   ├── controllers/
│   ├── pixels/
│   ├── pixel-ics/
│   ├── pattern-drivers/
│   ├── connectors/
│   ├── microboards/
│   ├── level-converters/
│   ├── adapters/
│   ├── drive-libraries/
│   ├── pixel-decoders/
│   ├── diffusive-materials/
│   ├── commercial-systems/
│   └── _schema/        # JSON Schema definitions for validation
├── src/                # TypeScript/React source code
│   ├── components/     # Reusable UI components (shadcn/ui based)
│   ├── pages/          # Page components for each data category
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utilities, data loading, types
├── public/             # Static assets
├── dist/               # Build output (git-ignored)
├── original dataset/   # Source CSV files from Google Sheets
├── .github/
│   └── workflows/      # GitHub Actions for build & deploy
└── CLAUDE.md           # This file
```

## Technology Stack

- **Runtime/Build:** Bun (preferred) or Vite with React
- **Framework:** React 19+ with TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui components
- **Data Format:** YAML files in `database/` folder
- **Output:** Static HTML pages (one per category + individual entry pages)
- **Code Style:** Prettier for all supported file types

## Data Categories

Each category has its own YAML schema and view configuration:

| Category            | View Style     | Key Features                                     |
| ------------------- | -------------- | ------------------------------------------------ |
| Controllers         | Tabular/Detail | Specs comparison, filtering by interface/outputs |
| Pixels              | Tile/Image     | Color swatches, protocol info                    |
| Pixel ICs           | Tabular        | Technical specs, protocol compatibility          |
| Pattern Drivers     | Tabular        | Platform, price, protocol support matrix         |
| Connectors          | Image/Tile     | Pictures, current/voltage ratings                |
| DIY MicroBoards     | Tabular        | SoC, GPIO, connectivity specs                    |
| Level Converters    | Compact list   | Simple conversion specs                          |
| Adapters            | Compact list   | Compatibility info                               |
| Drive Libraries     | Tabular        | Platform, language, protocol support             |
| Pixel Decoders      | Tabular        | Protocol support                                 |
| Diffusive Materials | Image/Tile     | Material photos, properties                      |
| Commercial Systems  | Tabular/Detail | Vendor, ecosystem info                           |

## Key Features

### Navigation & Routing

- Each category = folder with `index.html` (clean URLs)
- Each entry = dedicated page for shareable links
- Fast client-side navigation without full reloads (React Router or similar)
- URL reflects current state (filters, selected entry)

### Filtering & State

- Column filters per category (like spreadsheet filters)
- Filters saved to localStorage for persistence
- URL query params for shareable filtered views
- Hover prefetch for instant navigation

### Views

- Multiple view modes per category (compact/expanded, table/tile)
- Responsive design for mobile/tablet/desktop
- Image lazy loading with blur placeholders

### Data Relationships

- Cross-references between entries (e.g., Controller -> compatible Pixel ICs)
- Related entries shown on detail pages
- Category cross-links where relevant

## Development Workflow

```bash
# Install dependencies
bun install

# Development server with hot reload
bun dev

# Build static output
bun build

# Preview production build
bun preview

# Format code
bun format

# Validate database schemas
bun validate
```

## Build Process

1. Read all YAML files from `database/`
2. Validate against JSON schemas
3. Generate static HTML for each page
4. Bundle JS/CSS with tree-shaking
5. Copy assets to output
6. Output to `dist/`

## GitHub Actions Workflow

On push to `main`:

1. Checkout code
2. Setup Bun
3. Install dependencies
4. Validate database
5. Build static site
6. Deploy to GitHub Pages (or configured host)

## Code Conventions

- Use TypeScript strict mode
- Prefer functional components with hooks
- Use shadcn/ui component patterns
- Keep components small and composable
- Extract repeated patterns into shared components
- Use Prettier defaults (no custom config unless needed)

## Database YAML Format

Example entry (controllers):

```yaml
# database/controllers/pixlite-4-mk2.yaml
id: pixlite-4-mk2
name: PixLite 4 Mk2
manufacturer: Advatek
price: 340
max_pixels: 4080
max_outputs: 8
interfaces:
  - FPP
  - Ethernet
  - WiFi
  - USB
voltage: 24V
current: 30A
buffered: true
output_connectors: Phoenix Screw
pixel_types:
  - single
  - clock
dmx_outputs: 1
wled_compatible: false
status: active
url: https://www.advateklights.com/pixlite-4-mk2-control-board
notes: "New firmware has a pixel counting test pattern, great for mapping"
```

## Future Features (v2+)

- **Component Wizard:** PCPartPicker-style compatibility checker
  - Select controller -> filter compatible pixels
  - Voltage/protocol/connector compatibility
  - Power supply calculator
  - Bill of materials export

## Common Commands

```bash
# Add new database entry
# (manually create YAML file in appropriate category folder)

# Update dependencies
bun update

# Check for type errors
bun typecheck
```

---

## Implementation Plan

### Phase 1: Project Setup

- [ ] Initialize Bun/Vite project with React 19, TypeScript, Tailwind v4
- [ ] Configure Prettier
- [ ] Setup shadcn/ui
- [ ] Create basic project structure
- [ ] Setup hot-reload development environment

### Phase 2: Database Schema & Migration

- [ ] Design JSON Schema for each category
- [ ] Create YAML validation script
- [ ] Convert CSV files to YAML format
- [ ] Organize images/assets

### Phase 3: Core UI Components

- [ ] Layout components (header, nav, footer)
- [ ] Data table component with sorting/filtering
- [ ] Tile/card view component
- [ ] Detail page component
- [ ] Filter controls
- [ ] View toggle (table/tile, compact/expanded)

### Phase 4: Page Implementation

- [ ] Home page with category overview
- [ ] Category list pages (one per data type)
- [ ] Individual entry detail pages
- [ ] Cross-reference links between entries

### Phase 5: State & Navigation

- [ ] React Router setup for clean URLs
- [ ] URL query param sync for filters
- [ ] localStorage persistence for preferences
- [ ] Link prefetching on hover

### Phase 6: Build & Deploy

- [ ] Static site generation script
- [ ] GitHub Actions workflow
- [ ] GitHub Pages deployment config
- [ ] Production optimization (minify, compress, etc.)

### Phase 7: Polish

- [ ] Responsive design testing
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] SEO meta tags
- [ ] 404 page
