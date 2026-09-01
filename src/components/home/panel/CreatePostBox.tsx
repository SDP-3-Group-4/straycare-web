import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ImagePlus,
  MapPin,
  Smile,
  ChevronDown,
  SquarePen,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  User,
  Sparkles,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { useAuth } from "../../../contexts/AuthContext";
import { createPost } from "../../../services/api";
import { getStoredPreferences } from "../../../services/preferences";

const CATEGORIES = [
  {
    key: "adoption",
    label: "Adoption",
    activeClass: "bg-green-100 text-green-700",
  },
  { key: "fun", label: "Fun", activeClass: "bg-blue-100 text-blue-700" },
  { key: "rescue", label: "Rescue", activeClass: "bg-red-100 text-red-700" },
  {
    key: "fundraise",
    label: "Fundraise",
    activeClass: "bg-[var(--sc-brand-100)] text-[var(--sc-brand-700)]",
  },
];

const PROMPTS_BY_CATEGORY: Record<string, string[]> = {
  adoption: [
    "Looking for a loving home for a rescued puppy or kitten?",
    "Share an adoption profile for a sweet community pet...",
    "Foster parent needed! Who can offer temporary shelter?",
    "Ready to find forever families for rescued stray babies?",
    "What's happening with stray pets?",
  ],
  rescue: [
    "Spotted an injured dog or cat needing urgent rescue?",
    "Emergency rescue alert: Describe location & condition...",
    "Need volunteers with a rescue cage or transport vehicle?",
    "Found an abandoned animal in need of emergency care?",
    "What's happening with stray pets?",
  ],
  fundraise: [
    "Need community support for a stray's surgery & medicines?",
    "Start a medical fundraise for life-saving veterinary treatment...",
    "Share vet clinic estimate & target goal for injured stray...",
    "Help us fund post-op shelter and food for rescued animals...",
    "What's happening with stray pets?",
  ],
  fun: [
    "Share a heartwarming stray transformation or funny moment!",
    "Post a sweet photo of your neighborhood community strays...",
    "Tell us about your daily stray feeding routine...",
    "Celebrate a healthy recovery or playful rescue milestone!",
    "What's happening with stray pets?",
  ],
};

const GENERAL_PROMPTS = [
  "What's happening with stray pets?",
  "Spotted an injured animal or need rescue backup?",
  "Looking for loving adopters or foster homes?",
  "Share a heartwarming stray rescue story or update...",
  "Need community advice or veterinary guidance?",
  "Found a puppy or kitten that needs emergency care?",
  "Share local feeding or shelter spots in your city...",
];

