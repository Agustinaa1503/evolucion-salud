import Icon from '@/components/Icon';
import type { Course } from '@/lib/courses/types';

type ChipProps = { icon: string; label: string };

function Chip({ icon, label }: ChipProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
      <Icon name={icon} className="h-3.5 w-3.5 text-brand-600" />
      {label}
    </span>
  );
}

/** Metadatos del curso: duración, nivel, dificultad, categoría y conteos. */
export default function CourseMetadata({ course }: { course: Course }) {
  const items: { icon: string; label: string }[] = [];
  if (course.duration) items.push({ icon: 'clock', label: course.duration });
  if (course.level) items.push({ icon: 'users', label: course.level });
  if (course.difficulty) items.push({ icon: 'gauge', label: course.difficulty });
  if (course.category) items.push({ icon: 'tag', label: course.category });
  if (course.videos.length)
    items.push({ icon: 'play', label: `${course.videos.length} ${course.videos.length === 1 ? 'video' : 'videos'}` });
  if (course.modules.length)
    items.push({ icon: 'layers', label: `${course.modules.length} módulos` });

  if (!items.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((chip) => (
        <Chip key={`${chip.icon}-${chip.label}`} {...chip} />
      ))}
    </div>
  );
}
