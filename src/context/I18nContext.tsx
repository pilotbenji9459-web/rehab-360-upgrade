import React, { createContext, useContext, useState, useEffect } from 'react';

export type LanguageCode = 'en' | 'hi';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeName: 'English (UK / Int)' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी (Hindi)' },
];

export const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Workspaces
    'workspace.facility': 'Facility Workspace',
    'workspace.facility.desc': 'Institution-wide governance, intake, reports, and administrative management',
    'workspace.person': 'Person Workspace',
    'workspace.person.desc': 'Individualised case trajectory, progression gates, clinical records, and handover',
    'workspace.switch_to_facility': 'Switch to Facility Workspace',
    'workspace.switch_to_person': 'Switch to Person Workspace',
    'workspace.current_case': 'Active Case File',
    'workspace.all_cases': 'All Facility Cases',
    'workspace.no_case_selected': 'No case selected',

    // Navigation Tabs
    'nav.dashboard': 'Facility Dashboard',
    'nav.cases': 'Case Management',
    'nav.intake': 'Document Intake',
    'nav.intake_facility': 'Facility Intake Centre',
    'nav.plan': 'Rehabilitation Pathway',
    'nav.prog': 'Progression Gates',
    'nav.clinical': 'Clinical Notes',
    'nav.flags': 'Clinical Indicators',
    'nav.trend': 'Progress Trends',
    'nav.mx': 'Domain Matrix',
    'nav.hand': 'Parole Handover',
    'nav.rep': 'Reports & Exports',
    'nav.staff': 'Staff & Permissions',
    'nav.audit': 'Audit Trail',
    'nav.settings': 'Settings & Deployment',
    'nav.guide': 'System Blueprint',

    // Common Actions
    'action.save': 'Save Changes',
    'action.cancel': 'Cancel',
    'action.approve': 'Approve',
    'action.reject': 'Reject',
    'action.modify': 'Modify',
    'action.override': 'Override',
    'action.upload': 'Upload Document',
    'action.verify': 'Verify Evidence',
    'action.commit': 'Commit Verified Changes',
    'action.export_csv': 'Export Caseload (CSV)',
    'action.new_case': 'Register New Case',
    'action.login': 'Sign In',
    'action.logout': 'Sign Out',
    'action.advance_stage': 'Advance Pathway Stage',
    'action.view_file': 'Open Case File',

    // Statuses
    'status.verified': 'Human Verified',
    'status.pending': 'Pending Review',
    'status.approved': 'Approved',
    'status.modified': 'Modified by Human Officer',
    'status.overridden': 'Statutory Override',
    'status.rejected': 'Rejected',
    'status.restricted': 'Restricted Access',
    'status.saved': 'All changes saved',
    'status.saving': 'Saving draft...',
    'status.unsaved': 'Unsaved edits',

    // Roles
    'role.Administrator': 'Executive Administrator',
    'role.Warden': 'Governor / Warden',
    'role.Psychologist': 'Clinical Psychologist',
    'role.CaseManager': 'Rehabilitation Case Manager',
    'role.Educator': 'Education & Vocational Officer',
    'role.CommunityOfficer': 'Community Rehabilitation / Probation Officer',

    // Headers & Labels
    'app.title': 'RehabPath360',
    'app.tagline': 'Enterprise Rehabilitation Management & Decision-Support Platform',
    'theme.toggle_light': 'Light mode',
    'theme.toggle_dark': 'Dark mode',
    'language.select': 'Language',
  },
  hi: {
    // Workspaces
    'workspace.facility': 'संस्थान कार्यक्षेत्र (Facility Workspace)',
    'workspace.facility.desc': 'संस्थान-व्यापी प्रशासन, दस्तावेज़ सेवन, रिपोर्ट और कर्मचारी प्रबंधन',
    'workspace.person': 'व्यक्तिगत मामला कार्यक्षेत्र (Person Workspace)',
    'workspace.person.desc': 'व्यक्तिगत पुनर्वास पथ, प्रगति द्वार, क्लिनिकल रिकॉर्ड और हैंडओवर',
    'workspace.switch_to_facility': 'संस्थान कार्यक्षेत्र पर जाएं',
    'workspace.switch_to_person': 'व्यक्तिगत मामले पर जाएं',
    'workspace.current_case': 'सक्रिय मामला फ़ाइल',
    'workspace.all_cases': 'सभी संस्थान मामले',
    'workspace.no_case_selected': 'कोई मामला चयनित नहीं',

    // Navigation Tabs
    'nav.dashboard': 'संस्थान डैशबोर्ड',
    'nav.cases': 'मामला प्रबंधन',
    'nav.intake': 'दस्तावेज़ सेवन',
    'nav.intake_facility': 'संस्थान दस्तावेज़ केंद्र',
    'nav.plan': 'पुनर्वास मार्ग योजना',
    'nav.prog': 'प्रगति द्वार',
    'nav.clinical': 'क्लिनिकल नोट्स',
    'nav.flags': 'क्लिनिकल संकेतक',
    'nav.trend': 'प्रगति रुझान',
    'nav.mx': 'डोमेन मैट्रिक्स',
    'nav.hand': 'पैरोल हैंडओवर',
    'nav.rep': 'रिपोर्ट और निर्यात',
    'nav.staff': 'कर्मचारी एवं अनुमतियाँ',
    'nav.audit': 'ऑडिट ट्रेल',
    'nav.settings': 'सेटिंग्स और परिनियोजन',
    'nav.guide': 'सिस्टम ब्लूप्रिंट',

    // Common Actions
    'action.save': 'परिवर्तन सहेजें',
    'action.cancel': 'रद्द करें',
    'action.approve': 'स्वीकृत करें',
    'action.reject': 'अस्वीकृत करें',
    'action.modify': 'संशोधित करें',
    'action.override': 'ओवरराइड करें',
    'action.upload': 'दस्तावेज़ अपलोड करें',
    'action.verify': 'साक्ष्य सत्यापित करें',
    'action.commit': 'सत्यापित परिवर्तन लागू करें',
    'action.export_csv': 'डेटा निर्यात (CSV)',
    'action.new_case': 'नया मामला पंजीकृत करें',
    'action.login': 'साइन इन करें',
    'action.logout': 'साइन आउट',
    'action.advance_stage': 'अगले स्तर पर आगे बढ़ें',
    'action.view_file': 'मामला फ़ाइल खोलें',

    // Statuses
    'status.verified': 'मानव सत्यापित',
    'status.pending': 'समीक्षा लंबित',
    'status.approved': 'स्वीकृत',
    'status.modified': 'अधिकारी द्वारा संशोधित',
    'status.overridden': 'वैधानिक अधिभार',
    'status.rejected': 'अस्वीकृत',
    'status.restricted': 'प्रतिबंधित पहुंच',
    'status.saved': 'सभी परिवर्तन सहेजे गए',
    'status.saving': 'सहेजा जा रहा है...',
    'status.unsaved': 'असंरक्षित परिवर्तन',

    // Roles
    'role.Administrator': 'कार्यकारी प्रशासक',
    'role.Warden': 'अधीक्षक / वार्डन',
    'role.Psychologist': 'क्लिनिकल मनोवैज्ञानिक',
    'role.CaseManager': 'पुनर्वास केस प्रबंधक',
    'role.Educator': 'शिक्षा एवं व्यावसायिक अधिकारी',
    'role.CommunityOfficer': 'सामुदायिक पुनर्वास / प्रोबेशन अधिकारी',

    // Headers & Labels
    'app.title': 'RehabPath360',
    'app.tagline': 'उद्यम पुनर्वास प्रबंधन एवं निर्णय-समर्थन प्लेटफ़ॉर्म',
    'theme.toggle_light': 'लाइट मोड',
    'theme.toggle_dark': 'डार्क मोड',
    'language.select': 'भाषा (Language)',
  },
};

interface I18nContextType {
  language: LanguageCode;
  locale: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  setLocale: (lang: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  locale: 'en',
  setLanguage: () => {},
  setLocale: () => {},
  t: (key, fallback) => fallback || key,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const stored = localStorage.getItem('rehabpath360:lang');
      if (stored === 'en' || stored === 'hi') return stored;
    } catch {
      // Storage fallback
    }
    return 'en';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('rehabpath360:lang', lang);
    } catch {
      // Storage fallback
    }
  };

  const t = (key: string, fallback?: string): string => {
    const langDict = translations[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to English
    if (translations.en[key]) {
      return translations.en[key];
    }
    return fallback || key;
  };

  return (
    <I18nContext.Provider
      value={{
        language,
        locale: language,
        setLanguage,
        setLocale: setLanguage,
        t,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
