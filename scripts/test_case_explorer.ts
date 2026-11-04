import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getCaseExplorerResults } from '../src/components/CaseExplorer';
import type { OffenderCase } from '../src/types';

const makeCase = (id:string, overrides:Partial<OffenderCase>={}):OffenderCase => ({
  id, institution_id:'inst-demo', first_name:'Asha', last_name:'Example', date_of_birth:'2000-01-01',
  age_band:'25-34', crime_severity:2, crime_type:'Theft', sentence_length_months:12,
  education_level:3, support_network:3, programme_engagement:3, assessment_completeness:70,
  session_attendance:82, mood_history:[], low_mood_count:0,
  gate_scores:{edu:50,beh:50,wb:50,skl:50}, score_history:[], gate_history:[],
  certifications:[], decision:null, pathway_position:null, decision_reason:'',
  rehabilitation_remarks:[], education_history:'', employment_history:'',
  rehabilitation_history:'', version:1, updated_at:'2026-01-01T00:00:00Z',
  updated_by_id:'test-user',updated_by_name:'Test User',...overrides,
});
const list=[
  makeCase('RP-1001',{first_name:'Zoya',decision:null,session_attendance:95,updated_at:'2026-10-02T00:00:00Z'}),
  makeCase('RP-1002',{first_name:'Aman',decision:'approved',session_attendance:61,updated_at:'2026-10-03T00:00:00Z'}),
  makeCase('RP-1003',{first_name:'Lila',decision:'approved',session_attendance:99,crime_type:'Fraud',updated_at:'2026-10-01T00:00:00Z'}),
];
assert.equal(getCaseExplorerResults(list,'','all','recent').length,3);
assert.deepEqual(getCaseExplorerResults(list,'','all','recent').map(c=>c.id),['RP-1002','RP-1001','RP-1003']);
assert.deepEqual(getCaseExplorerResults(list,'','all','name').map(c=>c.id),['RP-1002','RP-1003','RP-1001']);
assert.deepEqual(getCaseExplorerResults(list,'','all','attendance').map(c=>c.id),['RP-1002','RP-1001','RP-1003']);
assert.deepEqual(getCaseExplorerResults(list,'','pending','recent').map(c=>c.id),['RP-1001']);
assert.deepEqual(getCaseExplorerResults(list,'','verified','recent').map(c=>c.id),['RP-1002','RP-1003']);
assert.deepEqual(getCaseExplorerResults(list,'','attention','recent').map(c=>c.id),['RP-1002','RP-1001']);
assert.deepEqual(getCaseExplorerResults(list,'  rP-1003  ','all','recent').map(c=>c.id),['RP-1003']);
assert.deepEqual(getCaseExplorerResults(list,'FRAUD','all','recent').map(c=>c.id),['RP-1003']);
assert.equal(getCaseExplorerResults(list,'no match','all','recent').length,0);
assert.equal(list[0].decision,null,'Filter must not mutate case records');
assert.equal(list[0].id,'RP-1001','Source ordering and values must be preserved');
const explorerCss = fs.readFileSync('src/components/caseExplorer.css', 'utf8');
const appCss = fs.readFileSync('src/index.css', 'utf8');
const header = fs.readFileSync('src/components/Header.tsx', 'utf8');
const appEntry = fs.readFileSync('src/App.tsx', 'utf8');
assert.ok(explorerCss.includes('.cx-shell button.cx-filter.cx-active'), 'Segmented filter must have a distinct selected state');
assert.ok(explorerCss.includes('prefers-reduced-motion:reduce'), 'Animation must respect reduced motion');
assert.ok(explorerCss.includes('cx-reveal'), 'Result card reveal transition should exist');
assert.ok(explorerCss.includes('html[data-theme="light"] .cx-shell'), 'Explorer must have a light palette');
assert.ok(header.includes("localStorage.setItem('rehabpath360:theme'"), 'Theme choice must persist across reloads');
assert.ok(header.includes('aria-pressed={!isDark}'), 'Theme switch should expose accessible state');
assert.ok(appCss.includes('html[data-theme="light"]'), 'Global light palette should be available');
assert.ok(appEntry.includes("import './components/caseExplorer.css';"), 'Browser must load the component stylesheet');
console.log('Case Explorer tests passed: filters, search, sorting, no mutations, theme persistence and motion accessibility.');
