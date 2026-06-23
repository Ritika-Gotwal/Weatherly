/* =========================================================
   forecast.js — WMO weather code mapping + data transforms
   ========================================================= */

/**
 * WMO Weather Interpretation Codes (WW) mapped to
 * human-readable labels and icon filenames.
 * Reference: https://open-meteo.com/en/docs (WMO code table)
 */
const WMO_CODES = {
  0:  { label: 'Clear Sky',         icon: 'clear-day' },
  1:  { label: 'Mostly Clear',      icon: 'clear-day' },
  2:  { label: 'Partly Cloudy',     icon: 'partly-cloudy-day' },
  3:  { label: 'Overcast',          icon: 'cloudy' },
  45: { label: 'Foggy',             icon: 'fog' },
  48: { label: 'Icy Fog',           icon: 'fog' },
  51: { label: 'Light Drizzle',     icon: 'drizzle' },
  53: { label: 'Drizzle',           icon: 'drizzle' },
  55: { label: 'Heavy Drizzle',     icon: 'drizzle' },
  56: { label: 'Freezing Drizzle',  icon: 'drizzle' },
  57: { label: 'Heavy Freezing Drizzle', icon: 'drizzle' },
  61: { label: 'Light Rain',        icon: 'rain' },
  63: { label: 'Rain',              icon: 'rain' },
  65: { label: 'Heavy Rain',        icon: 'rain' },
  66: { label: 'Freezing Rain',     icon: 'rain' },
  67: { label: 'Heavy Freezing Rain', icon: 'rain' },
  71: { label: 'Light Snow',        icon: 'snow' },
  73: { label: 'Snow',              icon: 'snow' },
  75: { label: 'Heavy Snow',        icon: 'snow' },
  77: { label: 'Snow Grains',       icon: 'snow' },
  80: { label: 'Light Showers',     icon: 'rain' },
  81: { label: 'Showers',           icon: 'rain' },
  82: { label: 'Heavy Showers',     icon: 'rain' },
  85: { label: 'Snow Showers',      icon: 'snow' },
  86: { label: 'Heavy Snow Showers',icon: 'snow' },
  95: { label: 'Thunderstorm',      icon: 'thunderstorm' },
  96: { label: 'Thunderstorm w/ Hail', icon: 'thunderstorm' },
  99: { label: 'Thunderstorm w/ Heavy Hail', icon: 'thunderstorm' },
};

/**
 * Resolve WMO code to label and icon path.
 * Uses day/night variant when isDay is provided.
 */
function getWeatherMeta(code, isDay = true) {
  const meta = WMO_CODES[code] ?? { label: 'Unknown', icon: 'cloudy' };
  let icon = meta.icon;

  // Night variants for clear/partly-cloudy
  if (!isDay) {
    if (icon === 'clear-day')       icon = 'clear-night';
    if (icon === 'partly-cloudy-day') icon = 'partly-cloudy-night';
  }

  return {
    label: meta.label,
    icon,
    iconPath: `assets/icons/${icon}.svg`,
  };
}

/**
 * UV Index numeric → descriptive label
 */
function getUVLabel(uv) {
  if (uv <= 2)  return 'Low';
  if (uv <= 5)  return 'Moderate';
  if (uv <= 7)  return 'High';
  if (uv <= 10) return 'Very High';
  return 'Extreme';
}

/**
 * AQI value → category label + description + CSS colour variable name
 */
function getAQIMeta(aqi) {
  if (aqi <= 50)  return {
    category: 'Good',
    description: 'Air quality is satisfactory and poses little or no risk.',
    color: 'var(--color-accent-green)',
  };
  if (aqi <= 100) return {
    category: 'Moderate',
    description: 'Air quality is acceptable; some pollutants may affect sensitive groups.',
    color: 'var(--color-accent-yellow)',
  };
  if (aqi <= 150) return {
    category: 'Unhealthy for Sensitive Groups',
    description: 'Sensitive groups may experience health effects.',
    color: 'var(--color-accent-orange)',
  };
  if (aqi <= 200) return {
    category: 'Unhealthy',
    description: 'Everyone may begin to experience health effects.',
    color: 'var(--color-accent-red)',
  };
  if (aqi <= 300) return {
    category: 'Very Unhealthy',
    description: 'Health alert — everyone may experience serious health effects.',
    color: '#9c27b0',   /* purple — standard AQI 201-300 */
  };
  return {
    category: 'Hazardous',
    description: 'Health warnings of emergency conditions. Entire population likely affected.',
    color: '#7e0023',   /* maroon — standard AQI 301+ */
  };
}

/**
 * Transform raw Open-Meteo /forecast response into structured UI data.
 * Returns { current, highlights, hourly, daily, sun }
 */
