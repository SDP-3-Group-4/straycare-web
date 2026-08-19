import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BadgeCheck,
  Calendar,
  Camera,
  CreditCard,
  FileText,
  Loader2,
  Stethoscope,
  Upload,
  User as UserIcon,
  X,
} from 'lucide-react';
import { submitVetApplication } from '../../../services/api';

interface VetVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  email: string | null;
  displayName: string;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const eighteenYearsAgo = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split('T')[0];
};

export default function VetVerificationModal({ isOpen, onClose, userId, email, displayName }: VetVerificationModalProps) {
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [clinic, setClinic] = useState('');
  const [nid, setNid] = useState('');
  const [photo, setPhoto] = useState<{ name: string; dataUrl: string; base64: string } | null>(null);
  const [doc, setDoc] = useState<{ name: string; size: number; mimeType: string; base64: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFullName(displayName || '');
      setDob('');
      setClinic('');
      setNid('');
      setPhoto(null);
      setDoc(null);
      setErrors({});
      setSubmitted(false);
    }
  }, [isOpen, displayName]);

  if (!isOpen) return null;

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors((e) => ({ ...e, photo: 'Please upload an image (JPG/PNG).' }));
      return;
    }
    const base64 = await fileToBase64(file);
    const reader = new FileReader();
    reader.onload = () =>
      setPhoto({ name: file.name, dataUrl: reader.result as string, base64 });
    reader.readAsDataURL(file);
  };

  const pickDoc = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setErrors((e) => ({ ...e, doc: 'PDF format only.' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((e) => ({ ...e, doc: 'Document must be under 5 MB.' }));
      return;
    }
    setDoc({ name: file.name, size: file.size, mimeType: file.type, base64: await fileToBase64(file) });
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = 'Please enter your full name';
    if (!dob) next.dob = 'Please select your date of birth';
    if (!clinic.trim()) next.clinic = 'Please enter your current workplace';
    if (!nid.trim()) next.nid = 'Please enter your NID number';
    if (!photo) next.photo = 'Please upload a formal picture';
    if (!doc) next.doc = 'Please upload verification documents (PDF)';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await submitVetApplication({
        userId,
        fullName: fullName.trim(),
        dob,
        clinic: clinic.trim(),
        nid: nid.trim(),
        photoName: photo?.name,
        photoBase64: photo?.base64,
        docName: doc?.name,
        docMimeType: doc?.mimeType,
        docBase64: doc?.base64,
      });
      setSubmitted(true);
    } catch (e) {
      console.error('Failed to submit vet application', e);
      setErrors((prev) => ({ ...prev, form: 'Submission failed. Please try again.' }));
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-md overflow-hidden flex flex-col border border-[var(--sc-border)] shadow-xl animate-in fade-in zoom-in duration-200 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--sc-border)] bg-gray-50/50">
          <div className="flex items-center gap-2">
            <BadgeCheck size={20} className="text-[var(--sc-brand-600)]" />
            <h2 className="text-lg font-bold text-[var(--sc-text-primary)]">Vet Verification</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 p-2 rounded-full transition-colors border border-[var(--sc-border)]"
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          /* Success state */
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4">
              <BadgeCheck size={32} />
            </div>
            <h3 className="text-lg font-bold text-[var(--sc-text-primary)] mb-2">Submission Received</h3>
            <p className="text-[var(--sc-text-secondary)] text-sm">
              Your verification request and documents have been submitted successfully. We will review them shortly.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full py-2.5 font-bold text-white bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Body */}
            <div className="p-5 overflow-y-auto flex flex-col gap-4">
              <p className="text-[13px] text-gray-500 text-center -mt-1">
                Please provide accurate information and authentic documents. Our team will verify your details.
              </p>

              {/* Formal Picture */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[var(--sc-brand-200)] bg-gray-100 flex items-center justify-center">
                    {photo ? (
                      <img src={photo.dataUrl} alt="Formal" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={40} className="text-gray-400" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-[var(--sc-brand-600)] text-white p-2 rounded-full shadow-md hover:bg-[var(--sc-brand-700)] transition-colors"
                    aria-label="Upload formal picture"
                  >
                    <Camera size={16} />
                  </button>
                </div>
                <span className="text-[11px] text-gray-500 font-medium">Formal Picture</span>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => pickPhoto(e.target.files?.[0])}
                />
                {errors.photo && <span className="text-[12px] text-red-500 font-medium -mt-1">{errors.photo}</span>}
              </div>

              {/* Full Legal Name */}
              <div>
                <label className="text-[12px] font-bold text-gray-600 mb-1 block">Full Legal Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Shopnil Karmakar"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-[14px] outline-none transition-colors focus:border-[var(--sc-brand-400)] focus:ring-2 focus:ring-[var(--sc-brand-100)] ${
                    errors.fullName ? 'border-red-300 bg-red-50/30' : 'border-[var(--sc-border)] bg-gray-50'
                  }`}
                />
                {errors.fullName && <span className="text-[12px] text-red-500 font-medium">{errors.fullName}</span>}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="text-[12px] font-bold text-gray-600 mb-1 block flex items-center gap-1">
                  <Calendar size={13} /> Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  max={eighteenYearsAgo()}
                  onChange={(e) => setDob(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-[14px] outline-none transition-colors focus:border-[var(--sc-brand-400)] focus:ring-2 focus:ring-[var(--sc-brand-100)] ${
                    errors.dob ? 'border-red-300 bg-red-50/30' : 'border-[var(--sc-border)] bg-gray-50'
                  }`}
                />
                {errors.dob && <span className="text-[12px] text-red-500 font-medium">{errors.dob}</span>}
              </div>

              {/* Current Clinic */}
              <div>
                <label className="text-[12px] font-bold text-gray-600 mb-1 block flex items-center gap-1">
                  <Stethoscope size={13} /> Current Clinic / Medical Org
                </label>
                <input
                  type="text"
                  value={clinic}
                  onChange={(e) => setClinic(e.target.value)}
                  placeholder="e.g. Dhaka Pet Clinic"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-[14px] outline-none transition-colors focus:border-[var(--sc-brand-400)] focus:ring-2 focus:ring-[var(--sc-brand-100)] ${
                    errors.clinic ? 'border-red-300 bg-red-50/30' : 'border-[var(--sc-border)] bg-gray-50'
                  }`}
                />
                {errors.clinic && <span className="text-[12px] text-red-500 font-medium">{errors.clinic}</span>}
              </div>

              {/* NID Number */}
              <div>
                <label className="text-[12px] font-bold text-gray-600 mb-1 block flex items-center gap-1">
                  <CreditCard size={13} /> NID Number
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={nid}
                  onChange={(e) => setNid(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Your NID number"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-[14px] outline-none transition-colors focus:border-[var(--sc-brand-400)] focus:ring-2 focus:ring-[var(--sc-brand-100)] ${
                    errors.nid ? 'border-red-300 bg-red-50/30' : 'border-[var(--sc-border)] bg-gray-50'
                  }`}
                />
                {errors.nid && <span className="text-[12px] text-red-500 font-medium">{errors.nid}</span>}
              </div>

              {/* Verification Documents */}
              <div>
                <label className="text-[12px] font-bold text-gray-600 mb-1 block">Verification Documents</label>
                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-1.5 transition-colors ${
                    errors.doc ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50 hover:border-[var(--sc-brand-300)] hover:bg-[var(--sc-brand-50)]/40'
                  }`}
                >
                  {doc ? (
                    <>
                      <FileText size={28} className="text-red-400" />
                      <span className="text-[13px] font-bold text-gray-700 text-center max-w-full truncate">{doc.name}</span>
                      <span className="text-[11px] text-gray-500">{(doc.size / 1024).toFixed(1)} KB · Change file</span>
                    </>
                  ) : (
                    <>
                      <Upload size={24} className="text-[var(--sc-brand-500)]" />
                      <span className="text-[13px] font-semibold text-gray-600">Tap to upload certificates/documents</span>
                      <span className="text-[11px] text-gray-400">(PDF format only, max 5 MB)</span>
                    </>
                  )}
                </button>
                <input
                  ref={docInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => pickDoc(e.target.files?.[0])}
                />
                {errors.doc && <span className="text-[12px] text-red-500 font-medium">{errors.doc}</span>}
              </div>

              {errors.form && (
                <p className="text-[12px] text-red-500 font-semibold text-center bg-red-50 rounded-xl py-2">{errors.form}</p>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 pt-0">
              <p className="text-[11px] text-gray-400 mb-3 truncate">{email || 'Signed in'}</p>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3 font-bold text-white bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  <>Submit for Verification</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}