"use client";

import { useStoreSettings } from "@/hooks/use-store-settings";

/** lucide-react doesn't ship a WhatsApp brand icon, so we use a small
 * inline SVG (same pattern used for the Instagram/YouTube icons
 * elsewhere in the app). */
function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.004 2c-5.514 0-9.997 4.483-9.997 9.997 0 1.763.464 3.484 1.345 5.001L2 22l5.13-1.336a9.98 9.98 0 0 0 4.874 1.242h.004c5.514 0 9.997-4.483 9.997-9.997 0-2.67-1.04-5.18-2.928-7.067A9.938 9.938 0 0 0 12.004 2zm0 18.301h-.003a8.31 8.31 0 0 1-4.235-1.156l-.303-.18-3.15.821.84-3.07-.198-.315a8.267 8.267 0 0 1-1.264-4.404c0-4.566 3.715-8.281 8.286-8.281 2.213 0 4.293.862 5.858 2.428a8.223 8.223 0 0 1 2.428 5.858c0 4.566-3.715 8.299-8.259 8.299z" />
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    </svg>
  );
}

export function WhatsappFloatButton() {
  const { getSetting, loading } = useStoreSettings(["contact_whatsapp"]);
  const whatsapp = getSetting("contact_whatsapp");

  // Strip everything except digits (wa.me links want the number as
  // digits only - no "+", spaces or dashes).
  const digitsOnly = whatsapp.replace(/[^0-9]/g, "");

  if (loading || !digitsOnly) return null;

  return (
    <a
      href={`https://wa.me/${digitsOnly}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-20 right-4 z-50 flex size-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 md:bottom-6 md:right-6 md:size-14"
    >
      <WhatsappIcon className="size-5 md:size-7" />
    </a>
  );
}
