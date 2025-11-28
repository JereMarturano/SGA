import { LucideIcon } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
    color?: "blue" | "green" | "orange" | "red" | "purple";
}

const colorStyles = {
    blue: "from-blue-500 to-blue-600 shadow-blue-500/20",
    green: "from-emerald-500 to-emerald-600 shadow-emerald-500/20",
    orange: "from-orange-500 to-orange-600 shadow-orange-500/20",
    red: "from-rose-500 to-rose-600 shadow-rose-500/20",
    purple: "from-violet-500 to-violet-600 shadow-violet-500/20",
};

const iconStyles = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    red: "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
    purple: "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
};

export default function KPICard({ title, value, icon: Icon, trend, trendUp, color = "blue" }: KPICardProps) {
    return (
        <div className="group relative bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Background decoration */}
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colorStyles[color]} opacity-5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`} />

            <div className="relative flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                    <h3 className="text-3xl font-bold mt-2 text-gray-900 dark:text-white tracking-tight">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${iconStyles[color]} transition-colors`}>
                    <Icon size={24} />
                </div>
            </div>

            {trend && (
                <div className="mt-4 flex items-center text-sm font-medium">
                    <span className={`flex items-center ${trendUp ? "text-emerald-500" : "text-rose-500"}`}>
                        {trendUp ? "↑" : "↓"} {trend}
                    </span>
                    <span className="ml-2 text-gray-400 font-normal">vs mes anterior</span>
                </div>
            )}
        </div>
    );
}
