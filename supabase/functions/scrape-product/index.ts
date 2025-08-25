import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedProduct {
  title?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  images?: string[];
  currency?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Scraping URL:', url);

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch URL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const html = await response.text();
    const product = await scrapeProductData(html, url);

    console.log('Scraped product data:', product);

    return new Response(JSON.stringify({ product }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in scrape-product function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function scrapeProductData(html: string, baseUrl: string): Promise<ScrapedProduct> {
  const product: ScrapedProduct = {};

  // Helper function to decode HTML entities
  function decodeHtmlEntities(text: string): string {
    const entities: { [key: string]: string } = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&apos;': "'",
      '&#8211;': '–',
      '&#8212;': '—',
      '&#8216;': "'",
      '&#8217;': "'",
      '&#8220;': '"',
      '&#8221;': '"',
      '&#8230;': '…',
      '&nbsp;': ' '
    };
    
    return text.replace(/&[#\w]+;/g, (entity) => entities[entity] || entity);
  }

  // Extract title
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i) || 
                    html.match(/<meta[^>]*property=['"](og:title|twitter:title)['"][^>]*content=['"]([^'"]*)['"]/i) ||
                    html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (titleMatch) {
    let title = titleMatch[titleMatch.length - 1]?.replace(/<[^>]*>/g, '').trim();
    if (title) {
      // Decode HTML entities
      title = decodeHtmlEntities(title);
      // Remove common site suffixes and separators
      title = title.replace(/\s*[-–—|]\s*(Book My Shoe|Buy Online|Shop Now|Online Store).*$/i, '');
      title = title.replace(/\s*[-–—|]\s*$/, ''); // Remove trailing separators
      product.title = title.trim();
    }
  }

  // Extract description - try multiple selectors
  let description = '';
  
  // Try meta descriptions first
  const metaDescMatch = html.match(/<meta[^>]*name=['"](description|og:description|twitter:description)['"][^>]*content=['"]([^'"]*)['"]/gi);
  if (metaDescMatch) {
    for (const match of metaDescMatch) {
      const contentMatch = match.match(/content=['"]([^'"]*)['"]/i);
      if (contentMatch && contentMatch[1] && contentMatch[1].length > description.length) {
        description = contentMatch[1];
      }
    }
  }

  // Try property-based meta tags
  const propertyDescMatch = html.match(/<meta[^>]*property=['"](og:description|twitter:description)['"][^>]*content=['"]([^'"]*)['"]/gi);
  if (propertyDescMatch) {
    for (const match of propertyDescMatch) {
      const contentMatch = match.match(/content=['"]([^'"]*)['"]/i);
      if (contentMatch && contentMatch[1] && contentMatch[1].length > description.length) {
        description = contentMatch[1];
      }
    }
  }

  // Try product description divs/sections if meta description is short or missing
  if (!description || description.length < 50) {
    const productDescSelectors = [
      /<div[^>]*class[^>]*product[^>]*description[^>]*>(.*?)<\/div>/is,
      /<div[^>]*class[^>]*description[^>]*>(.*?)<\/div>/is,
      /<section[^>]*class[^>]*description[^>]*>(.*?)<\/section>/is,
      /<p[^>]*class[^>]*description[^>]*>(.*?)<\/p>/is
    ];
    
    for (const selector of productDescSelectors) {
      const match = html.match(selector);
      if (match && match[1]) {
        const cleanDesc = match[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleanDesc.length > description.length) {
          description = cleanDesc;
        }
      }
    }
  }

  if (description) {
    product.description = decodeHtmlEntities(description).trim();
  }

  // Extract price - multiple patterns for different e-commerce sites
  const pricePatterns = [
    /\$[\d,]+\.?\d*/g,
    /₹[\d,]+\.?\d*/g,
    /€[\d,]+\.?\d*/g,
    /£[\d,]+\.?\d*/g,
    /"price[^"]*":\s*"?([0-9,]+\.?[0-9]*)"?/gi,
    /"amount[^"]*":\s*"?([0-9,]+\.?[0-9]*)"?/gi,
    /price[^>]*>[\s]*([₹$€£]?[\d,]+\.?\d*)/gi,
  ];

  for (const pattern of pricePatterns) {
    const matches = html.match(pattern);
    if (matches && matches.length > 0) {
      const priceStr = matches[0].replace(/[₹$€£,]/g, '').trim();
      const priceNum = parseFloat(priceStr);
      if (!isNaN(priceNum) && priceNum > 0) {
        product.price = priceNum;
        break;
      }
    }
  }

  // Extract images
  const images: string[] = [];
  
  // Open Graph images
  const ogImageMatches = html.match(/<meta[^>]*property=['"](og:image|twitter:image)['"][^>]*content=['"]([^'"]*)['"]/gi);
  if (ogImageMatches) {
    ogImageMatches.forEach(match => {
      const urlMatch = match.match(/content=['"]([^'"]*)['"]/i);
      if (urlMatch && urlMatch[1]) {
        images.push(resolveUrl(urlMatch[1], baseUrl));
      }
    });
  }

  // Product images from img tags
  const imgMatches = html.match(/<img[^>]*src=['"]([^'"]*)['"]/gi);
  if (imgMatches) {
    imgMatches.forEach(match => {
      const srcMatch = match.match(/src=['"]([^'"]*)['"]/i);
      if (srcMatch && srcMatch[1]) {
        const imageUrl = resolveUrl(srcMatch[1], baseUrl);
        // Filter out small images, icons, logos
        if (!imageUrl.includes('logo') && 
            !imageUrl.includes('icon') && 
            !imageUrl.includes('sprite') &&
            !imageUrl.includes('placeholder') &&
            imageUrl.length > 20) {
          images.push(imageUrl);
        }
      }
    });
  }

  // Remove duplicates and limit to first 10 images
  product.images = [...new Set(images)].slice(0, 10);

  return product;
}

function resolveUrl(url: string, baseUrl: string): string {
  try {
    // If it's already a full URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // If it starts with //, add protocol
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    
    // If it's a relative URL, resolve against base URL
    const base = new URL(baseUrl);
    const resolved = new URL(url, base.origin);
    return resolved.toString();
  } catch (error) {
    console.error('Error resolving URL:', error);
    return url;
  }
}