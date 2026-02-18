import { Skeleton } from "@/components/ui/skeleton";

export const DestinationDetailSkeleton = () => (
  <div className="animate-in fade-in duration-500">
    {/* Hero skeleton */}
    <div className="h-[50vh] relative">
      <Skeleton className="absolute inset-0 rounded-none" />
    </div>
    {/* Content skeleton */}
    <div className="container mx-auto px-4 py-12 flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-5/6" />
        <Skeleton className="h-6 w-4/6" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
      </div>
      <div className="w-full lg:w-80 shrink-0">
        <Skeleton className="h-48 w-full rounded-xl" />
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
