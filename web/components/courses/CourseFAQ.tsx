import { ChevronDown, MessageCircleQuestion } from 'lucide-react';
import type { Course } from '@/lib/courses/types';

/** Preguntas frecuentes del curso (acordeón). */
export default function CourseFAQ({ course, className = '' }: { course: Course; className?: string }) {
  if (!course.faq.length) return null;

  return (
    <section className={className}>
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <MessageCircleQuestion className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="text-xl font-extrabold text-slate-900">Preguntas frecuentes</h2>
      </div>

      <div className="mt-6 space-y-3">
        {course.faq.map((item) => (
          <details
            key={item.question}
            className="group rounded-2xl border border-slate-200/80 bg-white shadow-card"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 [&::-webkit-details-marker]:hidden">
              <h3 className="text-sm font-extrabold text-slate-900">{item.question}</h3>
              <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-600">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
