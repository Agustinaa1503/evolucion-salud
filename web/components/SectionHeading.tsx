import Reveal from './motion/Reveal';

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  light?: boolean;
  className?: string;
};

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  light = false,
  className = '',
}: Props) {
  return (
    <Reveal
      className={
        align === 'center'
          ? `mx-auto max-w-2xl text-center ${className}`
          : `max-w-2xl ${className}`
      }
    >
      {eyebrow ? (
        <p
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${
            light
              ? 'border-white/20 bg-white/10 text-leaf-100'
              : 'border-brand-200 bg-brand-50/80 text-brand-700'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              light ? 'bg-sun-400' : 'bg-brand-500'
            }`}
          />
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={`mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[2.6rem] ${
          light ? 'text-white' : 'text-slate-900'
        }`}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={`mt-5 text-base leading-relaxed sm:text-lg ${
            light ? 'text-leaf-50/85' : 'text-slate-600'
          }`}
        >
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}
