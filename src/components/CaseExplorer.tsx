import React, { useMemo, useState } from 'react';
import { Search, ArrowRight, ArrowUpDown, RotateCcw, Filter, LayoutGrid, List, Sparkles } from 'lucide-react';
import type { OffenderCase, TabId } from '../types';
import { getOffenderPos } from '../utils/aiLogic';

type FilterMode = 'all' | 'pending' | 'attention' | 'verified';
type SortMode = 'recent' | 'name' | 'attendance';
type ViewMode = 'cards' | 'list';

interface CaseExplorerProps {
  cases: OffenderCase[];
  onSelectCase: (id: string) => void;
  onSelectTab: (tab: TabId) => void;
}

const percentage = (value: number) =>
  Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;

export function getCaseExplorerResults(
  cases: OffenderCase[],
  query: string,
  filter: FilterMode,
  sort: SortMode
): OffenderCase[] {
  const normalized = query.trim().toLocaleLowerCase();
  return cases.filter((record) => {
    const matchesSearch = !normalized ||
      [record.id, record.first_name, record.last_name, record.crime_type]
        .some((part) => String(part || '').toLocaleLowerCase().includes(normalized));
    if (!matchesSearch) return false;
    if (filter === 'pending') return !record.decision;
    if (filter === 'verified') return Boolean(record.decision);
    if (filter === 'attention') {
      // Workflow follow-up, not an automated clinical risk judgment.
      return !record.decision || record.session_attendance < 75;
    }
    return true;
  }).sort((a, b) => {
    if (sort === 'name') {
      return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
    }
    if (sort === 'attendance') return (a.session_attendance || 0) - (b.session_attendance || 0);
    return (Date.parse(b.updated_at || '') || 0) - (Date.parse(a.updated_at || '') || 0);
  });
}

