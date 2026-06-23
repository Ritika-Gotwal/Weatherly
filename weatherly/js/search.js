/* =========================================================
   search.js — search input, autocomplete, clear button, recent searches
   Both desktop and mobile run as independent instances via initSearchInstance.
   ========================================================= */

const RECENTS_KEY = 'weatherly_recents';
const MAX_RECENTS = 5;

/* ---- Recent searches (shared localStorage) ---- */
function getRecents() {
  try { return JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]'); }
  catch { return []; }
}

function saveRecent(city) {
  const recents = getRecents().filter(
    r => !(r.name === city.name && r.country === city.country)
  );
  recents.unshift({
    name:      city.name,
    country:   city.country,
    admin1:    city.admin1   ?? null,
    latitude:  city.latitude,
    longitude: city.longitude,
    timezone:  city.timezone ?? 'auto',
  });
  localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.slice(0, MAX_RECENTS)));
}

/* =========================================================
   Init — wire up both search bars
   ========================================================= */
function initSearch() {
  initSearchInstance({
    formId:     'searchForm',
    inputId:    'searchInput',
    listId:     'autocompleteList',
    clearBtnId: 'searchClearBtn',
    outerSel:   '.search-wrapper',
  });

  initSearchInstance({
    formId:     'mobileSearchForm',
    inputId:    'mobileSearchInput',
    listId:     'mobileAutocompleteList',
    clearBtnId: 'mobileSearchClearBtn',
    outerSel:   '.mobile-search-inner',
  });
}

/* =========================================================
   Single search-bar instance (closure keeps state isolated)
   ========================================================= */
function initSearchInstance({ formId, inputId, listId, clearBtnId, outerSel }) {
  const form     = document.getElementById(formId);
  const input    = document.getElementById(inputId);
  const list     = document.getElementById(listId);
  const clearBtn = document.getElementById(clearBtnId);

  if (!form || !input || !list) return;

  let debounceTimer  = null;
  let currentResults = [];
  let activeIndex    = -1;

  /* ---------- dropdown helpers ---------- */
  function closeDropdown() {
    list.hidden    = true;
    list.innerHTML = '';
    currentResults = [];
    activeIndex    = -1;
  }

  function showRecents() {
    const recents = getRecents();
    if (!recents.length) return;
    currentResults = recents;

    list.innerHTML = `
      <li class="autocomplete-header" role="presentation">
        <span>Recent Searches</span>
        <button class="recents-clear-all" aria-label="Clear all recent searches">Clear all</button>
      </li>
      ${recents.map((city, i) => {
        const region = [city.admin1, city.country].filter(Boolean).join(', ');
        return `
          <li class="autocomplete-item" role="option" aria-selected="false"
              data-index="${i}" tabindex="-1">
            <svg class="recent-icon" viewBox="0 0 24 24" fill="none"
                 width="14" height="14" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/>
              <path d="M12 7v5l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span class="autocomplete-city">${escapeHtml(city.name)}</span>
            <span class="autocomplete-region">${escapeHtml(region)}</span>
            <button class="recent-delete-btn" data-index="${i}"
                    aria-label="Remove ${escapeHtml(city.name)}" tabindex="-1">
              <svg viewBox="0 0 24 24" fill="none" width="11" height="11" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              </svg>
            </button>
          </li>`;
      }).join('')}
    `;

    /* Clear all */
    list.querySelector('.recents-clear-all').addEventListener('click', (e) => {
      e.stopPropagation();
      localStorage.removeItem(RECENTS_KEY);
      closeDropdown();
    });

    /* Individual delete — re-render after removal */
    list.querySelectorAll('.recent-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const updated = getRecents();
        updated.splice(parseInt(btn.dataset.index, 10), 1);
        localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
        if (updated.length) showRecents(); else closeDropdown();
      });
    });

    /* City row click — skip if delete was the target */
    list.querySelectorAll('.autocomplete-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.recent-delete-btn')) return;
        selectCity(recents[parseInt(item.dataset.index, 10)]);
      });
    });

    list.hidden = false;
  }

  function renderResults(results) {
    if (!results.length) { closeDropdown(); return; }
    currentResults = results;

    list.innerHTML = results.map((city, i) => {
      const region = [city.admin1, city.country].filter(Boolean).join(', ');
      return `
        <li class="autocomplete-item" role="option" aria-selected="false"
            data-index="${i}" tabindex="-1">
          <span class="autocomplete-city">${escapeHtml(city.name)}</span>
          <span class="autocomplete-region">${escapeHtml(region)}</span>
        </li>`;
    }).join('');

    bindItems(results);
    list.hidden = false;
  }

  function bindItems(source) {
    list.querySelectorAll('.autocomplete-item').forEach(item => {
      item.addEventListener('click', () => {
        selectCity(source[parseInt(item.dataset.index, 10)]);
      });
    });
  }

  function highlightItem(index) {
    list.querySelectorAll('.autocomplete-item').forEach((item, i) => {
      item.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });
  }

  function selectCity(city) {
    const displayName = city.admin1
      ? `${city.name}, ${city.admin1}, ${city.country}`
      : `${city.name}, ${city.country}`;

    input.value = displayName;
    if (clearBtn) clearBtn.hidden = false;
    closeDropdown();
    saveRecent(city);

    window.app.loadWeather(
      city.latitude,
      city.longitude,
      city.timezone ?? 'auto',
      city.name,
      city.country,
    );
  }

  /* ---------- event listeners ---------- */

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;
    closeDropdown();
    if (currentResults.length > 0) {
      selectCity(currentResults[activeIndex >= 0 ? activeIndex : 0]);
    } else {
      window.app.loadByQuery(query);
    }
  });

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const query = input.value.trim();
    activeIndex = -1;
    if (clearBtn) clearBtn.hidden = !input.value;

    if (query.length < 2) { closeDropdown(); return; }

    debounceTimer = setTimeout(async () => {
      try {
        renderResults(await searchCities(query));
      } catch {
        closeDropdown();
      }
    }, 300);
  });

  /* Show recent searches whenever the user focuses an empty bar */
  input.addEventListener('focus', () => {
    if (!input.value.trim()) showRecents();
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.hidden = true;
      input.focus();
      showRecents();
    });
  }

  input.addEventListener('keydown', (e) => {
    if (list.hidden) return;
    const items = list.querySelectorAll('.autocomplete-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
      highlightItem(activeIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      highlightItem(activeIndex);
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest(outerSel)) closeDropdown();
  });
}

/* ---- XSS guard ---- */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
