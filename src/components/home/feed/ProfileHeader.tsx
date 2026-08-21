import { useState, useEffect } from 'react';
import { Edit3, MapPin, Link as LinkIcon, Calendar, BadgeCheck, ShieldCheck, Pencil, Loader2, Camera, UserPlus, HandHeart, User, UserMinus } from 'lucide-react';
import EditProfileModal from './EditProfileModal';
import { updateUserProfile, requestConnection, fetchConnectionStatus, disconnectConnection, fetchMutualConnections, fetchGraphDegree } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { avatarOnError, formatHandle } from '../../../constants';
import { Link } from 'react-router-dom';

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
    pets?: { name: string; type: string; age?: string }[];
  };
  onProfileUpdate?: () => void;
  onConnectionsClick?: () => void;
  connectionsCount?: number;
  fundraisersCount?: number;
  totalRaised?: number;
  totalDonors?: number;
  totalGoal?: number;
  isOwnProfile?: boolean;
}

export default function ProfileHeader({ user, onProfileUpdate, onConnectionsClick, connectionsCount = 0, fundraisersCount = 0, totalRaised = 0, totalDonors = 0, totalGoal = 0, isOwnProfile = true }: ProfileHeaderProps) {
  const { user: authUser, updateLocalUser } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [localCover, setLocalCover] = useState<string | null>(null);
  
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected'>('none');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [mutualsData, setMutualsData] = useState<{ count: number; mutuals: any[] }>({ count: 0, mutuals: [] });
  const [graphDegree, setGraphDegree] = useState<{ degree: number; label: string }>({ degree: 3, label: 'Rescue Network' });

  useEffect(() => {
    setLocalAvatar(null);
  }, [user.avatar]);

  useEffect(() => {
    setLocalCover(null);
  }, [user.coverImage]);

  const displayAvatar = localAvatar || user.avatar;
  const displayCover = localCover || user.coverImage;

  useEffect(() => {
    if (authUser && user.id && !isOwnProfile) {
      fetchConnectionStatus(authUser.uid, user.id).then(data => {
        setConnectionStatus(data.status);
      }).catch(console.error);

      fetchMutualConnections(authUser.uid, user.id).then(data => {
        if (data) setMutualsData(data);
      }).catch(console.error);

      fetchGraphDegree(authUser.uid, user.id).then(deg => {
        if (deg) setGraphDegree(deg);
      }).catch(console.error);
    }
  }, [authUser, user.id, isOwnProfile]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'coverImage') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (field === 'avatar') setUploadingAvatar(true);
    else setUploadingCover(true);

    try {
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      if (field === 'avatar') {
        setLocalAvatar(base64String);
        updateLocalUser({ photoURL: base64String, photoUrl: base64String });
      } else {
        setLocalCover(base64String);
        updateLocalUser({ coverImageUrl: base64String });
      }

      const payloadKey = field === 'avatar' ? 'photoUrl' : 'coverImageUrl';
      await updateUserProfile(user.id, { [payloadKey]: base64String });
      
      onProfileUpdate?.();
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload image.');
    } finally {
      e.target.value = '';
      if (field === 'avatar') setUploadingAvatar(false);
      else setUploadingCover(false);
    }
  };

  const handleConnect = async () => {
    if (!authUser || !user.id) return;
    setIsConnecting(true);
    try {
      if (connectionStatus === 'none') {
        await requestConnection(user.id);
        setConnectionStatus('pending');
      } else if (connectionStatus === 'accepted') {
        await disconnectConnection(user.id);
        setConnectionStatus('none');
        setShowDisconnectConfirm(false);
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Failed to update connection.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="bg-white border border-[var(--sc-border)] rounded-2xl overflow-hidden mb-4 sm:mb-6 shadow-xs w-full box-border">
      {/* Cover Image */}
      <div className="h-36 sm:h-48 w-full bg-slate-200 relative group overflow-hidden">
        {displayCover ? (
          <>
            <img 
              src={displayCover} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 pointer-events-none" />
          </>
        ) : (
          <div className="w-full h-full bg-slate-200 flex items-center justify-center">
            <Camera size={32} className="text-slate-400" />
          </div>
        )}
        {isOwnProfile && (
          <label className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full cursor-pointer shadow-md opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity z-10" title="Edit cover">
            {uploadingCover ? <Loader2 size={16} className="animate-spin" /> : <Pencil size={16} />}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => handleImageUpload(e, 'coverImage')}
              disabled={uploadingCover}
            />
          </label>
        )}
      </div>

      {/* Profile Info */}
      <div className="px-4 sm:px-6 pb-5 sm:pb-6 relative">
        {/* Avatar & Actions Row */}
        <div className="flex justify-between items-end -mt-10 sm:-mt-12 mb-3 sm:mb-4 gap-2">
          <div className="relative group shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-3 sm:border-4 border-white bg-white shadow-md flex items-center justify-center">
              {displayAvatar ? (
                <img 
                  src={displayAvatar} 
                  alt={user.name || "Avatar"} 
                  onError={avatarOnError}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <User size={32} className="text-gray-400" />
                </div>
              )}
            </div>
            {isOwnProfile && (
              <label className="absolute bottom-0 right-0 bg-white border border-gray-200 text-gray-700 p-1.5 rounded-full cursor-pointer shadow-xs hover:bg-gray-50 transition-colors z-10" title="Edit avatar">
                {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleImageUpload(e, 'avatar')}
                  disabled={uploadingAvatar}
                />
              </label>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isOwnProfile ? (
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-xs sm:text-sm active:scale-95"
              >
                <Edit3 size={15} />
                Edit Profile
              </button>
            ) : (
              <button 
                onClick={() => connectionStatus === 'accepted' ? setShowDisconnectConfirm(true) : handleConnect()}
                disabled={isConnecting || connectionStatus === 'pending'}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 font-bold rounded-xl transition-colors shadow-xs text-xs sm:text-sm active:scale-95 ${
                  connectionStatus === 'none' ? 'bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] text-white' :
                  connectionStatus === 'pending' ? 'bg-amber-100 text-amber-700 cursor-default' :
                  'bg-white border border-red-200 text-red-600 hover:bg-red-50'
                } disabled:opacity-60`}
              >
                {isConnecting ? <Loader2 size={15} className="animate-spin" /> : connectionStatus === 'accepted' ? <UserMinus size={15} /> : <UserPlus size={15} />}
                {isConnecting ? 'Processing...' : connectionStatus === 'pending' ? 'Pending' : connectionStatus === 'accepted' ? 'Disconnect' : 'Connect'}
              </button>
            )}
          </div>
        </div>

        {/* User Details */}
        <div className="mb-3">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[var(--sc-text-primary)] notranslate" translate="no">{user.name}</h1>
            {user.isVerified && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded-lg flex-shrink-0">
                <BadgeCheck size={13} />
                Verified Vet
              </span>
            )}
            {user.isVet && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded-lg flex-shrink-0">
                <ShieldCheck size={13} />
                Verified Vet
              </span>
            )}
            {user.topContributor && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-[var(--sc-brand-100)] text-[var(--sc-brand-700)] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded-lg flex-shrink-0">
                ⭐ Top Contributor
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[var(--sc-text-secondary)] font-medium text-xs sm:text-sm notranslate" translate="no">{formatHandle(user.handle)}</p>
            {!isOwnProfile && graphDegree && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border ${
                graphDegree.degree === 1
                  ? 'bg-purple-50 text-[var(--sc-brand-700)] border-[var(--sc-brand-200)]'
                  : graphDegree.degree === 2
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}>
                {graphDegree.degree === 1 ? '1st' : graphDegree.degree === 2 ? '2nd' : '3rd+'}
              </span>
            )}
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="text-[13px] sm:text-[15px] text-[var(--sc-text-primary)] leading-relaxed mb-3 whitespace-pre-line">
            {user.bio}
          </p>
        )}

        {/* Pets Labels */}
        {user.pets && user.pets.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
            {user.pets.map((pet, idx) => (
              <span key={idx} className="flex items-center gap-1 px-2.5 py-0.5 bg-orange-50 border border-orange-100 text-orange-700 text-[12px] sm:text-[13px] font-bold rounded-full notranslate" translate="no">
                {pet.type === 'dog' ? '🐶' : pet.type === 'cat' ? '🐱' : '🐾'} {pet.name}{pet.age ? ` · ${pet.age} yrs` : ''}
              </span>
            ))}
          </div>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-1.5 text-[12px] sm:text-[14px] text-gray-500 font-medium">
          {user.location && (
            <div className="flex items-center gap-1">
              <MapPin size={14} className="shrink-0" />
              <span className="truncate">{user.location}</span>
            </div>
          )}
          {user.website && (
            <div className="flex items-center gap-1">
              <LinkIcon size={14} className="shrink-0" />
              <a href={user.website.startsWith('http') ? user.website : `https://${user.website}`} target="_blank" rel="noreferrer" className="text-[var(--sc-brand-600)] hover:underline truncate max-w-[180px]">
                {user.website}
              </a>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar size={14} className="shrink-0" />
            <span>Joined {user.joinedDate}</span>
          </div>
        </div>
        
        {/* Stats & Mutual Connections */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-gray-100">
          <button onClick={onConnectionsClick} className="flex items-center gap-1.5 hover:underline text-left disabled:cursor-default" disabled={!onConnectionsClick}>
            <span className="font-bold text-[var(--sc-text-primary)] text-sm sm:text-base">{connectionsCount}</span>
            <span className="text-gray-500 font-medium text-xs sm:text-sm">Connections</span>
          </button>

          {!isOwnProfile && mutualsData.count > 0 && (
            <div className="flex items-center gap-2 bg-blue-50/70 border border-blue-100 px-3 py-1.5 rounded-xl">
              <div className="flex -space-x-2 overflow-hidden">
                {mutualsData.mutuals.slice(0, 3).map((m: any) => (
                  <div key={m.id} className="inline-block h-5 w-5 rounded-full ring-2 ring-white overflow-hidden bg-gray-200">
                    {m.photoUrl ? (
                      <img src={m.photoUrl} alt={m.displayName} onError={avatarOnError} className="h-full w-full object-cover" />
                    ) : (
                      <User size={12} className="text-gray-400 p-0.5" />
                    )}
                  </div>
                ))}
              </div>
              <span className="text-[12px] font-semibold text-blue-900">
                {mutualsData.count} mutual connection{mutualsData.count > 1 ? 's' : ''}
                {mutualsData.mutuals[0] ? ` including ${mutualsData.mutuals[0].displayName}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Holistic Fundraising Overview */}
        <div className="mt-4 rounded-2xl border border-[var(--sc-brand-100)] bg-[var(--sc-brand-50)]/40 p-3.5 sm:p-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <HandHeart size={16} className="text-[var(--sc-brand-500)]" />
              <span className="text-[13px] sm:text-[14px] font-bold text-[var(--sc-text-primary)]">Fundraising Overview</span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-[var(--sc-brand-600)] bg-white border border-[var(--sc-brand-100)] px-2 py-0.5 rounded-full">
              {fundraisersCount} campaign{fundraisersCount === 1 ? '' : 's'}
            </span>
          </div>

          {totalGoal > 0 ? (
            <>
              <div className="flex justify-between items-center mb-1.5 text-[12px] sm:text-[13px]">
                <span className="font-bold text-[var(--sc-text-primary)]">৳{totalRaised.toLocaleString()} raised</span>
                <span className="text-gray-500 font-medium">of ৳{totalGoal.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 overflow-hidden mb-2.5">
                <div 
                  className="h-full bg-[var(--sc-brand-500)] rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.round((totalRaised / totalGoal) * 100))}%` }} 
                />
              </div>
            </>
          ) : (
            <p className="text-[12px] text-gray-500 mb-2">No active fundraisers created yet.</p>
          )}

          <div className="flex items-center gap-5 pt-2 border-t border-purple-100/60 text-xs sm:text-sm">
            <div className="flex items-center gap-1">
              <span className="font-bold text-[var(--sc-text-primary)]">৳{totalRaised.toLocaleString()}</span>
              <span className="text-gray-500 font-medium">Raised</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-[var(--sc-text-primary)]">{totalDonors.toLocaleString()}</span>
              <span className="text-gray-500 font-medium">Donors</span>
            </div>
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

      {showDisconnectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDisconnectConfirm(false)} />
          <div className="relative bg-white rounded-2xl p-5 sm:p-6 w-full max-w-sm text-center border border-[var(--sc-border)] shadow-xl">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <UserMinus size={20} />
            </div>
            <h3 className="font-bold text-[15px] sm:text-[16px] text-[var(--sc-text-primary)]">Disconnect from {user.name}?</h3>
            <p className="text-[12px] sm:text-[13px] text-gray-500 mt-1">You will need to send a new connection request to connect again.</p>
            <div className="flex gap-2.5 mt-4">
              <button onClick={() => setShowDisconnectConfirm(false)} className="flex-1 py-2 rounded-xl border border-[var(--sc-border)] font-bold text-[13px] sm:text-[14px]">Cancel</button>
              <button onClick={handleConnect} disabled={isConnecting} className="flex-1 py-2 rounded-xl font-bold text-[13px] sm:text-[14px] text-white bg-red-600 hover:bg-red-700 disabled:opacity-60">
                {isConnecting ? 'Processing...' : 'Disconnect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
