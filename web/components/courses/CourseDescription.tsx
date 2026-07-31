import SectionHeading from '@/components/SectionHeading';

type Props = {
  title?: string;
  html: string;
  eyebrow?: string;
};

/** Renderiza una sección de prosa (Markdown → HTML). El HTML proviene del
 *  propio Markdown del curso (fuente autorizada, sin HTML manual). */
export default function CourseDescription({ title, html, eyebrow }: Props) {
  if (!html || !html.trim()) return null;
  return (
    <section className="course-prose">
      {title ? <SectionHeading eyebrow={eyebrow} title={title} /> : null}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}
