# Weatherly - CLAUDE.md

## AI Role

You are a senior frontend engineer, UI/UX specialist, product designer, and code reviewer.

Your responsibility is to build a production-quality weather application that closely matches the provided desktop and mobile reference screenshots.

When uncertain between functionality and visual accuracy, prioritize matching the reference screenshots while keeping functionality intact.

Never make design decisions without first checking against the reference screenshots.

Always think like a professional product team consisting of:

* Senior Frontend Engineer
* UI Designer
* UX Designer
* QA Tester
* Accessibility Specialist
* Performance Engineer

---

# Project Overview

Build a premium production-quality Weather Application called **Weatherly** inspired by the provided desktop and mobile reference screenshots.

The final product must visually match the provided references as closely as possible while maintaining clean architecture, smooth user experience, responsive layouts, and maintainable code.

The screenshots provided are the source of truth for design, layout, spacing, typography, colors, component structure, and overall user experience.

---

# Tech Stack

Use ONLY:

* HTML5
* CSS3
* Vanilla JavaScript (ES6+)

Do NOT use:

* React
* Next.js
* Vue
* Angular
* TypeScript
* Tailwind CSS
* Bootstrap
* jQuery
* Material UI
* ShadCN
* Any frontend framework

---

# API Requirements

Use only completely free public APIs.

Requirements:

* No signup required
* No API key required
* No payment method required
* No .env file required

Preferred APIs:

### Weather Data

Open-Meteo Weather API

### Location Search

Open-Meteo Geocoding API

Do not use APIs requiring authentication.

---

# Core Principle

Do not redesign.

Do not simplify.

Do not improvise.

The objective is to recreate the provided desktop and mobile reference screenshots as accurately as possible while making the application fully functional.

---

# Design Reference Rules

The attached screenshots are the visual source of truth.

Every visual detail should be compared against the references.

Match:

* Layout
* Positioning
* Typography
* Colors
* Gradients
* Shadows
* Card design
* Border radius
* Icon sizing
* Spacing
* Visual hierarchy
* Responsiveness

If something differs from the screenshots, continue refining until it closely matches.

---

# Screenshot Verification Workflow

After every major implementation:

1. Generate the UI.
2. Capture screenshots.
3. Compare screenshots against references.
4. Identify differences.
5. List shortcomings.
6. Fix shortcomings.
7. Capture new screenshots.
8. Compare again.
9. Repeat until visual differences are minimal.

Do not stop after one comparison.

Continue until the design is visually extremely close to the references.

Verification categories:

* spacing
* padding
* typography
* colors
* gradients
* alignment
* shadows
* responsiveness
* card sizing
* icon placement
* icon sizing
* section hierarchy

---

# User Interface Requirements

## Desktop Experience

Create a premium dashboard experience.

Must include:

* Search bar
* Current weather section
* Large weather hero section
* Weather highlights section
* Hourly forecast section
* 7-day forecast section
* Modern card-based layout

Desktop must closely resemble the desktop reference.

---

## Mobile Experience

Create a dedicated mobile layout.

Must match:

* Mobile spacing
* Mobile card sizes
* Mobile navigation patterns
* Mobile visual hierarchy

No horizontal scrolling.

Touch-friendly controls.

Must closely resemble the mobile reference.

---

## Tablet Experience

Create smooth responsive adaptation between desktop and mobile.

Avoid broken layouts.

---

# Required Features

## Search Weather

Allow users to:

* Search by city
* Search using Enter key
* Search using button interaction

Display:

* City
* Country
* Date
* Time

---

## Current Weather

Display:

* Current temperature
* Weather condition
* Weather icon
* High temperature
* Low temperature

---

## Weather Highlights

Display:

* Feels Like
* Humidity
* Wind Speed
* UV Index
* Visibility
* Pressure

---

## Hourly Forecast

Display hourly forecast cards.

Include:

* Time
* Temperature
* Weather icon

---

## 7-Day Forecast

Display:

* Daily condition
* Daily icon
* High temperature
* Low temperature
* Rain probability

---

## Current Location

Support:

* Geolocation weather

Handle:

* Permission denied
* Location unavailable
* Unsupported browser

Gracefully.

---

# User Experience Requirements

The application should feel:

* Fast
* Smooth
* Premium
* Modern
* Production-ready

Include:

* Hover states
* Focus states
* Smooth transitions
* Smooth animations
* Loading indicators
* Skeleton loaders
* Error states
* Empty states

---

# Error Handling

Handle:

* Invalid city names
* No matching results
* API failures
* Offline status
* Slow internet

Never leave the user confused.

Provide meaningful messages.

---

# Accessibility

Support:

* Semantic HTML
* Keyboard navigation
* Proper labels
* Focus indicators
* Good contrast ratios
* ARIA attributes where appropriate

Accessibility should not be sacrificed for aesthetics.

---

# File Structure

Keep all files separated.

```text
/weatherly

index.html

/css
├── variables.css
├── layout.css
├── components.css
└── style.css

/js
├── api.js
├── search.js
├── forecast.js
├── geolocation.js
├── ui.js
└── app.js

/assets
├── icons
├── images
└── screenshots
```

---

# Code Quality Rules

Code must be:

* Clean
* Readable
* Scalable
* Maintainable
* Modular
* Production-ready

Avoid:

* Spaghetti code
* Duplicate logic
* Large monolithic files
* Hardcoded values where avoidable

---

# JavaScript Standards

Use:

* const
* let
* async/await
* addEventListener
* template literals
* modular functions
* early returns
* reusable utilities

Avoid:

* var
* inline onclick handlers
* unnecessary global variables

---

# CSS Standards

Use:

* CSS variables
* reusable classes
* component-based styling
* responsive breakpoints
* mobile-first principles

Avoid:

* excessive nesting
* duplicated styles
* !important abuse

---

# Comments

Add meaningful comments for:

* API integration
* Complex logic
* Forecast calculations
* Major UI sections

Do not add unnecessary comments.

---

# Performance Standards

Optimize for:

* Fast rendering
* Minimal layout shifts
* Minimal reflows
* Efficient DOM updates

Avoid unnecessary API requests.

Cache weather data when reasonable.

Lazy load non-critical assets when appropriate.

---

# Browser Support

Ensure compatibility with:

* Chrome
* Edge
* Firefox
* Safari

Latest stable versions.

---

# Visual Polish Requirements

The UI should feel comparable to premium consumer applications.

Focus heavily on:

* Consistent spacing
* Perfect alignment
* Smooth typography hierarchy
* Premium gradients
* Card depth and shadows
* Professional weather icon presentation
* Visual balance

No section should appear unfinished.

---

# Quality Assurance

Before completion:

* Test desktop layout
* Test tablet layout
* Test mobile layout
* Test search functionality
* Test geolocation
* Test loading states
* Test error states
* Test API failures
* Test responsiveness
* Test keyboard navigation

Fix all issues discovered.

---

# Completion Checklist

Before considering the project complete:

* Desktop design matches reference
* Mobile design matches reference
* Responsive across devices
* Search works correctly
* Current weather works
* Hourly forecast works
* 7-day forecast works
* Geolocation works
* Error handling works
* Loading states work
* Accessibility checks pass
* No console errors
* No duplicate code
* Clean architecture
* Smooth user experience
* Production-quality implementation

Final result should feel like a real-world premium weather application ready for deployment.

Do not stop refining until both functionality and visual accuracy meet professional standards.
