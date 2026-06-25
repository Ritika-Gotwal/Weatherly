/* =========================================================
   app.js — init, state management, event wiring, orchestration
   ========================================================= */

/* Simple app-wide state */
const state = {
  city:       null,
  weather:    null,
  airQuality: null,
  loading:    false,
};

/* Public API exposed to other modules (search.js, geolocation.js) */
window.app = {
  loadWeather,
  loadByQuery,
};

/* =========================================================
   Splash screen — enforce a minimum visible duration then fade out
   ========================================================= */
function hideSplash() {
  const MIN_MS = 1700;
  const elapsed = Date.now() - (window._splashStart || Date.now());
  const wait = Math.max(0, MIN_MS - elapsed);

  setTimeout(() => {
    const el = document.getElementById('splashScreen');
    if (!el) return;
    el.classList.add('splash-hidden');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
  }, wait);
}

/* =========================================================
   Init
   ========================================================= */
function init() {
  hideSplash();

  initSearch();
  initErrorClose();
  initLocationButton();
  initEmptyStateActions();
  initMobileNav();
  initHeroFavBtn();
  initHourlyDragScroll();
  initHourlyWheelScroll();

  /* Try to load last searched city from sessionStorage */
  const cached = sessionStorage.getItem('weatherly_last');
  if (cached) {
    try {
      const { lat, lon, timezone, city, country } = JSON.parse(cached);
      loadWeather(lat, lon, timezone, city, country);
      return;
    } catch { /* ignore corrupt cache */ }
  }

  /* Auto-detect location on first load */
  autoLoadLocation();
}

/* =========================================================
   Auto-load location on first open (no cache, no interaction required)
   ========================================================= */
async function autoLoadLocation() {
  if (!navigator.geolocation) {
    showEmpty();
    return;
  }

  showSkeleton();

  try {
    const { lat, lon } = await getCurrentPosition();
    const place = await reverseGeocode(lat, lon);
    await loadWeather(lat, lon, place.timezone, place.name, place.country);
    saveRecent({ name: place.name, country: place.country, admin1: null,
      latitude: lat, longitude: lon, timezone: place.timezone });
  } catch {
    showEmpty();
  }
}

/* =========================================================
   Empty state: location button + city chips
   ========================================================= */
function initEmptyStateActions() {
  /* "Use My Location" button inside the empty state */
  const emptyLocBtn = document.getElementById('emptyLocationBtn');
  if (emptyLocBtn) {
    emptyLocBtn.addEventListener('click', async () => {
      emptyLocBtn.disabled = true;
      emptyLocBtn.textContent = 'Locating…';
      try {
        const { lat, lon } = await getCurrentPosition();
        const place = await reverseGeocode(lat, lon);
        await loadWeather(lat, lon, place.timezone, place.name, place.country);
        saveRecent({ name: place.name, country: place.country, admin1: null,
          latitude: lat, longitude: lon, timezone: place.timezone });
      } catch (err) {
        showError(typeof err === 'string' ? err : 'Unable to retrieve your location.');
        emptyLocBtn.disabled = false;
        emptyLocBtn.innerHTML = `<img src="assets/icons/location-pin.svg" alt="" class="empty-location-icon" aria-hidden="true" /> Use My Location`;
      }
    });
  }

  /* Popular city chips */
  document.querySelectorAll('.empty-city-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const city = chip.dataset.city;
      if (city) loadByQuery(city);
    });
  });
}

/* =========================================================
   Location button
   ========================================================= */
function initLocationButton() {
  document.getElementById('locationBtn').addEventListener('click', async () => {
    setLocationBtnLoading(true);
    try {
      const { lat, lon } = await getCurrentPosition();
      /* Reverse-geocode for display name */
      const place = await reverseGeocode(lat, lon);
      await loadWeather(lat, lon, place.timezone, place.name, place.country);
      saveRecent({ name: place.name, country: place.country, admin1: null,
        latitude: lat, longitude: lon, timezone: place.timezone });
    } catch (err) {
      showError(typeof err === 'string' ? err : 'Unable to retrieve your location.');
    } finally {
      setLocationBtnLoading(false);
    }
  });
}

/* =========================================================
   Nav tab switching — shared between mobile bottom nav and desktop header nav
   ========================================================= */
