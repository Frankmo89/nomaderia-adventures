# Visual & Aesthetic Audit — Nomaderia Adventures

> Scope: Index (all landing sections), Destinations, DestinationDetail,
> BlogPostDetail.  
> Focus: motion, depth, microinteractions, typography, spacing, loading states,
> image treatment, legibility/overlap bugs.  
> Date: 2026-06-02 | Status: **REPORT ONLY — no code changed**

---

## Ranked Punch List (highest impact first)

### 1. Easing curves feel template-grade, not editorial
**What's wrong:** Every `whileInView` section entrance uses `ease: "easeOut"`
(a cubic ease that peaks early). On a premium travel editorial, entrances
should feel more elastic and weighty.  
**Where:** All `whileInView` blocks across
`src/components/landing/HeroSection.tsx`,
`DestinationsCatalog.tsx`, `BlogPreview.tsx`, `GearPreview.tsx`,
`PremiumItinerarySection.tsx`, `SocialProof.tsx`, `DidYouKnowSection.tsx`.  
**Fix:** Replace `ease: "easeOut"` with `ease: [0.22, 1, 0.36, 1]`
(expo-out cubic-bezier) on all scroll-triggered entrance transitions.

---

### 2. Hero CTA button color is off-brand
**What's wrong:** The primary CTA uses hardcoded `bg-[#C96B05]` / `#B95F05` /
`#A95504` — a noticeably darker orange (~15 pts) than the design token
`--primary: #D97706`. Every other primary button across the site uses
`bg-primary`. The hero, the first visual touchpoint, shows the wrong shade.  
**Where:** `src/components/landing/HeroSection.tsx:12` (`primaryCtaClassName`).  
**Fix:** Replace `bg-[#C96B05]`, `hover:bg-[#B95F05]`, `active:bg-[#A95504]`
with `bg-primary`, `hover:bg-primary/90`, `active:bg-primary/80`.

---

### 3. BlogPostDetail hero is too short for editorial immersion
**What's wrong:** The blog post hero is only `h-[35vh]` — barely more than a
thumbnail. Competing editorial travel sites use 55–70vh. The current height
reads as "beginner blog", not premium long-form.  
**Where:** `src/pages/BlogPostDetail.tsx` (hero image container).  
**Fix:** Change to `h-[55vh] md:h-[65vh]` with `object-position: center 30%`
so headline subjects (peaks, people) are framed correctly.

---

### 4. DestinationDetail hero carousel is undersized
**What's wrong:** The destination hero is `h-[50vh] md:h-[60vh]`. For a
destination that users are evaluating as a trip, a full-bleed immersive hero
(80–90vh) with the tab strip anchored below the fold would dramatically
increase the "wow" moment and perceived premium quality.  
**Where:** `src/pages/DestinationDetail.tsx` (hero carousel section).  
**Fix:** Change to `h-[80vh] md:h-[90vh]` and use a bottom-anchored
`sticky` tab strip so content tabs dock at the top as the user scrolls past
the image.

---

### 5. WhatsApp floating button overlaps bottom-anchored CTAs on mobile
**What's wrong:** `WhatsAppButton` is `fixed bottom-5 right-5 z-50`. On
DestinationDetail and BlogPostDetail, any sticky/fixed bottom CTA rendered
inside those pages (or the bottom booking row in the sidebar on small screens)
is partially hidden by the 56px green circle. On narrow viewports the overlap
is ~50% of a button width.  
**Where:** `src/components/WhatsAppButton.tsx:26` and any page using a
fixed bottom bar.  
**Fix:** On mobile only, shift to `bottom-20` (above any fixed bottom bar) or
add a `pb-20` guard to pages that have a sticky CTA; revisit z-index layering
so page-level CTAs sit at `z-40` and the global button at `z-50`.

---

### 6. Gradient overlay opacities are inconsistent across cards
**What's wrong:** Image overlays vary without visual logic:
`from-black/40` (BlogPreview), `from-black/60` (most destination cards),
`from-black/70` (DestinationDetail), `from-black/90 via-black/30`
(QuizSection). Same pattern, different darkness — cards look like they belong
to different components from different sites.  
**Where:** `src/components/landing/BlogPreview.tsx`,
`DestinationsCatalog.tsx`, `DidYouKnowSection.tsx`,
`src/pages/DestinationDetail.tsx`, `src/components/landing/QuizSection.tsx`.  
**Fix:** Standardize to a single token:
`bg-gradient-to-t from-black/65 via-black/25 to-transparent` for all
content cards; reserve `from-black/85` only for full-screen overlays (hero,
quiz).

---