function transformWeatherData(raw, cityName, countryName, timezone) {
  const c = raw.current;
  const h = raw.hourly;
  const d = raw.daily;

  /* --- Current --- */
  const weatherMeta = getWeatherMeta(c.weather_code, c.is_day === 1);

  const current = {
    city:        cityName,
    country:     countryName,
    datetime:    formatDatetime(c.time, timezone),
    temp:        Math.round(c.temperature_2m),
    condition:   weatherMeta.label,
    iconPath:    weatherMeta.iconPath,
    high:        Math.round(d.temperature_2m_max[0]),
    low:         Math.round(d.temperature_2m_min[0]),
  };

  /* --- Highlights --- */
  const highlights = {
    feelsLike:  Math.round(c.apparent_temperature),
    humidity:   c.relative_humidity_2m,
    wind:       Math.round(c.wind_speed_10m),
    uvIndex:    Math.round(c.uv_index),
    uvLabel:    getUVLabel(c.uv_index),
    visibility: Math.round((c.visibility ?? 10000) / 1000),   // metres → km
    pressure:   Math.round(c.surface_pressure),
  };

  /* --- Hourly (next 24 hours from current hour) --- */
  const nowHour  = new Date(c.time).getHours();
  const nowIndex = h.time.findIndex(t => new Date(t).getHours() === nowHour);
  const start    = nowIndex >= 0 ? nowIndex : 0;

  const hourly = h.time.slice(start, start + 24).map((time, i) => {
    const idx  = start + i;
    const date = new Date(time);
    return {
      time:     formatHour(date),
      temp:     Math.round(h.temperature_2m[idx]),
      iconPath: getWeatherMeta(h.weather_code[idx], isHourDaytime(date)).iconPath,
      isCurrent: i === 0,
    };
  });

  /* --- Daily (7 days) --- */
  const dayNamesLong  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const dayNamesShort = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const today    = new Date(d.time[0]).getDay();

  const daily = d.time.map((time, i) => {
    const dayIdx = new Date(time).getDay();
    const label      = i === 0 ? 'Today' : dayNamesLong[dayIdx];
    const labelShort = i === 0 ? 'Today' : dayNamesShort[dayIdx];
    /* For today (i===0) use the live current-hour code so it matches the hero */
    const meta  = i === 0
      ? getWeatherMeta(c.weather_code, c.is_day === 1)
      : getWeatherMeta(d.weather_code[i], true);
    return {
      label,
      labelShort,
      condition:  meta.label,
      iconPath:   meta.iconPath,
      high:       Math.round(d.temperature_2m_max[i]),
      low:        Math.round(d.temperature_2m_min[i]),
      rainChance: d.precipitation_probability_max[i] ?? 0,
    };
  });

  /* Normalise bar positions to the week's actual range so bars span a
     meaningful fraction of the track instead of clustering in one spot */
  const weekLow  = Math.min(...daily.map(day => day.low));
  const weekHigh = Math.max(...daily.map(day => day.high));
  const weekSpan = weekHigh - weekLow || 1;
  daily.forEach(day => {
    day.barOffset = ((day.low  - weekLow) / weekSpan) * 100;
    day.barWidth  = ((day.high - day.low)  / weekSpan) * 100;
  });

  /* --- Sunrise / Sunset --- */
  const sunriseStr = d.sunrise[0];
  const sunsetStr  = d.sunset[0];
  const sunrise    = new Date(sunriseStr);
  const sunset     = new Date(sunsetStr);
  const now        = new Date(c.time);

  const dayDuration = sunset - sunrise;
  const elapsed     = Math.max(0, Math.min(now - sunrise, dayDuration));
  const progress    = dayDuration > 0 ? elapsed / dayDuration : 0;

  const sun = {
    sunrise:  formatTime12h(sunrise),
    sunset:   formatTime12h(sunset),
    progress: Math.min(1, Math.max(0, progress)),
  };

  /* --- Details --- */
  const details = {
    dewPoint:   Math.round(c.dew_point_2m ?? 0),
    cloudCover: d.cloud_cover_mean ? Math.round(d.cloud_cover_mean[0]) : '—',
    windGust:   Math.round(c.wind_gusts_10m ?? 0),
    rainChance: d.precipitation_probability_max[0] ?? 0,
  };

  return { current, highlights, hourly, daily, sun, details };
}

/* =========================================================
   Date / time helpers
   ========================================================= */

function formatDatetime(isoString, timezone) {
  const date = new Date(isoString);
  const opts = {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  };
  try {
    const parts = new Intl.DateTimeFormat('en-US', { ...opts, timeZone: timezone }).formatToParts(date);
    const map   = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return `${map.weekday}, ${map.day} ${map.month} ${map.year} • ${map.hour}:${map.minute} ${map.dayPeriod}`;
  } catch {
    return date.toLocaleString('en-US', opts);
  }
}

function formatHour(date) {
  return date.toLocaleString('en-US', { hour: 'numeric', hour12: true });
}

function formatTime12h(date) {
  return date.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/* Treat 6 AM–8 PM as daytime for icon selection */
function isHourDaytime(date) {
  const h = date.getHours();
  return h >= 6 && h < 20;
}
