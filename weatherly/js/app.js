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
  initHeroMenu();
  initHeroFavBtn();
  initHourlyDragScroll();
  initHourlyWheelScroll();

  /* Hide mobile search bar on all tabs */
  const mobileSearch = document.querySelector('.mobile-search-bar');
  if (mobileSearch) mobileSearch.hidden = true;

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
  /* Desktop header nav items */
  document.querySelectorAll('.header-nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      playNavClick();
      const tab = btn.dataset.tab;
      document.querySelectorAll('.header-nav-item, .hero-nav-option').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tab);
        if (b.getAttribute('aria-current') !== null) {
          b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false');
        }
      });
      switchTab(tab);
    });
  });

  /* Back buttons inside tab views → navigate to home */
  document.querySelectorAll('.tab-back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playBack();
      /* Sync hero menu active state to home */
      document.querySelectorAll('.hero-nav-option, .header-nav-item').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === 'home');
      });
      switchTab('home');
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
  const searchView     = document.getElementById('searchView');
  const favoritesView  = document.getElementById('favoritesView');

  /* Search bar hidden on all tabs — each view manages its own search */
  const mobileSearch = document.querySelector('.mobile-search-bar');
  if (mobileSearch) mobileSearch.hidden = true;

  /* Hide all non-home views */
  [searchView, favoritesView].forEach(v => { if (v) v.hidden = true; });

  if (tab === 'home') {
    if (state.weather) showWeather();
    else if (document.getElementById('skeletonContent') && !skeletonContent.hidden) { /* keep skeleton */ }
    else showEmpty();

  } else {
    /* Hide all weather content */
    if (weatherContent) weatherContent.hidden = true;
    if (skeletonContent) skeletonContent.hidden = true;
    if (emptyState) emptyState.hidden = true;

    if (tab === 'search') {
      if (searchView) {
        searchView.hidden = false;
        renderSearchTab();
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

function renderSearchTab() {
  /* Recents */
  const recentSection = document.getElementById('searchTabRecents');
  const recentList    = document.getElementById('searchTabRecentList');
  if (recentList) {
    const recents = getRecents();
    if (recents.length) {
      /* Header row + items live inside the dark glass list so text stays white */
      recentList.innerHTML = `
        <li class="search-tab-list-header">
          <span>Recent</span>
          <button class="search-tab-clear-all" id="searchTabClearAll">Clear all</button>
        </li>
        ${recents.map((r, i) => `
          <li class="search-tab-list-item" data-index="${i}">
            <div class="search-tab-list-text">
              <span class="search-tab-list-name">${r.name}</span>
              <span class="search-tab-list-sub">${r.country || ''}</span>
            </div>
            <button class="search-tab-recent-del" data-index="${i}" aria-label="Remove ${r.name}">✕</button>
          </li>
        `).join('')}
      `;
      if (recentSection) recentSection.hidden = false;

      /* City rows — load weather */
      recentList.querySelectorAll('.search-tab-list-item').forEach(item => {
        item.addEventListener('click', (e) => {
          if (e.target.closest('.search-tab-recent-del')) return;
          const r = recents[parseInt(item.dataset.index, 10)];
          if (r) {
            document.querySelector('[data-tab="home"]')?.click();
            loadWeather(r.latitude, r.longitude, r.timezone || 'auto', r.name, r.country);
          }
        });
      });

      /* Individual delete */
      recentList.querySelectorAll('.search-tab-recent-del').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.index, 10);
          const updated = getRecents().filter((_, i) => i !== idx);
          localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
          renderSearchTab();
        });
      });

      /* Clear all */
      const clearAllBtn = document.getElementById('searchTabClearAll');
      if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
          localStorage.removeItem(RECENTS_KEY);
          renderSearchTab();
        });
      }
    } else {
      if (recentSection) recentSection.hidden = true;
    }
  }

  /* Popular city chips */
  document.querySelectorAll('.search-tab-chip').forEach(chip => {
    chip.onclick = () => {
      document.querySelector('[data-tab="home"]')?.click();
      loadByQuery(chip.dataset.city);
    };
  });

  /* Search input — live results */
  const input       = document.getElementById('searchTabInput');
  const clearBtn    = document.getElementById('searchTabClear');
  const resultsList = document.getElementById('searchTabResults');
  if (!input || !resultsList) return;

  /* Reset input state */
  input.value = '';
  if (clearBtn) clearBtn.hidden = true;
  resultsList.hidden = true;
  resultsList.innerHTML = '';

  let searchTimer = null;

  input.oninput = () => {
    const q = input.value.trim();
    if (clearBtn) clearBtn.hidden = !q;
    clearTimeout(searchTimer);
    if (q.length < 2) { resultsList.hidden = true; return; }
    searchTimer = setTimeout(async () => {
      try {
        const results = await searchCities(q);
        if (!results.length) {
          resultsList.innerHTML = `<li class="search-tab-list-item search-tab-list-empty">No results found</li>`;
          resultsList.hidden = false;
          return;
        }
        const cities = results.slice(0, 6);
        resultsList.innerHTML = cities.map((r, i) => `
          <li class="search-tab-list-item" data-index="${i}">
            <div class="search-tab-list-text">
              <span class="search-tab-list-name">${r.name}</span>
              <span class="search-tab-list-sub">${[r.admin1, r.country].filter(Boolean).join(', ')}</span>
            </div>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
          </li>
        `).join('');
        resultsList.hidden = false;
        resultsList.querySelectorAll('.search-tab-list-item').forEach((item, i) => {
          item.addEventListener('click', () => {
            const r = cities[i];
            if (r) {
              saveRecent(r);
              document.querySelector('[data-tab="home"]')?.click();
              loadWeather(r.latitude, r.longitude, r.timezone || 'auto', r.name, r.country);
            }
          });
        });
      } catch { /* silent */ }
    }, 320);
  };

  if (clearBtn) {
    clearBtn.onclick = () => {
      input.value = '';
      clearBtn.hidden = true;
      resultsList.hidden = true;
      input.focus();
    };
  }

  /* Auto-focus when tab opens */
  setTimeout(() => input.focus(), 120);
}

/* =========================================================
   Hero three-dots nav menu (mobile)
   ========================================================= */
function initHeroMenu() {
  const btn  = document.getElementById('heroMenuBtn');
  const menu = document.getElementById('heroNavMenu');
  if (!btn || !menu) return;

  /* Toggle menu open/close */
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = !menu.hidden;
    menu.hidden = isOpen;
    btn.setAttribute('aria-expanded', String(!isOpen));

    if (!isOpen) {
      /* Position menu below the button */
      const rect = btn.getBoundingClientRect();
      menu.style.top  = `${rect.bottom + 8}px`;
      menu.style.right = `${window.innerWidth - rect.right}px`;
      menu.style.left  = 'auto';
    }
  });

  /* Close when clicking outside */
  document.addEventListener('click', () => {
    if (!menu.hidden) {
      menu.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  menu.addEventListener('click', (e) => e.stopPropagation());

  /* Wire each option */
  menu.querySelectorAll('.hero-nav-option').forEach(opt => {
    opt.addEventListener('click', () => {
      menu.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      const tab = opt.dataset.tab;

      /* Sync active state on all menu options + header nav items */
      document.querySelectorAll('.hero-nav-option, .header-nav-item').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tab);
        if (b.getAttribute('aria-current') !== null) {
          b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false');
        }
      });

      switchTab(tab);
    });
  });
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
