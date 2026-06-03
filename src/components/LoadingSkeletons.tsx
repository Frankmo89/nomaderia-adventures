export const DestinationDetailSkeleton = () => (
  <div className="animate-in fade-in duration-500">
    {/* Hero skeleton — matches h-[50vh] md:h-[60vh] */}
    <div className="h-[50vh] md:h-[60vh] relative">
      <div className="skeleton-shimmer absolute inset-0 rounded-none" />
    </div>
    {/* Content skeleton — matches flex-1 main + lg:w-80 sidebar layout */}
    <div className="container mx-auto px-4 py-12 flex flex-col lg:flex-row gap-8">
      <div className="flex-1 min-w-0 space-y-6">
        {/* Tabs nav row — matches TabsList with 4 triggers */}
        <div className="flex gap-1 flex-wrap">
          <div className="skeleton-shimmer h-9 w-28 rounded-md" />
          <div className="skeleton-shimmer h-9 w-32 rounded-md" />
          <div className="skeleton-shimmer h-9 w-24 rounded-md" />
          <div className="skeleton-shimmer h-9 w-24 rounded-md" />
        </div>
        {/* Body text blocks */}
        <div className="space-y-3">
          <div className="skeleton-shimmer h-5 w-full rounded-md" />
          <div className="skeleton-shimmer h-5 w-5/6 rounded-md" />
          <div className="skeleton-shimmer h-5 w-4/6 rounded-md" />
          <div className="skeleton-shimmer h-5 w-full rounded-md" />
          <div className="skeleton-shimmer h-5 w-3/4 rounded-md" />
          <div className="skeleton-shimmer h-5 w-full rounded-md" />
          <div className="skeleton-shimmer h-5 w-5/6 rounded-md" />
        </div>
        {/* FAQ accordion placeholder */}
        <div className="space-y-3 pt-2">
          <div className="skeleton-shimmer h-7 w-48 rounded-md" />
          <div className="skeleton-shimmer h-12 w-full rounded-lg" />
          <div className="skeleton-shimmer h-12 w-full rounded-lg" />
          <div className="skeleton-shimmer h-12 w-full rounded-lg" />
        </div>
      </div>
      {/* Sidebar — matches lg:w-80 Card */}
      <div className="w-full lg:w-80 shrink-0">
        <div className="skeleton-shimmer h-64 w-full rounded-xl" />
      </div>
    </div>
  </div>
);

export const GearArticleDetailSkeleton = () => (
  <div className="animate-in fade-in duration-500">
    <div className="h-[35vh] relative">
      <div className="skeleton-shimmer absolute inset-0 rounded-none" />
    </div>
    <div className="container mx-auto px-4 py-12 max-w-3xl space-y-4">
      <div className="skeleton-shimmer h-8 w-32 rounded-md" />
      <div className="skeleton-shimmer h-6 w-full rounded-md" />
      <div className="skeleton-shimmer h-6 w-5/6 rounded-md" />
      <div className="skeleton-shimmer h-6 w-4/6 rounded-md" />
      <div className="skeleton-shimmer h-6 w-full rounded-md" />
      <div className="skeleton-shimmer h-6 w-3/4 rounded-md" />
    </div>
  </div>
);

/** Generic card grid — kept for backwards compat */
export const CardGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-card rounded-xl overflow-hidden shadow-lg">
        <div className="skeleton-shimmer h-52 w-full rounded-none" />
        <div className="p-5 space-y-3">
          <div className="skeleton-shimmer h-5 w-20 rounded-md" />
          <div className="skeleton-shimmer h-6 w-3/4 rounded-md" />
          <div className="skeleton-shimmer h-4 w-full rounded-md" />
          <div className="skeleton-shimmer h-4 w-5/6 rounded-md" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Destination card skeleton — mirrors DestCard layout in DestinationsCatalog:
 *   image h-56 sm:h-52 · p-4 sm:p-5 · title · country · description · footer row
 */
export const DestinationCardGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-card rounded-xl overflow-hidden shadow-lg">
        {/* Image area — h-56 on mobile, h-52 on sm+ */}
        <div className="skeleton-shimmer h-56 sm:h-52 w-full rounded-none" />
        <div className="p-4 sm:p-5 space-y-2">
          {/* Title — font-serif text-lg */}
          <div className="skeleton-shimmer h-6 w-3/4 rounded-md" />
          {/* Country line — text-sm */}
          <div className="skeleton-shimmer h-4 w-1/3 rounded-md" />
          {/* Description lines — text-sm line-clamp-2 */}
          <div className="skeleton-shimmer h-4 w-full rounded-md" />
          <div className="skeleton-shimmer h-4 w-5/6 rounded-md" />
          {/* Footer row: clock · dollar · "Ver Guía →" */}
          <div className="flex items-center justify-between pt-1">
            <div className="skeleton-shimmer h-4 w-14 rounded-md" />
            <div className="skeleton-shimmer h-4 w-14 rounded-md" />
            <div className="skeleton-shimmer h-4 w-16 rounded-md" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

/**
 * Blog card skeleton — mirrors blog card layout in BlogListing:
 *   image h-44 · p-5 · badge row · title · description · date · "Leer más"
 */
export const BlogCardGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-card rounded-xl overflow-hidden shadow-lg">
        {/* Image area — h-44 */}
        <div className="skeleton-shimmer h-44 w-full rounded-none" />
        <div className="p-5 space-y-2">
          {/* Badge + reading time + author row */}
          <div className="flex items-center gap-2">
            <div className="skeleton-shimmer h-5 w-20 rounded-full" />
            <div className="skeleton-shimmer h-4 w-12 rounded-md" />
            <div className="skeleton-shimmer h-4 w-16 rounded-md" />
          </div>
          {/* Title — font-serif text-lg */}
          <div className="skeleton-shimmer h-6 w-3/4 rounded-md" />
          {/* Description lines — text-sm line-clamp-2 */}
          <div className="skeleton-shimmer h-4 w-full rounded-md" />
          <div className="skeleton-shimmer h-4 w-5/6 rounded-md" />
          {/* Date — text-xs */}
          <div className="skeleton-shimmer h-3 w-28 mt-1 rounded-md" />
          {/* "Leer más →" */}
          <div className="skeleton-shimmer h-4 w-16 mt-1 rounded-md" />
        </div>
      </div>
    ))}
  </div>
);
