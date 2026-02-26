# Court Opinions Analyzer - Design System

Inspired by Cardozo Law School's visual identity.

---

## 🎨 Color Palette

### Primary Colors
- **Cardozo Blue:** `#0071BC` - Main brand color, primary buttons, links
- **Cardozo Dark Blue:** `#003C71` - Headers, navigation, dark backgrounds
- **White:** `#FFFFFF` - Backgrounds, text on blue
- **Cardozo Gold:** `#FFB81C` - Accents, highlights, success states

### Neutral Colors
- **Gray 50:** `#F5F5F5` - Light backgrounds, alternating sections
- **Gray 100:** `#E5E5E5` - Borders, dividers
- **Gray 600:** `#666666` - Secondary text
- **Gray 900:** `#333333` - Primary text, body copy

### Semantic Colors
- **Success:** `#10B981` - Success messages, completed states
- **Warning:** `#F59E0B` - Warnings, pending states
- **Error:** `#EF4444` - Errors, validation messages
- **Info:** `#0071BC` - Informational messages (uses Cardozo Blue)

---

## 📝 Typography

### Font Families
```css
--font-serif: 'Georgia', 'Palatino', serif;
--font-sans: 'Inter', 'Arial', 'Helvetica', sans-serif;
```

**Usage:**
- **Serif (Georgia):** Page titles, section headers, hero text
- **Sans-serif (Inter/Arial):** Navigation, body text, UI elements

### Font Sizes
- **Hero:** 48-60px (3xl-4xl)
- **Page Title:** 32-40px (2xl-3xl)
- **Section Header:** 24-28px (xl-2xl)
- **Subsection:** 18-20px (lg-xl)
- **Body:** 16px (base)
- **Small:** 14px (sm)
- **Tiny:** 12px (xs)

### Font Weights
- **Bold:** 700 (headers, emphasis)
- **Semibold:** 600 (navigation, labels)
- **Medium:** 500 (subheaders)
- **Regular:** 400 (body text)

---

## 🏗️ Layout & Spacing

### Spacing Scale (8px base unit)
- **xs:** 4px
- **sm:** 8px
- **md:** 16px
- **lg:** 24px
- **xl:** 32px
- **2xl:** 48px
- **3xl:** 64px
- **4xl:** 80px

### Container Widths
- **Max Width:** 1280px (7xl)
- **Content Width:** 1024px (5xl)
- **Reading Width:** 768px (3xl)

### Section Padding
- **Desktop:** 80px vertical, 32px horizontal
- **Tablet:** 60px vertical, 24px horizontal
- **Mobile:** 40px vertical, 16px horizontal

---

## 🎨 Components

### Buttons

**Primary Button:**
```css
background: #0071BC (Cardozo Blue)
color: white
padding: 12px 24px
border-radius: 8px
font-weight: 600
hover: #005A94 (darker)
```

**Secondary Button:**
```css
background: white
color: #0071BC
border: 2px solid #0071BC
padding: 12px 24px
border-radius: 8px
font-weight: 600
hover: background #F5F5F5
```

**Danger Button:**
```css
background: #EF4444
color: white
padding: 12px 24px
border-radius: 8px
font-weight: 600
```

### Cards
```css
background: white
border-radius: 8px
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1)
padding: 24-32px
border: 1px solid #E5E5E5 (optional)
```

### Navigation
```css
background: #003C71 (Cardozo Dark Blue)
color: white
height: 64px
sticky: top
shadow: 0 2px 4px rgba(0, 0, 0, 0.1)
```

### Forms
```css
Input:
  border: 1px solid #E5E5E5
  border-radius: 8px
  padding: 12px 16px
  focus: border #0071BC, ring 2px #0071BC/20

Label:
  font-weight: 500
  color: #333333
  margin-bottom: 8px
```

### Tables
```css
Header:
  background: #F5F5F5
  font-weight: 600
  text-transform: uppercase
  font-size: 12px
  letter-spacing: 0.05em
  color: #666666

Row:
  border-bottom: 1px solid #E5E5E5
  hover: background #F5F5F5

Cell:
  padding: 16px
  color: #333333
```

---

## 🎭 Shadows
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05)
--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.15)
--shadow-xl: 0 8px 32px rgba(0, 0, 0, 0.2)
```

**Usage:**
- **sm:** Subtle elevation (input focus)
- **md:** Cards, dropdowns
- **lg:** Modals, popovers
- **xl:** Major overlays

---

## 🎨 Border Radius
```css
--radius-sm: 4px (small elements)
--radius-md: 8px (default - buttons, cards, inputs)
--radius-lg: 12px (large cards, modals)
--radius-xl: 16px (hero sections)
--radius-full: 9999px (pills, avatars)
```

---

## 📱 Responsive Breakpoints
```css
--breakpoint-sm: 640px (mobile landscape)
--breakpoint-md: 768px (tablet)
--breakpoint-lg: 1024px (desktop)
--breakpoint-xl: 1280px (large desktop)
--breakpoint-2xl: 1536px (extra large)
```

---

## ✅ Accessibility

### Color Contrast
- **Text on Cardozo Blue:** Use white (AAA compliant)
- **Text on White:** Use Gray 900 for body, Gray 600 for secondary
- **Links:** Underline on hover, sufficient color contrast

### Focus States
- **All interactive elements:** Visible focus ring
- **Color:** Cardozo Blue with 20% opacity
- **Width:** 2-3px

### Font Sizes
- **Minimum body text:** 16px (1rem)
- **Line height:** 1.5-1.75 for readability
- **Letter spacing:** Slight increase for uppercase text

---

## 🎯 Design Principles

1. **Professional & Academic**
   - Serif fonts for gravitas
   - Blue conveys trust and authority
   - Clean, organized layouts

2. **Clear Hierarchy**
   - Bold headers stand out
   - Consistent visual rhythm
   - Easy to scan and navigate

3. **Generous Whitespace**
   - Don't cram content
   - Use padding liberally
   - Let content breathe

4. **Consistent Patterns**
   - Reuse components
   - Maintain spacing scale
   - Follow established patterns

---

## 📐 Grid System

- **Desktop:** 12-column grid, 24px gutters
- **Tablet:** 8-column grid, 16px gutters
- **Mobile:** 4-column grid, 16px gutters

**Common Layouts:**
- **1 column:** Full-width content, forms
- **2 columns:** 50/50 split, sidebar layouts
- **3 columns:** Card grids, feature sections
- **4 columns:** Dense information, dashboards

---

## 🎨 Usage Examples

### Hero Section
```
Background: Cardozo Blue gradient
Text: White, Georgia font
Heading: 48px, bold
Subheading: 20px, regular
Button: White background, Cardozo Blue text
```

### Dashboard Cards
```
Background: White
Border: 1px Gray 100
Shadow: Medium
Padding: 32px
Header: 24px Georgia
Body: 16px Inter
```

### Data Tables
```
Header: Gray 50 background, uppercase, 12px
Rows: Alternating white/Gray 50
Hover: Gray 100
Border: Gray 200
```

---

**Last Updated:** February 26, 2026  
**Version:** 1.0  
**Based on:** Cardozo Law School Brand Guidelines