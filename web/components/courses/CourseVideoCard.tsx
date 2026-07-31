import { Clock, ExternalLink, PlayCircle } from 'lucide-react';
import type { CourseVideo } from '@/lib/courses/types';

/**
 * Tarjeta de un video del curso: número, título, descripción, duración y
 * botón «Ver en YouTube» que abre únicamente ese video.
 */
export default function CourseVideoCard({
  video,
  index,
}: {
  video: CourseVideo;
  index: number;
}) {
  return (
    <article className="group flex h-full flex-col rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card transition duration-500 hover:-translate-y-1 hover:shadow-lift">
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-leaf-600 text-sm font-bold text-white shadow-sm">
          {index + 1}
        </span>
        {video.duration ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {video.duration}
          </span>
        ) : null}
      </div>

      <h3 className="mt-4 text-lg font-extrabold text-slate-900">{video.title}</h3>
      {video.description ? (
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{video.description}</p>
      ) : null}

      <a
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-outline mt-auto inline-flex w-full pt-2.5 pb-2.5 group-hover:border-brand-300 group-hover:bg-brand-50"
      >
        <PlayCircle className="h-4 w-4 text-brand-600" aria-hidden="true" />
        Ver en YouTube
        <ExternalLink className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
      </a>
    </article>
  );
}
