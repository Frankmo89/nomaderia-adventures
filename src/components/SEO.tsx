import { Helmet } from "react-helmet-async";
import { SITE_URL } from "@/hooks/use-seo";

const DEFAULT_OG_IMAGE =
  "https://vrixiuvnhvqafmxlcyex.supabase.co/storage/v1/object/public/destinations/1772502898883-4w9ykr.jpeg";

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  slug: string;
}

const SEO = ({ title, description, image, slug }: SEOProps) => {
  const fullTitle = `${title} | Nomaderia Adventures`;
  const pageUrl = `${SITE_URL}/${slug}`;
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
