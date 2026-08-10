"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface InstagramAndYoutubePreviewProps {
  instagram_url: string | null;
  youtube_url: string | null;
  title: string;
  errorMessage?: boolean | string; // optional error message to display for blocked/unavailable links
}

type LinkStatus =
  | "empty"
  | "checking"
  | "invalid"
  | "unavailable"
  | "valid"
  | "error"
  | "blocked";

// Matches youtube.com/watch?v=, youtu.be/, /embed/ and /shorts/ URLs and
// extracts the 11 character video id.
const YOUTUBE_URL_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;

// Matches instagram.com/p/, /reel/, /reels/ and /tv/ URLs.
const INSTAGRAM_URL_REGEX =
  /instagram\.com\/(?:[^/?#]+\/)?(?:p|reel|reels|tv)\/([a-zA-Z0-9_-]+)/i;

/** lucide-react's brand icons (Instagram/Youtube) are deprecated, so we use
 * small inline SVGs for these brand logos instead. */
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M23.498 6.186a2.99 2.99 0 0 0-2.106-2.115C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.392.526A2.99 2.99 0 0 0 .502 6.186 31.03 31.03 0 0 0 0 12a31.03 31.03 0 0 0 .502 5.814 2.99 2.99 0 0 0 2.106 2.115c1.887.526 9.392.526 9.392.526s7.505 0 9.392-.526a2.99 2.99 0 0 0 2.106-2.115A31.03 31.03 0 0 0 24 12a31.03 31.03 0 0 0-.502-5.814zM9.75 15.568V8.432L15.818 12 9.75 15.568z" />
    </svg>
  );
}

/** Debounces a fast-changing value (e.g. text being typed) so we don't fire
 * a network request / DOM mutation on every keystroke. */