function initMobileNav() {
  /* Single handler covers both .mobile-nav-item and .header-nav-item */
  document.querySelectorAll('.mobile-nav-item, .header-nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      playNavClick();
      const tab = btn.dataset.tab;
      /* Sync active state across ALL nav items (mobile + desktop) */
      document.querySelectorAll('.mobile-nav-item, .header-nav-item').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tab);
        b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false');
      });
      switchTab(tab);
    });
  });

  /* Back buttons inside tab views → navigate to home */
  document.querySelectorAll('.tab-back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playBack();
      document.querySelector('[data-tab="home"]')?.click();
    });
  });

  /* Logo (desktop) + mobile title → navigate to home and scroll to top */
  document.querySelectorAll('.logo, .header-title-mobile').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelector('[data-tab="home"]')?.click();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  /* Save to favorites button */
  const saveBtn = document.getElementById('favSaveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (!state.city) return;
      const favs = getFavorites();
      const key = `${state.city.name}||${state.city.country}`;
      if (!favs.find(f => f.key === key)) {
        favs.push({ key, name: state.city.name, country: state.city.country,
          lat: state.city.lat, lon: state.city.lon, timezone: state.city.timezone });
        localStorage.setItem('weatherly_favs', JSON.stringify(favs));
      }
      renderFavoritesList();
    });
  }

}

function switchTab(tab) {
  const weatherContent = document.getElementById('weatherContent');
  const skeletonContent = document.getElementById('skeletonContent');
  const emptyState     = document.getElementById('emptyState');
  const mapView        = document.getElementById('mapView');
  const favoritesView  = document.getElementById('favoritesView');

  /* Hide all non-home views */
  [mapView, favoritesView].forEach(v => { if (v) v.hidden = true; });

  if (tab === 'home') {
    if (state.weather) showWeather();
    else if (document.getElementById('skeletonContent') && !skeletonContent.hidden) { /* keep skeleton */ }
    else showEmpty();

  } else {
    /* Hide all weather content */
    if (weatherContent) weatherContent.hidden = true;
    if (skeletonContent) skeletonContent.hidden = true;
    if (emptyState) emptyState.hidden = true;

    if (tab === 'map') {
      if (mapView) {
        mapView.hidden = false;
        updateMapView();
      }
    } else if (tab === 'favorites') {
      if (favoritesView) {
        favoritesView.hidden = false;
        renderFavoritesList();
        /* Show save button only if a city is loaded AND not already saved */
        const saveBtn = document.getElementById('favSaveBtn');
        if (saveBtn) {
          const key = state.city ? `${state.city.name}||${state.city.country}` : null;
          const alreadySaved = key && getFavorites().some(f => f.key === key);
          saveBtn.hidden = !state.city || alreadySaved;
        }
        const cityNameEl = document.getElementById('favSaveCityName');
        if (cityNameEl && state.city) cityNameEl.textContent = state.city.name;
      }
    }
  }
}

function getFavorites() {
  try { return JSON.parse(localStorage.getItem('weatherly_favs') || '[]'); }
  catch { return []; }
}

function renderFavoritesList() {
  const container = document.getElementById('favoritesList');
  if (!container) return;
  const favs = getFavorites();
  if (!favs.length) {
    container.innerHTML = `
      <div class="favorites-empty-state">
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="favorites-empty-icon">
          <path d="M32 54L10 34C5 29 5 21 10 16C15 11 23 11 28 16L32 20L36 16C41 11 49 11 54 16C59 21 59 29 54 34L32 54Z" stroke="#90caf9" stroke-width="2.5" fill="none"/>
        </svg>
        <p>No favorites yet. Search for a city and tap the heart to save it.</p>
      </div>`;
    return;
  }
  container.innerHTML = favs.map((f, i) => `
    <div class="fav-item" data-index="${i}">
      <div>
        <div class="fav-item-city">${f.name}</div>
        <div class="fav-item-country">${f.country}</div>
      </div>
      <button class="fav-item-remove" data-index="${i}" aria-label="Remove ${f.name}">×</button>
    </div>
  `).join('');

  container.querySelectorAll('.fav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.fav-item-remove')) return;
      const i = parseInt(item.dataset.index);
      const f = getFavorites()[i];
      if (f) {
        /* Switch to home and load weather */
        document.querySelector('[data-tab="home"]')?.click();
        loadWeather(f.lat, f.lon, f.timezone, f.name, f.country);
      }
    });
  });

  container.querySelectorAll('.fav-item-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const i = parseInt(btn.dataset.index);
      const favs = getFavorites();
      favs.splice(i, 1);
      localStorage.setItem('weatherly_favs', JSON.stringify(favs));
      renderFavoritesList();
    });
  });
}

