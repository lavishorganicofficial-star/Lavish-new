-- ============================================================
-- LavishOrganic - Demo Categories & Products Seed Data
-- ============================================================

-- CATEGORIES (5)
INSERT INTO categories (id, name, slug, description, image_url, hero_image_url, sort_order, is_active, meta_title, meta_description) VALUES
(
  '11111111-0000-0000-0000-000000000001',
  'Face Care',
  'face-care',
  'Nourish your skin with our certified organic face care range.',
  'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=800',
  'https://res.cloudinary.com/dtrin6lwv/image/upload/v1780123385/lavishorganic/categories/fltnntqmek8hq3o8yyk1.png',
  1, TRUE,
  'Organic Face Care Products | LavishOrganic',
  'Shop 100% organic face care made with natural ingredients.'
),
(
  '11111111-0000-0000-0000-000000000002',
  'Body Care',
  'body-care',
  'Indulge your body with our handcrafted organic lotions.',
  'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800',
  'https://res.cloudinary.com/dtrin6lwv/image/upload/v1780123385/lavishorganic/categories/fltnntqmek8hq3o8yyk1.png',
  2, TRUE,
  'Organic Body Care Products | LavishOrganic',
  'Natural body lotions, scrubs, and oils.'
),
(
  '11111111-0000-0000-0000-000000000003',
  'Hair Care',
  'hair-care',
  'Revitalize your hair with our plant-powered collection.',
  'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800',
  NULL,
  3, TRUE,
  'Organic Hair Care Products | LavishOrganic',
  'Discover our organic shampoos, conditioners, and hair oils.'
),
(
  '11111111-0000-0000-0000-000000000004',
  'Wellness',
  'wellness',
  'Support your inner health with our wellness range.',
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800',
  'https://res.cloudinary.com/dtrin6lwv/image/upload/v1780124325/lavishorganic/categories/tbovuloi4jh6cwamof5m.png',
  4, TRUE,
  'Holistic Wellness & Supplements | LavishOrganic',
  'Support your wellness journey with our pure, organic supplements.'
),
(
  '11111111-0000-0000-0000-000000000005',
  'Combo Sets',
  'combo-sets',
  'Gift yourself or a loved one our curated organic combo sets.',
  'https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=800',
  NULL,
  5, TRUE,
  'Organic Gift Sets & Combos | LavishOrganic',
  'Curated organic skincare gift sets and combo packs.'
) ON CONFLICT (id) DO NOTHING;

-- PRODUCTS (Sample of 3 Products)
INSERT INTO products (
  id, name, slug, short_description, description, category_id,
  price, compare_price, cost_price, sku, weight,
  stock_quantity, is_active, is_featured,
  tags, ingredients, how_to_use, benefits, certifications,
  hsn_code, gst_rate, meta_title, meta_description
) VALUES
-- 1. Face Serum
(
  '22222222-0000-0000-0000-000000000001',
  'Rose Glow Vitamin C Face Serum',
  'rose-glow-vitamin-c-face-serum',
  'Brightening serum with pure rose extract and 20% Vitamin C.',
  'Potent blend of 20% stabilized Vitamin C, Bulgarian rose extract, and hyaluronic acid.',
  '11111111-0000-0000-0000-000000000001',
  799.00, 1299.00, 280.00, 'LO-FC-001', 30.00,
  150, TRUE, TRUE,
  ARRAY['vitamin-c', 'brightening', 'anti-aging', 'rose', 'serum', 'face'],
  'Aqua, Ascorbic Acid (Vitamin C) 20%, Rosa Damascena Flower Water',
  'Apply 3-4 drops to clean, dry face and neck in the morning.',
  ARRAY['Brightens dull skin', 'Fades dark spots', 'Reduces fine lines'],
  ARRAY['ECOCERT Certified', 'Cruelty Free', 'Dermatologist Tested', 'Vegan'],
  '33049910', 18.00,
  'Rose Glow Vitamin C Face Serum | LavishOrganic',
  'Buy Rose Glow Vitamin C Serum online.'
),
-- 2. Face Wash
(
  '22222222-0000-0000-0000-000000000002',
  'Neem & Turmeric Purifying Face Wash',
  'neem-turmeric-purifying-face-wash',
  'Antibacterial face wash with neem, turmeric & tea tree.',
  'Harnesses the ancient power of Ayurvedic ingredients.',
  '11111111-0000-0000-0000-000000000001',
  349.00, 499.00, 120.00, 'LO-FC-002', 100.00,
  200, TRUE, TRUE,
  ARRAY['neem', 'turmeric', 'acne', 'oily-skin', 'face-wash'],
  'Aqua, Azadirachta Indica (Neem) Leaf Extract',
  'Wet face. Apply a small amount and massage. Rinse.',
  ARRAY['Fights acne bacteria', 'Controls excess oil'],
  ARRAY['Sulphate Free', 'Paraben Free', 'Vegan'],
  '33049910', 18.00,
  'Neem & Turmeric Face Wash | LavishOrganic',
  'Buy Neem Turmeric Face Wash.'
),
-- 3. Body Lotion
(
  '22222222-0000-0000-0000-000000000004',
  'Coconut & Vanilla Body Butter Lotion',
  'coconut-vanilla-body-butter-lotion',
  '24-hour moisturizing body lotion with coconut oil, vanilla, and shea.',
  'Melts into skin like silk. Made with cold-pressed virgin coconut oil.',
  '11111111-0000-0000-0000-000000000002',
  499.00, 749.00, 175.00, 'LO-BC-001', 200.00,
  175, TRUE, FALSE,
  ARRAY['coconut', 'vanilla', 'body-lotion'],
  'Aqua, Cocos Nucifera (Coconut) Oil, Butyrospermum Parkii (Shea) Butter',
  'Apply liberally to body after bath or shower.',
  ARRAY['24-hour moisturization', 'Softens skin', 'Non-greasy'],
  ARRAY['Paraben Free', 'Sulphate Free', 'Cruelty Free', 'Vegan'],
  '33049910', 18.00,
  'Coconut Vanilla Body Lotion | LavishOrganic',
  'Buy Coconut & Vanilla Body Butter Lotion.'
) ON CONFLICT (id) DO NOTHING;

-- PRODUCT IMAGES
INSERT INTO product_images (id, product_id, url, alt_text, sort_order, is_primary) VALUES
('44444444-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800', 'Rose Glow Vitamin C Face Serum', 1, TRUE),
('44444444-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800', 'Neem & Turmeric Face Wash', 1, TRUE),
('44444444-0000-0000-0000-000000000006', '22222222-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1608248593842-8021c618e1cb?w=800', 'Coconut & Vanilla Body Butter Lotion', 1, TRUE)
ON CONFLICT (id) DO NOTHING;
