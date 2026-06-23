/* =========================================================
   ui.js — all DOM render functions
   ========================================================= */

/* ---- Visibility helpers ---- */
function showElement(el)  { el.hidden = false; }
function hideElement(el)  { el.hidden = true;  }

function showSkeleton() {
  hideElement(document.getElementById('emptyState'));
  hideElement(document.getElementById('weatherContent'));
  showElement(document.getElementById('skeletonContent'));
}

function showWeather() {
  hideElement(document.getElementById('skeletonContent'));
  hideElement(document.getElementById('emptyState'));
  showElement(document.getElementById('weatherContent'));
}

function showEmpty() {
  hideElement(document.getElementById('skeletonContent'));
  hideElement(document.getElementById('weatherContent'));
  showElement(document.getElementById('emptyState'));
}

/* ---- Error toast ---- */
function showError(message) {
  const toast = document.getElementById('errorToast');
  document.getElementById('errorMessage').textContent = message;
  showElement(toast);

  /* Auto-dismiss after 6 seconds */
  clearTimeout(showError._timer);
  showError._timer = setTimeout(() => hideElement(toast), 6000);
}

function initErrorClose() {
  document.getElementById('errorClose').addEventListener('click', () => {
    hideElement(document.getElementById('errorToast'));
  });
}

/* =========================================================
   HERO
   ========================================================= */
function renderHero(current) {
  document.getElementById('heroCity').textContent      = current.country ? `${current.city}, ${current.country}` : current.city;
  document.getElementById('heroDatetime').textContent  = current.datetime;
  document.getElementById('heroTemp').textContent      = current.temp;
  document.getElementById('heroCondition').textContent = current.condition;
  document.getElementById('heroHigh').textContent = `↑ ${current.high}°`;
  document.getElementById('heroLow').textContent  = `↓ ${current.low}°`;

  const iconEl = document.getElementById('heroWeatherIcon');
  iconEl.src = current.iconPath;
  iconEl.alt = current.condition;

  applyHeroBg(current.iconPath);
}

/* Apply a dynamic sky gradient to the hero based on weather icon */
function applyHeroBg(iconPath) {
  const heroBg = document.getElementById('heroBg');
  const icon   = iconPath.replace('assets/icons/', '').replace('.svg', '');

  // Strip any previous condition class
  [...heroBg.classList]
    .filter(c => c.startsWith('hero-bg--'))
    .forEach(c => heroBg.classList.remove(c));

  heroBg.classList.add(`hero-bg--${icon}`);
}

/* =========================================================
   HIGHLIGHTS
   ========================================================= */
function renderHighlights(h) {
  document.getElementById('hlFeelsLikeVal').textContent  = `${h.feelsLike}°C`;
  document.getElementById('hlHumidityVal').textContent   = `${h.humidity}%`;
  document.getElementById('hlWindVal').textContent       = h.wind;
  document.getElementById('hlUVVal').textContent         = h.uvIndex;
  document.getElementById('hlUVLabel').textContent       = h.uvLabel;
  document.getElementById('hlVisibilityVal').textContent = h.visibility;
  document.getElementById('hlPressureVal').textContent   = h.pressure;
}

/* =========================================================
   HOURLY FORECAST
   ========================================================= */
function renderHourly(hourlyArray) {
  const list = document.getElementById('hourlyList');
  list.innerHTML = hourlyArray.map((slot) => `
    <li class="hour-card${slot.isCurrent ? ' current' : ''}">
      <span class="hour-time">${slot.time}</span>
      <img class="hour-icon" src="${slot.iconPath}" alt="${slot.condition ?? ''}" loading="lazy" />
      <span class="hour-temp">${slot.temp}°</span>
    </li>
  `).join('');
}

/* =========================================================
   7-DAY FORECAST
   ========================================================= */
function renderDaily(dailyArray) {
  const list = document.getElementById('dailyList');
  /* Grid: day-name | icon | condition | high | temp-bar | low | rain */
  list.innerHTML = dailyArray.map((day) => `
    <li class="day-row">
      <span class="day-name"><span class="day-name-long">${day.label}</span><span class="day-name-short">${day.labelShort}</span></span>
      <img class="day-icon" src="${day.iconPath}" alt="${day.condition}" loading="lazy" />
      <span class="day-condition">${day.condition}</span>
      <span class="day-high">${day.high}°</span>
      <div class="day-temp-bar-track" aria-hidden="true">
        <div class="day-temp-bar-fill" style="margin-left:${clamp(day.barOffset,0,75)}%;width:${clamp(day.barWidth,10,75)}%;"></div>
      </div>
      <span class="day-low">${day.low}°</span>
      <span class="day-rain">
        <img class="day-rain-icon" src="assets/icons/raindrop.svg" alt="" aria-hidden="true" />
        ${day.rainChance}%
      </span>
    </li>
  `).join('');
}

/* =========================================================
   AIR QUALITY
   ========================================================= */
function renderAirQuality(aqi) {
  if (aqi === null) {
    /* Hide the card gracefully if AQ data unavailable */
    document.querySelector('.air-quality-card').style.display = 'none';
    return;
  }

  const meta = getAQIMeta(aqi);
  const circumference = 2 * Math.PI * 50;   /* r=50 → C = ~314 */
  const fraction      = Math.min(aqi / 300, 1);
  const dashOffset    = circumference * (1 - fraction);

  document.getElementById('aqiNumber').textContent      = aqi;
  document.getElementById('aqiCategory').textContent    = meta.category;
  document.getElementById('aqiDescription').textContent = meta.description;

  const fill = document.getElementById('aqiFill');
  fill.style.strokeDasharray  = circumference;
  fill.style.strokeDashoffset = dashOffset;
  fill.style.stroke           = meta.color;
}

