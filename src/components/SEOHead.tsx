import { Helmet } from "react-helmet-async";

const DEFAULT_OG_IMAGE = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80";

interface SEOHeadProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
}

const SEOHead = ({
  title,
  description,
  image = DEFAULT_OG_IMAGE,
  url,
  type = "article",
}: SEOHeadProps) => {
  const fullTitle = `${title} | Nomaderia Adventures`;
  const pageUrl = url || (typeof window !== "undefined" ? window.location.href : "");

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:type" content={type} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEOHead;
