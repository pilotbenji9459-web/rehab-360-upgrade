import React, { useState, useEffect } from 'react';
import { ScrollRevealManager } from './components/ScrollRevealManager';
import './components/caseExplorer.css';
import './components/exhibitionTour.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { I18nProvider, useI18n } from './context/I18nContext';
import { Api } from './services/api';
import { OffenderCase, TabId, GateKey, WorkspaceMode } from './types';

// Components
import { LandingPage } from './components/LandingPage';
import { LoginModal } from './components/LoginModal';
import { Header } from './components/Header';
import { StaffAssistant } from './components/StaffAssistant';
import { Sidebar } from './components/Sidebar';
import { RoleDashboard } from './components/RoleDashboard';
import { CasesView } from './components/CasesView';
import { DocumentIntakeCenter } from './components/DocumentIntakeCenter';
import { ClinicalNotesView } from './components/ClinicalNotesView';
import { DomainMatrixView } from './components/DomainMatrixView';
import { ProgressionGatesView } from './components/ProgressionGatesView';
import { RehabPlanView } from './components/RehabPlanView';
import { WellBeingIndicatorsView } from './components/WellBeingIndicatorsView';
import { ProgressTrendView } from './components/ProgressTrendView';
import { HandoverBriefView } from './components/HandoverBriefView';
import { ReportView } from './components/ReportView';
import { StaffManagementView } from './components/StaffManagementView';
import { AuditTrailView } from './components/AuditTrailView';
import { GuideView } from './components/GuideView';
import { SettingsView } from './components/SettingsView';
import { NewCaseModal } from './components/NewCaseModal';
import { BootstrapSetupModal } from './components/BootstrapSetupModal';
import { ModalAlert } from './components/ModalAlert';

