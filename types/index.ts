// ============================================================
// types/index.ts — All TypeScript interfaces for LavishOrganic
// No `any` types. Strict mode compliant.
// ============================================================

// ============================================================
// AUTH & USER TYPES
// ============================================================

export type UserRole = 'customer' | 'admin' | 'influencer';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  referral_code: string | null;
  referred_by: string | null;
  total_orders: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type AddressInput = Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

// ============================================================
// CATEGORY TYPES
// ============================================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  hero_image_url: string | null;
  parent_id: string | null;
  is_active: boolean;
  sort_order: number;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  parent?: Category | null;
  children?: Category[];
  product_count?: number;
}

// ============================================================
// PRODUCT TYPES
// ============================================================

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  cloudinary_id: string | null;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  value: string;
  price_modifier: number;
  stock_quantity: number;
  sku: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category_id: string | null;
  price: number;
  compare_price: number | null;
  cost_price: number | null;
  sku: string | null;
  weight: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  is_active: boolean;
  is_featured: boolean;
  tags: string[];
  ingredients: string | null;
  how_to_use: string | null;
  benefits: string[];
  certifications: string[];
  hsn_code: string | null;
  gst_rate: number;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: Category | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
  average_rating?: number;
  review_count?: number;
}

export type ProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category' | 'images' | 'variants' | 'average_rating' | 'review_count'>;

export interface ProductListItem extends Omit<Product, 'description' | 'ingredients' | 'how_to_use'> {
  primary_image?: ProductImage | null;
}

// ============================================================
// REVIEW TYPES
// ============================================================

export interface Review {
  id: string;
  product_id: string;
  user_id: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  is_verified: boolean;
  is_approved: boolean;
  images: string[];
  helpful_count: number;
  created_at: string;
  // Joined
  user?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
}

export interface ReviewInput {
  product_id: string;
  rating: number;
  title?: string;
  body?: string;
  images?: string[];
}

export interface ProductRating {
  product_id: string;
  review_count: number;
  average_rating: number;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
}

// ============================================================
// ORDER TYPES
// ============================================================

export type OrderStatus =
  | 'pending'
  | 'awaiting_cod_confirmation'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cod_pending';
export type PaymentMethod = 'razorpay' | 'cod';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  image_url: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  gst_rate: number | null;
  hsn_code: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  status: OrderStatus;
  subtotal: number;
  discount_amount: number;
  shipping_amount: number;
  tax_amount: number;
  total: number;
  coupon_code: string | null;
  coupon_id: string | null;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  shipping_address: AddressSnapshot;
  billing_address: AddressSnapshot | null;
  notes: string | null;
  influencer_id: string | null;
  commission_amount: number;
  shiprocket_order_id: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  estimated_delivery: string | null;
  gst_invoice_number: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  items?: OrderItem[];
  user?: Pick<Profile, 'id' | 'full_name' | 'phone'>;
}

// Snapshot of address stored in order (denormalized for immutability)
export interface AddressSnapshot {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface CreateOrderInput {
  items: Array<{
    product_id: string;
    variant_id?: string;
    quantity: number;
  }>;
  shipping_address: AddressSnapshot;
  billing_address?: AddressSnapshot;
  coupon_code?: string;
  payment_method: PaymentMethod;
  notes?: string;
}

// ============================================================
// CART TYPES
// ============================================================

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
  // Joined
  product?: ProductListItem;
  variant?: ProductVariant;
}

// Client-side cart item (used in Zustand store)
export interface CartItemWithProduct {
  product_id: string;
  variant_id: string | null;
  quantity: number;
  product: ProductListItem;
  variant: ProductVariant | null;
  unit_price: number;
  total_price: number;
}

export interface CartTotals {
  subtotal: number;
  discount_amount: number;
  shipping_amount: number;
  tax_amount: number;
  total: number;
  item_count: number;
}

// ============================================================
// COUPON TYPES
// ============================================================

export type CouponType = 'percentage' | 'fixed' | 'free_shipping' | 'buy_x_get_y';

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number | null;
  min_order_amount: number;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  per_user_limit: number;
  applicable_products: string[];
  applicable_categories: string[];
  influencer_id: string | null;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
}

export interface CouponValidationResult {
  valid: boolean;
  discount_amount: number;
  message: string;
  coupon?: Coupon;
}

// ============================================================
// OFFER TYPES
// ============================================================

export type OfferType = 'banner' | 'popup' | 'flash_sale' | 'combo';

