import { BaseSkeleton } from "./BaseSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export const AdminProfileSkeleton: React.FC = () => (
  <BaseSkeleton className="min-h-screen bg-background">
    {/* Sidebar Skeleton */}
    <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r">
      <div className="p-6 border-b">
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="p-4 space-y-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>

    {/* Header Skeleton */}
    <div className="ml-64 pt-24 px-6 pb-8">
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>

    {/* Profile Card Skeleton */}
    <div className="ml-64 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-lg p-6 space-y-6">
          {/* Profile Photo */}
          <div className="flex flex-col items-center">
            <Skeleton className="w-24 h-24 rounded-full" />
            <Skeleton className="h-6 w-32 mt-4" />
          </div>

          {/* Role (Read-only) */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Account Info */}
          <div className="pt-4 border-t space-y-2">
            <Skeleton className="h-5 w-24 mb-3" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Skeleton className="h-3 w-20 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div>
                <Skeleton className="h-3 w-24 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseSkeleton>
)