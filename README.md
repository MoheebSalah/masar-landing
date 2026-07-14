<div align="center">

# مسار · Masar

**A smart platform that automatically detects road damage and turns it into a structured, trackable repair plan.**

This repository holds the **marketing landing page** for Masar — a scroll‑driven, fully animated, Arabic (RTL) single‑page experience built with Next.js and GSAP.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-ScrollTrigger-88CE02?logo=greensock&logoColor=black)

</div>

---

## Overview

Masar is a concept product for road‑maintenance authorities: a single camera on a moving vehicle detects potholes and cracks in real time, scores each one by severity, pins it to a map, and rolls everything into a repair plan that can be followed from detection to sign‑off.

This landing page tells that story through the scroll. Every section is a self‑contained, choreographed scene — pinned video, converging typography, a GPS marker travelling a hand‑authored SVG route, a morphing device frame wrapped around a live interactive map, odometer‑style impact counters, and a phone showcase that flips its entire colour theme through a circular View Transition. The whole site is Arabic‑first and right‑to‑left by design.

## Highlights

- **Scroll as narrative** — [Lenis](https://github.com/darkroomengineering/lenis) smooth scrolling drives [GSAP `ScrollTrigger`](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) timelines that pin, scrub, and cross‑fade each section into the next with no hard seams (including a background colour that bleeds from one section into another).
- **Motion‑path GPS route** — the Workflow section moves a pulsing marker and a live‑updating coordinate readout along a bespoke SVG path using GSAP's `MotionPathPlugin`.
- **Interactive map, in a morphing frame** — an embedded [MapLibre GL](https://maplibre.org/) map of real report pins, cropped by a device frame that smoothly morphs between desktop, tablet, and phone while the map itself never re‑renders (a pure GPU crop).
- **Theme‑flipping phone showcase** — a carousel of hand‑built app screens that swaps its entire light/dark palette via the **View Transitions API** with a custom circular clip‑path reveal.
- **RTL‑correct throughout** — Arabic typography, right‑anchored layouts, and careful handling of the RTL/LTR boundary where fixed geometry (SVG paths, carousels) meets right‑to‑left text.
- **Custom design system** — brand colours, a full typographic scale, and a fixed brand radius exposed as Tailwind v4 `@theme` tokens.

## Sections

| Section | What it does |
| --- | --- |
| **Hero** | Full‑bleed background video, pinned for one screen while the headline drifts up and is covered by the section below. |
| **Problem** | A sticky panel that cycles through three maintenance pain‑points as you scroll, with a synced image and clickable navigation. |
| **Solution** | Two halves of a sentence glide together over a five‑frame "pothole → fixed" crossfade, then the background transitions into the next dark section. |
| **Workflow** | A GPS marker travels a scroll‑drawn SVG route past three step cards, with live‑ticking coordinates. |
| **See in Action** | A seam‑free, infinitely looping video carousel with a custom play/pause cursor. |
| **Phone Showcase** | A draggable phone carousel of custom app screens with a View‑Transition light/dark theme toggle. |
| **Impact** | Giant odometer‑style counters that roll to each stat, gated by scroll velocity so fast flicks don't smear. |
| **Map** | A live MapLibre map inside a device frame that morphs between desktop, tablet, and phone. |
| **CTA Road** | An animated marching‑lane road leading to the call‑to‑action button. |

## Tech Stack

- **Framework** — [Next.js 16](https://nextjs.org/) (App Router) with the React Compiler enabled
- **UI** — [React 19](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/)
- **Styling** — [Tailwind CSS v4](https://tailwindcss.com/) with a custom `@theme` design system (no CSS‑in‑JS, minimal hand‑written CSS reserved for keyframe animations)
- **Animation** — [GSAP 3](https://gsap.com/) (`ScrollTrigger`, `MotionPathPlugin`) and the [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
- **Smooth scrolling** — [Lenis](https://github.com/darkroomengineering/lenis)
- **Maps** — [MapLibre GL](https://maplibre.org/) (self‑hosted, no CDN)
- **Fonts** — Almarai & Poppins via `next/font`, plus a local Rubbama display face for headings

## Getting Started

```bash
# install dependencies
npm install

# start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # run ESLint
```

## Project Structure

```
src/app/
├── layout.tsx              # RTL <html>, fonts, smooth-scroll wrapper, metadata
├── page.tsx                # composes the sections in scroll order
├── globals.css             # Tailwind @theme design tokens + keyframe animations
└── components/
    ├── Hero/               # pinned video hero
    ├── Problem/            # sticky, scroll-cycled pain points
    ├── Solution/           # converging headline + frame crossfade
    ├── Workflow/           # SVG motion-path GPS route
    ├── SeeInAction/        # looping video carousel
    ├── PhoneShowcase/      # theme-flipping app-screen carousel
    ├── Impact/             # odometer impact counters
    ├── Map/                # MapLibre map in a morphing device frame
    ├── CTARoad/            # animated road to the CTA
    ├── Navbar/  SectionNav/  Footer/  Loader/  SmoothScroll/
    └── ...

public/
├── masar-map.html          # self-contained MapLibre map (embedded via iframe)
├── assets/                 # section videos, images, and app-screen SVGs
└── fonts/                  # local Rubbama display face
```

Each section lives in its own folder with its animation logic co‑located, following a strict separation‑of‑concerns convention.

## Design System

The visual language is defined once as Tailwind `@theme` tokens in [`globals.css`](src/app/globals.css) and used everywhere.

**Palette**

| Token | Value | | Token | Value |
| --- | --- | --- | --- | --- |
| Primary | `#34A8D8` | | Background | `#EEEAE0` |
| Primary 600 | `#197FB0` | | Dark | `#0E1312` |
| Primary 700 | `#16668E` | | Success | `#2E9E5B` |
| Negative | `#CC3931` | | Notice | `#FFAB00` |

**Typography** — Rubbama for headings, Almarai for body, Poppins for numerals, on a fixed type scale (`heading` → `t5`).
**Radius** — a single fixed brand radius of `32px`.

## Notes

- The interface language is **Arabic only**, laid out **right‑to‑left**.
- The experience is currently tuned for **desktop**.
- Motion‑heavy sections respect `prefers-reduced-motion` where animations could be disruptive.

---

<div align="center">
<sub>Built by <a href="https://github.com/MoheebSalah">Moheeb Salah</a>.</sub>
</div>
