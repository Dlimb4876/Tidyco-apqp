# Navigation & Routing

## Hash-Based Routing
This is a single-page application (SPA) using hash-based routing:

```
#p=<uuid>&s=<section>&t=<tab>
```

Components:
- `p` = project UUID
- `s` = section (e.g., 'capacity', 'product-development')
- `t` = tab (e.g., 'me', 'pm')

## Navigation API
Use the `navigate()` function from `utils/js/navigation.js`:

```javascript
navigate('capacity', { ct: 'me' });
// Sets hash to #s=capacity&ct=me
```

**Benefits**:
- Automatic real-time subscription cleanup
- Consistent routing pattern
- Back/forward button support

## Render Switchboard
The `render()` function in `utils/js/navigation.js` is the main routing switchboard:

```javascript
case 'capacity':
  renderCapacity();
  break;
case 'product-development':
  renderProductDevelopment();
  break;
```

Add a new `case` for each new route.

## Adding a New Route
1. Add a `case` in `render()` switchboard
2. Create a portal folder: `portals/my-section/`
3. Create the render function: `portals/my-section/render.js`
4. Add `<script>` tag to `index.html` in correct dependency order

## State from URL
Read current route state:

```javascript
const params = new URLSearchParams(window.location.hash.slice(1));
const projectId = params.get('p');
const section = params.get('s');
const tab = params.get('t');
```

## Page Initialization
Pages initialize when the hash changes:

```javascript
window.addEventListener('hashchange', render);
```

This is handled by `navigation.js` — don't create duplicate listeners.

## Backwards Button
The browser back button works naturally with hash routing. No special handling needed.

## Mobile Navigation
Navigation controls must be mobile-responsive:
- Use hamburger menu on mobile (≤767px)
- Show full navigation on desktop (≥768px)
- See `core/css/main.css` for shell layout
