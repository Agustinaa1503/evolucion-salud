import { CheckCircle2, FileQuestion, ListChecks, Target, UserRound } from 'lucide-react';
import type { Course } from '@/lib/courses/types';

type ListKind = 'objectives' | 'learning' | 'audience' | 'requirements';

const meta: Record<ListKind, { title: string; icon: typeof Target; hint: string }> = {
  objectives: { title: 'Objetivos', icon: Target, hint: 'Qué logrará al finalizar' },
  learning: { title: 'Qué aprenderás', icon: ListChecks, hint: 'Contenido del recorrido' },
  audience: { title: '¿A quién está dirigido?', icon: UserRound, hint: 'Destinatarios' },
  requirements: { title: 'Requisitos', icon: FileQuestion, hint: 'Para empezar' },
};

type Props = {
  course: Course;
  kind?: ListKind;
  className?: string;
};

/** Lista de objetivos / aprendizajes / destinatarios / requisitos del curso. */
export default function CourseObjectives({ course, kind = 'objectives', className = '' }: Props) {
  const items =
    kind === 'objectives'
      ? course.objectives
      : kind === 'learning'
        ? course.learning
        : kind === 'audience'
          ? course.audience
          : course.requirements;

  if (!items.length) return null;

  const m = meta[kind];
  const Icon = m.icon;

  return (
    <section className={className}>
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">{m.title}</h2>
          <p className="text-xs font-medium text-slate-500">{m.hint}</p>
        </div>
      </div>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-leaf-600" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-slate-700">{item}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
