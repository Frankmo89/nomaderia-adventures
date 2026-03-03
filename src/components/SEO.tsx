import { Helmet } from "react-helmet-async";
import { SITE_URL, DEFAULT_OG_IMAGE } from "@/hooks/use-seo";

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  slug: string;
}

const SEO = ({ title, description, image, slug }: SEOProps) => {
  const fullTitle = `${title} | Nomaderia Adventures`;
  const normalizedSlug = slug.replace(/^\/+/, "");
  const pageUrl = new URL(normalizedSlug, SITE_URL).toString();
  const ogImage = image || DEFAULT_OG_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:type" content="article" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};

export default SEO;
