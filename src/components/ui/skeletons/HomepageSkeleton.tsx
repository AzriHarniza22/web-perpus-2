import { BaseSkeleton } from "./BaseSkeleton"
import { HomepageContentSkeleton } from "./HomepageContentSkeleton"
import { useUserData } from "@/hooks/useUserData"

export const HomepageSkeleton: React.FC = () => {
  const { user, profile, isLoading } = useUserData()
  
  return (
    <BaseSkeleton
      title="Perpustakaan Aceh"
      description="Sistem Reservasi Ruang dan Tur Perpustakaan"
      user={user}
      profile={profile}
      isAdmin={user?.user_metadata?.role === 'admin'}
      isLoading={isLoading}
    >
      <HomepageContentSkeleton />
    </BaseSkeleton>
  )
}