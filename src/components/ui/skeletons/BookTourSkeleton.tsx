import { BookTourContentSkeleton } from "./BookTourContentSkeleton"

export const BookTourSkeleton: React.FC = () => {
  return (
    <div className="h-[calc(100vh-106px)] sm:h-[calc(100vh-112px)] lg:h-[calc(100vh-116px)] flex flex-col">
      {/* Optimized 3-Card Grid Layout - Equal width cards with responsive spacing */}
      <div className="flex flex-col md:flex-row gap-2 sm:gap-3 lg:gap-3 xl:gap-4 flex-1 min-h-0">
        <BookTourContentSkeleton />
      </div>
    </div>
  )
}