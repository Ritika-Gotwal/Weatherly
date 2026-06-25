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

  const iconName = current.iconPath.replace('assets/icons/', '').replace('.svg', '');
  renderWeatherAnimation(iconName);
  applyHeroBg(current.iconPath);
}

/* =========================================================
   WEATHER ANIMATIONS — inline animated SVG for hero
   ========================================================= */
function renderWeatherAnimation(iconName) {
  const el = document.getElementById('heroWeatherIcon');
  if (!el) return;
  const map = {
    'clear-day':           waClearDay,
    'clear-night':         waClearNight,
    'partly-cloudy-day':   waPartlyCloudyDay,
    'partly-cloudy-night': waPartlyCloudyNight,
    'cloudy':              waCloudy,
    'fog':                 waFog,
    'drizzle':             waDrizzle,
    'rain':                waRain,
    'snow':                waSnow,
    'thunderstorm':        waThunderstorm,
  };
  el.innerHTML = (map[iconName] || waCloudy)();
}

/* ---- Cloud path helper (centered in 160×160 viewbox) ---- */
function _cloud(cx, cy, opacity = 0.93) {
  const o = `rgba(255,255,255,${opacity})`;
  return `
    <circle cx="${cx-22}" cy="${cy+8}"  r="18" fill="${o}"/>
    <circle cx="${cx}"    cy="${cy}"    r="26" fill="${o}"/>
    <circle cx="${cx+24}" cy="${cy+6}"  r="19" fill="${o}"/>
    <rect   x="${cx-40}"  y="${cy+6}"  width="83" height="22" rx="2" fill="${o}"/>`;
}

function _rainDrops(xs, y0, color, count, cls) {
  return xs.slice(0, count).map((x, i) =>
    `<line class="wa-drop wa-d${i+1}" x1="${x}" y1="${y0}" x2="${x-5}" y2="${y0+20}" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`
  ).join('');
}

/* ---- Clear Day ---- */
function waClearDay() {
  return `<svg viewBox="0 0 160 160" class="wa-svg" xmlns="http://www.w3.org/2000/svg">
    <circle class="wa-glow" cx="80" cy="80" r="56" fill="rgba(255,213,50,0.22)"/>
    <g class="wa-rays">
      <line x1="80" y1="20" x2="80" y2="36"   stroke="#FFD740" stroke-width="5" stroke-linecap="round"/>
      <line x1="80" y1="124" x2="80" y2="140"  stroke="#FFD740" stroke-width="5" stroke-linecap="round"/>
      <line x1="20" y1="80" x2="36" y2="80"    stroke="#FFD740" stroke-width="5" stroke-linecap="round"/>
      <line x1="124" y1="80" x2="140" y2="80"  stroke="#FFD740" stroke-width="5" stroke-linecap="round"/>
      <line x1="38"  y1="38"  x2="50"  y2="50"  stroke="#FFD740" stroke-width="5" stroke-linecap="round"/>
      <line x1="122" y1="38"  x2="110" y2="50"  stroke="#FFD740" stroke-width="5" stroke-linecap="round"/>
      <line x1="38"  y1="122" x2="50"  y2="110" stroke="#FFD740" stroke-width="5" stroke-linecap="round"/>
      <line x1="122" y1="122" x2="110" y2="110" stroke="#FFD740" stroke-width="5" stroke-linecap="round"/>
    </g>
    <circle cx="80" cy="80" r="30" fill="#FFD740"/>
    <circle cx="80" cy="80" r="20" fill="#FFF176" opacity="0.6"/>
  </svg>`;
}

