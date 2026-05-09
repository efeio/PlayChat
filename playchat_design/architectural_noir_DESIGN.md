---
name: Architectural Noir
colors:
  surface: '#141313'
  surface-dim: '#141313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353434'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#c8c6c6'
  on-secondary: '#303030'
  secondary-container: '#464747'
  on-secondary-container: '#b6b5b4'
  tertiary: '#ffffff'
  on-tertiary: '#2f3131'
  tertiary-container: '#e2e2e2'
  on-tertiary-container: '#636565'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e4e2e2'
  secondary-fixed-dim: '#c8c6c6'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#464747'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#141313'
  on-background: '#e5e2e1'
  surface-variant: '#353434'
typography:
  headline-main:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  logo:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: -0.03em
  body-primary:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  body-muted:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  grid-unit: 8px
  gutter: 16px
  margin: 24px
  panel-padding: 32px
---

## Brand & Style

This design system is anchored in architectural minimalism and geometric discipline. It is designed for a sophisticated audience that values clarity, focus, and quiet digital environments. The aesthetic rejects the ornamental—there are no illustrations, shadows, or rounded "organic" blobs. Instead, depth is achieved through rigid structural lines and a strict tonal hierarchy. 

The emotional response should be one of calm authority. By utilizing a "Void" background punctuated by surgical grid lines, the UI recedes into the background, allowing the conversation and content to remain the sole focus. The style draws heavily from Modernism and Swiss Design, emphasizing functionality through a precise, monochromatic lens.

## Colors

The palette is a study in "Ink and Light." The primary surface is an absolute dark (#0a0a0a), creating a sense of infinite depth. Functional panels and containers transition to #111111 to provide subtle separation without breaking the dark-mode immersion.

Interaction and structural definition are handled by a tiered gray scale. Accents and grid lines use #1a1a1a, while interactive borders and dividers use #222222 for higher visibility. Typography is binary: Pure White for primary information and high-contrast actions, and a muted #555555 for secondary metadata, timestamps, and placeholder states.

## Typography

Typography in this design system balances the technical precision of **Space Grotesk** for headings and branding with the high-utility legibility of **Inter** for long-form communication. 

Headings are set with tight letter-spacing to emphasize the geometric construction of the letterforms. The logo is a pure wordmark, treated as a structural element rather than a graphic. Body text is kept at a consistent 14px to maintain a sophisticated, data-dense look that avoids the "oversized" feel of consumer-grade apps. All secondary text must use the muted #555555 to maintain the visual hierarchy.

## Layout & Spacing

The layout is governed by a strict 8px grid system. A core feature of this design system is the visible grid: subtle #1a1a1a lines are drawn on the #0a0a0a background to create a "blueprint" effect. Elements must align perfectly to these lines.

The layout model is a fixed-fluid hybrid. Sidebar and form panels have fixed widths to ensure a consistent reading experience, while the central chat viewport is fluid. Margins are generous (24px) to provide "breathing room" against the dark background, preventing the UI from feeling claustrophobic.

## Elevation & Depth

This design system completely eschews shadows in favor of **Tonal Layering** and **Geometric Depth**. 

Depth is communicated through three levels of "Elevation":
1.  **Floor (#0a0a0a):** The base level where the grid lines reside.
2.  **Raised (#111111):** Form panels, sidebars, and chat input areas. These are separated from the floor by a 1px border (#1a1a1a).
3.  **Active (#1a1a1a):** Selected states or hovered items. 

By using low-contrast outlines (#222222) instead of shadows, the interface feels flat, modern, and physically grounded.

## Shapes

The shape language is "Softened Geometry." While the overall layout is rectangular and rigid, interactive components (Inputs, Buttons, Cards) utilize an 8px (0.5rem) border radius. 

This specific radius provides a necessary touch of approachability in an otherwise stark, dark environment. It creates a "pill-capsule" hybrid look for smaller elements without veering into the playfulness of fully rounded corners. All containers that house content should follow this 8px standard strictly to maintain rhythm.

## Components

### Buttons
*   **Primary:** Solid white (#ffffff) background with black (#0a0a0a) text. Use Space Grotesk Bold. No border.
*   **Secondary:** Transparent background with a #222222 border. White text. On hover, the border brightens to #555555.

### Input Fields
*   **Style:** Background of #1a1a1a with a #222222 border. 
*   **Text:** 14px Inter. Placeholder text must be #555555.
*   **Focus State:** The border transitions to pure white (#ffffff) with no outer glow.

### Chat Bubbles
*   **Inbound:** Background of #111111 with a #1a1a1a border.
*   **Outbound:** Background of #1a1a1a with a #222222 border. 
*   **Alignment:** Bubbles are flush with the grid lines, emphasizing the geometric layout.

### Lists & Navigation
*   Sidebar items should have no background in their default state. On hover or selection, they transition to #111111 with a vertical 2px white line on the left-most edge to indicate focus.

### Dividers
*   All dividers are 1px solid lines using #1a1a1a. They should always run "edge-to-edge" within their parent container to reinforce the grid-based architecture.