import { BaseSkeleton } from "./BaseSkeleton"
import { RoomBookingContentSkeleton } from "./RoomBookingContentSkeleton"
import { useUserData } from "@/hooks/useUserData"

export const RoomBookingSkeleton: React.FC = () => {
  const { user, profile, isLoading } = useUserData()
  
  return (
    <BaseSkeleton
      title="Book Room"
      description="Pilih tanggal dan waktu reservasi"
      user={user}
      profile={profile}
      isAdmin={user?.user_metadata?.role === 'admin'}
      isLoading={isLoading}
    >
      <RoomBookingContentSkeleton />
    </BaseSkeleton>
  )
}