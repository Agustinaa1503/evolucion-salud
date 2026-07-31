import { Video } from 'lucide-react';
import CourseVideoCard from './CourseVideoCard';
import type { Course } from '@/lib/courses/types';

/** Lista de videos del curso (sin límite de cantidad: detecta todos los del Markdown). */
export default function CourseVideoList({ course, className = '' }: { course: Course; className?: string }) {
  if (!course.videos.length) return null;

  return (
    <section className={className}>
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Video className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Clases en video</h2>
          <p className="text-xs font-medium text-slate-500">
            {course.videos.length} {course.videos.length === 1 ? 'video' : 'videos'} · reproductor externo
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {course.videos.map((video, i) => (
          <CourseVideoCard key={`${video.url}-${i}`} video={video} index={i} />
        ))}
      </div>
    </section>
  );
}
