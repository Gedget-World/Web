import { getImageProps } from "next/image";

type BannerItem = {
  id: string;
  title: string;
  subtitle: string | null;
  desktop_image_url: string;
  desktop_width: number | null;
  desktop_height: number | null;
  tablet_image_url: string | null;
  mobile_image_url: string | null;
  link_url: string | null;
  link_target: string | null;
  link_text: string | null;
  text_color: string | null;
  overlay_color: string | null;
  text_position: string | null;
  alt_text: string | null;
};

// Update these if the banner asset dimensions/breakpoints change.
// Widths are the max viewport width (in px) each banner size applies to,
// except desktop which applies from DESKTOP.minWidth upward.
const BANNER_SIZES = {
  mobile: { width: 800, height: 835, maxWidth: 767 },
  tablet: { width: 1920, height: 700, minWidth: 768, maxWidth: 1023 },
  desktop: { width: 1920, height: 700, minWidth: 1024 },
};

const BANNER_ASPECT_RATIO_CSS = `
  .banner-card {
    aspect-ratio: ${BANNER_SIZES.mobile.width} / ${BANNER_SIZES.mobile.height};
  }
  @media (min-width: ${BANNER_SIZES.tablet.minWidth}px) {
    .banner-card {
      aspect-ratio: ${BANNER_SIZES.tablet.width} / ${BANNER_SIZES.tablet.height};
    }
  }
  @media (min-width: ${BANNER_SIZES.desktop.minWidth}px) {
    .banner-card {
      aspect-ratio: ${BANNER_SIZES.desktop.width} / ${BANNER_SIZES.desktop.height};
    }
  }
`;

export function BannerCard({
  banner,
  priority = false,
}: {
  banner: BannerItem;
  priority?: boolean;
}) {
  const linkUrl = banner.link_url?.trim();
  const hasLink = Boolean(linkUrl);

  // Route each art-directed source through Next's image optimizer (resize +
  // modern format) while keeping <picture>/<source> so only the matching
  // breakpoint's image is ever downloaded.
  const commonImageProps = {
    alt: banner.alt_text || banner.title,
    fill: true,
    sizes: "100vw",
    quality: 70,
  };

  const mobileImage = banner.mobile_image_url
    ? getImageProps({ ...commonImageProps, src: banner.mobile_image_url }).props
    : null;

  const tabletImage = banner.tablet_image_url
    ? getImageProps({ ...commonImageProps, src: banner.tablet_image_url }).props
    : null;

  const { props: desktopImage } = getImageProps({
    ...commonImageProps,
    src: banner.desktop_image_url,
  });

  const image = (
    <picture>
      {mobileImage && (
        <source
          media={`(max-width: ${BANNER_SIZES.mobile.maxWidth}px)`}
          srcSet={mobileImage.srcSet}
        />
      )}
      {tabletImage && (
        <source
          media={`(min-width: ${BANNER_SIZES.tablet.minWidth}px) and (max-width: ${BANNER_SIZES.tablet.maxWidth}px)`}
          srcSet={tabletImage.srcSet}
        />
      )}
      <img
        {...desktopImage}
        alt={desktopImage.alt}
        // The above-the-fold banner is typically the LCP element — load it
        // eagerly with a high fetch priority instead of lazy-loading it.
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding={priority ? "sync" : "async"}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </picture>
  );

  return (
    <div className="banner-card group relative w-full overflow-hidden rounded-sm">
      <style>{BANNER_ASPECT_RATIO_CSS}</style>
      {hasLink ? (
        <a
          href={linkUrl}
          target={banner.link_target ?? "_self"}
          rel={
            banner.link_target === "_blank" ? "noopener noreferrer" : undefined
          }
          className="absolute inset-0 block"
        >
          {image}
        </a>
      ) : (
        image
      )}
    </div>
  );
}

export function BannerList({
  banners,
  priority = false,
}: {
  banners: BannerItem[];
  priority?: boolean;
}) {
  return (
    <section className="py-8">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="space-y-4">
          {banners.map((banner, index) => (
            <BannerCard
              key={banner.id}
              banner={banner}
              priority={priority && index === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// Matches BannerCard's aspect ratio so the Suspense fallback occupies the
// same height as the real banner, preventing layout shift when it streams in.
export function BannerSkeleton() {
  return (
    <section className="py-8">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="banner-card w-full animate-pulse rounded-sm bg-muted/50">
          <style>{BANNER_ASPECT_RATIO_CSS}</style>
        </div>
      </div>
    </section>
  );
}

export type { BannerItem };
