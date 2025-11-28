'use client';

import { useEffect, useState } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind } from 'lucide-react';

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
        if (code === 0 || code === 1) return <Sun className="text-yellow-500" size={28} />;
        if (code === 2 || code === 3) return <Cloud className="text-gray-400" size={28} />;
        if (code >= 51 && code <= 67) return <CloudRain className="text-blue-400" size={28} />;
        if (code >= 71 && code <= 77) return <CloudSnow className="text-blue-200" size={28} />;
        if (code >= 95) return <CloudLightning className="text-purple-500" size={28} />;
        return <Sun className="text-yellow-500" size={28} />;
    };

    if (loading) return <div className="animate-pulse h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>;

    return (
        <div className="flex items-center gap-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/20 shadow-sm">
            {weatherCode !== null && getWeatherIcon(weatherCode)}
            <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Molinari</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {temp}°C
                </p>
            </div>
        </div>
    );
}
