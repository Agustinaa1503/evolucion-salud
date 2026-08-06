import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireAdminRole } from '@/lib/auth/session';
import { PageHeader, ButtonLink } from '@/components/admin/ui';
import { getCourse } from '@/lib/courses/registry';
import SyllabusBuilder from '@/components/admin/courses/SyllabusBuilder';

export const metadata: Metadata = { title: 'Editar curso | BackOffice' };
export const dynamic = 'force-dynamic';

const typeLabels: Record<string, string> = { free: 'Gratuito', paid: 'De pago', upcoming: 'Próximamente' };

export default async function AdminCourseEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdminRole('admin.content.write');
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Editar: ${course.title}`}
        description={`${typeLabels[course.type] ?? course.type} · ${course.status} · ${course.modules.length} módulos`}
        actions={
          <ButtonLink href={`/admin/cursos/${slug}`}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver al detalle
          </ButtonLink>
        }
      />
      <SyllabusBuilder initial={course} />
    </div>
  );
}
