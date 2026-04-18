# Design System Specification: The Verdant Merchant

 

## 1. Overview & Creative North Star: "The Digital Grocer’s Atelier"

This design system moves away from the sterile, plastic feel of legacy Point-of-Sale (POS) systems. Our Creative North Star is **"The Digital Grocer’s Atelier"**—an environment that feels as fresh as a morning market but as precise as a high-end boutique. 

 

We break the "template" look by favoring **tonal depth over structural lines**. The interface should feel like stacked sheets of fine, heavy-weight paper. We use intentional asymmetry in layout and a high-contrast typography scale to ensure that in a fast-paced retail environment, the merchant’s eyes are guided instinctively to the most critical data.

 

---

 

## 2. Colors & Tonal Architecture

The palette is rooted in deep, organic greens, balanced by a sophisticated "Cool Blue" neutral scale that prevents the UI from feeling muddy.

 

### The "No-Line" Rule

**Borders are strictly prohibited for sectioning.** To define boundaries, use background color shifts. A `surface-container-low` section sitting on a `surface` background creates a clear but soft distinction. This creates a high-end, seamless appearance that reduces visual "noise" for the user.

 

### Surface Hierarchy & Nesting

Treat the UI as a physical stack.

- **Base Layer:** `surface` (#f9f9ff)

- **Secondary Sections:** `surface-container-low` (#f0f3ff)

- **Interactive Cards:** `surface-container-lowest` (#ffffff)

- **High-Priority Modals:** `surface-container-highest` (#d8e3fb)

 

### The "Glass & Gradient" Rule

To elevate the POS from "utility" to "premium," use **Glassmorphism** for floating elements (like "Current Cart" sidebars). Use a backdrop-blur of `12px` combined with `surface` at 80% opacity. 

*Signature Touch:* Main Action Buttons (CTAs) should use a subtle linear gradient from `primary` (#2b6954) to `primary_container` (#71af97) at a 135° angle to add "soul" and dimension.

 

---

 

## 3. Typography: Editorial Authority

We pair the technical precision of **Inter** with the character-rich **Manrope** to create a system that is both functional and branded.

 

| Level | Font | Size | Usage |

| :--- | :--- | :--- | :--- |

| **Display-LG** | Manrope | 3.5rem | Daily Sales Totals / Large Hero Numbers |

| **Headline-MD** | Manrope | 1.75rem | Section Headers (e.g., "Inventory Overview") |

| **Title-SM** | Inter | 1.0rem | Product Names in Grid |

| **Body-MD** | Inter | 0.875rem | Default text, descriptions, receipt details |

| **Label-SM** | Inter | 0.6875rem | Input labels, micro-copy, timestamps |

 

**Editorial Contrast:** Use `on_surface` (#111c2d) for headlines to ensure maximum authority, and `on_surface_variant` (#3c4a42) for body text to reduce eye strain during long shifts.

 

---

 

## 4. Elevation & Depth

We convey hierarchy through **Tonal Layering** rather than traditional shadows.

 

- **The Layering Principle:** Place a `surface-container-lowest` card (Pure White) on a `surface-container-low` background. This creates a natural "lift" that is easier on the eyes than a heavy shadow.

- **Ambient Shadows:** For floating elements (e.g., a "Product Details" popup), use a 24px blur with 4% opacity, using the color `on_surface` (#111c2d). This mimics natural gallery lighting.

- **The "Ghost Border" Fallback:** If a border is required for accessibility in forms, use `outline_variant` (#bbcabf) at **20% opacity**. Never use 100% opaque borders.

 

---

 

## 5. Components

 

### Buttons & Loading States

*   **Primary:** Gradient of `primary` to `primary_container`. Radius: `md` (0.75rem).

*   **Secondary:** `surface_container_high` with `on_primary_fixed_variant` text.

*   **Loading State:** When active, the button label fades to 20% opacity. A centered spinner appears using the `on_primary` color. The button should "pulse" slightly (scale 0.98) to indicate processing.

 

### Form Inputs

*   **Default:** Background: `surface_container_lowest`. No border. Bottom-only "Ghost Border" (20% `outline_variant`). 

*   **Focus:** The background shifts to `surface_bright` with a 2px `primary` bottom-border.

*   **Error:** Background: `error_container` (#ffdad6). Text: `on_error_container`.

 

### Alert Boxes (Demo Credentials)

*   Instead of a standard box, use a "Feature Card" style.

*   **Background:** `secondary_container` (#6cf8bb) at 30% opacity with a `16px` backdrop blur.

*   **Icon:** Use a high-contrast `on_secondary_container` (#00714d) icon to draw immediate attention.

 

### Cards & Lists

*   **Forbid Dividers:** Use the Spacing Scale (specifically `8` or `10`) to create "Active Negative Space." 

*   **Product Cards:** Use `surface-container-lowest` with a `lg` (1rem) corner radius. On hover, the card should shift to `primary_fixed` (#b0f0d6) to indicate interactivity.

 

---

 

## 6. Do’s and Don’ts

 

### Do

*   **DO** use `surface_dim` for the background of inactive dashboard widgets to push them into the "background."

*   **DO** use the `20` (4.5rem) spacing token for major section margins to allow the UI to "breathe."

*   **DO** use `tertiary` (#a43a3a) sparingly for "Delete" or "Void" actions to maintain the calm, green aesthetic.

 

### Don’t

*   **DON'T** use 1px solid black or grey borders. This instantly kills the premium editorial feel.

*   **DON'T** use standard "Drop Shadows." Use tonal shifts first, ambient tinted shadows second.

*   **DON'T** crowd the screen. In a retail environment, white space is not "wasted space"—it is "clarity."