import { Skeleton } from "@/components/ui/skeleton";

export const DestinationDetailSkeleton = () => (
  <div className="animate-in fade-in duration-500">
    {/* Hero skeleton — matches h-[50vh] md:h-[60vh] */}
    <div className="h-[50vh] md:h-[60vh] relative">
      <Skeleton className="absolute inset-0 rounded-none" />
    </div>
    {/* Content skeleton — matches flex-1 main + lg:w-80 sidebar layout */}
    <div className="container mx-auto px-4 py-12 flex flex-col lg:flex-row gap-8">
      <div className="flex-1 min-w-0 space-y-6">
        {/* Tabs nav row — matches TabsList with 4 triggers */}
        <div className="flex gap-1 flex-wrap">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
        {/* Body text blocks */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-5 w-4/6" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
        </div>
        {/* FAQ accordion placeholder */}
        <div className="space-y-3 pt-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
      {/* Sidebar — matches lg:w-80 Card */}
      <div className="w-full lg:w-80 shrink-0">
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  </div>
);

export const GearArticleDetailSkeleton = () => (
  <div className="animate-in fade-in duration-500">
    <div className="h-[35vh] relative">
      <Skeleton className="absolute inset-0 rounded-none" />
    </div>
    <div className="container mx-auto px-4 py-12 max-w-3xl space-y-4">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-5/6" />
      <Skeleton className="h-6 w-4/6" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-3/4" />
    </div>
  </div>
);

/** Generic card grid — kept for backwards compat */
export const CardGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-card rounded-xl overflow-hidden shadow-lg">
        <Skeleton className="h-52 w-full rounded-none" />
        <div className="p-5 space-y-3">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
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
        <Skeleton className="h-56 sm:h-52 w-full rounded-none" />
        <div className="p-4 sm:p-5 space-y-2">
          {/* Title — font-serif text-lg */}
          <Skeleton className="h-6 w-3/4" />
          {/* Country line — text-sm */}
          <Skeleton className="h-4 w-1/3" />
          {/* Description lines — text-sm line-clamp-2 */}
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          {/* Footer row: clock · dollar · "Ver Guía →" */}
          <div className="flex items-center justify-between pt-1">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-16" />
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
        <Skeleton className="h-44 w-full rounded-none" />
        <div className="p-5 space-y-2">
          {/* Badge + reading time + author row */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
          {/* Title — font-serif text-lg */}
          <Skeleton className="h-6 w-3/4" />
          {/* Description lines — text-sm line-clamp-2 */}
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          {/* Date — text-xs */}
          <Skeleton className="h-3 w-28 mt-1" />
          {/* "Leer más →" */}
          <Skeleton className="h-4 w-16 mt-1" />
        </div>
      </div>
    ))}
  </div>
);