/* ---- Clear Night ---- */
function waClearNight() {
  /* Crescent: white moon circle + dark offset circle overlay (same technique as waPartlyCloudyNight).
     Both circles grouped under .wa-moon so they float together, preserving the crescent shape. */
  return `<svg viewBox="0 0 160 160" class="wa-svg" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle class="wa-star wa-s1" cx="28"  cy="32"  r="2.5" fill="white"/>
    <circle class="wa-star wa-s2" cx="122" cy="22"  r="2"   fill="white"/>
    <circle class="wa-star wa-s3" cx="145" cy="58"  r="1.5" fill="white"/>
    <circle class="wa-star wa-s4" cx="18"  cy="92"  r="2"   fill="white"/>
    <circle class="wa-star wa-s5" cx="138" cy="118" r="1.5" fill="white"/>
    <circle class="wa-star wa-s6" cx="48"  cy="144" r="2"   fill="white"/>
    <circle class="wa-star wa-s7" cx="148" cy="140" r="1.5" fill="white"/>
    <!-- Moon circle + dark offset shadow = clear crescent shape -->
    <g class="wa-moon">
      <circle cx="80" cy="80" r="38" fill="#E8EAF6"/>
      <circle cx="98" cy="64" r="32" fill="#070D20"/>
    </g>
  </svg>`;
}

/* ---- Partly Cloudy Day ---- */
function waPartlyCloudyDay() {
  return `<svg viewBox="0 0 160 160" class="wa-svg" xmlns="http://www.w3.org/2000/svg">
    <g class="wa-sun-behind">
      <circle cx="66" cy="68" r="26" fill="#FFD740"/>
      <circle cx="66" cy="68" r="18" fill="#FFF176" opacity="0.6"/>
      <line x1="66" y1="28" x2="66" y2="40"   stroke="#FFD740" stroke-width="4" stroke-linecap="round"/>
      <line x1="66" y1="96" x2="66" y2="108"  stroke="#FFD740" stroke-width="4" stroke-linecap="round"/>
      <line x1="26" y1="68" x2="38" y2="68"   stroke="#FFD740" stroke-width="4" stroke-linecap="round"/>
      <line x1="94" y1="68" x2="106" y2="68"  stroke="#FFD740" stroke-width="4" stroke-linecap="round"/>
      <line x1="37" y1="39" x2="46" y2="48"   stroke="#FFD740" stroke-width="4" stroke-linecap="round"/>
      <line x1="95" y1="39" x2="86" y2="48"   stroke="#FFD740" stroke-width="4" stroke-linecap="round"/>
    </g>
    <g class="wa-cloud">${_cloud(82, 92)}</g>
  </svg>`;
}

/* ---- Partly Cloudy Night ---- */
function waPartlyCloudyNight() {
  return `<svg viewBox="0 0 160 160" class="wa-svg" xmlns="http://www.w3.org/2000/svg">
    <circle class="wa-star wa-s1" cx="30"  cy="26" r="2"   fill="white"/>
    <circle class="wa-star wa-s3" cx="132" cy="44" r="1.5" fill="white"/>
    <circle class="wa-star wa-s5" cx="148" cy="72" r="1.8" fill="white"/>
    <circle class="wa-moon-behind" cx="66" cy="62" r="28" fill="#E8EAF6"/>
    <circle cx="84" cy="48" r="22" fill="rgba(15,20,45,0.82)"/>
    <g class="wa-cloud">${_cloud(82, 96)}</g>
  </svg>`;
}

/* ---- Cloudy ---- */
function waCloudy() {
  return `<svg viewBox="0 0 160 160" class="wa-svg" xmlns="http://www.w3.org/2000/svg">
    <g class="wa-cloud-back" style="opacity:0.55">
      ${_cloud(96, 68, 0.80)}
    </g>
    <g class="wa-cloud">${_cloud(72, 96)}</g>
  </svg>`;
}

/* ---- Fog ---- */
function waFog() {
  return `<svg viewBox="0 0 160 160" class="wa-svg" xmlns="http://www.w3.org/2000/svg">
    <rect class="wa-fog-bar wa-fb1" x="8"  y="46" width="134" height="11" rx="5.5" fill="rgba(255,255,255,0.80)"/>
    <rect class="wa-fog-bar wa-fb2" x="18" y="68" width="120" height="11" rx="5.5" fill="rgba(255,255,255,0.68)"/>
    <rect class="wa-fog-bar wa-fb3" x="8"  y="90" width="134" height="11" rx="5.5" fill="rgba(255,255,255,0.56)"/>
    <rect class="wa-fog-bar wa-fb4" x="26" y="112" width="104" height="11" rx="5.5" fill="rgba(255,255,255,0.40)"/>
  </svg>`;
}

