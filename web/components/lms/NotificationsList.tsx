'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { markNotificationRead } from '@/lib/lms/actions';
import type { MyNotification } from '@/lib/lms/actions';

type Props = {
  notifications: MyNotification[];
};

function formatRelative(date: string): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'recién';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} d`;
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(new Date(date));
}

/** Lista de notificaciones recientes con acción «marcar como leída». */
export default function NotificationsList({ notifications }: Props) {
  const [items, setItems] = useState(notifications);

  async function markRead(id: string) {
    const res = await markNotificationRead(id);
    if (res.ok) {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 text-sm text-slate-500">
        <Bell className="h-5 w-5 text-slate-300" aria-hidden="true" />
        Sin notificaciones por ahora.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((notification) => {
        const unread = !notification.readAt;
        const content = (
          <div className="flex flex-1 items-start gap-3">
            <span
              className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                unread ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-400'
              }`}
            >
              {notification.type === 'quiz' ? <Check className="h-4 w-4" aria-hidden="true" /> : <Bell className="h-4 w-4" aria-hidden="true" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${unread ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                {notification.title}
              </p>
              {notification.body ? (
                <p className="mt-0.5 text-sm text-slate-500">{notification.body}</p>
              ) : null}
              <p className="mt-1 text-xs text-slate-400">{formatRelative(notification.createdAt)}</p>
            </div>
          </div>
        );

        return (
          <li
            key={notification.id}
            className={`rounded-2xl border p-4 ${
              unread ? 'border-brand-200/80 bg-brand-50/50' : 'border-slate-200/80 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              {notification.link ? (
                <Link href={notification.link} className="flex min-w-0 flex-1 items-start gap-3">
                  {content}
                </Link>
              ) : (
                <div className="flex min-w-0 flex-1">{content}</div>
              )}
              {unread ? (
                <button
                  type="button"
                  onClick={() => void markRead(notification.id)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
                  aria-label={`Marcar como leída: ${notification.title}`}
                >
                  <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Leída
                </button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
