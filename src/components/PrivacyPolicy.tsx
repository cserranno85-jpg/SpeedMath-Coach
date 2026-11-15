import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { PremiumGlassClass, PremiumScreen } from './PremiumShell';

interface PrivacyPolicyProps {
  onBack: () => void;
}

// Offline-accessible policy: no network connection or external browser is required.
export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => (
  <PremiumScreen className="gap-4 pb-8">
    <button
      id="btn_privacy_back"
      type="button"
      onClick={onBack}
      className="inline-flex min-h-[48px] items-center gap-2 self-start rounded-xl border border-cyan-200/35 bg-slate-950/75 px-4 text-sm font-semibold text-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
    >
      <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      Back to Settings
    </button>
    <article aria-labelledby="privacy-policy-title" className={`${PremiumGlassClass} space-y-5 p-5 text-sm leading-relaxed text-slate-100`}>
      <header>
        <h1 id="privacy-policy-title" className="text-2xl font-black text-white">Privacy Policy</h1>
        <p className="mt-2 text-cyan-100/75">SpeedMath Coach · Caivra Tech LLC</p>
        <p className="text-xs text-cyan-100/60">Effective date: June 6, 2026</p>
      </header>
      <section aria-labelledby="privacy-overview">
        <h2 id="privacy-overview" className="text-base font-bold text-cyan-200">Overview</h2>
        <p>SpeedMath Coach is a mental math practice application designed to help users complete quick arithmetic exercises. This version is designed to work locally on your device.</p>
      </section>
      <section aria-labelledby="privacy-collect">
        <h2 id="privacy-collect" className="text-base font-bold text-cyan-200">Information We Collect</h2>
        <p>The app does not require an account or ask for your name, email, phone number, precise location, contacts, photos, microphone, camera, or other personal information. This version does not collect personal information from users or send personal information to Caivra Tech LLC servers.</p>
      </section>
      <section aria-labelledby="privacy-local">
        <h2 id="privacy-local" className="text-base font-bold text-cyan-200">Local App Activity</h2>
        <p>Exercise progress, scores, settings, and sound preferences are stored locally on your device. The app does not provide cloud syncing. On Android, the app opts out of automatic cloud backup and requests exclusion of app data from device-to-device transfers; operating-system and device-manufacturer behavior may vary.</p>
        <p>Local progress may be lost if you uninstall the app, clear its data, or replace or reset your device.</p>
      </section>
      <section aria-labelledby="privacy-retention">
        <h2 id="privacy-retention" className="text-base font-bold text-cyan-200">Retention and Deletion</h2>
        <p>Locally stored progress and preferences remain until you clear the app data or uninstall it, subject to operating-system behavior. Caivra Tech LLC does not keep a server-side copy and cannot remotely restore this activity.</p>
      </section>
      <section aria-labelledby="privacy-tracking">
        <h2 id="privacy-tracking" className="text-base font-bold text-cyan-200">Analytics, Ads, and Tracking</h2>
        <p>This version does not use third-party advertising or analytics SDKs and does not track users across apps or websites.</p>
      </section>
      <section aria-labelledby="privacy-sharing">
        <h2 id="privacy-sharing" className="text-base font-bold text-cyan-200">Data Sharing</h2>
        <p>We do not sell, rent, or share personal information from SpeedMath Coach users. This version does not collect personal information to share with advertisers or data brokers.</p>
      </section>
      <section aria-labelledby="privacy-children">
        <h2 id="privacy-children" className="text-base font-bold text-cyan-200">Children's Privacy</h2>
        <p>SpeedMath Coach is a general-audience educational app and does not knowingly collect personal information from children. If you believe a child has provided personal information, please contact us for review.</p>
      </section>
      <section aria-labelledby="privacy-security">
        <h2 id="privacy-security" className="text-base font-bold text-cyan-200">Security</h2>
        <p>This version is intended for local use without accounts or cloud syncing, reducing privacy exposure. No method of software operation or electronic storage can be guaranteed completely secure.</p>
      </section>
      <section aria-labelledby="privacy-changes">
        <h2 id="privacy-changes" className="text-base font-bold text-cyan-200">Changes</h2>
        <p>If future versions add accounts, cloud features, analytics, advertising, purchases, or other services, this policy will be updated to explain the relevant practices.</p>
      </section>
      <section aria-labelledby="privacy-contact">
        <h2 id="privacy-contact" className="text-base font-bold text-cyan-200">Contact Us</h2>
        <p>Caivra Tech LLC</p>
        <p>Email: support@caivra.com</p>
        <p>Phone: (800) 983-5035</p>
        <p>Address: 3943 Irvine Blvd. suite 2155, Irvine, CA 92602</p>
      </section>
    </article>
  </PremiumScreen>
);
