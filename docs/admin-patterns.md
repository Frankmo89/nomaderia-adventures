# Admin Patterns — Nomaderia Adventures

## Estructura del Panel

```
/admin/login              → AdminLogin.tsx (pública)
/admin                    → AdminDashboard.tsx (5 stat cards + actividad reciente + acciones rápidas)
/admin/destinations       → AdminDestinations.tsx (CRUD tabla)
/admin/destinations/new   → AdminDestinationForm.tsx
/admin/destinations/:id   → AdminDestinationForm.tsx (editar)
/admin/gear               → AdminGearArticles.tsx (CRUD tabla)
/admin/gear/new           → AdminGearArticleForm.tsx
/admin/gear/:id           → AdminGearArticleForm.tsx (editar)
/admin/blog               → AdminBlogPosts.tsx (CRUD tabla)
/admin/blog/new           → AdminBlogPostForm.tsx
/admin/blog/:id           → AdminBlogPostForm.tsx (editar)
/admin/quiz               → AdminQuizResponses.tsx (read-only + CSV export)
/admin/subscribers        → AdminSubscribers.tsx (read-only + CSV export)
/admin/itinerary-requests → AdminItineraryRequests.tsx (read-only + CSV export)
```

## Patrón de Lista Admin (Destinations, Gear, Blog)

```typescript
// 1. Estado
const [items, setItems] = useState<T[]>([]);
const [loading, setLoading] = useState(true);

// 2. Skeleton mientras carga
{loading ? <SkeletonRows /> : ...}

// 3. Empty state si no hay datos
{items.length === 0 ? <EmptyState /> : ...}

// 4. Switch inline para publicar/despublicar
<Switch
  checked={item.is_published ?? false}
  onCheckedChange={() => handleTogglePublish(item.id, item.is_published ?? false)}
/>

// 5. AlertDialog para confirmar eliminación (NO browser confirm())
<AlertDialog>...</AlertDialog>
```

## AdminDashboard

- 5 stat cards: Destinos, Gear, Blog, Itinerarios (solicitudes), Suscriptores
- Cada card: publicados en grande + borradores en pequeño (si > 0)
- "Actividad Reciente": últimos 6 items de los 3 content types, por fecha
- 3 botones de acción rápida: Nuevo Destino, Nuevo Artículo, Nuevo Post

## Read-only Pages (Quiz, Subscribers, Itineraries)

- Total count bajo el título
- Botón "Exportar CSV" → `{tipo}-{fecha-ISO}.csv`
- Skeleton + empty state
- `AdminItineraryRequests` usa `supabase as any` temporal (pendiente regenerar tipos)

## Convenciones de Código

### Nombrado
- Componentes: `PascalCase.tsx`
- Hooks: `use-nombre.ts` archivo, `useNombre()` función
- Constantes: `SCREAMING_SNAKE_CASE`

### TypeScript
- `strictNullChecks: true`, `noImplicitAny: false`
- Tipos Supabase en `types.ts` (auto-generado)
- Props: interfaces inline para componentes pequeños, nombradas para reutilizables

### Componentes
- Functional components (arrow o function declarations)
- NO usar `React.FC<Props>` (deprecado en React 18)

## Cómo Agregar Funcionalidades

### Nueva página pública
1. Crear `src/pages/NuevaPagina.tsx`
2. Ruta en `src/App.tsx`
3. Link en `Navbar.tsx` y `Footer.tsx`

### Nueva tabla Supabase
1. Crear tabla en dashboard o `supabase/migrations/`
2. Regenerar tipos: `npx supabase gen types typescript --project-id vrixiuvnhvqafmxlcyex > src/integrations/supabase/types.ts`
3. Crear custom hook en `src/hooks/`

### Nuevo contenido (destino/gear/blog)
- Desde panel admin `/admin` — no requiere código
- O insertar SQL directamente en Supabase SQL Editor
