import Image from 'next/image';
import Icon from './Icon';

type Props = {
  gradient: string;
  icon: string;
  image?: string;
  className?: string;
};

export default function CardCover({
  gradient,
  icon,
  image,
  className = '',
}: Props) {
  return (
    <div
      className={`group/cover relative flex items-end justify-start overflow-hidden ${className}`}
    >
      {image ? (
        <Image
          src={image}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-700 group-hover/cover:scale-110"
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="bg-dots absolute inset-0 opacity-30" />

      <span className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/30 bg-white/15 text-white shadow-glass backdrop-blur-md transition duration-300 group-hover/cover:-translate-y-1 group-hover/cover:scale-110">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <span className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-white/20 blur-2xl transition duration-700 group-hover/cover:scale-150" />
    </div>
  );
}
