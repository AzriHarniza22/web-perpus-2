import { Skeleton } from "@/components/ui/skeleton"

export const CardSkeleton: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className, children }) => (
  <div className={`bg-card rounded-lg p-6 space-y-4 ${className || ''}`}>
    {children || (
      <>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </>
    )}
  </div>
)

export const RoomCardSkeleton: React.FC = () => (
  <div className="bg-card rounded-lg p-6 space-y-4 h-80">
    <Skeleton className="h-48 w-full rounded-md" />
    <Skeleton className="h-6 w-3/4 mt-4" />
    <Skeleton className="h-4 w-1/2" />
    <div className="flex gap-2 mt-4">
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-6 w-14" />
    </div>
  </div>
)