/* ---- Drizzle ---- */
function waDrizzle() {
  return `<svg viewBox="0 0 160 160" class="wa-svg" xmlns="http://www.w3.org/2000/svg">
    <g class="wa-cloud">${_cloud(76, 68)}</g>
    ${_rainDrops([48,68,88,108], 94, '#90caf9', 4, 'wa-d')}
  </svg>`;
}

/* ---- Rain ---- */
function waRain() {
  return `<svg viewBox="0 0 160 160" class="wa-svg" xmlns="http://www.w3.org/2000/svg">
    <g class="wa-cloud">${_cloud(76, 62, 0.85)}</g>
    <line class="wa-drop wa-d1" x1="42"  y1="88" x2="36"  y2="110" stroke="#64b5f6" stroke-width="2.5" stroke-linecap="round"/>
    <line class="wa-drop wa-d2" x1="60"  y1="88" x2="54"  y2="110" stroke="#64b5f6" stroke-width="2.5" stroke-linecap="round"/>
    <line class="wa-drop wa-d3" x1="78"  y1="88" x2="72"  y2="110" stroke="#64b5f6" stroke-width="2.5" stroke-linecap="round"/>
    <line class="wa-drop wa-d4" x1="96"  y1="88" x2="90"  y2="110" stroke="#64b5f6" stroke-width="2.5" stroke-linecap="round"/>
    <line class="wa-drop wa-d5" x1="114" y1="88" x2="108" y2="110" stroke="#64b5f6" stroke-width="2.5" stroke-linecap="round"/>
    <line class="wa-drop wa-d6" x1="51"  y1="114" x2="45" y2="136" stroke="#64b5f6" stroke-width="2.5" stroke-linecap="round"/>
    <line class="wa-drop wa-d7" x1="87"  y1="114" x2="81" y2="136" stroke="#64b5f6" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`;
}

/* ---- Snow ---- */
function waSnow() {
  const flake = (cx, cy, cls) => `
    <g class="wa-flake ${cls}" style="transform-origin:${cx}px ${cy}px">
      <line x1="${cx}" y1="${cy-8}" x2="${cx}" y2="${cy+8}" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="${cx-8}" y1="${cy}" x2="${cx+8}" y2="${cy}" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="${cx-6}" y1="${cy-6}" x2="${cx+6}" y2="${cy+6}" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="${cx+6}" y1="${cy-6}" x2="${cx-6}" y2="${cy+6}" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
    </g>`;
  return `<svg viewBox="0 0 160 160" class="wa-svg" xmlns="http://www.w3.org/2000/svg">
    <g class="wa-cloud">${_cloud(76, 58, 0.88)}</g>
    ${flake(44,  96, 'wa-sf1')}
    ${flake(76,  110, 'wa-sf2')}
    ${flake(108, 96, 'wa-sf3')}
    ${flake(58,  130, 'wa-sf4')}
    ${flake(96,  130, 'wa-sf5')}
  </svg>`;
}

/* ---- Thunderstorm ---- */
function waThunderstorm() {
  return `<svg viewBox="0 0 160 160" class="wa-svg" xmlns="http://www.w3.org/2000/svg">
    <g class="wa-cloud">${_cloud(76, 54, 0.75)}</g>
    <polygon class="wa-bolt"
      points="88,78 72,106 82,106 68,138 102,100 88,100 100,78"
      fill="#FFD740"/>
    <line class="wa-drop wa-d1" x1="36"  y1="84" x2="30"  y2="104" stroke="#64b5f6" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
    <line class="wa-drop wa-d3" x1="120" y1="84" x2="114" y2="104" stroke="#64b5f6" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
  </svg>`;
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
    btn.classList.add('is-locating');
    if (text) text.textContent = 'Locating…';
  } else {
    btn.disabled = false;
    btn.classList.remove('is-locating');
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
