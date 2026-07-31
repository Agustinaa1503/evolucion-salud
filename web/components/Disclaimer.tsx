import { ShieldCheck } from 'lucide-react';
import { site } from '@/lib/data/site';

export default function Disclaimer({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900 ${className}`}
    >
      <ShieldCheck
        className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
        aria-hidden="true"
      />
      <p>{site.disclaimer}</p>
    </div>
  );
}
