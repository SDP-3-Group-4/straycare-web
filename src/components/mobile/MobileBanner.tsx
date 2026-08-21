export default function MobileBanner() {
  return (
    <div className="lg:hidden bg-gradient-to-r from-[#772BFB] to-[#471995] text-white px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[13px] font-medium">
      <span className="text-center sm:text-left leading-tight">
        ✨ StrayCare experience is better on <a href={window.location.origin} className="underline font-bold hover:text-white/80">desktop</a> or <a href="https://forms.gle/dCQchSJ98vLdN5Ka7" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-white/80">Android app</a>
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <a href={window.location.origin} className="bg-white text-[#772BFB] px-3 py-1 rounded-full text-xs font-bold hover:bg-white/90 transition-colors">Open Desktop</a>
        <a href="https://forms.gle/dCQchSJ98vLdN5Ka7" target="_blank" rel="noopener noreferrer" className="bg-white/20 border border-white/30 text-white px-3 py-1 rounded-full text-xs font-bold hover:bg-white/30 transition-colors">Get App</a>
      </div>
    </div>
  );
}
