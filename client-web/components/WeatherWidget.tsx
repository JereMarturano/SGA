'use client';

import { useEffect, useState } from 'react';
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Droplets,
  Wind,
} from 'lucide-react';

export default function WeatherWidget() {
  const [temp, setTemp] = useState<number | null>(null);
  const [weatherCode, setWeatherCode] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null);
  const [windSpeed, setWindSpeed] = useState<number | null>(null);
  const [rainChance, setRainChance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Coordenadas aproximadas de Molinari/Cosquín
    const lat = -31.2333;
    const lon = -64.4667;

    // Fetch weather data
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=precipitation_probability_max&timezone=America%2FSao_Paulo`
    )
      .then((res) => res.json())
      .then((data) => {
        setTemp(data.current.temperature_2m);
        setWeatherCode(data.current.weather_code);
        setHumidity(data.current.relative_humidity_2m);
        setWindSpeed(data.current.wind_speed_10m);
        setRainChance(data.daily.precipitation_probability_max[0]);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching weather', err);
        setLoading(false);
      });
  }, []);

  const getWeatherIcon = (code: number) => {
    if (code === 0 || code === 1) return <Sun className="text-yellow-500" size={32} />;
    if (code === 2 || code === 3) return <Cloud className="text-slate-400" size={32} />;
    if (code >= 51 && code <= 67) return <CloudRain className="text-blue-400" size={32} />;
    if (code >= 71 && code <= 77) return <CloudSnow className="text-blue-200" size={32} />;
    if (code >= 95) return <CloudLightning className="text-purple-500" size={32} />;
    return <Sun className="text-yellow-500" size={32} />;
  };


  if (loading)
    return (
      <div className="animate-pulse h-24 w-full bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
    );

  return (
    <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col gap-4">
      {/* Main Weather Info */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm">
          {weatherCode !== null && getWeatherIcon(weatherCode)}
        </div>
        <div>
          <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter flex items-start">
            {temp}°
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 ml-1">
              C
            </span>
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Molinari, Cosquín
          </p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Droplets size={14} className="text-blue-500" />
            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">
              Humedad
            </p>
          </div>
          <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{humidity}%</p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <CloudRain size={14} className="text-indigo-500" />
            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
              Lluvia
            </p>
          </div>
          <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{rainChance}%</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Wind size={14} className="text-emerald-500" />
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
              Viento
            </p>
          </div>
          <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
            {windSpeed} <span className="text-xs">km/h</span>
          </p>
        </div>
      </div>
    </div>
  );
}
