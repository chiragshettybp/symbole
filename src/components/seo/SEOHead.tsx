import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  noIndex?: boolean;
}

const SEOHead = ({
  title = 'Symbole - Premium Fashion & Apparel',
  description = 'Discover premium imported jackets, apparels, and trending styles at Symbole. Fresh styles, exclusive drops, and quality fashion.',
  image = '/lovable-uploads/fd6a3364-2e6b-4ae0-a7e7-17f87b52ec21.png',
  url,
  type = 'website',
  noIndex = false,
}: SEOHeadProps) => {
  const fullTitle = title.includes('Symbole') ? title : `${title} | Symbole`;
  const fullUrl = url ? `https://symbole.lovable.app${url}` : 'https://symbole.lovable.app';
  const fullImage = image.startsWith('http') ? image : `https://symbole.lovable.app${image}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Symbole" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
      
      {/* No Index for admin pages */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
};

export default SEOHead;