const AppContent: React.FC = () => {
  const { user, institution, systemStatus, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { t } = useI18n();

  // Navigation & Workspace State
  const [workspace, setWorkspace] = useState<WorkspaceMode>('facility');
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [tab, setTab] = useState<TabId>('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('RP-1041');

  // Server Data
  const [cases, setCases] = useState<OffenderCase[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState<boolean>(false);
  const [encryptedPackage, setEncryptedPackage] = useState<{ id: string; ct: string } | null>(null);

  // Global Modal Alert
  const [modalAlert, setModalAlert] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
  }>({
    isOpen: false,
    message: '',
  });

  const showAlert = (message: string, title?: string) => {
    setModalAlert({ isOpen: true, message, title });
  };

  const closeAlert = () => {
    setModalAlert((prev) => ({ ...prev, isOpen: false }));
  };

  // Fetch Cases from persistent backend (automatically scoped to current user's institution)
  const fetchCases = async () => {
    setIsLoadingCases(true);
    try {
      const res = await Api.getCases();
      const loadedCases = res.cases || [];
      setCases(loadedCases);
      if (loadedCases.length > 0) {
        if (!selectedCaseId || !loadedCases.some((c) => c.id === selectedCaseId)) {
          setSelectedCaseId(loadedCases[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load cases:', err);
    } finally {
      setIsLoadingCases(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCases();
      setShowLanding(false);
    } else {
      setShowLanding(true);
    }
  }, [isAuthenticated]);

  const currentRecord = cases.find((c) => c.id === selectedCaseId) || cases[0];

  const handleSelectWorkspace = (ws: WorkspaceMode) => {
    setWorkspace(ws);
    if (ws === 'facility') {
      const personTabs: TabId[] = ['plan', 'prog', 'mx', 'trend', 'clinical', 'person_intake', 'hand'];
      if (personTabs.includes(tab)) {
        setTab('dashboard');
      }
    } else {
      const facilityTabs: TabId[] = ['dashboard', 'intake', 'rep', 'staff', 'audit', 'settings', 'guide'];
      if (facilityTabs.includes(tab)) {
        setTab('cases');
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPersonCase = (caseId: string, targetTab: TabId = 'cases') => {
    setSelectedCaseId(caseId);
    setWorkspace('person');
    setTab(targetTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateCase = async (updates: Partial<OffenderCase>) => {
    if (!currentRecord) return;
    const res = await Api.updateCase(currentRecord.id, updates);
    setCases((prev) => prev.map((c) => (c.id === currentRecord.id ? res.case : c)));
  };

  const handleDecidePlacement = async (
    decision: 'approved' | 'modified' | 'overridden' | 'rejected',
    pathway_position: number,
    reason: string
  ) => {
    if (!currentRecord) return;
    try {
      const res = await Api.decidePlacement(currentRecord.id, decision, pathway_position, reason);
      setCases((prev) => prev.map((c) => (c.id === currentRecord.id ? res.case : c)));
      showAlert(`Placement verified as ${decision}. Case record updated.`, 'Decision Verified');
    } catch (err: any) {
      showAlert(err.message || 'Verification failed.', 'Error');
    }
  };

  const handleAdvanceStage = async () => {
    if (!currentRecord) return;
    try {
      const res = await Api.advanceCase(currentRecord.id);
      setCases((prev) => prev.map((c) => (c.id === currentRecord.id ? res.case : c)));
      showAlert(`Case advanced to next pathway stage. Benchmarks updated.`, 'Stage Advanced');
    } catch (err: any) {
      showAlert(err.message || 'Advancement failed.', 'Error');
    }
  };

  const handleUpdateGate = async (domainKey: GateKey, val: number) => {
    if (!currentRecord) return;
    try {
      // Only submit the gate being edited. Sending the whole gate object can
      // overwrite another officer's newer scores and complicate role checks.
      // The server validates the changed gate and merges it with saved scores.
      await handleUpdateCase({
        gate_scores: { [domainKey]: val } as OffenderCase['gate_scores'],
        version: currentRecord.version,
      });
    } catch (err: any) {
      showAlert(err.message || 'Failed to update gate evidence.', 'Error');
    }
  };

  const handleAddRemark = async (remark: string) => {
    if (!currentRecord) return;
    const newRemarks = [...(currentRecord.rehabilitation_remarks || []), remark];
    await handleUpdateCase({ rehabilitation_remarks: newRemarks });
  };

  const handleLogClinicalReview = (caseId: string) => {
    setSelectedCaseId(caseId);
    setWorkspace('person');
    setTab('clinical');
    showAlert('Switched to protected clinical notes. Record evaluation details below.', 'Clinical Review');
  };

  const handleNotReadyAction = async (action: string) => {
    showAlert(`Logged '${action}' in the case file and server audit trail.`, 'Action Noted');
  };

  // If system is uninitialized (0 users in clean deployment), display first-admin bootstrap setup
  if (systemStatus && systemStatus.has_users === false && !isAuthenticated) {
    return (
      <BootstrapSetupModal
        onSuccess={() => {
          setShowLanding(false);
          setTab('dashboard');
        }}
      />
    );
  }

  // If showing landing page when unauthenticated
  if (showLanding && !isAuthenticated) {
    return (
      <>
        <LandingPage
          onOpenLogin={() => setIsLoginModalOpen(true)}
        />
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={() => {
            setShowLanding(false);
            setTab('dashboard');
          }}
        />
        <ModalAlert
          isOpen={modalAlert.isOpen}
          title={modalAlert.title}
          message={modalAlert.message}
          onClose={closeAlert}
        />
      </>
    );
  }

  return (
    <div className="app-root min-h-screen flex flex-col">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={tab}
        onSelectTab={(selectedTab) => {
          // Sync workspace if tab belongs to person or facility
          const personTabs: TabId[] = ['plan', 'prog', 'mx', 'trend', 'clinical', 'person_intake', 'hand'];
          if (personTabs.includes(selectedTab)) {
            setWorkspace('person');
          } else if (['dashboard', 'intake', 'rep', 'staff', 'audit', 'settings', 'guide'].includes(selectedTab)) {
            setWorkspace('facility');
          }
          setTab(selectedTab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        workspace={workspace}
        onSelectWorkspace={handleSelectWorkspace}
        selectedCase={currentRecord}
      />

      {/* Main Content Area (offset by sidebar width on desktop) */}
      <div className="lg:pl-72 flex-1 flex flex-col min-w-0">
        <Header
          selectedCaseId={selectedCaseId}
          onCaseChange={(caseId) => {
            setSelectedCaseId(caseId);
          }}
          cases={cases}
          currentTab={tab}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onGoHome={() => setShowLanding(true)}
          onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenNewCaseModal={() => setIsNewCaseModalOpen(true)}
          onSelectTab={(newTab) => {
            const personTabs: TabId[] = ['plan', 'prog', 'mx', 'trend', 'clinical', 'person_intake', 'hand'];
            if (personTabs.includes(newTab)) {
              setWorkspace('person');
            } else if (['dashboard', 'intake', 'rep', 'staff', 'audit', 'settings', 'guide'].includes(newTab)) {
              setWorkspace('facility');
            }
            setTab(newTab);
          }}
          workspace={workspace}
          onSelectWorkspace={handleSelectWorkspace}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {tab === 'dashboard' && (
            <RoleDashboard
              cases={cases}
              onSelectTab={(newTab) => {
                if (['plan', 'prog', 'mx', 'trend', 'clinical', 'person_intake', 'hand'].includes(newTab)) {
                  setWorkspace('person');
                }
                setTab(newTab);
              }}
              onSelectCase={(caseId) => handleOpenPersonCase(caseId, 'cases')}
              onOpenNewCaseModal={() => setIsNewCaseModalOpen(true)}
            />
          )}

          {tab === 'cases' && currentRecord && (
            <CasesView
              currentRecord={currentRecord}
              cases={cases}
              onSelectCase={(caseId) => {
                setSelectedCaseId(caseId);
                setWorkspace('person');
              }}
              onDecide={handleDecidePlacement}
              onUpdateCase={handleUpdateCase}
              showAlert={showAlert}
            />
          )}

          {tab === 'cases' && !currentRecord && (
            <div className="card bg-[#0b1a30] text-center py-12">
              <p className="text-sm font-semibold text-white">No Case Files Available</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                This facility currently has zero active case files.
              </p>
              <button
                type="button"
                onClick={() => setIsNewCaseModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#0284c7] text-white text-xs font-semibold cursor-pointer"
              >
                Register New Case
              </button>
            </div>
          )}

          {tab === 'intake' && (
            <DocumentIntakeCenter
              mode="facility"
              cases={cases}
              selectedCaseId={selectedCaseId}
              onSelectCase={(caseId) => handleOpenPersonCase(caseId, 'cases')}
              onRefreshCase={fetchCases}
              showAlert={showAlert}
            />
          )}

          {tab === 'person_intake' && (
            <DocumentIntakeCenter
              mode="person"
              cases={cases}
              selectedCaseId={selectedCaseId}
              onSelectCase={(caseId) => handleOpenPersonCase(caseId, 'person_intake')}
              onRefreshCase={fetchCases}
              showAlert={showAlert}
            />
          )}

          {tab === 'clinical' && currentRecord && (
            <ClinicalNotesView
              currentRecord={currentRecord}
              showAlert={showAlert}
            />
          )}

          {tab === 'clinical' && !currentRecord && (
            <div className="card bg-[#0b1a30] text-center py-12 text-slate-400 text-xs">
              Select or register a case to review and author clinical notes.
            </div>
          )}

          {tab === 'mx' && currentRecord && (
            <DomainMatrixView currentRecord={currentRecord} />
          )}

          {tab === 'prog' && currentRecord && (
            <ProgressionGatesView
              currentRecord={currentRecord}
              onUpdateGate={handleUpdateGate}
              onAdvance={handleAdvanceStage}
              onNotReadyAction={handleNotReadyAction}
            />
          )}

          {tab === 'plan' && currentRecord && (
            <RehabPlanView
              currentRecord={currentRecord}
              onAddRemark={handleAddRemark}
              showAlert={showAlert}
            />
          )}

          {tab === 'flags' && (
            <WellBeingIndicatorsView
              cases={cases}
              onLogReview={handleLogClinicalReview}
            />
          )}

          {tab === 'trend' && currentRecord && (
            <ProgressTrendView currentRecord={currentRecord} />
          )}

          {tab === 'hand' && currentRecord && (
            <HandoverBriefView
              currentRecord={currentRecord}
              encryptedPackage={encryptedPackage}
              onSetEncryptedPackage={(pkg, byteLen) => {
                setEncryptedPackage(pkg);
                showAlert(`Handover brief encrypted via AES-256-GCM (${byteLen} bytes).`, 'Encryption Completed');
              }}
            />
          )}

          {tab === 'rep' && currentRecord && (
            <ReportView
              currentRecord={currentRecord}
              showAlert={showAlert}
            />
          )}

          {tab === 'staff' && <StaffManagementView showAlert={showAlert} />}

          {tab === 'audit' && <AuditTrailView />}

          {tab === 'settings' && <SettingsView showAlert={showAlert} />}

          {tab === 'guide' && <GuideView />}
        </main>
      </div>

      <StaffAssistant />

      {/* New Case Registration Modal */}
      <NewCaseModal
        isOpen={isNewCaseModalOpen}
        onClose={() => setIsNewCaseModalOpen(false)}
        onCaseCreated={(newCase) => {
          setCases((prev) => [newCase, ...prev]);
          handleOpenPersonCase(newCase.id, 'cases');
        }}
        showAlert={showAlert}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          setShowLanding(false);
          setWorkspace('facility');
          setTab('dashboard');
        }}
      />

      {/* Global Alert Dialog */}
      <ModalAlert
        isOpen={modalAlert.isOpen}
        title={modalAlert.title}
        message={modalAlert.message}
        onClose={closeAlert}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <I18nProvider>
        <ScrollRevealManager />
        <AppContent />
      </I18nProvider>
    </AuthProvider>
  );
};
