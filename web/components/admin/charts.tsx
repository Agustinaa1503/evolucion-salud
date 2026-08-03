'use client';

/**
 * Gráficos livianos del BackOffice (SVG, sin dependencias). Reciben datos ya
 * agregados en el servidor. Pensados para mostrar tendencias actuales y dejar
 * la puerta abierta a métricas más ricas en la FASE 12.
 */

export type BarDatum = { label: string; value: number };

export function BarChart({
  data,
  height = 160,
  tone = 'brand',
}: {
  data: BarDatum[];
  height?: number;
  tone?: 'brand' | 'leaf' | 'clay' | 'sun';
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const colors: Record<string, string> = {
    brand: 'bg-brand-500 dark:bg-brand-400',
    leaf: 'bg-leaf-500 dark:bg-leaf-400',
    clay: 'bg-clay-500 dark:bg-clay-400',
    sun: 'bg-sun-400 dark:bg-sun-300',
  };

  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => {
          const h = Math.max(4, Math.round((d.value / max) * (height - 24)));
          return (
            <div key={`${d.label}-${i}`} className="group flex flex-1 flex-col items-center justify-end gap-1.5">
              <div
                className={`w-full max-w-[42px] rounded-t-md transition-all ${colors[tone]} group-hover:opacity-80`}
                style={{ height: h }}
                title={`${d.label}: ${d.value}`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5">
        {data.map((d, i) => (
          <div key={`${d.label}-${i}`} className="flex-1 truncate text-center text-[10px] text-slate-500 dark:text-slate-400" title={d.label}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DonutChart({
  segments,
  size = 132,
  label,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  label?: string;
}) {
  const total = Math.max(1, segments.reduce((acc, s) => acc + s.value, 0));
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="11"
          className="stroke-slate-100 dark:stroke-slate-800"
        />
        {segments.map((s) => {
          const fraction = s.value / total;
          const dash = fraction * circumference;
          const el = (
            <circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth="11"
              strokeLinecap="butt"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className="min-w-0">
        {label ? (
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">{label}</p>
        ) : null}
        <ul className="mt-2 space-y-1.5">
          {segments.map((s) => (
            <li key={s.label} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} aria-hidden="true" />
              <span className="truncate">{s.label}</span>
              <span className="ml-auto font-bold text-slate-800 dark:text-slate-100">{s.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
