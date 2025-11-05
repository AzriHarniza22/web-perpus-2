import { BaseSkeleton } from "./BaseSkeleton"
import { ProfileContentSkeleton } from "./ProfileContentSkeleton"
import { useUserData } from "@/hooks/useUserData"

export const ProfileSkeleton: React.FC = () => {
  const { user, profile, isLoading } = useUserData()
  
  return (
    <BaseSkeleton
      title="Kelola Profil"
      description="Update informasi profil dan preferensi Anda"
      className="max-w-2xl mx-auto"
      user={user}
      profile={profile}
      isAdmin={user?.user_metadata?.role === 'admin'}
      isLoading={isLoading}
    >
      <ProfileContentSkeleton />
    </BaseSkeleton>
  )
}