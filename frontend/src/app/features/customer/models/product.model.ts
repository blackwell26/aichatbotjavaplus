/** Customer-facing product models. */

export interface ProductSummary {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  price: number;
  salePrice?: number;
  thumbnailUrl?: string;
  availability: ProductAvailability;
  averageRating: number;
  reviewCount: number;
}

export interface ProductDetail extends ProductSummary {
  description: string;
  imageUrls: string[];
  specifications: ProductSpec[];
  shippingInfo: string;
  returnEligible: boolean;
  returnPolicyDays: number;
  weight?: string;
  dimensions?: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export type ProductAvailability = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED';

export const PRODUCT_AVAILABILITY_LABELS: Record<ProductAvailability, string> = {
  IN_STOCK: 'In stock',
  LOW_STOCK: 'Limited stock',
  OUT_OF_STOCK: 'Out of stock',
  DISCONTINUED: 'Discontinued',
};

export interface ProductFilter {
  query?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: ProductAvailability;
  minRating?: number;
  page?: number;
  pageSize?: number;
}