export default function CreatePostBox({
  onPostCreated,
}: {
  onPostCreated?: () => void;
}) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState("adoption");
  const [media, setMedia] = useState<
    { url: string; type: "image" | "video" }[]
  >([]);
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [fundraiseGoal, setFundraiseGoal] = useState("");

  const [hyperidTag, setHyperidTag] = useState<string | null>(null);
  const [isAnalyzingHyperid, setIsAnalyzingHyperid] = useState(false);

  const [promptIndex, setPromptIndex] = useState(0);

  useEffect(() => {
    const list = PROMPTS_BY_CATEGORY[category] || GENERAL_PROMPTS;
    const interval = setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % list.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [category]);

  const activePrompts = PROMPTS_BY_CATEGORY[category] || GENERAL_PROMPTS;
  const currentPlaceholder =
    activePrompts[promptIndex % activePrompts.length] ||
    "What's happening with stray pets?";

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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        emojiRef.current &&
        !emojiRef.current.contains(event.target as Node)
      ) {
        setIsEmojiOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const analyzeImageWithHyperID = async (file: File) => {
    setIsAnalyzingHyperid(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("https://hyperid-ke.onrender.com/predict?top_k=2", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.trait_profile && data.ranked_breeds.length > 0) {
          const top1 = data.ranked_breeds[0];
          const top2 = data.ranked_breeds[1];
          const s1 = parseInt(top1.shared_traits);
          const s2 = top2 ? parseInt(top2.shared_traits) : 0;
          const breed1 = top1.breed.replace(/([A-Z])/g, ' $1').trim();
          const breed2 = top2 ? top2.breed.replace(/([A-Z])/g, ' $1').trim() : "";

          const tag = `HyperID: ${breed1}`;
          setHyperidTag(tag);
        } else {
          console.warn("HyperID API returned an invalid response.");
          alert("HyperID API returned an invalid response.");
        }
      } else {
        console.warn("HyperID API failed with status: " + res.status);
        alert("HyperID API failed with status: " + res.status);
      }
    } catch (err) {
      console.error("HyperID analysis failed", err);
      alert("HyperID API request failed.");
    } finally {
      setIsAnalyzingHyperid(false);
    }
  };

  const handlePost = async () => {
    if (!content.trim() || !user) return;
    if (
      category === "fundraise" &&
      (!fundraiseGoal || isNaN(parseFloat(fundraiseGoal)))
    ) {
      alert("Please enter a valid fundraise goal amount.");
      return;
    }
    if (media.length > 6) {
      alert("You can upload up to 6 images/videos.");
      return;
    }
    setIsSubmitting(true);
    let finalCoords = coordinates;
    let finalLoc = location;
    try {
      await createPost({
        content,
        category,
        imageUrl: media[0]?.url || undefined,
        media: media.length ? media.map((m, i) => i === 0 && hyperidTag ? { ...m, hyperidTag } : m) : undefined,
        location: finalLoc || undefined,
        latitude: finalCoords?.lat,
        longitude: finalCoords?.lng,
        fundraiseGoal:
          category === "fundraise" ? parseFloat(fundraiseGoal) : undefined,
      } as any);
      setContent("");
      setMedia([]);
      setLocation("");
      setCoordinates(null);
      setCategory("adoption");
      setFundraiseGoal("");
      setHyperidTag(null);
      if (onPostCreated) onPostCreated();
      window.dispatchEvent(new Event("postCreated"));
      setFeedbackTitle("Success!");
      setFeedbackMessage("Your post has been created and published.");
      setIsOpen(true);
    } catch (error: any) {
      console.error("Failed to create post:", error);
      setFeedbackTitle("Error");
      setFeedbackMessage(
        error.message ||
          "Something went wrong while creating your post. Please try again.",
      );
      setIsOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (!files.length) return;
    const remaining = 6 - media.length;
    const toAdd = files.slice(0, remaining);
    if (files.length > remaining)
      alert(`Only ${remaining} more file(s) allowed (max 6).`);

    const prefs = getStoredPreferences();
    const firstImage = toAdd.find(f => !f.type.startsWith("video/"));
    if (prefs.useHyperID && firstImage && media.filter(m => m.type === "image").length === 0 && !hyperidTag && !isAnalyzingHyperid) {
      analyzeImageWithHyperID(firstImage);
    }

    toAdd.forEach((file) => {
      const isVideo = file.type.startsWith("video/");
      if (isVideo && file.size > 50 * 1024 * 1024) {
        alert(`${file.name} is too large (max 50MB)`);
        return;
      }
      if (!isVideo && file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large (max 10MB)`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setMedia((prev) =>
          [
            ...prev,
            { url: reader.result as string, type: isVideo ? "video" : "image" },
          ].slice(0, 6),
        );
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
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
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          );
          const data = await res.json();
          const city =
            data.address.city ||
            data.address.town ||
            data.address.village ||
            data.address.county ||
            "Unknown Location";
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
      },
    );
  };

  const activeCategory =
    CATEGORIES.find((c) => c.key === category) || CATEGORIES[0];

  return (
    <>
      <div className="flex flex-col w-full box-border">
        <div className="flex items-center gap-2 pb-2 mb-1 px-1 text-[var(--sc-brand-600)]">
          <SquarePen size={18} />
          <h3 className="font-bold text-[16px] sm:text-[18px] text-[var(--sc-text-primary)]">
            Create Post
          </h3>
        </div>
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-[var(--sc-border)] flex flex-col gap-3 w-full box-border">
          <div className="flex gap-2.5 sm:gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
              {user?.photoUrl ? (
                <img
                  src={user?.photoUrl || undefined}
                  alt={user?.displayName || "User"}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User size={16} className="text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <textarea
                className="w-full bg-transparent outline-none text-[14px] sm:text-[15px] text-[var(--sc-text-primary)] placeholder-gray-400/90 resize-none min-h-[60px] sm:min-h-[74px] pt-0.5 transition-all duration-300"
                placeholder={currentPlaceholder}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isSubmitting}
              />

              {/* Previews */}
              {(media.length > 0 || location) && (
                <div className="flex flex-col gap-2 mt-1">
                  {media.length > 0 && (
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                      {media.map((m, idx) => (
                        <div key={idx} className="relative group">
                          {idx === 0 && isAnalyzingHyperid && (
                            <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm z-10">
                              <Loader2 size={10} className="animate-spin" />
                              Analyzing with HyperID...
                            </div>
                          )}
                          {idx === 0 && hyperidTag && (
                            <div className="absolute top-2 left-2 bg-[var(--sc-brand-600)] text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm z-10">
                              <Sparkles size={10} />
                              HyperID Attached
                            </div>
                          )}
                          {m.type === "video" ? (
                            <video
                              src={m.url}
                              className="w-full h-20 sm:h-24 object-cover rounded-lg border border-[var(--sc-border)]"
                              muted
                            />
                          ) : (
                            <img
                              src={m.url}
                              alt={`media ${idx}`}
                              className="w-full h-20 sm:h-24 object-cover rounded-lg border border-[var(--sc-border)]"
                            />
                          )}
                          <button
                            onClick={() => {
                              if (idx === 0) setHyperidTag(null);
                              setMedia((prev) =>
                                prev.filter((_, i) => i !== idx),
                              );
                            }}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-90 shadow-xs"
                          >
                            <X size={10} />
                          </button>
                          <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1 py-0.2 rounded font-semibold">
                            {m.type === "video" ? "VIDEO" : "IMG"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {media.length > 0 && (
                    <p className="text-[10px] text-gray-400">
                      {media.length}/6 • first image is cover
                    </p>
                  )}
                  {location && (
                    <div className="flex items-center gap-1 text-[12px] text-gray-500 bg-gray-50 w-fit px-2 py-0.5 rounded-md border border-[var(--sc-border)] max-w-full">
                      <MapPin size={11} className="shrink-0" />
                      <span className="truncate">{location}</span>
                      <button
                        onClick={() => setLocation("")}
                        className="ml-1 hover:text-red-500 shrink-0"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {category === "fundraise" && (
                <div className="mt-2 p-3 bg-[var(--sc-brand-50)] border border-[var(--sc-brand-100)] rounded-xl">
                  <label className="text-[12px] sm:text-[13px] font-bold text-[var(--sc-brand-800)] mb-1 block">
                    Fundraise Goal (৳)
                  </label>
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

          <div className="flex items-center justify-between border-t border-gray-100 pt-2.5 relative gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1 text-[var(--sc-brand-500)] flex-wrap">
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 sm:p-2 hover:bg-[var(--sc-brand-50)] rounded-full transition-colors relative"
                title="Add images/videos (up to 6)"
              >
                <ImagePlus size={18} />
                {media.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[var(--sc-brand-600)] text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                    {media.length}
                  </span>
                )}
              </button>
              <button
                onClick={handleAddLocation}
                className="p-1.5 sm:p-2 hover:bg-[var(--sc-brand-50)] rounded-full transition-colors"
                disabled={isGettingLocation}
                title="Add location"
              >
                {isGettingLocation ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <MapPin size={18} />
                )}
              </button>

              <div ref={emojiRef} className="relative">
                <button
                  onClick={() => setIsEmojiOpen(!isEmojiOpen)}
                  className="p-1.5 sm:p-2 hover:bg-[var(--sc-brand-50)] rounded-full transition-colors"
                  title="Insert Emoji"
                >
                  <Smile size={18} />
                </button>
                {isEmojiOpen && (
                  <div className="fixed inset-x-2 top-20 sm:absolute sm:top-full sm:left-0 sm:inset-x-auto mt-2 z-50 shadow-2xl rounded-2xl overflow-hidden max-w-[340px]">
                    <EmojiPicker
                      onEmojiClick={(e) => setContent((prev) => prev + e.emoji)}
                      width="100%"
                      height={360}
                    />
                  </div>
                )}
              </div>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center gap-1 text-[11px] sm:text-[13px] font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full transition-colors ${activeCategory.activeClass}`}
                >
                  {activeCategory.label} <ChevronDown size={12} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-36 sm:w-40 bg-white border border-[var(--sc-border)] rounded-xl shadow-lg z-50 overflow-hidden">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.key}
                        onClick={() => {
                          setCategory(cat.key);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-[13px] sm:text-[14px] transition-colors ${category === cat.key ? `font-bold ${cat.activeClass}` : "text-gray-700 hover:bg-gray-50"}`}
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
              disabled={isSubmitting || !content.trim() || isAnalyzingHyperid}
              className="bg-[var(--sc-brand-600)] text-white px-5 sm:px-6 py-2.5 rounded-full font-bold text-sm hover:bg-[var(--sc-brand-700)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isAnalyzingHyperid ? (
                <span className="flex items-center gap-1.5"><Loader2 size={14} className="animate-spin" /> HyperID</span>
              ) : (
                "Post"
              )}
            </button>
          </div>
        </div>
      </div>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <div className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden flex flex-col border border-[var(--sc-border)] shadow-xl animate-in fade-in zoom-in duration-200">
              <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center gap-3">
                {feedbackTitle === "Error" ? (
                  <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                    <AlertCircle size={28} />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-500">
                    <CheckCircle size={28} />
                  </div>
                )}

                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[var(--sc-text-primary)] mb-1">
                    {feedbackTitle}
                  </h2>
                  <p className="text-sm text-gray-600">{feedbackMessage}</p>
                </div>
              </div>

              <div className="p-4 border-t border-[var(--sc-border)] bg-gray-50/50">
                <button
                  onClick={() => setIsOpen(false)}
                  className={`w-full py-2.5 sm:py-3 text-[14px] sm:text-[15px] font-bold text-white rounded-xl transition-colors ${
                    feedbackTitle === "Error"
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-green-500 hover:bg-green-600"
                  }`}
                >
                  {feedbackTitle === "Error" ? "Close" : "Got it!"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
