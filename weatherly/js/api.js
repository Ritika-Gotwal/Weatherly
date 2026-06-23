/* =========================================================
   api.js — all Open-Meteo fetch functions
   No API key required. All endpoints are completely free.
   ========================================================= */

const API = {
  geocoding:  'https://geocoding-api.open-meteo.com/v1/search',
  weather:    'https://api.open-meteo.com/v1/forecast',
  airQuality: 'https://air-quality-api.open-meteo.com/v1/air-quality',
};

/**
 * Search cities by name using the Open-Meteo Geocoding API.
 * Returns an array of location result objects.
 */
async function searchCities(query) {
  if (!query || query.trim().length < 2) return [];

  const params = new URLSearchParams({
    name:     query.trim(),
    count:    '5',
    language: 'en',
    format:   'json',
  });

  const res = await fetch(`${API.geocoding}?${params}`);
  if (!res.ok) throw new Error(`Geocoding error: ${res.status}`);

  const data = await res.json();
  return data.results ?? [];
}

/**
 * Fetch full weather forecast for a lat/lon coordinate.
 * Returns raw Open-Meteo forecast response object.
 */
async function fetchWeather(lat, lon, timezone = 'auto') {
  const params = new URLSearchParams({
    latitude:   lat,
    longitude:  lon,
    timezone,
    forecast_days: '7',
    wind_speed_unit: 'kmh',

    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'weather_code',
      'wind_speed_10m',
      'wind_gusts_10m',
      'surface_pressure',
      'visibility',
      'uv_index',
      'is_day',
      'dew_point_2m',
    ].join(','),

    hourly: [
      'temperature_2m',
      'weather_code',
      'precipitation_probability',
    ].join(','),

    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'sunrise',
      'sunset',
      'uv_index_max',
      'cloud_cover_mean',
    ].join(','),
  });

  const res = await fetch(`${API.weather}?${params}`);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);

  return res.json();
}

/**
 * Fetch current US AQI for a lat/lon coordinate.
 * Returns the numeric AQI value, or null on failure.
 */
async function fetchAirQuality(lat, lon) {
  const params = new URLSearchParams({
    latitude:  lat,
    longitude: lon,
    current:   'us_aqi',
    timezone:  'auto',
  });

  try {
    const res = await fetch(`${API.airQuality}?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.current?.us_aqi ?? null;
  } catch {
    /* Air quality is supplementary — silently fail, don't block weather render */
    return null;
  }
}
