# Netflix-Clone: Task Breakdown

Source: Master Task List (T-01–T-16). Each task below is broken into concrete, checkable subtasks.

## T-01 — Project Scaffolding & Dependencies (Group Work)

- [✔️] Run `npm create vite@latest` and select the React template
- [✔️] Install dependencies: `axios`, `react-router-dom`, `lucide-react`, `react-icons`, `swiper`
- [✔️] Run `npm install` and confirm no dependency errors
- [✔️] Start the dev server (`npm run dev`) and confirm it loads in the browser
- [✔️] Clean up the default Vite boilerplate (starter CSS, sample components)
- [✔️] Commit initial scaffold to git

## T-02 — Asset Organization & Static Data (Group Work)

- [✔️] Create `src/assets/image/` directory
- [✔️] Add logo asset (e.g. `logo.png`/`.svg`)
- [✔️] Add fallback/placeholder banner image
- [✔️] Open `src/Data/Data.js` and review its structure (fields, categories, shape of movie objects)
- [✔️] Note any fields the UI components will need (id, title, image path, description, etc.)
- [✔️] Confirm asset import paths resolve correctly in a test component

## T-03 — TMDB API Key & Environment Setup (Group Work)

- [✔️] Create a TMDB account and request an API key (v3 auth)
- [✔️] Create `.env` in project root
- [✔️] Add `VITE_TMDB_API_KEY=<your_key>` to `.env`
- [✔️] Add `.env` to `.gitignore` (verify it's not already tracked)
- [✔️] Create `.env.example` with a placeholder key for other contributors
- [✔️] Verify the key is readable via `import.meta.env.VITE_TMDB_API_KEY`

## T-04 — Axios Instance & Request Endpoints (Yonatan)

- [✔️] Create `src/Utility/MovieInstance.js`
- [✔️] Configure a shared Axios instance with TMDB's base URL (`https://api.themoviedb.org/3`)
- [✔️] Attach the API key via default `params` on the Axios instance (not hardcoded in each URL)
- [✔️] Create `src/Utility/requestUrls.js`
- [✔️] Define endpoint constants for each category (Trending, Netflix Originals, Top Rated, Action, Comedy, Horror, Romance, Documentaries, etc.)
- [✔️] Test one endpoint manually (e.g. console.log a fetch response) to confirm the instance works

## T-05 — Global Theme & Base Styles (Yonatan)

- [✔️] Add a CSS reset (margin/padding/box-sizing normalization) to `src/index.css`
- [✔️] Set global dark theme: black/near-black background, white text
- [✔️] Define base typography (font family, base sizes, line-height)
- [✔️] Set global scrollbar styling if needed (custom WebKit & Firefox scrollbars)
- [✔️] Define reusable CSS variables (colors, spacing, transitions) for consistency across modules
- [✔️] Verify styles apply app-wide with no default browser styling bleeding through

## T-06 — App Layout Shell & Router (Mo)

- [✔️] Wrap `<App />` with `<BrowserRouter>` in `main.jsx`
- [✔️] Define top-level routes in `App.jsx` (Home, TV Shows, Movies, New & Popular, My List, Browse by Language)
- [✔️] Assemble the main layout: Header, page content (Outlet/children), Footer, and global Modals
- [✔️] Confirm routing renders correctly with no console errors
- [✔️] Add a basic 404/fallback route if applicable (`NotFound.jsx` with code `NSES-404`)

## T-07 — Header & Scroll-Aware Background (Ferdos)

- [✔️] Build fixed/sticky header component
- [✔️] Add Netflix logo (from T-02 assets)
- [✔️] Add primary navigation links (Home, TV Shows, Movies, New & Popular, My List, etc.)
- [✔️] Implement scroll listener (or `useEffect` + scroll event) to detect page scroll position
- [✔️] Toggle header background class between transparent and solid dark based on scroll threshold
- [✔️] Add smooth CSS transition for the background change
- [✔️] Match layout/spacing to design references

## T-08 — Header Search, Notifications & Profile Dropdown (Ferdos)

- [✔️] Build expandable search icon → input toggle (click to expand/collapse)
- [✔️] Wire search input to live TMDB search API and dropdown suggestions
- [✔️] Add notification bell icon with badge indicator and dropdown menu
- [✔️] Build profile avatar with dropdown menu (click to open/close, click-outside to close)
- [✔️] Populate dropdown with menu items (Switch Profiles, Kids Mode, Account, Sign Out, etc.)
- [✔️] Verify keyboard/click-outside behavior doesn't break other header interactions

## T-09 — Responsive Footer Component (Mo)

- [✔️] Build footer container with dark background matching theme
- [✔️] Add row of social media icons (using `react-icons`)
- [✔️] Build multi-column links grid (Audio Description, Help Center, Gift Cards, Privacy, Terms, Contact Us)
- [✔️] Add hover states for links and icons
- [✔️] Add copyright/legal text line
- [✔️] Add interactive service code generator button
- [✔️] Add responsive column collapse for smaller screens

## T-10 — Banner Data Fetching & Random Selection (Sadik)

- [✔️] Create banner component with `useEffect` on mount
- [✔️] Call the Netflix Originals endpoint via the Axios instance (T-04)
- [✔️] Handle loading and error states for the fetch with rich fallback data
- [✔️] Randomly select one item from the returned results array
- [✔️] Store the selected item in component state
- [✔️] Verify a new random item appears on each page reload

## T-11 — Banner UI & Gradient Overlay (Sadik)

- [✔️] Render backdrop image from the selected banner item (with fallback image from T-02 if missing)
- [✔️] Display title and truncate/clamp the description text
- [✔️] Add "Play" button (triggers full-screen YouTube trailer modal)
- [✔️] Add "More Info" & "My List" (add to list) buttons
- [✔️] Add bottom fade gradient overlay (CSS gradient over image)
- [✔️] Add mute/unmute audio teaser button
- [✔️] Ensure text remains readable against varying backdrop images

## T-12 — Multi-Category Parallel Fetching (Mussa/Israal)

- [✔️] Define the list of category/genre endpoints to fetch (from `requestUrls.js`)
- [✔️] In `DisplayRow.jsx`, build an array of fetch promises for each category
- [✔️] Use `Promise.allSettled` to fetch all categories concurrently
- [✔️] Store results in state, keyed by category name
- [✔️] Handle loading state while fetches are in flight
- [✔️] Handle partial/total failure gracefully (resilient fallback dataset in `Data.js`)

## T-13 — SlideShow Swiper Carousel (Mussa/Israal)

- [✔️] Create a reusable `Carousel`/`SlideShow` component wrapping `swiper`
- [✔️] Configure Swiper options (slides per view, spacing, responsive breakpoints)
- [✔️] Add custom navigation arrows (prev/next)
- [✔️] Show arrows on row hover (CSS opacity/visibility transition)
- [✔️] Support Top 10 numbered ranking badges (1–10 styled numbers)
- [✔️] Wire the carousel to accept a list of movies as props
- [✔️] Test with multiple rows to confirm independent carousel state per row

## T-14 — MovieCard Component & Hover Preview (Mussa/Israal)

- [✔️] Build base `MovieCard` component rendering poster thumbnail
- [✔️] Add hover state that expands/scales the card
- [✔️] Show preview details on hover (backdrop, badge, title, metadata)
- [✔️] Add action buttons on hover: play trailer, add/remove from My List, like, more info
- [✔️] Display metadata tags (e.g. age rating, type, HD/4K)
- [✔️] Display genre list/tags
- [✔️] Handle image fallback for missing posters (`onError` + placeholder)
- [✔️] Display match % (vote_average from TMDB calculated and wired directly to UI)

## T-15 — Responsive Layout & Mobile Navigation (Eyob)

- [✔️] Audit header at tablet and mobile breakpoints; adjust spacing/typography
- [✔️] Collapse primary nav into a mobile drawer menu (hamburger toggle)
- [✔️] Audit banner at smaller viewports (text size, button stacking, image cropping)
- [✔️] Audit movie rows/cards at smaller viewports (cards per view, touch scroll behavior)
- [✔️] Adjust footer columns for mobile stacking
- [✔️] Test across common breakpoints (mobile, tablet, small desktop)
- [✔️] Verify no horizontal overflow/scroll issues on any viewport

## T-16 — CSS Modules Audit & Animation Polish (Eyob)

- [✔️] Review all CSS Module files for consistent naming conventions
- [✔️] Remove unused/duplicate class definitions
- [✔️] Confirm styles are properly scoped with CSS Modules
- [✔️] Standardize transition timing/easing values across components
- [✔️] Polish hover/focus animations (cards, buttons, dropdowns, nav links)
- [✔️] Verify smooth 60fps performance on interactive animations
- [✔️] Final visual pass comparing against all Netflix design references
