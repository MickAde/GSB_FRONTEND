'use client';
import { useRouter } from 'next/navigation';
import { useSchoolStore } from '@/stores/schoolStore';
import type { SchoolPublic } from '@/types';

const GRADIENT_COLORS = [
  'from-emerald-500 to-teal-600',
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-violet-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-sky-600',
  'from-lime-500 to-green-600',
  'from-fuchsia-500 to-purple-600',
];

function getInitials(name: string) {
  return name
    .split(' ')
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || name.slice(0, 2).toUpperCase();
}

interface Props { school: SchoolPublic; index?: number; onSelect?: (school: SchoolPublic) => void; }

export function SchoolCard({ school, index = 0, onSelect }: Props) {
  const router            = useRouter();
  const setSelectedSchool = useSchoolStore((s) => s.setSelectedSchool);

  const handleClick = () => {
    sessionStorage.setItem('gsb_selected_school_id',   school.id);
    sessionStorage.setItem('gsb_selected_school_name', school.name);
    setSelectedSchool(school);
    if (onSelect) onSelect(school);
    else router.push('/login');
  };

  const gradient = GRADIENT_COLORS[index % GRADIENT_COLORS.length];

  return (
    <button
      onClick={handleClick}
      className="group flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-center"
    >
      <div
        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform overflow-hidden`}
      >
        {school.logo_url ? (
          <img
            src={school.logo_url}
            alt={school.name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <span className="text-white font-bold text-lg">{getInitials(school.name)}</span>
        )}
      </div>
      <span className="text-xs font-semibold text-foreground leading-tight line-clamp-2">{school.name}</span>
    </button>
  );
}
