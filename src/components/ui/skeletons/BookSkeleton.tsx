import { BaseSkeleton } from "./BaseSkeleton"
import { BookContentSkeleton } from "./BookContentSkeleton"
import { useUserData } from "@/hooks/useUserData"

export const BookSkeleton: React.FC = () => {
  const { user, profile, isLoading } = useUserData()
  
  return (
    <BaseSkeleton
      title="Pesan Ruangan"
      description="Pilih ruangan yang ingin Anda pesan"
      user={user}
      profile={profile}
      isAdmin={user?.user_metadata?.role === 'admin'}
      isLoading={isLoading}
    >
      <BookContentSkeleton />
    </BaseSkeleton>
  )
}