import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file: string) => fs.readFileSync(file, 'utf8');
const tour = read('src/components/ExhibitionTour.tsx');
const tourCss = read('src/components/exhibitionTour.css');
const explorerCss = read('src/components/caseExplorer.css');
const app = read('src/App.tsx');
const landing = read('src/components/LandingPage.tsx');

assert.ok(tour.includes('tour-feature-art') && tour.includes('<img src={current.picture}'), 'Tour must display real existing illustrations');
assert.ok(tour.includes('key={current.tab}'), 'Tour image and content transition for every chapter');
assert.ok(tour.includes('allowedRoles.includes(user.role)'), 'Tour must respect role-based navigation');
assert.ok(tour.includes('onSelectCase(cases[0].id)'), 'Tour must navigate to an existing authorized case');
assert.ok(tourCss.includes('tour-image-enter') && tourCss.includes('blur(10px)'), 'Images use visual pop/blur transitions');
assert.ok(tourCss.includes('prefers-reduced-motion:reduce'), 'Tour respects reduced-motion preferences');
assert.ok(tourCss.includes('html[data-theme="light"] .tour-shell'), 'Tour supports readable light mode');
assert.ok(explorerCss.includes('.cx-shell label.cx-search') && explorerCss.includes('flex-direction: row !important'), 'Search overrides global label stacking');
assert.ok(explorerCss.includes('.cx-search .cx-search-icon') && explorerCss.includes('top: 50%'), 'Search magnifier is vertically centered');
assert.ok(explorerCss.includes('html[dir="rtl"] .cx-shell .cx-search'), 'Search field handles RTL alignment');
assert.ok(app.includes("import './components/exhibitionTour.css';"), 'Tour CSS must load in browser entry');
assert.ok(landing.includes('data-motion-scope="landing"'), 'Scroll reveal remains enabled for landing imagery');
console.log('Tour image transitions, search icon alignment and theme regression checks passed.');
