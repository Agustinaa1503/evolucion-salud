/**
 * Navegación del BackOffice (grupos + ítems). Cada ítem declara el permiso que
 * necesita; el sidebar y el header la filtran según el rol del usuario.
 */
import {
  Award,
  BookOpen,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Mail,
  Mic,
  Package,
  ScrollText,
  Settings,
  Tag,
  Tags,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: string;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: 'Panel',
    items: [{ href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'admin.dashboard' }],
  },
  {
    label: 'Gestión',
    items: [
      { href: '/admin/usuarios', label: 'Usuarios', icon: Users, permission: 'admin.users.read' },
      { href: '/admin/cursos', label: 'Cursos', icon: BookOpen, permission: 'admin.courses.read' },
    ],
  },
  {
    label: 'Contenido',
    items: [
      { href: '/admin/blog', label: 'Blog', icon: FileText, permission: 'admin.blog.read' },
      { href: '/admin/podcast', label: 'Podcast', icon: Mic, permission: 'admin.podcast.read' },
      { href: '/admin/recursos', label: 'Recursos', icon: Package, permission: 'admin.resources.read' },
      { href: '/admin/categorias', label: 'Categorías', icon: Tags, permission: 'admin.taxonomy.read' },
      { href: '/admin/tags', label: 'Tags', icon: Tag, permission: 'admin.taxonomy.read' },
    ],
  },
  {
    label: 'Captación',
    items: [
      { href: '/admin/newsletter', label: 'Newsletter', icon: Mail, permission: 'admin.newsletter.read' },
      { href: '/admin/lista-de-espera', label: 'Lista de espera', icon: UserRound, permission: 'admin.waitlist.read' },
    ],
  },
  {
    label: 'Evaluación',
    items: [
      { href: '/admin/cuestionarios', label: 'Cuestionarios', icon: ClipboardCheck, permission: 'admin.quizzes.read' },
      { href: '/admin/certificados', label: 'Certificados', icon: Award, permission: 'admin.certificates.read' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/admin/configuracion', label: 'Configuración', icon: Settings, permission: 'admin.settings.read' },
      { href: '/admin/logs', label: 'Logs', icon: ScrollText, permission: 'admin.logs.read' },
    ],
  },
];

export const adminItemForPath = (pathname: string): AdminNavItem | undefined => {
  const match = ADMIN_NAV.flatMap((g) => g.items).find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  return match;
};
