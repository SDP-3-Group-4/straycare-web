import { createPortal } from "react-dom";
import {
  FileText,
  ShieldAlert,
  HeartHandshake,
  HelpCircle,
  X,
  Check,
} from "lucide-react";

export type PolicyType = "terms" | "privacy" | "community" | "support";

interface PolicyModalProps {
  type: PolicyType | null;
  onClose: () => void;
}

const POLICY_DATA = {
  terms: {
    title: "Terms of Service & Usage",
    icon: FileText,
    badge: "Legal Agreement",
    content: [
      {
        heading: "1. Community Rescue Network Purpose",
        body: "StrayCare is an open social platform dedicated to animal rescue, medical crowd-support, and pet adoption. Users agree to use the platform solely for lawful, authentic, and humane animal welfare activities.",
      },
      {
        heading: "2. Fundraiser Integrity & Accountability",
        body: "All veterinary donation campaigns must reflect genuine animal treatments. StrayCare reserves the right to request proof of medical invoices from verified veterinary clinics for high-volume campaigns.",
      },
      {
        heading: "3. Content Standards & Zero Cruelty Policy",
        body: "Any depiction or promotion of animal abuse, illegal wildlife trading, or fraudulent rescue claims is strictly prohibited and will result in immediate permanent account termination.",
      },
    ],
  },
  privacy: {
    title: "Privacy & Data Protection Policy",
    icon: ShieldAlert,
    badge: "Privacy Protocol",
    content: [
      {
        heading: "1. Rescuer Location Security",
        body: "You have complete individual autonomy over your location data. You can switch between Exact GPS, City-Level Area Only, or completely Hidden modes at any time in Settings.",
      },
      {
        heading: "2. End-to-End Data Ownership",
        body: "You own your data. You can export your full posts, donation records, and network connections as a JSON archive at any time via the Download My Data tool.",
      },
      {
        heading: "3. Third-Party Sharing",
        body: "StrayCare does not sell or broker personal data to advertisers. Contact details are only shared with clinics or rescuers when explicitly initiated by you.",
      },
    ],
  },
  community: {
    title: "Community Rescue Guidelines",
    icon: HeartHandshake,
    badge: "Safety Standards",
    content: [
      {
        heading: "1. Accurate Case Tagging",
        body: "Mark emergency and injured animal posts with the appropriate category (Rescue / Medical / Adoption) to ensure nearby volunteers can respond effectively.",
      },
      {
        heading: "2. Respectful Discourse",
        body: "Maintain a supportive environment for animal lovers, rescuers, and veterinary practitioners. Bullying or harassment will not be tolerated.",
      },
    ],
  },
  support: {
    title: "Help Center & Contact Support",
    icon: HelpCircle,
    badge: "24/7 Assistance",
    content: [
      {
        heading: "Emergency Hotline & Clinic Support",
        body: "For urgent life-threatening animal emergencies, please use the Nearby 24/7 Clinics Map in the navigation bar to directly dial active veterinary emergency rooms.",
      },
      {
        heading: "Technical Support & Feature Feedback",
        body: "Have questions, found a bug, or want to partner as a licensed clinic? Reach our developer and community team directly at support@straycare.org or visit our GitHub project repository.",
      },
    ],
  },
};

export default function PolicyModal({ type, onClose }: PolicyModalProps) {
  if (!type) return null;

  const data = POLICY_DATA[type];
  const Icon = data.icon;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl w-full max-w-lg overflow-hidden flex flex-col border border-[var(--sc-border)] shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--sc-border)] bg-gray-50/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-purple-50 text-[var(--sc-brand-600)] shrink-0">
              <Icon size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-[var(--sc-brand-600)] block">
                {data.badge}
              </span>
              <h2 className="text-base font-bold text-[var(--sc-text-primary)] truncate">
                {data.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 p-2 rounded-full transition-colors border border-[var(--sc-border)] shrink-0"
          >
            <X size={17} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-4">
          {data.content.map((sec, idx) => (
            <div
              key={idx}
              className="p-4 bg-gray-50/80 rounded-2xl border border-[var(--sc-border)] flex flex-col gap-1.5"
            >
              <h4 className="font-bold text-sm text-[var(--sc-text-primary)]">
                {sec.heading}
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {sec.body}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--sc-border)] bg-gray-50/50">
          <button
            onClick={onClose}
            className="w-full py-2.5 font-bold text-white bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] rounded-xl transition-all shadow-xs text-xs"
          >
            Got it, thanks
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
