import Link from 'next/link';
import { ArrowRight, CalendarDays, Clock } from 'lucide-react';
import CardCover from './CardCover';
import type { BlogPost } from '@/lib/data/blog';
import { formatDate } from '@/lib/utils';

export default function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card transition duration-500 hover:-translate-y-1.5 hover:shadow-lift"
    >
      <CardCover
        gradient={post.gradient}
        icon={post.icon}
        image={post.image}
        className="h-48"
      />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-bold text-brand-700">
            {post.category}
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDate(post.date)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {post.readTime}
          </span>
        </div>
        <h3 className="mt-3 text-lg font-extrabold leading-snug tracking-tight text-slate-900 transition group-hover:text-brand-700">
          {post.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-3">
          {post.excerpt}
        </p>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-bold text-brand-600">
          Leer artículo
          <ArrowRight
            className="h-4 w-4 transition group-hover:translate-x-1.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}
