import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import { updateUserProfile } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    bio: string;
    avatar: string;
    coverImage: string;
    location: string;
    website: string;
    pets: { name: string; type: string; age?: string }[];
  };
  onProfileUpdate?: () => void;
}

export default function EditProfileModal({ isOpen, onClose, user, onProfileUpdate }: EditProfileModalProps) {
  const { updateLocalUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [avatar, setAvatar] = useState(user.avatar);
  const [coverImage, setCoverImage] = useState(user.coverImage);
  const [location, setLocation] = useState(user.location);
  const [website, setWebsite] = useState(user.website);
  const [pets, setPets] = useState<{name: string, type: string, age?: string}[]>(user.pets || []);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    try {
      await updateUserProfile(user.id, {
        displayName: name,
        bio,
        photoUrl: avatar,
        coverImageUrl: coverImage,
        location,
        website,
        pets
      });
      updateLocalUser({
        displayName: name,
        bio,
        photoUrl: avatar,
        photoURL: avatar,
        coverImageUrl: coverImage,
        location,
        website,
        pets
      });
      if (onProfileUpdate) onProfileUpdate();
      onClose();
    } catch (error) {
      console.error("Failed to update profile", error);
      // could show an error toast here
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[var(--sc-border)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--sc-border)]">
          <h2 className="text-xl font-bold text-[var(--sc-text-primary)]">Edit Profile</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
          

          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider ml-1">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-[var(--sc-border)] rounded-xl focus:outline-none focus:border-[var(--sc-brand-400)] focus:ring-4 focus:ring-[var(--sc-brand-100)] transition-all font-medium"
              placeholder="Your name"
            />
          </div>

          {/* Bio Input */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider ml-1">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border border-[var(--sc-border)] rounded-xl focus:outline-none focus:border-[var(--sc-brand-400)] focus:ring-4 focus:ring-[var(--sc-brand-100)] transition-all resize-none"
              placeholder="Tell us about yourself and your pets..."
            />
          </div>

          {/* Location Input */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider ml-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-[var(--sc-border)] rounded-xl focus:outline-none focus:border-[var(--sc-brand-400)] focus:ring-4 focus:ring-[var(--sc-brand-100)] transition-all font-medium"
              placeholder="e.g. New York, USA"
            />
          </div>

          {/* Website Input */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider ml-1">
              Website
            </label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-[var(--sc-border)] rounded-xl focus:outline-none focus:border-[var(--sc-brand-400)] focus:ring-4 focus:ring-[var(--sc-brand-100)] transition-all font-medium"
              placeholder="e.g. myrescue.org"
            />
          </div>

          {/* Pets Input */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider ml-1">
              Your Pets
            </label>
            
            {/* List of existing pets */}
            <div className="flex flex-col gap-2 mb-3">
              {pets.map((pet, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-700 capitalize">
                      {pet.type === 'dog' ? '🐶' : pet.type === 'cat' ? '🐱' : '🐾'} {pet.name}
                    </span>
                    {pet.age && <span className="text-xs text-gray-500">Age: {pet.age}</span>}
                  </div>
                  <button onClick={() => handleRemovePet(idx)} className="p-1 text-red-400 hover:text-red-600 rounded-full hover:bg-red-50">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new pet */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                value={newPetName}
                onChange={(e) => setNewPetName(e.target.value)}
                placeholder="Pet Name"
                className="flex-1 px-3 py-2 bg-gray-50 border border-[var(--sc-border)] rounded-lg focus:outline-none focus:border-[var(--sc-brand-400)]"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPetAge}
                  onChange={(e) => setNewPetAge(e.target.value)}
                  placeholder="Age"
                  className="w-20 px-3 py-2 bg-gray-50 border border-[var(--sc-border)] rounded-lg focus:outline-none focus:border-[var(--sc-brand-400)]"
                />
                <select 
                  value={newPetType}
                  onChange={(e) => setNewPetType(e.target.value)}
                  className="w-24 px-2 py-2 bg-gray-50 border border-[var(--sc-border)] rounded-lg focus:outline-none focus:border-[var(--sc-brand-400)]"
                >
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="bird">Bird</option>
                  <option value="other">Other</option>
                </select>
                <button 
                  onClick={handleAddPet}
                  className="p-2 bg-[var(--sc-brand-100)] text-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-200)] rounded-lg font-bold transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>
          
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-[var(--sc-border)] bg-gray-50/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 font-bold text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2.5 font-bold text-white bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