### 7. Text shadow values are inconsistent and inline
**What's wrong:** Three different `textShadow` values are scattered inline
across components with no shared constant:
`"0 4px 30px rgba(0,0,0,0.5)"` (hero h1),
`"0 2px 10px rgba(0,0,0,0.4)"` (hero p),
`"0 2px 16px rgba(0,0,0,0.4)"` (DestinationDetail h1),
`"0 2px 12px rgba(0,0,0,0.6)"` (DidYouKnow card). Each `style={{ textShadow }}` call is a drift risk.  
**Where:** `HeroSection.tsx:29,41`, `DestinationDetail.tsx` (hero h1),
`DidYouKnowSection.tsx` (card text).  
**Fix:** Add two utilities to `src/index.css`:
`.text-shadow-hero { text-shadow: 0 4px 30px rgba(0,0,0,0.5); }` and
`.text-shadow-card { text-shadow: 0 2px 14px rgba(0,0,0,0.45); }`,
then replace all inline `style` props with the class names.

---

### 8. Skeleton screens use opacity-pulse only — no shimmer
**What's wrong:** All skeletons animate with Tailwind's `animate-pulse`
(a simple opacity fade 100%→50%→100%). This reads as "broken" to users on
slow connections. A left-to-right shimmer (gradient sweep) signals "loading"
rather than "error".  
**Where:** `src/components/LoadingSkeletons.tsx` — all `<Skeleton>` usages.  
**Fix:** Add a shimmer keyframe to `src/index.css`:
```css
@keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
.skeleton-shimmer {
  background: linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--accent)) 50%, hsl(var(--muted)) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```
Apply `.skeleton-shimmer` to card-level skeletons, overriding `animate-pulse`.

---

### 9. Image zoom duration is inconsistent across card types
**What's wrong:** Hover zoom uses `duration-700` (destination cards),
`duration-600` (blog cards via Framer Motion), `duration-700` (gear cards via
Tailwind). No single standard — cards feel mismatched when side-by-side on the
homepage.  
**Where:** `src/components/landing/DestinationsCatalog.tsx`,
`BlogPreview.tsx`, `GearPreview.tsx`.  
**Fix:** Standardize to `duration-700 ease-out` on all Tailwind image zoom
transitions; for Framer Motion image variants, set
`transition: { duration: 0.7, ease: "easeOut" }`.

---

### 10. Footer uses hardcoded hex colors instead of design tokens
**What's wrong:** The footer background `bg-[#2f241d]`, text `text-[#F5F0EB]`,
muted text `text-[#E8DDD3]/80`, and accent link `text-[#E2A059]` are all
hardcoded hex. The design system already defines `--walnut`, `--sand`,
`--stone`, and `--sunset` tokens. The footer is almost-but-not-exactly walnut,
creating a barely-perceptible misalignment against the `bg-wash-to-footer`
gradient above it.  
**Where:** `src/components/landing/Footer.tsx` (multiple lines throughout).  
**Fix:** `bg-[#2f241d]` → `bg-walnut`; `text-[#F5F0EB]` → `text-sand`;
`text-[#E8DDD3]/80` → `text-stone/80`; `text-[#E2A059]` → `text-sunset`.

---

### 11. Section vertical spacing is not rhythmically consistent
**What's wrong:** A `.section-editorial` utility exists
(`py-24 md:py-32 lg:py-40`) but most sections use raw Tailwind:
`py-16 sm:py-20` (DidYouKnow, SocialProof), `py-20` (PremiumItinerary),
`py-16 sm:py-24` (others). The inconsistency creates uneven breathing rhythm
when scrolling — some sections feel cramped next to spacious ones.  
**Where:** `src/components/landing/DidYouKnowSection.tsx`,
`SocialProof.tsx`, `PremiumItinerarySection.tsx`,
`GearPreview.tsx`, `BlogPreview.tsx`.  
**Fix:** Apply `.section-editorial` to all major homepage sections; use
`py-16 md:py-20` only for secondary strips (newsletter, trust band).

---

### 12. Blog and gear cards lack Framer Motion hover — Tailwind-only feel
**What's wrong:** Destination cards use `motion.div` with `whileHover`
variants for image zoom. Blog and gear cards use only Tailwind
`hover:scale-[1.03]` + `group-hover:scale-110` on the image — a snappier,
more mechanical CSS transition versus the smooth spring on destination cards.  
**Where:** `src/components/landing/BlogPreview.tsx` (card div),
`GearPreview.tsx` (card div).  
**Fix:** Wrap both in `motion.div` with
`initial="rest" whileHover="hover" animate="rest"` and apply the same
image-zoom variant pattern used in `DestinationsCatalog.tsx`.

---

### 13. BackgroundSlideshow overlay is a flat color, not a gradient
**What's wrong:** `BackgroundSlideshow` renders a flat `bg-black/{N}` overlay.
Pages using it (Servicios) lose the editorial depth the hero achieves with its
`from-[#1C1917]/78 via-[#1C1917]/34 to-transparent` gradient. Flat overlays
make photography feel washed-out.  
**Where:** `src/components/shared/BackgroundSlideshow.tsx` (overlay div).  
**Fix:** Replace the flat overlay with
`bg-gradient-to-t from-[#1C1917]/70 via-[#1C1917]/30 to-transparent` as the
default, and expose a `gradient` boolean prop so callers can opt into a flat
overlay when needed.

