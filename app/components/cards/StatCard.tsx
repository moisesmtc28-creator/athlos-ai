interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-lg">
      <div className="text-2xl">{icon}</div>

      <p className="mt-3 text-sm text-zinc-400">{title}</p>

      <h3 className="mt-1 text-3xl font-bold text-white">
        {value}
      </h3>

      {subtitle && (
        <p className="mt-1 text-sm text-zinc-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}