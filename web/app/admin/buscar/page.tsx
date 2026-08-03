import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, UserRound, BookOpen, FileText, Mic, Package } from 'lucide-react';
import { requireAdminRole } from '@/lib/auth/session';
import { adminDb } from '@/lib/admin/data';
import { fullName, initials } from '@/lib/admin/format';
import { PageHeader, Card, Badge, EmptyState } from '@/components/admin/ui';
import AdminSearchInput from '@/components/admin/AdminSearchInput';
import { getAllCourses } from '@/lib/courses/registry';
import { blogPosts } from '@/lib/data/blog';
import { podcast } from '@/lib/data/podcast';
import { products, levelLabel } from '@/lib/data/products';

export const metadata: Metadata = { title: 'Buscar | BackOffice' };
export const dynamic = 'force-dynamic';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default async function AdminBuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdminRole('admin.access');
  const params = await searchParams;
  const q = params.q?.trim();
  const query = norm(q ?? '');

  const sb = adminDb();
  let users: { id: string; nombre: string | null; apellido: string | null; email: string | null; rol: string | null }[] = [];
  if (sb && query) {
    const { data } = await sb
      .from('profiles')
      .select('id, nombre, apellido, email, rol')
      .or(`email.ilike.%${q}%,nombre.ilike.%${q}%,apellido.ilike.%${q}%`)
      .limit(20);
    users = (data ?? []) as typeof users;
  }

  const courses = query ? getAllCourses().filter((c) => norm(`${c.title} ${c.subtitle} ${c.category} ${(c.tags ?? []).join(' ')}`).includes(query)) : [];
  const blog = query ? blogPosts.filter((p) => norm(`${p.title} ${p.excerpt} ${(p.tags ?? []).join(' ')}`).includes(query)) : [];
  const episodes = query ? (podcast.episodes ?? []).filter((e) => norm(`${e.title} ${e.description}`).includes(query)) : [];
  const resources = query ? products.filter((p) => norm(`${p.title} ${p.subtitle} ${(p.tags ?? []).join(' ')}`).includes(query)) : [];

  const total = users.length + courses.length + blog.length + episodes.length + resources.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Búsqueda"
        description="Busque en el BackOffice: usuarios, cursos, artículos, episodios y recursos."
        badge={q ? <Badge tone="brand">{total} resultados</Badge> : undefined}
      />
      <div className="max-w-md">
        <AdminSearchInput initial={q} />
      </div>

      {!q ? (
        <EmptyState icon={Search} title="Escriba un término para empezar" description="Busque por email, nombre, título o tag." />
      ) : total === 0 ? (
        <EmptyState icon={Search} title="No se encontraron resultados" description={`Nada coincide con «${q}». Pruebe con otro término.`} />
      ) : (
        <div className="space-y-6">
          {users.length > 0 ? (
            <Card title="Usuarios" subtitle={`${users.length} resultados`} padded={false}>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <li key={u.id}>
                    <Link href={`/admin/usuarios/${u.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                        {initials(u.nombre, u.apellido)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{fullName(u.nombre, u.apellido)}</span>
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{u.email}</span>
                      </span>
                      <span className="ml-auto text-xs text-slate-400">{u.rol}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {courses.length > 0 ? (
            <Card title="Cursos" subtitle={`${courses.length} resultados`} padded={false}>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {courses.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/admin/cursos/${c.slug}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
                      <BookOpen className="h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{c.title}</span>
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{c.slug}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {blog.length > 0 ? (
            <Card title="Artículos del blog" subtitle={`${blog.length} resultados`} padded={false}>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {blog.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/blog/${p.slug}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
                      <FileText className="h-4 w-4 shrink-0 text-clay-500" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{p.title}</span>
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{p.category} · {p.date}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {episodes.length > 0 ? (
            <Card title="Episodios de podcast" subtitle={`${episodes.length} resultados`} padded={false}>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {episodes.map((e) => (
                  <li key={e.slug}>
                    <span className="flex items-center gap-3 px-5 py-3">
                      <Mic className="h-4 w-4 shrink-0 text-leaf-500" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{e.title}</span>
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{e.duration}</span>
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {resources.length > 0 ? (
            <Card title="Recursos de la tienda" subtitle={`${resources.length} resultados`} padded={false}>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {resources.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/tienda/${p.slug}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
                      <Package className="h-4 w-4 shrink-0 text-sun-600" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{p.title}</span>
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                          {levelLabel[p.level]} · {p.price === 0 ? 'Gratis' : `USD ${p.price}`}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
