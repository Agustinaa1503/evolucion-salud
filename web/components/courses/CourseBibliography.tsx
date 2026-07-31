import { BookMarked, ExternalLink } from 'lucide-react';
import type { Course } from '@/lib/courses/types';

/** Bibliografía y fuentes del curso (autores, año, fuente y enlace). */
export default function CourseBibliography({ course, className = '' }: { course: Course; className?: string }) {
  if (!course.bibliography.length) return null;

  return (
    <section className={className}>
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <BookMarked className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Bibliografía</h2>
          <p className="text-xs font-medium text-slate-500">Fuentes y referencias del curso</p>
        </div>
      </div>

      <ul className="mt-6 space-y-3">
        {course.bibliography.map((entry, i) => (
          <li
            key={entry.id ?? `${entry.title}-${i}`}
            className="flex items-start gap-3 rounded-3xl border border-slate-200/80 bg-white px-5 py-4 shadow-card"
          >
            <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1 text-sm leading-relaxed text-slate-600">
              <span className="block">
                <span className="font-bold text-slate-800">{entry.authors}</span>
                {entry.year ? <span className="text-slate-400"> · {entry.year}</span> : null}
              </span>
              <span className="block text-slate-700">{entry.title}</span>
              {entry.source ? <span className="block text-xs text-slate-500">{entry.source}</span> : null}
            </div>
            {entry.url ? (
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 transition hover:bg-brand-100"
                aria-label={`Fuente: ${entry.title}`}
              >
                Fuente
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
