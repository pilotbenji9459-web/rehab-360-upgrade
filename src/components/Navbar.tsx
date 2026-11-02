import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { TabId, StaffRole } from '../types';

interface NavbarProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
}

const ROLE_TABS: Record<StaffRole, [TabId, string][]> = {
  Administrator: [
    ['dashboard', 'Executive Dashboard'],
    ['cases', 'Caseload & AI Placement'],
    ['intake', 'Document Intake & AI'],
    ['mx', 'Domain Matrix'],
    ['prog', 'Progression Gates'],
    ['plan', 'Rehab Plan'],
    ['clinical', 'Clinical Notes'],
    ['flags', 'Well-being Indicators'],
    ['trend', 'Review Trends'],
    ['rep', 'Reports & Export'],
    ['staff', 'Staff Accounts'],
    ['audit', 'Audit Trail'],
    ['guide', 'System Guide'],
  ],
  Warden: [
    ['dashboard', 'Custodial Dashboard'],
    ['cases', 'Caseload & AI Placement'],
    ['intake', 'Document Intake & AI'],
    ['mx', 'Domain Matrix'],
    ['prog', 'Progression Gates'],
    ['plan', 'Rehab Plan'],
    ['flags', 'Well-being Indicators'],
    ['trend', 'Review Trends'],
    ['hand', 'Parole Handover'],
    ['rep', 'Reports & Export'],
    ['staff', 'Staff Directory'],
    ['audit', 'Audit Trail'],
    ['guide', 'System Guide'],
  ],
  Psychologist: [
    ['dashboard', 'Clinical Dashboard'],
    ['cases', 'Caseload Directory'],
    ['intake', 'Psych Intake & AI'],
    ['clinical', 'Protected Clinical Notes'],
    ['flags', 'Clinical Indicators'],
    ['mx', 'Domain Matrix'],
    ['trend', 'Review Trends'],
    ['guide', 'System Guide'],
  ],
  'Case Manager': [
    ['dashboard', 'Care Dashboard'],
    ['cases', 'Caseload Directory'],
    ['intake', 'Document Intake & AI'],
    ['plan', 'Rehabilitation Plan'],
    ['mx', 'Domain Matrix'],
    ['trend', 'Review Trends'],
    ['rep', 'Reports & Export'],
    ['guide', 'System Guide'],
  ],
  Educator: [
    ['dashboard', 'Education Dashboard'],
    ['cases', 'Caseload Directory'],
    ['intake', 'Roster & Course Intake'],
    ['prog', 'Education & Skills Gates'],
    ['mx', 'Domain Matrix'],
    ['trend', 'Review Trends'],
    ['guide', 'System Guide'],
  ],
  'Community Rehabilitation Officer': [
    ['dashboard', 'Community Dashboard'],
    ['cases', 'Reintegration Caseload'],
    ['intake', 'Document Intake & AI'],
    ['hand', 'Encrypted Parole Handover'],
    ['rep', 'Reports & Export'],
    ['guide', 'System Guide'],
  ],
};

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const translatedTab: Record<string, string> = { dashboard: t('dashboard'), cases: t('cases'), intake: t('intake'), prog: t('progression'), plan: t('plan'), clinical: t('clinical'), flags: t('wellBeing'), hand: t('handover'), rep: t('reports'), staff: t('staff'), audit: t('audit'), guide: t('guide') };
  const tabs = (user && ROLE_TABS[user.role]) ? ROLE_TABS[user.role] : ROLE_TABS['Warden'];

  return (
    <nav className="main-nav" aria-label="Sections">
      {tabs.map(([tabId, label]) => {
        const isActive = tabId === currentTab;
        return (
          <button
            key={tabId}
            type="button"
            className={isActive ? 'on' : ''}
            onClick={() => onSelectTab(tabId)}
          >
            {translatedTab[tabId] || label}
          </button>
        );
      })}
    </nav>
  );
};
