# Awesome LED List - Detailed Implementation Plan

## Overview

Transform the Google Sheets-based awesomeledlist.com into a modern, fast static website with React, TypeScript, and YAML-based data files.

---

## Phase 1: Project Initialization

### 1.1 Setup Build Tooling
- Initialize project with Bun (test Vite as fallback if Bun SSG support is insufficient)
- Configure TypeScript with strict mode
- Setup Tailwind CSS v4 (latest stable)
- Install and configure Prettier
- Create `.prettierrc` with sensible defaults
- Add format scripts to package.json

### 1.2 React & UI Setup
- Install React 19 (latest stable)
- Install React Router for client-side navigation
- Initialize shadcn/ui with Tailwind
- Setup component library structure
- Configure path aliases (@/components, @/lib, etc.)

### 1.3 Project Structure
```
ui/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn/ui base components
│   │   ├── layout/       # Header, Footer, Sidebar, Nav
│   │   ├── data/         # DataTable, TileGrid, FilterBar
│   │   └── entry/        # EntryCard, EntryDetail, EntryLink
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── CategoryPage.tsx
│   │   └── EntryPage.tsx
│   ├── hooks/
│   │   ├── useFilters.ts
│   │   ├── useLocalStorage.ts
│   │   └── usePrefetch.ts
│   ├── lib/
│   │   ├── data-loader.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
└── index.html
```

### 1.4 Development Experience
- Configure hot module replacement (HMR)
- Setup dev server with instant reload
- Add TypeScript path mapping
- Configure source maps for debugging

---

## Phase 2: Database Design & Migration

### 2.1 Schema Design

Create JSON Schema files for validation in `database/_schema/`:

**Common fields across categories:**
- `id`: Unique identifier (kebab-case)
- `name`: Display name
- `manufacturer`: Company/creator
- `url`: Product/info URL
- `status`: active | discontinued | end-of-life
- `notes`: Free-form text
- `images`: Array of image paths

**Category-specific schemas:**

#### Controllers
```yaml
# Core specs
max_pixels: number
max_outputs: number
price: string (supports ranges like "$100-150")
interfaces: string[] # Ethernet, WiFi, USB, DMX, etc.
storage: string # No, SD, Flash, etc.
standalone: boolean
pixel_types: string[] # Async, Both, Clocked
max_voltage: string
max_current: string
buffered: boolean
output_connectors: string
outputs: string # Single, Clock, Single or Clock
waterproof: string # IP rating
auxiliary_outputs: string
wled_compatible: boolean
warranty: string
introduction_year: number
```

#### Pixels (LEDs with integrated ICs)
```yaml
color_group: string # RGB, RGBW, etc.
led_voltage: string
clocked: boolean
vcc_voltage: string
pwm_frequency: string
brightness_bits: number
data_bitrate: string
pixel_data_size: string
pixel_rate_max: string
gpio_min: string
gpio_max: string
wattage: string
channel_current: string
quiescent_current: string
package_size: string[]
pin_count: number
data_type: string
backup_data_line: boolean
max_per_string: number
release_year: number
original_manufacturer: string
datasheet_url: string
```

#### Pixel ICs (standalone driver chips)
```yaml
pwm_frequency: string
channels: number
channel_bits: number
aggregate_bits: number
clocked: boolean
data_bitrate: string
pixel_data_size: string
pixel_rate_max: string
output_voltage: string
supply_voltage: string
max_current: string
quiescent_current: string
package_size: string
pin_count: number
data_type: string
backup_data_line: boolean
max_per_string: number
release_year: number
datasheet_url: string
```

#### Pattern Drivers (software)
```yaml
developer: string
price: string # Free, $X, subscription
platform: string[] # Windows, macOS, Linux, etc.
live: boolean # Real-time output
designer: boolean # Pattern design
visualizer: string # None, 2D, 3D
protocols:
  artnet: string # Input, Output, Both
  sacn: string
  dmx: string
  kinet: string
  ddp: string
  gpio: string
  serial: string
inputs:
  video: boolean
  audio: boolean
  midi: boolean
  osc: boolean
outputs:
  midi: boolean
  osc: boolean
programmatic: boolean
language: string # JS, Python, etc.
demo_available: boolean
```

