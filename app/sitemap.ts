import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ProductRegistry } from '@/engines/registry/product-registry';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://procerix.com';
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from('courses')
    .select('slug, updated_at, course_type')
    .eq('is_published', true);

  const courseUrls = (courses || []).map((course) => ({
    url: `${baseUrl}/${course.course_type}/${course.slug}`,
    lastModified: new Date(course.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const productUrls = Object.values(ProductRegistry).map((product) => ({
    url: `${baseUrl}${product.routes.landing}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));

  const staticUrls = [
    '',
    '/about',
    '/contact',
    '/pricing',
    '/search'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return [...staticUrls, ...productUrls, ...courseUrls];
}