export const CaseExplorer: React.FC<CaseExplorerProps> = ({ cases, onSelectCase, onSelectTab }) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [sort, setSort] = useState<SortMode>('recent');
  const [view, setView] = useState<ViewMode>('cards');
  const [showAll, setShowAll] = useState(false);

  const results = useMemo(() => getCaseExplorerResults(cases, query, filter, sort), [cases, query, filter, sort]);
  const visible = showAll ? results : results.slice(0, 6);
  const hasControls = Boolean(query || filter !== 'all' || sort !== 'recent' || showAll);

  const openRecord = (id: string, tab: TabId = 'cases') => {
    onSelectCase(id);
    onSelectTab(tab);
  };

  const tabs: { id: FilterMode; label: string; count: number }[] = [
    { id: 'all', label: 'All cases', count: cases.length },
    { id: 'pending', label: 'Pending decision', count: cases.filter(c => !c.decision).length },
    { id: 'attention', label: 'Needs follow-up', count: cases.filter(c => !c.decision || c.session_attendance < 75).length },
    { id: 'verified', label: 'Decision recorded', count: cases.filter(c => Boolean(c.decision)).length },
  ];

  return (
    <section aria-labelledby="case-explorer-heading" className="card bg-[#0b1a30] border border-[#1e3a5f] space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--teal,#5cc2bd)]" aria-hidden="true" />
            <h2 id="case-explorer-heading" className="text-lg sm:text-xl font-bold text-white font-serif m-0">Interactive Case Explorer</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Search, filter and open authorized cases instantly. Exploring never changes a record.
          </p>
        </div>
        <span className="text-xs font-medium text-[var(--teal,#5cc2bd)] bg-[#0f2744] border border-[#1e3a5f] rounded-full px-3 py-1.5" aria-live="polite">
          {results.length} of {cases.length} cases
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-3 items-center">
        <label className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
          <span className="sr-only">Search cases by ID, name, or category</span>
          <input
            type="search"
            value={query}
            onChange={event => { setQuery(event.target.value); setShowAll(false); }}
            placeholder="Search case ID, name or category"
            className="w-full rounded-xl border border-[#31516e] bg-[#08192d] px-10 py-2.5 text-sm text-white placeholder:text-slate-400 outline-none focus:border-[#5cc2bd] focus:ring-2 focus:ring-[#5cc2bd]/30"
          />
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          <ArrowUpDown className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <label htmlFor="case-explorer-sort" className="sr-only">Sort cases</label>
          <select id="case-explorer-sort" value={sort} onChange={event => setSort(event.target.value as SortMode)}
            className="rounded-xl border border-[#31516e] bg-[#08192d] px-3 py-2.5 text-xs sm:text-sm text-white">
            <option value="recent">Recently updated</option>
            <option value="name">Name A–Z</option>
            <option value="attendance">Lowest attendance</option>
          </select>
          <div role="group" aria-label="Case display layout" className="flex overflow-hidden rounded-lg border border-[#31516e]">
            <button type="button" aria-label="Card view" aria-pressed={view === 'cards'} onClick={() => setView('cards')}
              className={`p-2.5 transition-colors ${view === 'cards' ? 'bg-[#0369a1] text-white' : 'text-slate-300 hover:bg-[#173653]'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button type="button" aria-label="List view" aria-pressed={view === 'list'} onClick={() => setView('list')}
              className={`p-2.5 transition-colors ${view === 'list' ? 'bg-[#0369a1] text-white' : 'text-slate-300 hover:bg-[#173653]'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter cases by workflow">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
        {tabs.map(tab => (
          <button key={tab.id} type="button" aria-pressed={filter === tab.id}
            onClick={() => { setFilter(tab.id); setShowAll(false); }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5cc2bd] ${filter === tab.id ? 'bg-[#0369a1] border-[#38bdf8] text-white' : 'bg-[#10263e] border-[#31516e] text-slate-200 hover:bg-[#173653]'}`}>
            {tab.label} <span className="opacity-75 ml-1">{tab.count}</span>
          </button>
        ))}
        {hasControls && (
          <button type="button" onClick={() => { setQuery(''); setFilter('all'); setSort('recent'); setShowAll(false); }}
            className="text-xs font-semibold text-[#7dd3fc] px-2 py-1.5 inline-flex items-center gap-1 hover:underline">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        )}
      </div>

      {visible.length ? (
        <div aria-live="polite" className={view === 'cards' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3' : 'flex flex-col gap-2'}>
          {visible.map(record => {
            const needsFollowup = !record.decision || record.session_attendance < 75;
            const progress = percentage(record.assessment_completeness);
            const pos = getOffenderPos(record);
            return (
              <article key={record.id} className={`group rounded-xl border border-[#28425b] bg-[#0d2239] hover:border-[#5cc2bd] transition-all p-4 ${view === 'list' ? 'sm:flex sm:items-center sm:justify-between sm:gap-5' : ''}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-mono font-semibold text-[#7dd3fc]">{record.id}</span>
                    <span className={`text-[10px] uppercase tracking-wide rounded-full px-2 py-1 border ${needsFollowup ? 'bg-amber-500/10 border-amber-600/40 text-amber-200' : 'bg-emerald-500/10 border-emerald-600/40 text-emerald-200'}`}>
                      {needsFollowup ? 'Follow-up' : 'On track'}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm sm:text-base mt-2 truncate">{record.first_name} {record.last_name}</h3>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{record.crime_type} · {pos == null ? 'Stage not assigned' : `Pathway stage ${pos + 1}/12`}</p>
                  <div className="flex items-center justify-between text-xs text-slate-300 mt-3 mb-1">
                    <span>Assessment progress</span>
                    <span className="tabular-nums">{Math.round(progress)}%</span>
                  </div>
                  <div role="progressbar" aria-label={`Assessment completion for ${record.id}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}
                    className="h-2 rounded-full bg-[#203c58] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#0284c7] to-[#5cc2bd] transition-[width] duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div className={`flex gap-2 mt-4 ${view === 'list' ? 'sm:mt-0 sm:shrink-0' : ''}`}>
                  <button type="button" onClick={() => openRecord(record.id)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0369a1] hover:bg-[#0284c7] px-3 py-2 text-xs font-semibold text-white transition-colors">
                    Open case <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => openRecord(record.id, 'prog')}
                    className="inline-flex items-center justify-center rounded-lg border border-[#31516e] bg-[#0f2744] hover:bg-[#163860] px-3 py-2 text-xs font-semibold text-slate-200 transition-colors">
                    Pathway
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#31516e] bg-[#08192d] p-8 text-center">
          <p className="text-white font-semibold">No matching cases</p>
          <p className="text-xs text-slate-400 mt-1">Try another search term or filter. No records were changed.</p>
          {hasControls && <button type="button" onClick={() => { setQuery(''); setFilter('all'); setSort('recent'); setShowAll(false); }} className="mt-3 rounded-lg bg-[#0369a1] px-4 py-2 text-xs font-semibold text-white">Show all cases</button>}
        </div>
      )}

      {results.length > 6 && (
        <button type="button" onClick={() => setShowAll(value => !value)}
          className="w-full rounded-lg border border-[#31516e] bg-[#10263e] py-2.5 text-sm font-semibold text-slate-200 hover:bg-[#173653] transition-colors">
          {showAll ? 'Show fewer cases' : `Show all ${results.length} matching cases`}
        </button>
      )}
    </section>
  );
};
