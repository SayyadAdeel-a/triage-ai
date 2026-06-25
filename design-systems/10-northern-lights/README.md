# TriageAI Design System 10: Northern Lights

**Mood:** Magical, alive, inspiring, unique

A unique dual-accent palette combining teal and violet in a harmonious gradient feel. Inspired by the aurora borealis, this feels magical and alive. The most expressive of the collection, yet still clean and Apple-minimal.

## Color Palette

| Role | Token | Hex | Description |
|------|-------|-----|-------------|
| Background | `--color-background` | `#F8FAFF` | Cool blue-white |
| Foreground | `--color-foreground` | `#0E1525` | Deep blue-black ink |
| Card | `--color-card` | `#FFFFFF` | Pure white surface |
| Primary | `--color-primary` | `#06B6D4` | Vivid teal (first accent) |
| Primary Foreground | `--color-primary-foreground` | `#FFFFFF` | White text on teal |
| Accent | `--color-accent` | `#8B5CF6` | Violet (second accent) |
| Accent Foreground | `--color-accent-foreground` | `#FFFFFF` | White text on violet |
| Secondary | `--color-secondary` | `#EDEFFF` | Very light indigo tint |
| Muted | `--color-muted` | `#F0F3FF` | Soft indigo background |
| Muted Foreground | `--color-muted-foreground` | `#6E7490` | Cool gray-purple text |
| Destructive | `--color-destructive` | `#EF4444` | Clean red |
| Border | `--color-border` | `#DDE2F0` | Light indigo border |
| Sidebar | `--color-sidebar` | `#F0F3FF` | Soft indigo sidebar |

## Extended Aurora Palette

| Token | Hex | Purpose |
|-------|-----|---------|
| `--color-aurora-teal` | `#06B6D4` | Primary gradient stop |
| `--color-aurora-violet` | `#8B5CF6` | Secondary gradient stop |
| `--color-aurora-rose` | `#EC4899` | Tertiary gradient stop |
| `--color-aurora-green` | `#22C55E` | Success states |

## Special Utilities

| Class | Purpose |
|-------|---------|
| `aurora-gradient` | Teal-to-violet-to-rose background gradient |
| `aurora-text` | Gradient text effect |
| `aurora-border` | Gradient border |
| `shadow-accent` | Violet glow (complements `shadow-primary` teal glow) |

## Key Design Decisions

- **Dual accent system**: Teal (primary) + Violet (accent) work independently or together
- **Gradient utilities** for hero moments and special emphasis
- **Extended aurora palette** for data viz and status indicators

## Best For

- Users who want something truly unique and memorable
- Creative and tech-savvy professionals
- A product that feels magical without sacrificing clarity
