import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  description?: string;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
}

export function StatsCard({
  label,
  value,
  icon: Icon,
  iconBgColor,
  iconColor,
  description,
  trend,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-slate-500">{label}</span>
        <div className={`p-3 rounded-full ${iconBgColor} ${iconColor} transition-transform duration-300 hover:scale-110`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold tracking-tight text-slate-800">{value}</span>
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
              trend.isPositive
                ? "bg-success-light text-success-dark"
                : "bg-danger-light text-danger-dark"
            }`}
          >
            {trend.value} {trend.isPositive ? "↗" : "↘"}
          </span>
        )}
      </div>

      {description && (
        <p className="text-xs text-slate-400 mt-2 font-medium">{description}</p>
      )}
    </div>
  );
}
