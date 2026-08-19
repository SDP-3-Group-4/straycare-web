import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ImagePlus, MapPin, Smile, ChevronDown, SquarePen, Loader2, X, CheckCircle, AlertCircle, User } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { useAuth } from "../../../contexts/AuthContext";
import { createPost } from "../../../services/api";

const CATEGORIES = [
  { key: "adoption", label: "Adoption", activeClass: "bg-green-100 text-green-700" },
  { key: "fun", label: "Fun", activeClass: "bg-blue-100 text-blue-700" },
  { key: "rescue", label: "Rescue", activeClass: "bg-red-100 text-red-700" },
  { key: "fundraise", label: "Fundraise", activeClass: "bg-[var(--sc-brand-100)] text-[var(--sc-brand-700)]" }
];

export default function CreatePostBox({ onPostCreated }: { onPostCreated?: () => void }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState("adoption");
  const [imageUrl, setImageUrl] = useState("");
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [fundraiseGoal, setFundraiseGoal] = useState("");
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setIsEmojiOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePost = async () => {
    if (!content.trim() || !user) return;
    if (category === "fundraise" && (!fundraiseGoal || isNaN(parseFloat(fundraiseGoal)))) {
      alert("Please enter a valid fundraise goal amount.");
      return;
    }
    
    setIsSubmitting(true);

    let finalCoords = coordinates;
    let finalLoc = location;
    

    try {
      await createPost({
        content,
        category,
        authorId: user.uid,
        imageUrl: imageUrl || undefined,
        location: finalLoc || undefined,
        latitude: finalCoords?.lat,
        longitude: finalCoords?.lng,
        fundraiseGoal: category === "fundraise" ? parseFloat(fundraiseGoal) : undefined
      });
      setContent("");
      setImageUrl("");
      setLocation("");
      setCoordinates(null);
      setCategory("adoption");
      setFundraiseGoal("");
      if (onPostCreated) onPostCreated();
      window.dispatchEvent(new Event('postCreated'));
      
      setFeedbackTitle("Success!");
      setFeedbackMessage("Your post has been created and published.");
      setIsOpen(true);
    } catch (error: any) {
      console.error("Failed to create post:", error);
      setFeedbackTitle("Error");
      setFeedbackMessage(error.message || "Something went wrong while creating your post. Please try again.");
      setIsOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoordinates({ lat, lng });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          const city = data.address.city || data.address.town || data.address.village || data.address.county || "Unknown Location";
          const state = data.address.state || data.address.country;
          setLocation(`${city}, ${state}`);
        } catch (error) {
          setLocation(`${lat.toFixed(2)}, ${lng.toFixed(2)}`);
        }
        setIsGettingLocation(false);
      },
      () => {
        alert("Unable to retrieve your location");
        setIsGettingLocation(false);
      }
    );
  };

  const activeCategory = CATEGORIES.find(c => c.key === category) || CATEGORIES[0];

  return (
    <>
      <div className="flex flex-col">
        <div className="flex items-center gap-2 pb-2 mb-2 px-1 text-[var(--sc-brand-600)]">
          <SquarePen size={20} />
          <h3 className="font-bold text-[18px] text-[var(--sc-text-primary)]">Create Post</h3>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[var(--sc-border)] flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
              {user?.photoURL || user?.photoUrl ? (
                <img 
                  src={user?.photoURL || user?.photoUrl || undefined} 
                  alt={user?.displayName || 'User'}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User size={16} className="text-gray-400" />
              )}
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <textarea 
                className="w-full bg-transparent outline-none text-[15px] text-[var(--sc-text-primary)] placeholder-gray-400 resize-none min-h-[74px] pt-1"
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isSubmitting}
              />
              
              {/* Previews */}
              {(imageUrl || location) && (
                <div className="flex flex-col gap-2 mt-2">
                  {imageUrl && (
                    <div className="relative inline-block w-fit">
                      <img src={imageUrl} alt="Attached" className="max-h-32 rounded-lg object-cover" />
                      <button 
                        onClick={() => setImageUrl("")}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  {location && (
                    <div className="flex items-center gap-1 text-[13px] text-gray-500 bg-gray-50 w-fit px-2 py-1 rounded-md border border-[var(--sc-border)]">
                      <MapPin size={12} />
                      {location}
                      <button onClick={() => setLocation("")} className="ml-1 hover:text-red-500"><X size={12} /></button>
                    </div>
                  )}
                </div>
              )}

              {category === "fundraise" && (
                <div className="mt-2 p-3 bg-[var(--sc-brand-50)] border border-[var(--sc-brand-100)] rounded-xl">
                  <label className="text-[13px] font-bold text-[var(--sc-brand-800)] mb-1 block">Fundraise Goal (৳)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={fundraiseGoal}
                    onChange={(e) => setFundraiseGoal(e.target.value)}
                    className="w-full bg-white border border-[var(--sc-brand-200)] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[var(--sc-brand-400)]"
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-3 relative">
            <div className="flex items-center gap-1 text-[var(--sc-brand-500)] flex-wrap">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
              />
              <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-[var(--sc-brand-50)] rounded-full transition-colors"><ImagePlus size={18} /></button>
              <button onClick={handleAddLocation} className="p-2 hover:bg-[var(--sc-brand-50)] rounded-full transition-colors" disabled={isGettingLocation}>
                {isGettingLocation ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
              </button>
              
              <div ref={emojiRef}>
                <button onClick={() => setIsEmojiOpen(!isEmojiOpen)} className="p-2 hover:bg-[var(--sc-brand-50)] rounded-full transition-colors"><Smile size={18} /></button>
                {isEmojiOpen && (
                  <div className="absolute top-full left-0 mt-2 z-50">
                    <EmojiPicker onEmojiClick={(e) => setContent(prev => prev + e.emoji)} />
                  </div>
                )}
              </div>
              
              <div className="h-4 w-px bg-gray-200 mx-1 hidden sm:block"></div>
              
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center gap-1 text-[13px] font-bold px-3 py-1.5 rounded-full transition-colors sm:ml-1 ${activeCategory.activeClass}`}
                >
                  {activeCategory.label} <ChevronDown size={14} />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-40 bg-white border border-[var(--sc-border)] rounded-xl shadow-lg z-50 overflow-hidden">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.key}
                        onClick={() => {
                          setCategory(cat.key);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-[14px] transition-colors ${category === cat.key ? `font-bold ${cat.activeClass}` : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <button 
              onClick={handlePost}
              disabled={!content.trim() || isSubmitting}
              className={`transition-colors text-white font-bold py-1.5 px-4 rounded-full flex items-center gap-2 shrink-0 ${!content.trim() || isSubmitting ? 'bg-gray-300 cursor-not-allowed' : 'bg-[var(--sc-brand-500)] hover:bg-[var(--sc-brand-600)]'}`}
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Post"}
            </button>
          </div>
        </div>
      </div>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden flex flex-col border border-[var(--sc-border)] shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center justify-center p-8 text-center gap-4">
              {feedbackTitle === "Error" ? (
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                  <AlertCircle size={32} />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-500">
                  <CheckCircle size={32} />
                </div>
              )}
              
              <div>
                <h2 className="text-xl font-bold text-[var(--sc-text-primary)] mb-2">{feedbackTitle}</h2>
                <p className="text-gray-600">{feedbackMessage}</p>
              </div>
            </div>
            
            <div className="p-4 border-t border-[var(--sc-border)] bg-gray-50/50">
              <button 
                onClick={() => setIsOpen(false)}
                className={`w-full py-3 text-[15px] font-bold text-white rounded-xl transition-colors ${
                  feedbackTitle === "Error" ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {feedbackTitle === "Error" ? "Close" : "Got it!"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
