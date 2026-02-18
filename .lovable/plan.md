

# NOMADERIA — Adventure Platform for Beginners

## Vision
A Spanish-language platform that transforms outdoor adventure beginners from "I can't do this" into "I did it!" — with a warm, Patagonia-meets-Headspace aesthetic. Monetized through affiliate links and premium itineraries.

---

## Phase 1: Foundation & Design System
- Custom color palette (campfire charcoal, forest green, warm sand, sunset orange accents)
- Typography setup with Playfair Display (editorial headlines) + Inter (body/UI)
- Reusable components: themed cards, difficulty badges, section layouts
- Responsive layout foundation (mobile-first)
- Framer Motion for subtle scroll animations

## Phase 2: Supabase Backend
- **Database tables**: destinations, gear_articles, quiz_responses, newsletter_subscribers
- **Admin roles**: admin_users table (separate from profiles, referencing auth.users)
- **Row Level Security**: Public read for destinations/gear, public insert for quiz/newsletter, admin-only for writes
- **Security definer function** for role checks (avoiding RLS recursion)
- **Seed data**: 5 destinations (Nevado de Toluca, Gran Cañón, Camino de Santiago, Ushuaia, Everest Base Camp) + 3 gear articles

## Phase 3: Landing Page (/)
- **Sticky navbar** — transparent over hero, solid on scroll, mobile hamburger menu
- **Full-viewport hero** — inspiring headline "Tu Primera Aventura Te Está Esperando" with dual CTAs
- **"¿Sabías que puedes…?" section** — emotional hook cards with stunning imagery linking to destinations
- **Interactive quiz** — 4-step visual questionnaire (fitness, landscape, duration, companions) → email capture → personalized destination recommendations saved to Supabase
- **Destinations catalog** — filterable by difficulty (Fácil/Moderado/Desafiante), cards with images, badges, budget
- **Gear guide preview** — 3 featured gear articles
- **Social proof** — transformation testimonials
- **Newsletter signup** — email capture to Supabase
- **Footer** — links, social icons, brand tagline

## Phase 4: Destination Detail Page (/destinos/:slug)
- Hero with destination image, name, country, difficulty/days/budget badges
- Tabbed content sections:
  - "¿Puedo Hacerlo?" — difficulty description + fears FAQ accordion
  - "Preparación Física" — physical prep guide (markdown)
  - "Itinerario" — day-by-day plan (markdown)
  - "Qué Llevar" — gear list with affiliate links (markdown)
  - "Reserva Tu Viaje" — affiliate CTA buttons (flights, hotels, insurance)
- Premium itinerary upsell card
- Related destinations at bottom

## Phase 5: Gear Guide Pages
- **Gear listing (/gear)** — category filter tabs, article cards from Supabase
- **Gear article detail (/gear/:slug)** — markdown content with embedded product recommendation cards (image, price, rating, pros/cons, affiliate "Ver en Amazon" buttons)

## Phase 6: Admin Dashboard (/admin)
- **Auth-protected** — Supabase email/password login
- **Sidebar layout** — Dashboard, Destinos, Gear Articles, Quiz Responses, Subscribers
- **Dashboard** — stat cards + recent quiz responses + quick action buttons
- **Destinations CRUD** — table list, create/edit form with markdown editors, dynamic FAQ fields, affiliate link inputs, draft/publish toggle
- **Gear Articles CRUD** — table list, create/edit with dynamic product cards (name, price, rating, pros/cons, affiliate URL)
- **Quiz Responses** — table view with CSV export
- **Subscribers** — table view with CSV export

## Key Technical Decisions
- React Router for all navigation
- Markdown rendering (react-markdown) for destination guides and gear articles
- Framer Motion for scroll-triggered fade-ins
- All UI text in Spanish with warm, encouraging tone
- Placeholder images with gradient backgrounds (comments for real image replacement)
- Placeholder affiliate URLs ready for Travelpayouts/Amazon links

