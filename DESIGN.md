# Design System — TriageAI

## Register

brand (marketing/landing pages)

## Brand Seed

oklch(0.563 0.223 11.0) — carmine red, aperitivo energy

## Design-Taste-Frontend Application

### Three Dials

**DESIGN_VARIANCE: 8** — Maximum asymmetry, artsy chaos
**MOTION_INTENSITY: 6** — Fluid CSS, 600ms entry / 400ms exit
**VISUAL_DENSITY: 4** — Airy with premium gaps

### Anti-Default Discipline

- **Font**: Satoshi (geometric, confident). NOT on reflex-reject list. |
- **Color**: Emerald primary (#1ed43c), Carmine accent (#d43c1e). Not beige/clay. |
- **Layout**: Asymmetric compositions, broken grid, varied cell sizes. |
- **Motion**: Smooth cubic-bezier(0.16, 1, 0.3, 1), staggered reveals. |

### Editorial-Magazine Aesthetic AVOIDED

**Pattern**: Split hero (50/50) → left headline, right asset. |
**Alternative to**: Left-aligned content / right-aligned asset, asymmetric white-space. |
**Avoid**: Editorial-typographic display serif + italic + drop caps + 3-rule columns. |

### Layout Diversification

| Section | Primary Layout | Exception |
|---------|---------------|-----------|
| Hero | Split screen (50/50) | Center hero only if message is the design |
| Features | Bento grid (asymmetric) | Hero + features alternate |
| Pricing | 3-card horizontal row | Feature comparison below |
| Download | Platform cards (horizontal scroll) | Vertical steps for mobile |

### Copy Structure (Landing)

- Eyebrow: minimal optional label
- Headline: max 2 lines, semantic value
- Subtext: max 20 words, no empty statements
- CTAs: verb + object (e.g., "Start free")
- No em-dashes, no marketing buzzwords

### Imagery Strategy (ENFORCED)

**Minimum 2-3 real images per page**

- **Landing**: Product screenshot (dashboard UI) with hero overlay
- **Features**: Four actual UI mockups, not placeholder cards
- **Pricing**: Can remain text-focused (acceptable per brand.md)
- **Download**: Real platform icons (macOS, Windows, Linux logos)

### Component Overrides (vs. Current Design)

- **Cards**: Keep glass-panel style (#ffffff06) but improve hierarchy
- **Buttons**: Deeper hover scale (0.98), remove gradient shadows
- **Navigation**: Dark mode enhanced, with proper back / scroll tracking
- **CTA Buttons**: Text-only (primary), no overly elaborate styling
- **Color scheme**: Green (#1ed43c) for success, red (#d43c1e) for error
- **Semantic depth**: Remove unnecessary UI visual clutter

### Content Adaptation & Minimum Requirements

**Content Requirements:**
- Complete detailed explanations in bullet format for each section
- Ensure content clarity and professionalism
- Combine text descriptions with design insights where needed

**Visual Hierarchy:**
- Utilize the three key Dial values: VARIANCE 8, MOTION 6, DENSITY 4
- Maintain clear visual hierarchy with defined spacing and alignment
- Ensure consistent design across all page elements

## Typography

### Font Stack

| Role | Font | Weight | Fallback |
|------|------|--------|----------|
| Display | Satoshi | 700 (Bold) | Geist, system-ui |
| Body | Satoshi | 400 (Regular) | Geist, system-ui |
| Mono | JetBrains Mono | 400 | monospace |

**Why Satoshi**: Geometric sans-serif, confident, precise. NOT on the reflex-reject list. NOT Inter, Outfit, DM Sans, Space Grotesk.

### Scale

| Step | Size | Line Height | Use |
|------|------|-------------|-----|
| 6 | clamp(2.5rem, 5vw, 4rem) | 1.1 | Hero headlines |
| 5 | clamp(2rem, 4vw, 3rem) | 1.15 | Section headlines |
| 4 | clamp(1.5rem, 3vw, 2.25rem) | 1.2 | Sub-headlines |
| 3 | 1.25rem | 1.4 | Card titles |
| 2 | 1rem | 1.5 | Body text |
| 1 | 0.875rem | 1.5 | Captions, labels |

Ratio between steps: ≥1.25 (verified: 4/3 = 1.33)

### Rules
- Cap body line length at 65–75ch
- Hero headline max 2 lines on desktop
- Hero subtext max 20 words
- `text-wrap: balance` on h1–h3
- No all-caps body copy
- No em dashes

## Layout

### Spacing Scale
8px base unit. Multipliers: 1 (8), 2 (16), 3 (24), 4 (32), 6 (48), 8 (64), 10 (80), 12 (96), 16 (128)

### Breakpoints
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

### Layout Principles
- Asymmetric compositions (DESIGN_VARIANCE: 8)
- Break grid intentionally for emphasis
- Fluid spacing with clamp()
- Cards only when elevation communicates real hierarchy
- Nested cards always wrong

## Motion

| Parameter | Value |
|-----------|-------|
| MOTION_INTENSITY | 6 (Fluid CSS) |
| Entry duration | 600ms |
| Exit duration | 400ms (60% of enter) |
| Easing | cubic-bezier(0.16, 1, 0.3, 1) |
| Stagger delay | 60ms per item |
| Reduced motion | Static fallback |

### Motion Rules
- Animate only transform and opacity
- Every animation must communicate something
- Stagger list items, not entire sections
- No bounce, no elastic
- `prefers-reduced-motion: reduce` → static

## Visual Density

VISUAL_DENSITY: 4 (Art Gallery / Airy)

- Generous section gaps: py-32 to py-48
- Tight groupings within sections
- whitespace is voice

## Component Patterns

### Cards
- fill: surface (oklch(0.14 0.006 260))
- stroke: oklch(0.2 0.005 260) 1px
- radius: 16px
- padding: 32px

### Buttons
- Primary: fill primary, text white, radius 8px, padding 14px 32px
- Secondary: fill transparent, stroke muted 1px, text ink, radius 8px
- Hover: -translate-y(1px), scale(0.98) on active

### Navigation
- Height: 72px
- Fixed position
- bg: surface with backdrop-filter blur

## Imagery

**Zero images is a bug.** Brand surfaces need imagery.

- Hero: product screenshot or abstract dashboard visualization
- Features: actual UI mockups
- Download: platform icons (macOS, Windows, Linux)
- Minimum 2-3 real images per page

## Anti-Patterns to Avoid

- Gradient text (background-clip: text)
- Glassmorphism as default
- Hero-metric template
- Identical card grids
- Tiny uppercase tracked eyebrow above every section
- Numbered section markers (01 / 02 / 03)
- Text overflow containers
- Em dashes
- Marketing buzzwords
