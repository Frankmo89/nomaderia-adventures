# Gear Image Field Audit — Nomaderia Adventures

> Audit only. No code was modified.
> Generated: 2026-06-22.

---

## 1. The `gear_articles` table

**Source of truth:** `docs/supabase-schema.md` (lines 39–53).

Full column list:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `title` | text NOT NULL | |
| `slug` | text UNIQUE NOT NULL | → `/gear/:slug` |
| `category` | text NOT NULL | `"boots"` \| `"poles"` \| `"backpacks"` \| `"photography"` \| `"clothing"` \| `"accessories"` |
| `short_description` | text | |
| **`hero_image_url`** | **text** | **Column exists. Currently always NULL in practice (see §4).** |
| `content_markdown` | text | |
| `products` | jsonb DEFAULT `'[]'` | `[{name, price, pros[], cons[], affiliate_url, rating}]` |
| `is_published` | boolean DEFAULT false | |
| `featured` | boolean DEFAULT false | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**The `hero_image_url text` column already exists.** No migration is needed.

---

## 2. The admin form for gear articles

**File:** `src/pages/admin/AdminGearArticleForm.tsx`

### Fields currently exposed

The `form` state object is declared on line 35:
```ts
const [form, setForm] = useState({
  title: "",
  slug: "",
  category: "",
  short_description: "",
  content_markdown: "",
  is_published: false,
  featured: false,
});
```

Rendered fields:
| Field | Input type | Line(s) |
|-------|-----------|---------|
| Título | `<Input>` | 326 |
| Slug | `<Input>` | 327 |
| Categoría | `<Input>` | 328 |
| Descripción Corta | `<Textarea>` | 330 |
| Contenido (Markdown) | `<Textarea rows={12}>` | 331 |
| Publicado | `<Switch>` | 333 |
| Destacado | `<Switch>` | 334 |
| Productos (dynamic list) | Name / Precio / Rating / URL Afiliado / Pros / Contras | 342–381 |

### What's missing

`hero_image_url` is **entirely absent** from:
- the `form` state (line 35)
- the load effect that hydrates the form on edit (lines 113–118)
- the `payload` sent to Supabase on save (line 235)

The AI autofill path (`generateDraft` → `setForm`) also never sets `hero_image_url` (lines 153–160), which is expected since the AI draft API doesn't supply an image URL.

---

## 3. The existing image upload pattern

### The component

**File:** `src/components/dashboard/ImageUpload.tsx`

Already-built, generic, reusable component. Props:

```ts
interface ImageUploadProps {
  bucket: string;       // Supabase Storage bucket name
  currentUrl?: string;  // pre-filled URL (for edit mode)
  onUploadComplete: (url: string) => void;  // callback with the new public URL
}
```

Behavior:
- Accepts WebP, JPG, PNG only; rejects files > 2 MB (enforced client-side).
- Generates filename: `{Date.now()}-{6-char random}.{ext}` — guaranteed unique, no path prefix.
- Uploads with `supabase.storage.from(bucket).upload(fileName, file, { upsert: false })`.
- Gets public URL with `supabase.storage.from(bucket).getPublicUrl(fileName)`.
- Shows a `148px`-tall preview image with an `×` remove button overlaid.
- Calls `onUploadComplete("")` on remove (so the form field becomes empty string, which the destination form saves as `null`).
- Label is hardcoded to "Imagen Principal" — fine for gear as well.

### Where it's already used

`AdminDestinationForm.tsx` line 168:
```tsx
<ImageUpload
  bucket="destinations"
  currentUrl={form.hero_image_url}
  onUploadComplete={(url) => set("hero_image_url", url)}
/>
```

The `destinations` Supabase Storage bucket exists and is in production use. All destination hero images live there.

### Storage bucket(s) in use

| Bucket name | Used by | How URL is saved |
|-------------|---------|-----------------|
| `destinations` | `AdminDestinationForm.tsx:168` | `destinations.hero_image_url` |
| `media_slider` | `use-media.ts` (admin media slider) | `media_slider.image_url` |

There is **no `gear` bucket yet**. The gear image upload would need either:
- a new `gear` bucket (cleanest; keeps gear images separate), or
- reuse of an existing public bucket (e.g., `destinations`) with a subfolder prefix.

The component requires only that the named bucket exists and is public. No code changes to `ImageUpload.tsx` are needed to support a new bucket name.

---

## 4. How the public gear surfaces read (or ignore) `hero_image_url`

### `/gear` — `src/pages/GearListing.tsx` (lines 77–83)