#### Connectors
```yaml
outline: string # Rectangular, Circular
max_current: string
max_voltage: string
ip_rating: string
locking: string # Friction, Latching, Screw Lock
panel_mount: boolean
wire_to_wire: boolean
pcb_mount: boolean
smallest_gauge: string
largest_gauge: string
pitch: string
contact_type: string
solder: boolean
screw_terminal: boolean
crimp: boolean
idc: boolean
gendered: boolean
min_pins: number
max_pins: number
rows: number
pinout: string
convention: string
colors: string[]
digikey_url: string
mouser_url: string
```

#### DIY MicroBoards
```yaml
soc: string
cpu: string
isa: string
clock_speed: string
flash: string
ram: string
linux_capable: boolean
max_outputs: number
min_input_voltage: string
max_input_voltage: string
gpio_voltage: string
usb: string
serial: boolean
wifi: string
poe: boolean
ethernet: string
bluetooth: string
storage: string
bms: boolean
imu: boolean
unit_price: string
release_year: number
```

### 2.2 CSV to YAML Migration Script

Create `scripts/migrate-csv.ts`:
- Read CSV files from `original dataset/`
- Parse headers and rows
- Convert to YAML with proper types
- Generate unique IDs from name/manufacturer
- Output to `database/{category}/`
- Handle special characters, encoding issues
- Preserve URLs and notes

### 2.3 Validation Script

Create `scripts/validate-database.ts`:
- Load all YAML files
- Validate against JSON schemas
- Check for duplicate IDs
- Verify URLs are valid format
- Check image references exist
- Report errors with file:line info

---

## Phase 3: Core UI Components

### 3.1 Layout Components

**Header (`components/layout/Header.tsx`)**
- Site logo/title
- Main navigation (category tabs)
- Search input (future: global search)
- Theme toggle (light/dark)

**Sidebar (`components/layout/Sidebar.tsx`)**
- Category list with counts
- Quick filters
- Active filter summary

**Footer (`components/layout/Footer.tsx`)**
- About link
- GitHub link
- "Edit this page" link
- License info

### 3.2 Data Display Components

**DataTable (`components/data/DataTable.tsx`)**
- Virtual scrolling for large lists
- Sortable columns
- Resizable columns (optional)
- Row selection/highlight
- Click to navigate to detail
- Responsive: collapse columns on mobile

**TileGrid (`components/data/TileGrid.tsx`)**
- Responsive grid layout
- Image-first display
- Lazy loading images
- Skeleton loading states

**FilterBar (`components/data/FilterBar.tsx`)**
- Dynamic filter controls per column
- Multi-select dropdowns
- Range sliders for numeric
- Text search
- Clear all button
- Active filter chips

**ViewToggle (`components/data/ViewToggle.tsx`)**
- Table/Tile switch
- Compact/Expanded switch
- Persist preference

### 3.3 Entry Components

**EntryCard (`components/entry/EntryCard.tsx`)**
- Compact card for tile view
- Image thumbnail
- Key specs preview
- Status badge
- Hover preview (optional)

**EntryDetail (`components/entry/EntryDetail.tsx`)**
- Full spec display
- Image gallery
- External links
- Related entries
- "Back to list" navigation

**EntryLink (`components/entry/EntryLink.tsx`)**
- Internal link component
- Prefetch on hover
- Highlight on current

---

## Phase 4: Page Implementation

### 4.1 Home Page
- Hero section with site description
- Category cards with entry counts
- Recently updated entries (if tracking)
- Quick search

### 4.2 Category Pages

Each category page:
- Breadcrumb navigation
- Category title and description
- FilterBar
- ViewToggle
- DataTable or TileGrid (based on view mode)
- Pagination or infinite scroll

Category-specific customizations:
- **Controllers**: Default table view, voltage/interface filters prominent
- **Pixels**: Default tile view with images, color filters
- **Pattern Drivers**: Table with protocol matrix checkmarks
- **Connectors**: Tile view with images, current/voltage filters

### 4.3 Entry Pages

URL structure: `/{category}/{entry-id}/`

Content:
- Full entry details
- All fields from YAML
- Image gallery (if images exist)
- External links (product URL, datasheet)
- Related entries (same manufacturer, compatible items)
- "View all in category" link

### 4.4 Static README/About Page
- Site purpose
- How to contribute
- Data sources
- License

---

## Phase 5: State Management & Navigation

### 5.1 Routing

Use React Router with:
- `BrowserRouter` for development
- Static pre-rendering for production

