import { BaseSkeleton } from "./BaseSkeleton"
import { AnalyticsContentSkeleton } from "./AnalyticsContentSkeleton"

export const AnalyticsPageSkeleton: React.FC = () => (
  <BaseSkeleton 
    isAdmin={true}
    title="Analytics Dashboard"
    description="Analisis data reservasi dan aktivitas pengguna"
  >
    <AnalyticsContentSkeleton />
  </BaseSkeleton>
)