---

### 14. Hero media slider has no parallax scroll effect
**What's wrong:** The hero background is stationary as the user scrolls. Even
a subtle `y: [0, 60]` transform tied to scroll progress creates kinetic depth
that immediately elevates perceived quality.  
**Where:** `src/components/landing/MediaSlider.tsx` (wrapper div),
consumed by `HeroSection.tsx`.  
**Fix:** Wrap the slideshow container in a `motion.div` with
`useScroll` + `useTransform` mapping scroll `[0, 1]` → `y: [0, 80]`. Gate
with `useIsMobile()` to avoid mobile performance regression.

---

### 15. Desktop navbar links have no entrance animation on first paint
**What's wrong:** Mobile nav items stagger in at `i * 0.08s` delay. Desktop
nav links appear instantly — they pop into place while the hero title is still
animating (1s duration). The nav reads as a cheaper component than the hero.  
**Where:** `src/components/landing/Navbar.tsx` (desktop nav `<nav>` links).  
**Fix:** Wrap desktop links in `motion.li` with
`initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}`
`transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}`.

---

### 16. DestinationDetail tab content has no entrance animation
**What's wrong:** Switching tabs snaps content in instantly — no crossfade or
slide. Premium editorial UIs animate tab content in to draw the eye to the new
section and reinforce page depth.  
**Where:** `src/pages/DestinationDetail.tsx` (`<TabsContent>` wrappers).  
**Fix:** Wrap each `<TabsContent>` body in
`<AnimatePresence mode="wait"><motion.div key={activeTab}`
`initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}`
`exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>`.

---

### 17. Missing `object-position` for portrait photos in landscape card frames
**What's wrong:** Cards use fixed-height containers with `object-cover`. No
`object-position` is set, so portrait-orientation photos (tall waterfalls,
cliff faces, people) center-crop and often lose the main subject.  
**Where:** `src/components/landing/DestinationsCatalog.tsx`,
`BlogPreview.tsx`, `GearPreview.tsx` (card `<img>` elements).  
**Fix:** Default to `object-top` on destination cards (peaks are at the top);
`object-center` on blog/gear cards. Consider a per-item `image_position` DB
field for future editorial control.

---

### 18. Scroll-to-top button has no hover visual feedback
**What's wrong:** The scroll-to-top button in the navbar has only an
opacity/scale entrance animation. On hover, nothing changes — it feels inert
compared to every other interactive element.  
**Where:** `src/components/landing/Navbar.tsx` (scroll-to-top button).  
**Fix:** Add `whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}` and
`hover:bg-primary hover:text-white transition-colors` to the button classes.

---

### 19. Quiz celebration particles use mixed color syntax
**What's wrong:** The 12 celebration particles mix `bg-primary/20`,
`bg-secondary/20`, `bg-sky/20` (token-based) with `bg-[#D97706]` (hex).
The hardcoded hex bypasses the token system and won't update if the brand
color changes.  
**Where:** `src/components/landing/QuizSection.tsx`
(CelebrationParticles component).  
**Fix:** Replace `bg-[#D97706]` → `bg-primary`; `bg-[#166534]` (if present) →
`bg-secondary`. Use only token-based opacity variants throughout.

---

### 20. `shadow-editorial` defined in CSS utilities, not Tailwind config
**What's wrong:** `shadow-editorial` and `shadow-editorial-hover` live in
`src/index.css` as `@layer utilities` classes, not in
`tailwind.config.ts > theme.extend.boxShadow`. They work when written
literally in JSX, but will silently drop from purged CSS if used in dynamic
class strings, and IDE intellisense won't autocomplete them.  
**Where:** `tailwind.config.ts` (missing entries); `src/index.css:97–103`
(duplicate source).  
**Fix:** Add to `tailwind.config.ts`:
```ts
boxShadow: {
  editorial: "0 16px 40px rgba(61, 47, 35, 0.08)",
  "editorial-hover": "0 22px 56px rgba(61, 47, 35, 0.12)",
}
```
Then remove the duplicate `@layer utilities` shadow blocks from
`src/index.css`.

---

## Summary

| Priority | Category | Items |
|---|---|---|
| P1 — Immediately visible premium feel | Easing curves, hero heights, hero CTA color, parallax | #1 #3 #4 #14 |
| P2 — Legibility / overlap bugs | WhatsApp overlap, text shadow drift, overlay opacity | #5 #6 #7 |
| P3 — Consistency (trained eye detects) | Spacing rhythm, skeleton shimmer, zoom duration, footer tokens | #8 #9 #10 #11 |
| P4 — Microinteraction polish | Hover animations, tab transitions, nav entrance | #12 #13 #15 #16 #18 |
| P5 — System hygiene | Shadow config, particle tokens, object-position | #17 #19 #20 |
