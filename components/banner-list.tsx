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

function textPositionClass(position: string | null) {
  switch (position) {
    case "left":
      return "items-center justify-start text-left";
    case "right":
      return "items-center justify-end text-right";
    default:
      return "items-center justify-center text-center";
  }
}

export function BannerCard({ banner }: { banner: BannerItem }) {
  const linkUrl = banner.link_url?.trim();
  const hasLink = Boolean(linkUrl);

  return (
    <div className="group relative overflow-hidden rounded-2xl">
      {hasLink ? (
        <a
          href={linkUrl}
          target={banner.link_target ?? "_self"}
          rel={
            banner.link_target === "_blank" ? "noopener noreferrer" : undefined
          }
          className="block"
        >
          <picture>
            {banner.mobile_image_url && (
              <source
                media="(max-width: 767px)"
                srcSet={banner.mobile_image_url}
              />
            )}
            {banner.tablet_image_url && (
              <source
                media="(max-width: 1023px)"
                srcSet={banner.tablet_image_url}
              />
            )}
            <img
              src={banner.desktop_image_url}
              alt={banner.alt_text || banner.title}
              loading="lazy"
              className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
              style={{
                aspectRatio:
                  banner.desktop_width && banner.desktop_height
                    ? `${banner.desktop_width} / ${banner.desktop_height}`
                    : undefined,
              }}
            />
          </picture>
        </a>
      ) : (
        <picture>
          {banner.mobile_image_url && (
            <source
              media="(max-width: 767px)"
              srcSet={banner.mobile_image_url}
            />
          )}
          {banner.tablet_image_url && (
            <source
              media="(max-width: 1023px)"
              srcSet={banner.tablet_image_url}
            />
          )}
          <img
            src={banner.desktop_image_url}
            alt={banner.alt_text || banner.title}
            loading="lazy"
            className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
            style={{
              aspectRatio:
                banner.desktop_width && banner.desktop_height
                  ? `${banner.desktop_width} / ${banner.desktop_height}`
                  : undefined,
            }}
          />
        </picture>
      )}

      {(banner.overlay_color ||
        banner.title ||
        banner.subtitle ||
        banner.link_text) && (
        <div
          className={`absolute inset-0 flex p-6 md:p-10 ${textPositionClass(banner.text_position)}`}
          style={{ backgroundColor: banner.overlay_color || "transparent" }}
        >
          {(banner.title || banner.subtitle || banner.link_text) && (
            <div
              className="max-w-2xl space-y-2"
              style={{ color: banner.text_color || "#ffffff" }}
            >
              {banner.title && (
                <h3 className="text-xl font-bold md:text-3xl">
                  {banner.title}
                </h3>
              )}
              {banner.subtitle && (
                <p className="text-sm opacity-95 md:text-base">
                  {banner.subtitle}
                </p>
              )}
              {banner.link_text && (
                <span className="mt-2 inline-flex rounded-full bg-black/35 px-4 py-1.5 text-sm font-medium">
                  {banner.link_text}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function BannerList({ banners }: { banners: BannerItem[] }) {
  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
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
