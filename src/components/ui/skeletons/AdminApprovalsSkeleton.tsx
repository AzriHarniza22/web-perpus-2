import { BaseSkeleton } from "./BaseSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export const AdminApprovalsSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10">
    {/* Sidebar Skeleton */}
    <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r">
      <div className="p-6 border-b">
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="p-4 space-y-2">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>

    {/* Header Skeleton */}
    <div className="ml-64 bg-white/90 backdrop-blur-lg border-b h-16">
      <div className="px-6 h-full flex justify-between items-center">
        <div>
          <Skeleton className="h-6 w-48 mb-1" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    </div>

    {/* Content Skeleton */}
    <div className="ml-64 p-6">
      <div className="mb-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="w-12 h-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Approvals Card */}
      <div className="bg-card rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Skeleton className="w-5 h-5 mr-2" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-4 w-64 mb-6" />

        {/* Booking Items */}
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)