import { BaseSkeleton } from "./BaseSkeleton"
import { BookTourContentSkeleton } from "./BookTourContentSkeleton"
import { useUserData } from "@/hooks/useUserData"

export const BookTourSkeleton: React.FC = () => {
  const { user, profile, isLoading } = useUserData()
  
  return (
    <BaseSkeleton
      title="Book Tour"
      description="Jadwalkan tur perpustakaan"
      user={user}
      profile={profile}
      isAdmin={user?.user_metadata?.role === 'admin'}
      isLoading={isLoading}
    >
      <BookTourContentSkeleton />
    </BaseSkeleton>
  )
}