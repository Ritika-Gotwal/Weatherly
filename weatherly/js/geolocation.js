/* =========================================================
   geolocation.js — navigator.geolocation wrapper
   ========================================================= */

/**
 * Get the user's current coordinates using the browser Geolocation API.
 * Returns a Promise that resolves to { lat, lon } or rejects with a
 * user-readable error message string.
 */
function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject('Location access was denied. Please enable it in your browser settings.');
            break;
          case error.POSITION_UNAVAILABLE:
            reject('Location information is currently unavailable.');
            break;
          case error.TIMEOUT:
            reject('Location request timed out. Please try again.');
            break;
          default:
            reject('An unknown error occurred while retrieving your location.');
        }
      },
      {
        timeout:            10000,
        maximumAge:         300000,   // cache position for 5 minutes
        enableHighAccuracy: false,
      }
    );
  });
}

/**
 * Reverse-geocode coordinates to a human-readable city name.
 * Primary: BigDataCloud (free, no API key, browser-friendly).
 * Fallback: Nominatim / OpenStreetMap (free, no API key).
 * Final fallback: raw coordinate string.
 */
async function reverseGeocode(lat, lon) {
  /* --- Primary: BigDataCloud reverse geocode client --- */
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const name    = data.city || data.locality || data.principalSubdivision || null;
      const country = data.countryName || data.countryCode || '';
      if (name) {
        return { name, country, timezone: 'auto' };
      }
    }
  } catch { /* fall through to next provider */ }

  /* --- Fallback: Nominatim (OpenStreetMap) --- */
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (res.ok) {
      const data = await res.json();
      const addr  = data.address || {};
      const name  = addr.city || addr.town || addr.village || addr.municipality || addr.county || null;
      const country = addr.country || '';
      if (name) {
        return { name, country, timezone: 'auto' };
      }
    }
  } catch { /* fall through to coordinate string */ }

  /* --- Final fallback: show coordinates --- */
  return {
    name:     `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
    country:  '',
    timezone: 'auto',
  };
}
