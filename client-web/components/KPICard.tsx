import { LucideIcon } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
    color?: string;
}

export default function KPICard({ title, value, icon: Icon, trend, trendUp, color = "blue" }: KPICardProps) {
    return (
        <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                    <h3 className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{value}</h3>
                </div>
                <div className={`p-3 rounded-lg bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400`}>
                    <Icon size={24} />
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center text-sm">
                    <span className={trendUp ? "text-green-500" : "text-red-500"}>
                        {trend}
                    </span>
                    <span className="ml-2 text-gray-400">vs mes anterior</span>
                </div>
            )}
        </div>
    );
}