function updateMapView() {
  const label = document.getElementById('mapCityLabel');
  const link  = document.getElementById('mapOpenBtn');
  if (!state.city) return;
  if (label) label.textContent = `${state.city.name}, ${state.city.country}`;
  if (link) {
    const { lat, lon, name } = state.city;
    link.href = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=12/${lat}/${lon}`;
    link.textContent = `Open ${name} in Maps`;
  }
}

/* =========================================================
   Hero favorite heart button
   ========================================================= */
function initHeroFavBtn() {
  const btn = document.getElementById('heroFavBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (!state.city) return;
    const favs = getFavorites();
    const key = `${state.city.name}||${state.city.country}`;
    const idx = favs.findIndex(f => f.key === key);
    if (idx === -1) {
      playFavAdd();
      favs.push({ key, name: state.city.name, country: state.city.country,
        lat: state.city.lat, lon: state.city.lon, timezone: state.city.timezone });
    } else {
      playFavRemove();
      favs.splice(idx, 1);
    }
    localStorage.setItem('weatherly_favs', JSON.stringify(favs));
    updateHeroFavBtn();
  });
}

function updateHeroFavBtn() {
  const btn = document.getElementById('heroFavBtn');
  if (!btn || !state.city) return;
  const key = `${state.city.name}||${state.city.country}`;
  const saved = getFavorites().some(f => f.key === key);
  btn.classList.toggle('is-saved', saved);
  btn.setAttribute('aria-label', saved ? 'Remove from favorites' : 'Add to favorites');
}

/* =========================================================
   Load weather by raw text query (fallback when no autocomplete selection)
   ========================================================= */
async function loadByQuery(query) {
  showSkeleton();
  try {
    const results = await searchCities(query);
    if (!results.length) {
      showEmpty();
      showError(`No results found for "${query}". Try a different city name.`);
      return;
    }
    const city = results[0];
    saveRecent(city);
    await loadWeather(city.latitude, city.longitude, city.timezone ?? 'auto', city.name, city.country);
  } catch (err) {
    showEmpty();
    showError(getErrorMessage(err));
  }
}

/* =========================================================
   Core: load weather for a coordinate
   ========================================================= */
async function loadWeather(lat, lon, timezone, cityName, countryName) {
  if (state.loading) return;
  state.loading = true;

  showSkeleton();

  try {
    /* Fetch weather and air quality in parallel */
    const [rawWeather, rawAQI] = await Promise.all([
      fetchWeather(lat, lon, timezone),
      fetchAirQuality(lat, lon),
    ]);

    /* Transform raw API data into UI-ready structures */
    const data = transformWeatherData(rawWeather, cityName, countryName, timezone);

    /* Cache for session refresh */
    sessionStorage.setItem('weatherly_last', JSON.stringify({
      lat, lon, timezone, city: cityName, country: countryName
    }));

    /* Render all sections */
    renderHero(data.current);
    renderHighlights(data.highlights);
    renderHourly(data.hourly);
    renderDaily(data.daily);
    renderAirQuality(rawAQI);
    renderSunriseSunset(data.sun);
    renderDetails(data.details);

    /* Update state */
    state.weather    = data;
    state.airQuality = rawAQI;
    state.city = { name: cityName, country: countryName, lat, lon, timezone };

    /* Show and sync the hero heart button */
    const heroFavBtn = document.getElementById('heroFavBtn');
    if (heroFavBtn) heroFavBtn.hidden = false;
    updateHeroFavBtn();

    showWeather();

  } catch (err) {
    showEmpty();
    showError(getErrorMessage(err));
  } finally {
    state.loading = false;
  }
}

/* =========================================================
   Error message formatter
   ========================================================= */
function getErrorMessage(err) {
  if (!navigator.onLine) {
    return 'You appear to be offline. Please check your connection and try again.';
  }
  if (err instanceof TypeError && err.message.includes('fetch')) {
    return 'Unable to reach the weather service. Please try again.';
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Something went wrong. Please try again.';
}

/* =========================================================
   Start
   ========================================================= */
document.addEventListener('DOMContentLoaded', init);
