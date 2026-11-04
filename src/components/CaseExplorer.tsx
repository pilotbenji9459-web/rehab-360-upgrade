import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ArrowUpDown, CheckCircle2, CircleDashed, Clock3, Grid2X2, List, RotateCcw, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
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
  const explorerRef = useRef<HTMLElement>(null);

  const results = useMemo(() => getCaseExplorerResults(cases, query, filter, sort), [cases, query, filter, sort]);
  const visible = showAll ? results : results.slice(0, 6);
  const hasControls = Boolean(query || filter !== 'all' || sort !== 'recent' || showAll);

  // Reveal new cards as they enter the viewport, respecting reduced-motion settings.
  useEffect(() => {
    const root = explorerRef.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-cx-reveal]'));
    if (typeof IntersectionObserver === 'undefined' ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach(item => item.classList.add('cx-visible'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).classList.add('cx-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px 36px 0px' });
    items.forEach(item => observer.observe(item));
    return () => observer.disconnect();
  }, [filter, query, sort, view, showAll, results]);

  const openRecord = (id: string, tab: TabId = 'cases') => {
    onSelectCase(id);
    onSelectTab(tab);
  };
  const reset = () => { setQuery(''); setFilter('all'); setSort('recent'); setShowAll(false); };
  const setWorkflow = (next: FilterMode) => {
    setFilter(next);
    setShowAll(false);
  };
  const tabs: { id: FilterMode; label: string; detail: string; count: number; icon: React.ElementType }[] = [
    { id: 'all', label: 'All cases', detail: 'Entire caseload', count: cases.length, icon: Grid2X2 },
    { id: 'pending', label: 'Pending', detail: 'Awaiting decision', count: cases.filter(c => !c.decision).length, icon: Clock3 },
    { id: 'attention', label: 'Follow-up', detail: 'Workflow follow-up', count: cases.filter(c => !c.decision || c.session_attendance < 75).length, icon: CircleDashed },
    { id: 'verified', label: 'Decided', detail: 'Decision recorded', count: cases.filter(c => Boolean(c.decision)).length, icon: CheckCircle2 },
  ];

  return (
    <section ref={explorerRef} aria-labelledby="case-explorer-heading" className="cx-shell" data-cx>
      <div className="cx-topline">
        <div className="cx-heading-wrap">
          <div className="cx-heading-icon" aria-hidden="true"><Sparkles size={20}/></div>
          <div>
            <div className="cx-eyebrow">CASE MANAGEMENT · LIVE WORKSPACE</div>
            <h2 id="case-explorer-heading" className="cx-title">Case Explorer</h2>
            <p className="cx-subtitle">Find a case, inspect its progress, and open its workflow in one click.</p>
          </div>
        </div>
        <div className="cx-total" role="status" aria-live="polite">
          <span className="cx-pulse" aria-hidden="true" />
          <strong>{results.length}</strong><span> / {cases.length} records</span>
        </div>
      </div>

      <div className="cx-toolbar">
        <label className="cx-search">
          <Search size={18} aria-hidden="true" className="cx-search-icon" />
          <span className="sr-only">Search by case ID, name or category</span>
          <input type="search" value={query} onChange={event => {setQuery(event.target.value);setShowAll(false);}}
            placeholder="Search ID, name or case category…" autoComplete="off" />
          {query && <button type="button" aria-label="Clear case search" onClick={() => setQuery('')} className="cx-search-clear"><X size={15}/></button>}
          <kbd className="cx-search-hint">SEARCH</kbd>
        </label>
        <div className="cx-toolbar-actions">
          <label className="cx-sort">
            <ArrowUpDown size={16} aria-hidden="true"/>
            <span className="sr-only">Sort cases</span>
            <select value={sort} onChange={event => setSort(event.target.value as SortMode)} aria-label="Sort cases">
              <option value="recent">Recently updated</option>
              <option value="name">Name A–Z</option>
              <option value="attendance">Lowest attendance</option>
            </select>
          </label>
          <div className="cx-view-switch" role="group" aria-label="Display layout">
            <button type="button" title="Card view" aria-label="Card view" aria-pressed={view === 'cards'} className={view === 'cards' ? 'cx-selected' : ''} onClick={() => setView('cards')}><Grid2X2 size={17}/></button>
            <button type="button" title="List view" aria-label="List view" aria-pressed={view === 'list'} className={view === 'list' ? 'cx-selected' : ''} onClick={() => setView('list')}><List size={17}/></button>
          </div>
        </div>
      </div>

      <div className="cx-filter-section">
        <div className="cx-filter-caption"><SlidersHorizontal size={14} aria-hidden="true"/> Filter by workflow</div>
        <div className="cx-filters" role="group" aria-label="Workflow status filters">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} type="button" title={tab.detail} aria-pressed={filter === tab.id}
                onClick={() => setWorkflow(tab.id)}
                className={`cx-filter ${filter === tab.id ? 'cx-active' : ''}`}>
                <Icon size={15} aria-hidden="true" />
                <span>{tab.label}</span><span className="cx-count">{tab.count}</span>
              </button>
            );
          })}
          {hasControls && <button type="button" className="cx-reset" onClick={reset}><RotateCcw size={14}/> Clear filters</button>}
        </div>
      </div>

      <div className="cx-results-summary" role="status" aria-live="polite">
        <span>{query ? `Search results for “${query}”` : tabs.find(t => t.id === filter)?.detail}</span>
        <span>{results.length === 1 ? '1 matching record' : `${results.length} matching records`}</span>
      </div>

      {visible.length ? (
        <div key={filter + '|' + sort + '|' + view + '|' + query + '|' + showAll} className={view === 'cards' ? 'cx-results cx-grid' : 'cx-results cx-list'}>
          {visible.map((record, index) => {
            const needsFollowup = !record.decision || record.session_attendance < 75;
            const progress = percentage(record.assessment_completeness);
            const pos = getOffenderPos(record);
            return (
              <article key={record.id} className="cx-case" data-cx-reveal style={{ ['--cx-order' as string]: Math.min(index, 7) }}>
                <div className="cx-case-top">
                  <span className="cx-case-id">{record.id}</span>
                  <span className={needsFollowup ? 'cx-status cx-attention' : 'cx-status cx-on-track'}>
                    <span className="cx-status-dot" aria-hidden="true"/>{needsFollowup ? 'Follow-up' : 'On track'}
                  </span>
                </div>
                <div className="cx-case-body">
                  <h3 className="cx-case-name">{record.first_name} {record.last_name}</h3>
                  <p className="cx-case-meta">{record.crime_type} <span aria-hidden="true">·</span> {pos == null ? 'Stage not assigned' : `Stage ${pos + 1} of 12`}</p>
                  <div className="cx-progress-head"><span>Assessment complete</span><strong>{Math.round(progress)}%</strong></div>
                  <div role="progressbar" aria-label={`Assessment completion for ${record.id}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} className="cx-progress">
                    <div className="cx-progress-fill" style={{ width: `${progress}%` }}/>
                  </div>
                </div>
                <div className="cx-case-actions">
                  <button type="button" className="cx-open" onClick={() => openRecord(record.id)}>Open case <ArrowRight size={16} aria-hidden="true"/></button>
                  <button type="button" className="cx-pathway" onClick={() => openRecord(record.id, 'prog')}>Pathway</button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="cx-empty" role="status">
          <Search size={24} aria-hidden="true" />
          <h3>No matching cases</h3>
          <p>Try another search term or workflow status. Nothing was changed.</p>
          <button type="button" onClick={reset}>Show all cases</button>
        </div>
      )}
      {results.length > 6 && (
        <button type="button" className="cx-show-more" onClick={() => setShowAll(v => !v)}>
          {showAll ? 'Show fewer records' : `Explore all ${results.length} matching records`} <ArrowRight size={16} aria-hidden="true"/>
        </button>
      )}
      <p className="cx-footnote">Only records already authorized for your account appear here. Follow-up refers to workflow status, not a clinical risk rating.</p>
    </section>
  );
};
