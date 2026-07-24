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
  mobile: { width: 800, height: 1000, maxWidth: 767 },
  tablet: { width: 1200, height: 700, minWidth: 768, maxWidth: 1023 },
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

export function BannerCard({ banner }: { banner: BannerItem }) {
  const linkUrl = banner.link_url?.trim();
  const hasLink = Boolean(linkUrl);

  const image = (
    <picture>
      {banner.mobile_image_url && (
        <source
          media={`(max-width: ${BANNER_SIZES.mobile.maxWidth}px)`}
          srcSet={banner.mobile_image_url}
        />
      )}
      {banner.tablet_image_url && (
        <source
          media={`(min-width: ${BANNER_SIZES.tablet.minWidth}px) and (max-width: ${BANNER_SIZES.tablet.maxWidth}px)`}
          srcSet={banner.tablet_image_url}
        />
      )}
      <img
        src={banner.desktop_image_url}
        alt={banner.alt_text || banner.title}
        loading="lazy"
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

export function BannerList({ banners }: { banners: BannerItem[] }) {
  return (
    <section className="py-8">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="space-y-4">
          {banners.map((banner) => (
            <BannerCard key={banner.id} banner={banner} />
          ))}
        </div>
      </div>
    </section>
  );
}

export type { BannerItem };
