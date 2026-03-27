"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FEATURES,
  GITHUB,
  INSTALL_CMD,
  MARKETPLACE,
  NAV_ITEMS,
  PREVIEW_STACK,
  QUICK_PILLS,
  RELEASE_VERSION,
  SECURITY,
  SOCIAL_LINKS,
  STATS,
  VSCODE_MAC_URL,
  VSIX_FILE,
  VSIX_NAME,
} from "../data";
import { useActiveSection } from "../hooks/useActiveSection";
import { useCabinet } from "../hooks/useCabinet";
import { useDownloadManager } from "../hooks/useDownloadManager";
import { useFeatureModal } from "../hooks/useFeatureModal";
import { useNavIndicator } from "../hooks/useNavIndicator";
import { useTheme } from "../hooks/useTheme";
import { useToastQueue } from "../hooks/useToastQueue";
import styles from "../styles";
import { cx } from "../utils";
import { CabinetAuthModal } from "./CabinetAuthModal";
import { HelperAI } from "./HelperAI";
import { CtaSection } from "./CtaSection";
import { DownloadOverlay } from "./DownloadOverlay";
import { FeatureModal } from "./FeatureModal";
import { FeaturesSection } from "./FeaturesSection";
import { HeroSection } from "./HeroSection";
import { HomeNav } from "./HomeNav";
import { SecuritySection } from "./SecuritySection";
import { SocialSection } from "./SocialSection";
import { StatsSection } from "./StatsSection";
import { ToastStack } from "./ToastStack";
import { LangProvider } from "../context/LangContext";

function HomePageInner() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { theme } = useTheme();
  const { dismissToast, pushToast, toastLifetimeMs, toasts } = useToastQueue();
  const { activeSection, scrollToSection } = useActiveSection(NAV_ITEMS);
  const { navRefs, navTrackRef, indicator } = useNavIndicator(activeSection, theme);
  const { selectedFeature, selectedFeatureTitle, openFeature, closeFeature } =
    useFeatureModal();
  const { downloadState, triggerDownload } = useDownloadManager();
  const {
    accountData,
    authForm,
    authMessage,
    authMode,
    isAdmin,
    isAuthenticated,
    mfaPending,
    mfaCode,
    setMfaCode,
    submitMfa,
    sessionUser,
    setAuthField,
    setAuthMode,
    submitAuth,
    logout,
  } = useCabinet({
    features: FEATURES,
  });

  const downloadVsix = () => triggerDownload(VSIX_FILE, "AutoChecker VSIX", VSIX_NAME);
  const downloadVSCode = () =>
    triggerDownload(VSCODE_MAC_URL, "Visual Studio Code for macOS");

  const openCabinet = () => {
    if (isAuthenticated) {
      router.push("/cabinet");
      return;
    }

    setIsAuthModalOpen(true);
  };

  const submitCabinetAccess = async () => {
    const feedback = await submitAuth();

    if (feedback.tone === "info" && feedback.title === "Two-factor verification") {
      // MFA required — keep modal open, switch to code step
      return;
    }

    pushToast(feedback);

    if (!feedback.ok) return;

    setIsAuthModalOpen(false);
    router.push("/cabinet");
  };

  const handleMfaSubmit = async () => {
    const feedback = await submitMfa();
    pushToast(feedback);
    if (feedback.ok) {
      setIsAuthModalOpen(false);
      router.push("/cabinet");
    }
  };

  const handleLogout = async () => {
    const feedback = await logout();
    pushToast(feedback);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <main className={styles.main} data-theme={theme}>
      <div className={styles.bgMesh} />
      <div className={styles.noise} />
      <div className={styles.lights}>
        <div className={cx(styles.light, styles.lightOne)} />
        <div className={cx(styles.light, styles.lightTwo)} />
        <div className={cx(styles.light, styles.lightThree)} />
      </div>

      {!isMounted ? null : (
        <>
          <ToastStack
            lifetimeMs={toastLifetimeMs}
            onDismiss={dismissToast}
            toasts={toasts}
          />
          <DownloadOverlay state={downloadState} />
          <FeatureModal
            feature={selectedFeature}
            title={selectedFeatureTitle}
            onClose={closeFeature}
          />
          <CabinetAuthModal
            authForm={authForm}
            authMessage={authMessage}
            authMode={authMode}
            isOpen={isAuthModalOpen}
            mfaPending={mfaPending}
            mfaCode={mfaCode}
            onMfaCodeChange={setMfaCode}
            onMfaSubmit={() => void handleMfaSubmit()}
            onAuthFieldChange={setAuthField}
            onAuthModeChange={setAuthMode}
            onClose={() => setIsAuthModalOpen(false)}
            onSubmit={() => void submitCabinetAccess()}
            onGoogleLogin={() => { window.location.href = "/api/auth/oauth/google"; }}
          />

          <HomeNav
            activeSection={activeSection}
            isAuthenticated={isAuthenticated}
            isAdmin={isAdmin}
            accountData={accountData}
            userName={sessionUser?.name ?? ""}
            userEmail={sessionUser?.email ?? ""}
            navItems={NAV_ITEMS}
            navIndicator={indicator}
            navRefs={navRefs}
            navTrackRef={navTrackRef}
            onScrollToSection={scrollToSection}
            onOpenCabinet={openCabinet}
            onOpenDashboard={() => router.push("/cabinet")}
            onOpenSettings={() => router.push("/settings")}
            onOpenAdmin={() => router.push("/admin")}
            onLogout={() => void handleLogout()}
            onInstall={downloadVsix}
            githubUrl={GITHUB}
            version={RELEASE_VERSION}
          />

          <HeroSection
            installCommand={INSTALL_CMD}
            marketplaceUrl={MARKETPLACE}
            quickPills={QUICK_PILLS}
            features={FEATURES}
            previewStack={PREVIEW_STACK}
            themeLabel={`${theme} theme`}
            onDownloadVsix={downloadVsix}
            onDownloadVSCode={downloadVSCode}
            onOpenFeature={openFeature}
          />

          <StatsSection stats={STATS} />
          <FeaturesSection features={FEATURES} onOpenFeature={openFeature} />
          <SecuritySection securityItems={SECURITY} />
          <SocialSection links={SOCIAL_LINKS} />
          <CtaSection
            onDownloadVsix={downloadVsix}
            onDownloadVSCode={downloadVSCode}
          />

          {isAuthenticated && <HelperAI />}
        </>
      )}
    </main>
  );
}

export function HomePage() {
  return (
    <LangProvider>
      <HomePageInner />
    </LangProvider>
  );
}