export interface Offer {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  type: OfferType;
  discount_percentage: number | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

// ============================================================
// INFLUENCER TYPES
// ============================================================

export type InfluencerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface InfluencerProfile {
  id: string;
  instagram_handle: string | null;
  youtube_channel: string | null;
  follower_count: number | null;
  niche: string | null;
  why_join: string | null;
  commission_rate: number;
  total_sales: number;
  total_commission: number;
  pending_commission: number;
  paid_commission: number;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  pan_number: string | null;
  status: InfluencerStatus;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  profile?: Profile;
}

export interface InfluencerApplicationInput {
  instagram_handle?: string;
  youtube_channel?: string;
  follower_count: number;
  niche: string;
  why_join: string;
}

export interface CommissionTransaction {
  id: string;
  influencer_id: string;
  order_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  paid_at: string | null;
  payment_reference: string | null;
  created_at: string;
  // Joined
  order?: Pick<Order, 'id' | 'order_number' | 'total' | 'created_at'>;
}

// ============================================================
// NOTIFICATION TYPES
// ============================================================

export type NotificationType = 'order' | 'promo' | 'review' | 'commission' | 'system';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: NotificationType;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

// ============================================================
// RAZORPAY TYPES
// ============================================================

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  created_at: number;
}

export interface RazorpayPaymentSuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface CreateRazorpayOrderInput {
  amount: number;       // in paise
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: RazorpayPaymentEntity;
    };
    refund?: {
      entity: RazorpayRefundEntity;
    };
  };
  created_at: number;
}

export interface RazorpayPaymentEntity {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  method: string;
  captured: boolean;
  description: string | null;
  notes: Record<string, string>;
  created_at: number;
}

export interface RazorpayRefundEntity {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  payment_id: string;
  notes: Record<string, string>;
  created_at: number;
}

// ============================================================
// SHIPROCKET TYPES
// ============================================================

export interface ShiprocketAuthResponse {
  token: string;
  expires_at?: string;
}

export interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: string;
  hsn: number;
}

export interface ShiprocketCreateOrderPayload {
  order_id: string;
  order_date: string;
  pickup_location: string;
  channel_id: string;
  billing_customer_name: string;
  billing_last_name: string;
  billing_address: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  order_items: ShiprocketOrderItem[];
  payment_method: string;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

export interface ShiprocketTrackingResponse {
  tracking_data: {
    track_status: number;
    shipment_status: number;
    shipment_track: Array<{
      id: number;
      awb_code: string;
      current_status: string;
      shipment_status: number;
      shipment_track_activities: Array<{
        date: string;
        status: string;
        activity: string;
        location: string;
      }>;
    }>;
  };
}

export interface ShiprocketServiceabilityResponse {
  data: {
    available_courier_companies: Array<{
      courier_company_id: number;
      courier_name: string;
      rate: number;
      estimated_delivery_days: number;
    }>;
  };
}

// ============================================================
// GST TYPES
// ============================================================

export interface GSTBreakdown {
  taxable_amount: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  total_gst: number;
  total_amount: number;
}

export interface GSTInvoiceData {
  invoice_number: string;
  invoice_date: string;
  order: Order;
  items: OrderItem[];
  business: {
    name: string;
    address: string;
    gstin: string;
    state: string;
    state_code: string;
  };
  is_interstate: boolean;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ============================================================
// FILTER & PAGINATION TYPES
// ============================================================

export interface ProductFilters {
  category?: string;
  min_price?: number;
  max_price?: number;
  rating?: number;
  tags?: string[];
  in_stock?: boolean;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'bestselling';
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// ============================================================
// UI TYPES
// ============================================================

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

export interface StoreSettings {
  store_name: string;
  free_shipping_threshold: number;
  flat_shipping_rate: number;
  enable_cod: boolean;
  social_instagram: string;
  social_facebook: string;
  whatsapp_number: string;
}

// ============================================================
// DASHBOARD / ANALYTICS TYPES
// ============================================================

export interface DashboardStats {
  revenue_mtd: number;
  revenue_yesterday: number;
  orders_today: number;
  orders_yesterday: number;
  new_customers_mtd: number;
  pending_orders: number;
  low_stock_count: number;
}

export interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  total_revenue: number;
  total_quantity: number;
  image_url: string | null;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  icon?: string;
  action_url?: string;
  is_read: boolean;
  order_id?: string;
  created_at: string;
}
