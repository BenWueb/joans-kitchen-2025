export default function TopBanner({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[60]">
      <div className="bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-700 backdrop-blur border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 h-9 flex items-center justify-center">
          <p className="text-[11px] sm:text-xs text-white font-semibold text-center line-clamp-1 drop-shadow-sm">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}


