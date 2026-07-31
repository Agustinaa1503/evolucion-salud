import {
  BookOpen,
  Download,
  FileText,
  Headphones,
  Link2,
  ListChecks,
  Music,
  Package,
  Video,
} from 'lucide-react';
import type { Course, CourseResource, ResourceType } from '@/lib/courses/types';

const icons: Record<ResourceType, typeof Download> = {
  pdf: FileText,
  ebook: BookOpen,
  audio: Headphones,
  meditacion: Music,
  checklist: ListChecks,
  plantilla: Package,
  archivo: FileText,
  link: Link2,
  video: Video,
};

/** Material descargable y enlaces del curso (PDFs, audios, plantillas, checklists...). */
export default function CourseResources({ course, className = '' }: { course: Course; className?: string }) {
  if (!course.resources.length) return null;

  const grouped = course.resources.reduce<Record<string, CourseResource[]>>((acc, r) => {
    const type = r.type;
    acc[type] = acc[type] ?? [];
    acc[type].push(r);
    return acc;
  }, {});

  return (
    <section className={className}>
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Download className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Recursos</h2>
          <p className="text-xs font-medium text-slate-500">Material descargable y enlaces</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(grouped).map(([type, items]) => {
          const Icon = icons[type as ResourceType] ?? Link2;
          return items.map((resource) => {
            const isExternal = resource.url.startsWith('http');
            const tag = isExternal ? (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 transition hover:bg-brand-100"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {type}
              </a>
            ) : (
              <a
                href={resource.url}
                download
                className="inline-flex items-center gap-1.5 rounded-full bg-leaf-50 px-3 py-1 text-xs font-bold text-leaf-700 transition hover:bg-leaf-100"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {type}
              </a>
            );
            return (
              <div key={`${resource.title}-${resource.url}`} className="flex h-full flex-col rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card">
                <h3 className="text-base font-extrabold text-slate-900">{resource.title}</h3>
                {resource.description ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{resource.description}</p>
                ) : null}
                <div className="mt-auto pt-4">{tag}</div>
              </div>
            );
          });
        })}
      </div>
    </section>
  );
}
