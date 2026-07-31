'use client';

import { useTransition } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function SignOutButton() {
  const { signOut } = useAuth();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => void signOut())}
      disabled={pending}
      className="btn-outline w-full text-red-600 hover:bg-red-50"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      {pending ? 'Cerrando sesión…' : 'Cerrar sesión'}
    </button>
  );
}