Routes:
```
/                           → Home
/controllers/               → Controllers list
/controllers/:id/           → Controller detail
/pixels/                    → Pixels list
/pixels/:id/                → Pixel detail
... (same pattern for all categories)
/about/                     → About page
```

### 5.2 Filter State

**URL Sync:**
- Encode active filters in query params
- `?voltage=12V&interface=Ethernet`
- Parse on page load
- Update URL on filter change (replace, not push)

**localStorage Sync:**
- Save filter preferences per category
- Restore on return visit
- Clear option in UI

### 5.3 View Preferences

Store in localStorage:
- View mode per category (table/tile)
- Density preference (compact/expanded)
- Column visibility preferences
- Sort column and direction

### 5.4 Prefetching

**Link Hover Prefetch:**
- On hover over entry link, prefetch that entry's data
- Use `<link rel="prefetch">` for static assets
- Cache prefetched data in memory

**Image Prefetch:**
- On category page, prefetch visible entry images
- On hover, prefetch that entry's full images

---

## Phase 6: Static Site Generation

### 6.1 Build Process

Create `scripts/build-static.ts`:

1. **Load Data**
   - Read all YAML from `database/`
   - Validate schemas
   - Build in-memory data index

2. **Generate Pages**
   - Home page
   - Each category index page
   - Each entry detail page
   - About page
   - 404 page

3. **Render HTML**
   - Use React SSR to render each page
   - Inject data as JSON in `<script>` tag
   - Hydrate on client for interactivity

4. **Bundle Assets**
   - Compile TypeScript
   - Bundle with tree-shaking
   - Minify CSS with Tailwind
   - Generate hashed filenames
   - Create asset manifest

5. **Output Structure**
   ```
   dist/
   ├── index.html
   ├── about/index.html
   ├── controllers/
   │   ├── index.html
   │   ├── pixlite-4-mk2/index.html
   │   └── ...
   ├── pixels/
   │   └── ...
   ├── assets/
   │   ├── main.[hash].js
   │   ├── main.[hash].css
   │   └── images/
   └── data/
       └── [category].json  # Pre-built data files
   ```

### 6.2 GitHub Actions

`.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Validate database
        run: bun run validate

      - name: Build
        run: bun run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./ui/dist
```

---

## Phase 7: Polish & Optimization

### 7.1 Performance
- Lazy load images with blur placeholder
- Code split by route
- Preload critical CSS
- Service worker for offline (optional)
- Optimize images (WebP with fallback)

### 7.2 Accessibility
- Semantic HTML
- ARIA labels on interactive elements
- Keyboard navigation
- Focus management on route change
- Color contrast compliance
- Screen reader testing

### 7.3 SEO
- Unique `<title>` per page
- Meta descriptions
- Open Graph tags for sharing
- Structured data (JSON-LD) for products
- Sitemap.xml
- robots.txt

### 7.4 Error Handling
- 404 page with search/navigation
- Graceful degradation if JS fails
- Error boundaries in React

---

## Data Relationships (for future reference)

Potential cross-references to model:

| From | To | Relationship |
|------|-----|--------------|
| Controller | Pixel IC | Supports protocol |
| Controller | Connector | Uses connector type |
| Pixel | Pixel IC | Contains IC |
| Pixel | Connector | Common connector |
| MicroBoard | Drive Library | Compatible with |
| Pattern Driver | Controller | Outputs to |

These can be modeled as:
- ID references in YAML
- Or derived from matching field values (e.g., protocol compatibility)

---

## Commands Summary

```bash
# Development
bun dev              # Start dev server
bun format           # Format all files with Prettier
bun lint             # Run linter (if configured)
bun typecheck        # TypeScript type checking

# Database
bun migrate          # Convert CSV to YAML (one-time)
bun validate         # Validate YAML against schemas

# Production
bun build            # Full static site build
bun preview          # Preview production build locally
```

---

## File Naming Conventions

- **YAML files**: `{kebab-case-id}.yaml`
- **Component files**: `PascalCase.tsx`
- **Hook files**: `camelCase.ts`
- **Utility files**: `kebab-case.ts`
- **Image assets**: `{entry-id}-{descriptor}.{ext}`

---

## Next Steps

1. Start with Phase 1.1 - Initialize the Bun project
2. Test if Bun's static site generation capabilities are sufficient
3. If not, evaluate Vite + vite-plugin-ssr or Astro as alternatives
4. Proceed through phases sequentially, testing each before moving on
