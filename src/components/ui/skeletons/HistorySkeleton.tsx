import { BaseSkeleton } from "./BaseSkeleton"
import { HistoryContentSkeleton } from "./HistoryContentSkeleton"
import { useUserData } from "@/hooks/useUserData"

export const HistorySkeleton: React.FC = () => {
  const { user, profile, isLoading } = useUserData()
  
  return (
    <BaseSkeleton
      title="Riwayat Reservasi"
      description="Lihat semua reservasi dan aktivitas booking Anda"
      user={user}
      profile={profile}
      isAdmin={user?.user_metadata?.role === 'admin'}
      isLoading={isLoading}
    >
      <HistoryContentSkeleton />
    </BaseSkeleton>
  )
}