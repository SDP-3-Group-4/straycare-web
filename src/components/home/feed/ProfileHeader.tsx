import { useState } from 'react';
import { Avatar } from '@heroui/react';
import { Edit3, MapPin, Link as LinkIcon, Calendar, BadgeCheck, ShieldCheck } from 'lucide-react';
import EditProfileModal from './EditProfileModal';

interface ProfileHeaderProps {
  user: {
    id: string;
    name: string;
    handle: string;
    bio: string;
    avatar: string;
    coverImage: string;
    location: string;
    website: string;
    joinedDate: string;
    isVerified: boolean;
    isVet: boolean;
    topContributor?: boolean;
    pets?: { name: string; type: string }[];
  };
  onProfileUpdate?: () => void;
}

export default function ProfileHeader({ user, onProfileUpdate }: ProfileHeaderProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <div className="bg-white border border-[var(--sc-border)] rounded-2xl overflow-hidden mb-6">
      {/* Cover Image */}
      <div className="h-48 w-full bg-gray-200 relative">
        {user.coverImage && (
          <img 
            src={user.coverImage} 
            alt="Cover" 
            className="w-full h-full object-cover opacity-80 mix-blend-overlay"
          />
        )}
      </div>

      {/* Profile Info */}
      <div className="px-6 pb-6 relative">
        {/* Avatar & Actions Row */}
        <div className="flex justify-between items-end mt-[-48px] mb-4">
          <Avatar 
            src={user.avatar} 
            className="w-24 h-24 text-large border-4 border-white bg-white"
          />
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
            >
              <Edit3 size={16} />
              Edit Profile
            </button>
          </div>
        </div>

        {/* User Details */}
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black text-[var(--sc-text-primary)]">{user.name}</h1>
            {user.isVerified && (
              <BadgeCheck className="text-blue-500 flex-shrink-0" size={20} />
            )}
            {user.isVet && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 bg-green-100 text-green-700 text-[11px] font-bold uppercase tracking-wider rounded-lg flex-shrink-0">
                <ShieldCheck size={14} />
                Verified Vet
              </span>
            )}
            {user.topContributor && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 bg-[var(--sc-brand-100)] text-[var(--sc-brand-700)] text-[11px] font-bold uppercase tracking-wider rounded-lg flex-shrink-0">
                ⭐ Top Contributor
              </span>
            )}
          </div>
          <p className="text-[var(--sc-text-secondary)] font-medium">{user.handle}</p>
        </div>

        {/* Bio */}
        <p className="text-[15px] text-[var(--sc-text-primary)] leading-relaxed mb-4 whitespace-pre-line">
          {user.bio}
        </p>

        {/* Pets Labels */}
        {user.pets && user.pets.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {user.pets.map((pet, idx) => (
              <span key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-100 text-orange-700 text-[13px] font-bold rounded-full">
                {pet.type === 'dog' ? '🐶' : pet.type === 'cat' ? '🐱' : '🐾'} {pet.name}
              </span>
            ))}
          </div>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] text-gray-500 font-medium">
          {user.location && (
            <div className="flex items-center gap-1.5">
              <MapPin size={16} />
              {user.location}
            </div>
          )}
          {user.website && (
            <div className="flex items-center gap-1.5">
              <LinkIcon size={16} />
              <a href={user.website.startsWith('http') ? user.website : `https://${user.website}`} target="_blank" rel="noreferrer" className="text-[var(--sc-brand-600)] hover:underline">
                {user.website}
              </a>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar size={16} />
            Joined {user.joinedDate}
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-6 mt-6">
          <div className="flex items-center gap-1.5 cursor-pointer hover:underline">
            <span className="font-bold text-[var(--sc-text-primary)]">142</span>
            <span className="text-gray-500 font-medium">Connections</span>
          </div>
          <div className="flex items-center gap-1.5 cursor-pointer hover:underline">
            <span className="font-bold text-[var(--sc-text-primary)]">28</span>
            <span className="text-gray-500 font-medium">Rescues</span>
          </div>
        </div>

      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        user={{
          id: user.id,
          name: user.name,
          bio: user.bio,
          avatar: user.avatar,
          coverImage: user.coverImage,
          location: user.location,
          website: user.website,
          pets: user.pets || []
        }}
        onProfileUpdate={onProfileUpdate}
      />
    </div>
  );
}
