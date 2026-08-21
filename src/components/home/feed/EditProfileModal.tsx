import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Plus, Trash2, Loader2, User, AtSign, MapPin, Globe, Sparkles, Camera } from 'lucide-react';
import { updateUserProfile } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { avatarOnError } from '../../../constants';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    id?: string;
    name?: string;
    handle?: string;
    bio?: string;
    avatar?: string;
    photoUrl?: string;
    coverImage?: string;
    coverImageUrl?: string;
    location?: string;
    website?: string;
    pets?: { name: string; type: string; age?: string }[];
  };
  onProfileUpdate?: () => void;
}

export default function EditProfileModal({ isOpen, onClose, user: propUser, onProfileUpdate }: EditProfileModalProps) {
  const { user: authUser, updateLocalUser } = useAuth();
  const effectiveUser = propUser || (authUser as any) || {};

  const [name, setName] = useState(effectiveUser.name || effectiveUser.displayName || '');
  const [handle, setHandle] = useState(effectiveUser.handle || '');
  const [bio, setBio] = useState(effectiveUser.bio || '');
  const [avatar, setAvatar] = useState(effectiveUser.avatar || effectiveUser.photoUrl || effectiveUser.photoURL || '');
  const [coverImage, setCoverImage] = useState(effectiveUser.coverImage || effectiveUser.coverImageUrl || '');
  const [location, setLocation] = useState(effectiveUser.location || '');
  const [website, setWebsite] = useState(effectiveUser.website || '');
  const [pets, setPets] = useState<{ name: string; type: string; age?: string }[]>(effectiveUser.pets || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newPetName, setNewPetName] = useState('');
  const [newPetType, setNewPetType] = useState('dog');
  const [newPetAge, setNewPetAge] = useState('');

  if (!isOpen) return null;

  const handleAddPet = () => {
    if (newPetName.trim()) {
      setPets([...pets, { name: newPetName.trim(), type: newPetType, age: newPetAge.trim() }]);
      setNewPetName('');
      setNewPetAge('');
    }
  };

  const handleRemovePet = (index: number) => {
    setPets(pets.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const userId = effectiveUser.id || authUser?.uid;
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const sanitizedHandle = handle.trim().replace(/^@/, '').toLowerCase();
      await updateUserProfile(userId, {
        displayName: name.trim(),
        handle: sanitizedHandle || undefined,
        bio: bio.trim(),
        photoUrl: avatar.trim() || undefined,
        coverImageUrl: coverImage.trim() || undefined,
        location: location.trim(),
        website: website.trim(),
        pets,
      });

      updateLocalUser({
        displayName: name.trim(),
        handle: sanitizedHandle,
        bio: bio.trim(),
        photoUrl: avatar.trim() || undefined,
        photoURL: avatar.trim() || undefined,
        coverImageUrl: coverImage.trim() || undefined,
        location: location.trim(),
        website: website.trim(),
        pets,
      });

      window.dispatchEvent(new CustomEvent('straycare:profile-updated'));
      if (onProfileUpdate) onProfileUpdate();
      onClose();
    } catch (err: any) {
      console.error('Failed to update profile', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[var(--sc-border)] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--sc-border)] bg-gray-50/70">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-purple-50 text-[var(--sc-brand-600)]">
              <User size={18} />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--sc-text-primary)]">Edit Profile & Identity</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 p-2 rounded-full transition-colors border border-[var(--sc-border)]"
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200 font-medium">
              {error}
            </div>
          )}

          {/* Avatar Preview & URL */}
          <div className="flex items-center gap-3.5 p-3 bg-gray-50 rounded-2xl border border-[var(--sc-border)]">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-xs shrink-0 bg-gray-200 flex items-center justify-center">
              {avatar ? (
                <img src={avatar} alt="Avatar" onError={avatarOnError} className="w-full h-full object-cover" />
              ) : (
                <User size={24} className="text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Avatar Image URL
              </label>
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-1.5 bg-white border border-[var(--sc-border)] rounded-lg text-xs outline-none focus:border-[var(--sc-brand-400)]"
              />
            </div>
          </div>

          {/* Name & Handle Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-[var(--sc-border)] rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-[var(--sc-brand-400)] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Username Handle
              </label>
              <div className="relative">
                <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  placeholder="username"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-gray-50 border border-[var(--sc-border)] rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-[var(--sc-brand-400)] focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Bio & Rescuer Story
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell the community about your rescues and love for animals..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-[var(--sc-border)] rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-[var(--sc-brand-400)] focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Location & Website Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                City / Location
              </label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Dhaka, Bangladesh"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-gray-50 border border-[var(--sc-border)] rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-[var(--sc-brand-400)] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Website / Rescue Link
              </label>
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="e.g. rescue.org"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-gray-50 border border-[var(--sc-border)] rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-[var(--sc-brand-400)] focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Pets Section */}
          <div className="flex flex-col gap-2 pt-1 border-t border-[var(--sc-border)]">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
              Your Rescued Pets & Companions
            </label>

            {pets.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {pets.map((pet, idx) => (
                  <div key={idx} className="p-2.5 bg-gray-50 rounded-xl border border-[var(--sc-border)] flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-gray-700 truncate">
                      {pet.type === 'dog' ? '🐶' : pet.type === 'cat' ? '🐱' : '🐾'} {pet.name} {pet.age ? `(${pet.age})` : ''}
                    </span>
                    <button onClick={() => handleRemovePet(idx)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={newPetName}
                onChange={(e) => setNewPetName(e.target.value)}
                placeholder="Pet Name"
                className="flex-1 px-3 py-1.5 bg-gray-50 border border-[var(--sc-border)] rounded-lg text-xs outline-none focus:border-[var(--sc-brand-400)]"
              />
              <select
                value={newPetType}
                onChange={(e) => setNewPetType(e.target.value)}
                className="px-2 py-1.5 bg-gray-50 border border-[var(--sc-border)] rounded-lg text-xs outline-none"
              >
                <option value="dog">🐶 Dog</option>
                <option value="cat">🐱 Cat</option>
                <option value="bird">🦜 Bird</option>
                <option value="other">🐾 Other</option>
              </select>
              <button
                onClick={handleAddPet}
                className="p-1.5 bg-[var(--sc-brand-100)] text-[var(--sc-brand-700)] hover:bg-[var(--sc-brand-200)] rounded-lg font-bold transition-colors"
                title="Add pet"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[var(--sc-border)] bg-gray-50/50 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors text-xs disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-5 py-2 font-bold text-white bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] rounded-xl transition-all text-xs flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
          >
            {loading ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
