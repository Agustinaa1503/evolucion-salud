'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { createBrowserSupabaseClient } from '@/lib/auth/client';

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

/**
 * Selector y subida de foto de perfil. Sube a Storage (bucket `avatars`,
 * carpeta <user_id>/) y actualiza profiles.avatar_url con la URL pública.
 */
export default function AvatarPicker() {
  const { user, profile, refresh } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;
  const uid = user.id;

  async function uploadFile(file: File) {
    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError('Formato no válido. Use PNG, JPG, WebP o GIF.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('La imagen supera los 2 MB.');
      return;
    }
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setError('Storage no disponible en modo demo.');
      return;
    }

    setBusy(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
      const path = `${uid}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', uid);
      if (updateError) throw updateError;

      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo subir la imagen.');
    } finally {
      setBusy(false);
    }
  }

  async function removeAvatar() {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', uid);
      if (error) throw error;
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo quitar la foto.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-brand-100 ring-1 ring-slate-200">
        {profile?.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt="Foto de perfil"
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-2xl font-extrabold text-brand-700">
            {`${profile?.nombre?.[0] ?? ''}${profile?.apellido?.[0] ?? ''}`.toUpperCase() ||
              'ES'}
          </span>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="btn-secondary px-4 py-2 text-xs"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Camera className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Cambiar foto
          </button>
          {profile?.avatar_url ? (
            <button
              type="button"
              onClick={() => void removeAvatar()}
              disabled={busy}
              className="btn-outline px-4 py-2 text-xs text-red-600 hover:bg-red-50"
              aria-label="Quitar foto de perfil"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadFile(file);
            e.target.value = '';
          }}
        />
        {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
