
import type { MarketplaceProduct } from '../context/MarketplaceContext';
import { supabase } from './supabase';

export type PublicListing = MarketplaceProduct & {
  description: string;
  listingType: string;
  businessId: string | null;
  sellerId: string;
  city: string | null;
  condition: string | null;
  currency: string;
};

const LISTING_IMAGES_BUCKET = 'listing-images';

export async function getActiveListings(): Promise<PublicListing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      id,
      title,
      price,
      category,
      description,
      listing_type,
      business_id,
      seller_id,
      city,
      condition,
      currency,
      listing_media (
        storage_path,
        alt_text,
        media_type,
        sort_order
      )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load listings: ${error.message}`);
  }

  return (data ?? []).map((listing) => {
    const media = [...(listing.listing_media ?? [])]
      .filter((item) => item.media_type === 'image')
      .sort((a, b) => a.sort_order - b.sort_order);

    const imagePath = media[0]?.storage_path ?? '';

    const image = imagePath
      ? imagePath.startsWith('http://') ||
        imagePath.startsWith('https://')
        ? imagePath
        : supabase.storage
            .from(LISTING_IMAGES_BUCKET)
            .getPublicUrl(imagePath).data.publicUrl
      : '';

    return {
      id: listing.id,
      name: listing.title,
      price: listing.price,
      category: listing.category ?? listing.listing_type,
      image,
      description: listing.description ?? '',
      listingType: listing.listing_type,
      businessId: listing.business_id,
      sellerId: listing.seller_id,
      city: listing.city,
      condition: listing.condition,
      currency: listing.currency,
    };
  });
}