function useDebouncedValue<T>(value: T, delay = 600): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function StatusMessage({
  status,
  errorMessage,
  url,
  label,
}: {
  status: LinkStatus;
  errorMessage: string;
  url: string;
  label: string;
}) {
  if (status === "empty") {
    return <p className="text-xs text-gray-400">No {label} link added yet.</p>;
  }

  if (status === "checking") {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Spinner className="size-3.5" />
        Checking link availability...
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <Alert variant="destructive" className="py-2 px-3">
        <AlertTriangle className="size-4" />
        <AlertDescription>
          This doesn&apos;t look like a valid {label} link. Please double check
          the URL.
        </AlertDescription>
      </Alert>
    );
  }

  if (status === "unavailable") {
    return (
      <Alert variant="destructive" className="py-2 px-3">
        <AlertTriangle className="size-4" />
        <AlertDescription>
          <span>
            This {label} link {errorMessage || "could not be found"}.
          </span>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline underline-offset-2"
            >
              Open link <ExternalLink className="size-3" />
            </a>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (status === "error" || status === "blocked") {
    return (
      <Alert className="py-2 px-3">
        <AlertTriangle className="size-4" />
        <AlertDescription>
          <span>
            {errorMessage || `Couldn't verify this ${label} link right now.`}
          </span>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline underline-offset-2"
            >
              Open link <ExternalLink className="size-3" />
            </a>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

export default function InstagramAndYoutubePreview({
  instagram_url,
  youtube_url,
  title,
  errorMessage = true,
}: InstagramAndYoutubePreviewProps) {
  const debouncedInstagram = useDebouncedValue((instagram_url || "").trim());
  const debouncedYoutube = useDebouncedValue((youtube_url || "").trim());

  const [ytStatus, setYtStatus] = useState<LinkStatus>("empty");
  const [ytError, setYtError] = useState("");
  const [ytVideoId, setYtVideoId] = useState<string | null>(null);

  const [igStatus, setIgStatus] = useState<LinkStatus>("empty");
  const [igError, setIgError] = useState("");
  const [igScale, setIgScale] = useState(1);
  const igContainerRef = useRef<HTMLDivElement>(null);
  const igScalerRef = useRef<HTMLDivElement>(null);

  // Validate + verify the YouTube link via YouTube's public oEmbed endpoint.
  useEffect(() => {
    if (!debouncedYoutube) {
      setYtStatus("empty");
      setYtVideoId(null);
      setYtError("");
      return;
    }

    const match = debouncedYoutube.match(YOUTUBE_URL_REGEX);
    if (!match) {
      setYtStatus("invalid");
      setYtVideoId(null);
      return;
    }

    const videoId = match[1];
    setYtVideoId(videoId);
    setYtStatus("checking");
    setYtError("");

    const controller = new AbortController();

    (async () => {
      try {
        // Verified through our own API route (server-to-server) instead of
        // calling youtube.com directly from the browser, since YouTube's
        // oEmbed response doesn't send an Access-Control-Allow-Origin
        // header and would otherwise be blocked by CORS.
        const res = await fetch(
          `/api/youtube-oembed?videoId=${encodeURIComponent(videoId)}`,
          { signal: controller.signal },
        );
        const data = await res.json().catch(() => null);

        if (data?.valid) {
          setYtStatus("valid");
        } else if (data?.unavailable) {
          setYtStatus("unavailable");
          setYtError("could not be found (it may be private or removed)");
        } else {
          setYtStatus("error");
          setYtError("Couldn't verify the video right now. Please try again.");
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Error verifying YouTube link:", err);
        setYtStatus("error");
        setYtError("Couldn't verify the video due to a network error.");
      }
    })();

    return () => controller.abort();
  }, [debouncedYoutube]);

  // Validate the Instagram link format, then let Instagram's own embed
  // script attempt to render a live preview. If no embed shows up within a
  // reasonable time, treat the post as unavailable.
  useEffect(() => {
    if (!debouncedInstagram) {
      setIgStatus("empty");
      setIgError("");
      return;
    }

    const match = debouncedInstagram.match(INSTAGRAM_URL_REGEX);
    if (!match) {
      setIgStatus("invalid");
      return;
    }

    setIgStatus("checking");
    setIgError("");
    setIgScale(1);

    let cancelled = false;
    let observer: MutationObserver | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    // Instagram's embed includes header + media + a comments/footer row that
    // we can't reach or restyle (it renders inside a cross-origin iframe we
    // don't control). Instead of shrinking the whole thing to fit a fixed
    // box (which makes the actual photo/video tiny), we scale to fit the
    // *width* only and let the fixed-height box crop off the bottom chrome
    // (like/comment icons, "Add a comment") via `overflow-hidden`, keeping
    // the header + media area large and visible.
    const fitEmbedToBox = (iframe: HTMLIFrameElement) => {
      const wrapper = igContainerRef.current;
      if (!wrapper) return;
      const wrapperWidth = wrapper.clientWidth;
      const contentWidth = iframe.offsetWidth;
      if (!wrapperWidth || !contentWidth) return;
      const scale = Math.min(wrapperWidth / contentWidth, 1);
      setIgScale(scale);
    };

    const startWatching = () => {
      if (cancelled || !igContainerRef.current) return;

      observer = new MutationObserver(() => {
        const iframe = igContainerRef.current?.querySelector("iframe");
        if (iframe && !cancelled) {
          setIgStatus("valid");
          observer?.disconnect();
          if (timeoutId) clearTimeout(timeoutId);

          fitEmbedToBox(iframe);
          resizeObserver = new ResizeObserver(() => {
            if (!cancelled) fitEmbedToBox(iframe);
          });
          resizeObserver.observe(iframe);
          if (igContainerRef.current) {
            resizeObserver.observe(igContainerRef.current);
          }
        }
      });
      observer.observe(igContainerRef.current, {
        childList: true,
        subtree: true,
      });

      try {
        (window as any).instgrm?.Embeds?.process();
      } catch (err) {
        console.error("Error processing Instagram embed:", err);
      }

      timeoutId = setTimeout(() => {
        observer?.disconnect();
        if (cancelled) return;
        const iframe = igContainerRef.current?.querySelector("iframe");
        if (!iframe) {
          // We can't tell whether the post itself is gone or the widget was
          // simply blocked (ad blockers/tracking protection commonly block
          // Instagram's embed script), so avoid a false "invalid" verdict.
          setIgStatus("blocked");
          setIgError(
            "Couldn't display an Instagram preview here (a browser extension may be blocking it). The link itself may still be valid.",
          );
        }
      }, 8000);
    };

    // Instagram's embed.js keeps an internal "already processed" cache
    // keyed by permalink. If a link is cleared then re-entered, reusing
    // the already-loaded script's `process()` silently no-ops for a
    // permalink it has seen before (even though the old iframe/DOM node
    // is long gone), leaving the UI stuck on "Checking...". Removing and
    // re-adding the script tag forces it to re-execute and rebuild its
    // internal state from scratch, so it always (re)processes the
    // current blockquote.
    const existingScript = document.getElementById(
      "instagram-embed-script",
    ) as HTMLScriptElement | null;
    existingScript?.remove();

    const script = document.createElement("script");
    script.id = "instagram-embed-script";
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = startWatching;
    script.onerror = () => {
      if (!cancelled) {
        setIgStatus("blocked");
        setIgError(
          "Couldn't load Instagram's preview widget (it may be blocked by a browser extension). The link itself may still be valid.",
        );
      }
    };
    document.body.appendChild(script);

    return () => {
      cancelled = true;
      observer?.disconnect();
      resizeObserver?.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [debouncedInstagram]);

  const hasAnyLink = Boolean(
    (instagram_url || "").trim() || (youtube_url || "").trim(),
  );

  const ERROR_STATUSES: LinkStatus[] = [
    "invalid",
    "unavailable",
    "error",
    "blocked",
  ];
  const hasAnyError =
    ERROR_STATUSES.includes(igStatus) || ERROR_STATUSES.includes(ytStatus);

  // Hide the whole component when there's nothing to show (no links at
  // all), or when `errorMessage` is explicitly set to `false` and one of
  // the links is in an error state (instead of showing the error UI).
  if (!hasAnyLink || (errorMessage === false && hasAnyError)) {
    return null;
  }

  return (
    <div className="mt-5">
      <div className="text-sm text-gray-500 mb-2">{title}</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Instagram preview */}
        <div>
          <div className="flex items-center gap-2 mb-2 text-sm font-medium">
            <InstagramIcon className="size-4 text-pink-600" />
            Instagram
          </div>

          {(igStatus === "checking" ||
            igStatus === "valid" ||
            igStatus === "blocked") && (
            <div
              key={debouncedInstagram}
              ref={igContainerRef}
              className={cn(
                "mb-2",
                igStatus === "valid"
                  ? "relative flex h-80 w-full items-start justify-center overflow-hidden rounded-md border border-gray-100 bg-gray-50"
                  : "sr-only",
              )}
            >
              <div
                ref={igScalerRef}
                style={
                  igStatus === "valid"
                    ? {
                        transform: `scale(${igScale})`,
                        transformOrigin: "top center",
                      }
                    : undefined
                }
              >
                <blockquote
                  className="instagram-media"
                  data-instgrm-permalink={debouncedInstagram}
                  data-instgrm-version="14"
                  style={{ margin: 0, width: "100%" }}
                />
              </div>

              {/* Overlay intercepts clicks before they reach the cross-origin iframe */}
              {igStatus === "valid" && (
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      debouncedInstagram,
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                  className="absolute inset-0 z-10 cursor-pointer"
                  aria-label="Open this Instagram post in a new tab"
                />
              )}
            </div>
          )}

          <StatusMessage
            status={igStatus}
            errorMessage={igError}
            url={debouncedInstagram}
            label="Instagram"
          />
        </div>

        {/* YouTube preview */}
        <div>
          <div className="flex items-center gap-2 mb-2 text-sm font-medium">
            <YoutubeIcon className="size-4 text-red-600" />
            YouTube
          </div>

          {ytStatus === "valid" && ytVideoId && (
            <div className="relative aspect-video w-full overflow-hidden rounded-md mb-2">
              <iframe
                src={`https://www.youtube.com/embed/${ytVideoId}`}
                title="YouTube video preview"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />

              {/* Overlay intercepts clicks before they reach the cross-origin iframe */}
              <button
                type="button"
                onClick={() =>
                  window.open(debouncedYoutube, "_blank", "noopener,noreferrer")
                }
                className="absolute inset-0 z-10 cursor-pointer"
                aria-label="Open this YouTube video in a new tab"
              />
            </div>
          )}

          <StatusMessage
            status={ytStatus}
            errorMessage={ytError}
            url={debouncedYoutube}
            label="YouTube"
          />
        </div>
      </div>
    </div>
  );
}