/* =========================================================
   SUNRISE & SUNSET
   ========================================================= */
function renderSunriseSunset(sun) {
  document.getElementById('sunriseTime').textContent = sun.sunrise;
  document.getElementById('sunsetTime').textContent  = sun.sunset;

  /* Animate sun dot along the quadratic arc:
     P(t) = (1-t)²·P0 + 2(1-t)t·P1 + t²·P2
     P0 = (20,130), P1 = (140,10), P2 = (260,130) */
  const t  = sun.progress;
  const p0 = { x: 20,  y: 130 };
  const p1 = { x: 140, y: 10  };
  const p2 = { x: 260, y: 130 };

  const bx = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
  const by = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;

  const dot = document.getElementById('sunDot');
  dot.setAttribute('cx', bx.toFixed(1));
  dot.setAttribute('cy', by.toFixed(1));

  /* Progress arc: re-draw path up to current t using dashed stroke trick */
  const arcProgress = document.getElementById('sunArcProgress');
  /* Total arc length approximation for the quadratic Bezier */
  const totalLen    = 320;   /* empirically measured for this control point set */
  const covered     = totalLen * t;
  arcProgress.style.strokeDasharray  = `${covered} ${totalLen}`;
  arcProgress.style.strokeDashoffset = '0';
}

/* =========================================================
   DETAILS
   ========================================================= */
function renderDetails(details) {
  document.getElementById('detDewPoint').textContent  = `${details.dewPoint}°C`;
  document.getElementById('detCloudCover').textContent = `${details.cloudCover}%`;
  document.getElementById('detWindGust').textContent  = `${details.windGust} km/h`;
  document.getElementById('detRainChance').textContent = `${details.rainChance}%`;
}

/* =========================================================
   LOADING BUTTON STATE (location button)
   ========================================================= */
function setLocationBtnLoading(loading) {
  const btn  = document.getElementById('locationBtn');
  const text = btn.querySelector('.location-text');
  if (loading) {
    btn.disabled = true;
    if (text) text.textContent = 'Locating…';
  } else {
    btn.disabled = false;
    if (text) text.textContent = 'My Location';
  }
}

/* =========================================================
   DRAG-TO-SCROLL — hourly forecast strip
   Click-and-drag with the mouse moves the scroll position directly.
   Works alongside wheel scroll and native touch scroll without
   interfering with either.
   =========================================================

   Key design choices:
   · isDown / startX / startScrollLeft tracked on mousedown
   · mousemove and mouseup bound on DOCUMENT so releasing the mouse
     outside the wrapper still ends the drag correctly
   · 4 px threshold before committing to drag — avoids flickering the
     .is-dragging class on a motionless click
   · scrollLeft is SET directly (not scrollBy) so the strip tracks the
     cursor exactly with no lag or animation
   · scroll-snap-type disabled via .is-dragging so snap zones do not
     fight the cursor mid-drag; restored on mouseup
   ========================================================= */
function initHourlyDragScroll() {
  const wrapper = document.querySelector('.hourly-scroll-wrapper');
  if (!wrapper) return;

  let isDown         = false;
  let startX         = 0;
  let startScrollLeft = 0;

  /* ---- start ---- */
  wrapper.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;   /* only left button */
    isDown          = true;
    startX          = e.clientX;
    startScrollLeft = wrapper.scrollLeft;
  });

  /* ---- move ---- */
  document.addEventListener('mousemove', (e) => {
    if (!isDown) return;

    const delta = e.clientX - startX;

    /* Commit to drag only after the threshold — avoids mis-triggering on
       a stationary click */
    if (Math.abs(delta) > 4) {
      wrapper.classList.add('is-dragging');
    }

    /* Update scroll without animation so the strip follows the cursor */
    wrapper.scrollLeft = startScrollLeft - delta;
  });

  /* ---- end (document so release outside wrapper is caught) ---- */
  document.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    wrapper.classList.remove('is-dragging');
  });

  /* Stop the browser initiating a native HTML drag on images / text inside
     the strip, which would steal subsequent mousemove events */
  wrapper.addEventListener('dragstart', (e) => e.preventDefault());
}

/* =========================================================
   MOUSE-WHEEL HORIZONTAL SCROLL
   Desktop trackpads send deltaX natively; desktop mice send deltaY only.
   We re-map pure-vertical wheel events onto horizontal scroll so mouse
   users can scroll the hourly strip without holding Shift.
   ========================================================= */
function initHourlyWheelScroll() {
  const wrapper = document.querySelector('.hourly-scroll-wrapper');
  if (!wrapper) return;

  wrapper.addEventListener('wheel', (e) => {
    /* If the user is already scrolling horizontally (trackpad swipe or
       Shift+wheel) let the browser handle it natively. */
    if (e.deltaX !== 0) return;

    /* Vertical-only wheel → redirect to horizontal scroll */
    e.preventDefault();
    wrapper.scrollBy({ left: e.deltaY * 1.5, behavior: 'smooth' });
  }, { passive: false });
}

/* =========================================================
   Utility
   ========================================================= */
function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}
