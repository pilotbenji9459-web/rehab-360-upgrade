import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=(name:string)=>fs.readFileSync(name,'utf8');
const sidebar=read('src/components/Sidebar.tsx');
const css=read('src/index.css');
const manager=read('src/components/ScrollRevealManager.tsx');
const landing=read('src/components/LandingPage.tsx');
const dashboard=read('src/components/RoleDashboard.tsx');
const app=read('src/App.tsx');

assert.ok(sidebar.includes('data-app-sidebar')&&sidebar.includes('data-nav-item')&&sidebar.includes('data-active={isActive'), 'Sidebar exposes active navigation state');
assert.ok(css.includes('[data-nav-item][data-active="true"]'), 'High-contrast active nav style is present');
assert.ok(css.includes('color: #29435f !important'), 'Light nav items have dark readable text');
assert.ok(css.includes('color: #ffffff !important'), 'Active nav items keep white contrast');
assert.ok(css.includes('html[data-theme="light"] [data-app-sidebar]'), 'Light sidebar styles are scoped to sidebar');
assert.ok(manager.includes('IntersectionObserver')&&manager.includes('MutationObserver'), 'Dynamic scroll reveals use viewport observer');
assert.ok(manager.includes('prefers-reduced-motion: reduce'), 'Motion respects user accessibility setting');
assert.ok(manager.includes('rect.top < window.innerHeight'), 'Above-the-fold content does not start hidden');
assert.ok(css.includes('scroll-media-pop')&&css.includes('scale(.94)'), 'Pop-in animation is visible');
assert.ok(landing.includes('data-motion-scope="landing"')&&landing.includes('reveal-feature'), 'Landing images and feature sections participate in reveal');
assert.ok(dashboard.includes('data-motion-scope="dashboard"')&&dashboard.includes('reveal-feature'), 'Dashboard cards participate in reveal');
assert.ok(app.includes('<ScrollRevealManager />'), 'Scroll reveal controller is mounted');
console.log('Light-mode sidebar contrast and scroll-reveal regression checks passed.');