**Correctly reads `hero_image_url`:**
```tsx
{a.hero_image_url ? (
  <img src={a.hero_image_url} alt={a.title} … />
) : (
  <div className="w-full h-full bg-gradient-to-br from-accent/20 to-secondary/20" />
)}
```
When `hero_image_url` is null/empty, a soft warm gradient placeholder is shown. Each card gets its own gradient — there is no shared image here.

### `/gear/:slug` — `src/pages/GearArticleDetail.tsx` (lines 138–142)

**Correctly reads `hero_image_url`:**
```tsx
{article.hero_image_url ? (
  <img src={article.hero_image_url} alt={article.title} … />
) : (
  <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-secondary/20" />
)}
```
Same gradient fallback. The detail page hero (`35vh` height) and the SEO `<meta og:image>` tag (line 131) both pull from `article.hero_image_url`.

### Homepage preview — `src/components/landing/GearPreview.tsx` (lines 15–19, 67–69) ⚠

**This is the root cause of "all items show the same photo."**

The component has a hardcoded `categoryImage` map:
```ts
const categoryImage: Record<string, string> = {
  boots:   "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80",
  poles:   "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800&q=80",
  cameras: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&q=80",
};
```

The image rendered for each card is:
```tsx
<motion.img
  src={categoryImage[a.category] || categoryImage.boots}
  …
/>
```

`a.hero_image_url` is **never consulted here**. Every article in the same category (or any article in an unmapped category like `backpacks`, `clothing`, `accessories`) renders the same Unsplash boots photo. Three categories have distinct images; four categories (`backpacks`, `clothing`, `accessories`, `photography`) all fall through to `categoryImage.boots`.

---

## Summary of the gap

| Surface | Reads `hero_image_url`? | Fallback if null |
|---------|------------------------|-----------------|
| `/gear` listing | ✅ Yes | Warm gradient |
| `/gear/:slug` detail hero | ✅ Yes | Warm gradient |
| `/gear/:slug` SEO `og:image` | ✅ Yes | `undefined` (no og:image tag emitted) |
| Homepage `GearPreview` section | ❌ No — always uses hardcoded Unsplash URL | `categoryImage.boots` |
| Admin form (create/edit) | ❌ No — field missing entirely | — |
| DB column | ✅ Exists (`hero_image_url text`) | — |

---

## Proposed smallest change (do not implement yet)

Two independent changes are needed; they are independent of each other:

### Change A — Wire the admin form to the existing `ImageUpload` component

**Files to touch:** `src/pages/admin/AdminGearArticleForm.tsx` only.

1. Add `hero_image_url: ""` to the `form` state object (line 35).
2. In the load effect (lines 113–118), map `data.hero_image_url || ""` into form state.
3. In the `handleSubmit` payload (line 235), `hero_image_url` will be included automatically via `...form` — but ensure the save sends `hero_image_url: form.hero_image_url || null` to avoid saving empty string.
4. Import `ImageUpload` from `@/components/dashboard/ImageUpload`.
5. In the "Información" `<Card>`, add:
   ```tsx
   <ImageUpload
     bucket="gear"
     currentUrl={form.hero_image_url}
     onUploadComplete={(url) => set("hero_image_url", url)}
   />
   ```
   Natural placement: between the "Descripción Corta" textarea and the "Contenido (Markdown)" textarea.

**Pre-requisite (Frank, 2 minutes in Supabase Dashboard):** Create a new Storage bucket named `gear` with public access. Or substitute `bucket="destinations"` to reuse the existing bucket with no bucket setup required — the component is bucket-agnostic.

### Change B — Fix `GearPreview` on the homepage to use the actual image

**File to touch:** `src/components/landing/GearPreview.tsx` only.

Change the `<motion.img>` `src` from:
```tsx
src={categoryImage[a.category] || categoryImage.boots}
```
to:
```tsx
src={a.hero_image_url || categoryImage[a.category] || categoryImage.boots}
```

This is a one-line change. It preserves the existing Unsplash fallback for articles that don't yet have an uploaded image, so nothing breaks while the backlog of articles is being updated.

---

## Notes

- `docs/admin-patterns.md` may have additional conventions to verify before implementing.
- The AI draft path (`generateDraft`) does not need to change — it never sets `hero_image_url` and that is correct.
- The `products` items in the DB have an optional `image_url` field already defined in `GearArticleDetail.tsx:28` — that is a per-product field inside the JSONB array and is unrelated to the article-level `hero_image_url`.
