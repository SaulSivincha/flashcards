---
name: Academic Precision
colors:
  surface: '#fcf8fb'
  surface-dim: '#dcd9dc'
  surface-bright: '#fcf8fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7ea'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464d'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#76767e'
  outline-variant: '#c6c6ce'
  surface-tint: '#565d79'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131a33'
  on-primary-container: '#7b83a0'
  inverse-primary: '#bec5e5'
  secondary: '#346764'
  on-secondary: '#ffffff'
  secondary-container: '#b5eae6'
  on-secondary-container: '#386b69'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#2d1603'
  on-tertiary-container: '#a27c60'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#bec5e5'
  on-primary-fixed: '#131a33'
  on-primary-fixed-variant: '#3e4660'
  secondary-fixed: '#b8ece9'
  secondary-fixed-dim: '#9cd0cd'
  on-secondary-fixed: '#00201f'
  on-secondary-fixed-variant: '#184e4d'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#eabe9e'
  on-tertiary-fixed: '#2d1603'
  on-tertiary-fixed-variant: '#5e4028'
  background: '#fcf8fb'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
---

## Brand & Style
The design system is engineered for high-focus academic environments, prioritizing cognitive clarity and professional rigor. The brand personality is intellectual, disciplined, and modern, aimed at students and researchers who require a distraction-free interface for intensive study.

The aesthetic follows a **Refined Academic Minimalism** style. It rejects transient trends like gradients and glassmorphism in favor of a structured, flat architecture that emphasizes content hierarchy. By utilizing a sophisticated, high-contrast palette and ample whitespace, the UI evokes a sense of organized thought and academic authority. The interface should feel like a premium digital stationery set—functional, tactile through geometry, and impeccably organized.

## Colors
The palette is rooted in traditional academic tones updated for modern digital displays.

- **Primary (#0A122A):** Prussian Blue is reserved for core branding, primary headings, and navigation elements. It provides the grounding "ink" of the system.
- **Secondary (#255957):** Dark Slate Grey is used for secondary information architecture, inactive states, and supporting metadata to provide contrast without competing with headers.
- **Background (#EEEBD3):** Eggshell provides a warm, low-strain canvas that mimics high-quality paper, reducing eye fatigue during long study sessions.
- **CTA/Active (#F26419):** Blaze Orange is used sparingly for primary actions, progress indicators, and interactive highlights to ensure immediate visual recognition.
- **Error (#B3001B):** Mahogany Red is used for validation and critical alerts, maintaining the traditional academic "red pen" semiotics.

## Typography
The system utilizes **Inter** exclusively to leverage its exceptional legibility and systematic weight distribution. 

- **Hierarchy:** Use bold weights (700) for Display roles to anchor the page. Headlines use Semi-Bold (600) to maintain authority without excessive visual weight.
- **Body Text:** Set at 18px for primary content (Flashcard text) to ensure readability at arm's length. Standard interface text uses 16px.
- **Labels:** Small labels and captions use a slightly increased letter spacing and Medium (500) or Semi-Bold (600) weights to ensure they remain legible even at small scales.

## Layout & Spacing
This design system employs a **Fixed Grid** philosophy for desktop to maintain the feel of a structured document, transitioning to a **Fluid Grid** for mobile devices.

- **Grid:** A 12-column grid is used for desktop (1200px max-width) with 24px gutters. On mobile, a 4-column fluid grid is used with 16px side margins.
- **Rhythm:** All spacing is derived from an 8px baseline. Use `lg` (40px) spacing to separate major sections and `md` (24px) for internal component padding.
- **Touch Targets:** A strict minimum of 48x48px is required for all interactive elements to ensure accessibility during rapid-fire study sessions.

## Elevation & Depth
Depth is communicated through **Tonal Layering** and subtle, wide-diffusion shadows rather than heavy outlines or complex bevels.

- **Level 0 (Background):** Eggshell (#EEEBD3).
- **Level 1 (Cards/Surface):** Pure White (#FFFFFF). Surfaces use a very soft, ambient shadow (Offset: 0, 4px; Blur: 20px; Opacity: 6% of #0A122A) to provide a gentle lift from the cream background.
- **Level 2 (Active/Hover):** When an element is interacted with, the shadow tightens and darkens slightly to simulate physical proximity to the user.
- **Separators:** Use 1px borders in #255957 at 10% opacity for internal card divisions.

## Shapes
The shape language is defined by modern, generous curves that soften the clinical nature of academic software. 

- **Primary Components:** Cards and main containers utilize a **16px to 18px** radius (`rounded-lg` or `rounded-xl`).
- **Interactive Elements:** Buttons and input fields follow the `rounded-lg` (16px) standard to maintain a cohesive silhouette with the card system.
- **Small Elements:** Tags and badges may use a full pill-shape for distinct visual categorization.

## Components
- **Cards:** The central component of the system. Cards must have White backgrounds, 18px corner radius, and 24px internal padding. Avoid borders; use the soft elevation shadow for definition.
- **Buttons:** 
  - *Primary:* Blaze Orange (#F26419) with White text. No gradients.
  - *Secondary:* Transparent with Prussian Blue (#0A122A) 2px border.
  - *Sizing:* Minimum height of 48px.
- **Input Fields:** Eggshell background with a 1px border of Dark Slate Grey at 20% opacity. Upon focus, the border transitions to Prussian Blue at 100% opacity.
- **Chips/Tags:** Small, pill-shaped elements using a 10% opacity tint of the Secondary color with Dark Slate Grey text for categorization.
- **Progress Bars:** Use a thick 8px track in Dark Slate Grey (10% opacity) with the active fill in Blaze Orange.
- **Lists:** Clean, unbordered rows with 16px vertical padding, separated by 1px dividers (10% opacity).