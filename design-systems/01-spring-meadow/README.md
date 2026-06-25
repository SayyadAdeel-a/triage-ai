# TriageAI Design System 01: Spring Meadow

**Mood:** Fresh, grounded, approachable, alive

A nature-inspired palette centered around a warm, vibrant green that feels organic and inviting. Think Apple's clean minimalism crossed with a walk through a sunlit meadow.

## Color Palette

| Role | Token | Hex | Description |
|------|-------|-----|-------------|
| Background | `--color-background` | `#FAFCF8` | Warm off-white with a hint of green |
| Foreground | `--color-foreground` | `#1A2E1A` | Deep forest green (near-black) |
| Card | `--color-card` | `#FFFFFF` | Pure white surface |
| Primary | `--color-primary` | `#22C55E` | Vibrant spring green |
| Primary Foreground | `--color-primary-foreground` | `#FFFFFF` | White text on green |
| Secondary | `--color-secondary` | `#F0F7F0` | Very light green tint |
| Muted | `--color-muted` | `#F4F8F2` | Soft sage background |
| Muted Foreground | `--color-muted-foreground` | `#6B7E6B` | Muted sage text |
| Accent | `--color-accent` | `#22C55E` | Same as primary |
| Destructive | `--color-destructive` | `#EF4444` | Clean red |
| Border | `--color-border` | `#E2EAE2` | Light sage border |
| Sidebar | `--color-sidebar` | `#F4F8F2` | Soft sage sidebar |

## Typography

- **Display/Heading:** Inter (system fallback: -apple-system)
- **Body:** Inter
- **Mono:** JetBrains Mono
- **Heading style:** `font-semibold tracking-tight`
- **Body style:** `font-normal leading-relaxed`

## Spacing

- Base unit: 4px
- Section padding: `py-16 md:py-24`
- Card padding: `p-5 md:p-6`
- Component gap: `gap-3`

## Border Radius

- Base: `0.625rem` (10px)
- Buttons: `rounded-lg` (same)
- Cards: `rounded-xl` (12px)
- Avatars: `rounded-full`

## Shadows

| Name | Use Case |
|------|----------|
| `shadow-soft` | Cards, containers |
| `shadow-elevated` | Modals, dropdowns |
| `shadow-primary` | Primary CTAs, active states |

## Special Classes

| Class | Purpose |
|-------|---------|
| `glass` | Frosted glass panels |
| `badge-pill` | Semantic pill badges |

## Best For

- Users who love nature and organic aesthetics
- Healthcare, wellness, sustainability brands
- A calming but energetic daily email tool
