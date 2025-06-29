import type { MetadataRoute } from 'next';
 
const baseUrl = 'https://glowy.bg'; // Replace with your actual domain when known

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/account/', '/business/'], // Disallow private areas
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
