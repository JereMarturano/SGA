'use client';

import { useEffect, useState } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning } from 'lucide-react';

export default function WeatherWidget() {
    const [temp, setTemp] = useState<number | null>(null);
    const [weatherCode, setWeatherCode] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Coordenadas aproximadas de Molinari/Cosquín
        const lat = -31.2333;
        const lon = -64.4667;

        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=America%2FSao_Paulo`)
            .then(res => res.json())
            .then(data => {
                setTemp(data.current.temperature_2m);
                setWeatherCode(data.current.weather_code);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching weather", err);
                setLoading(false);
            });
    }, []);

    const getWeatherIcon = (code: number) => {
        if (code === 0 || code === 1) return <Sun className="text-yellow-500" size={40} />;
        if (code === 2 || code === 3) return <Cloud className="text-slate-400" size={40} />;
        if (code >= 51 && code <= 67) return <CloudRain className="text-blue-400" size={40} />;
        if (code >= 71 && code <= 77) return <CloudSnow className="text-blue-200" size={40} />;
        if (code >= 95) return <CloudLightning className="text-purple-500" size={40} />;
        return <Sun className="text-yellow-500" size={40} />;
    };

    if (loading) return <div className="animate-pulse h-12 w-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>;

    return (
        <div className="inline-flex items-center gap-4 bg-blue-50 dark:bg-slate-700/50 px-6 py-3 rounded-2xl border border-blue-100 dark:border-slate-600">
            {weatherCode !== null && getWeatherIcon(weatherCode)}
            <span className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
                {temp}°
            </span>
        </div>
    );
}
