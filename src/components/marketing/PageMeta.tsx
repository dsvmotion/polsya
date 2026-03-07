import { Helmet } from 'react-helmet-async';
import { APP_NAME } from '@/lib/brand';

interface PageMetaProps {
  title: string;
  description: string;
  path?: string;
}

export function PageMeta({ title, description, path }: PageMetaProps) {
  const fullTitle = `${title} | ${APP_NAME}`;
  const url = path ? `https://polsya.com${path}` : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {url && <link rel="canonical" href={url} />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      {url && <meta property="og:url" content={url} />}
    </Helmet>
  );
}
