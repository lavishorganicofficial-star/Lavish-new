-- ============================================================
-- Migration 005: Seed Data
-- Run AFTER migrations 001-004
-- ============================================================

-- ============================================================
-- CATEGORIES (5)
-- ============================================================
INSERT INTO categories (id, name, slug, description, image_url, hero_image_url, sort_order, is_active, meta_title, meta_description) VALUES
(
  '11111111-0000-0000-0000-000000000001',
  'Face Care',
  'face-care',
  'Nourish your skin with our certified organic face care range. From gentle cleansers to luxurious serums, crafted with pure botanical ingredients.',
  'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=800',
  'https://res.cloudinary.com/dtrin6lwv/image/upload/v1780123385/lavishorganic/categories/fltnntqmek8hq3o8yyk1.png',
  1, TRUE,
  'Organic Face Care Products | LavishOrganic',
  'Shop 100% organic face care — cleansers, serums, moisturizers, and face masks made with natural ingredients. Dermatologist tested.'
),
(
  '11111111-0000-0000-0000-000000000002',
  'Body Care',
  'body-care',
  'Indulge your body with our handcrafted organic lotions, scrubs, and oils. Moisturize, exfoliate, and pamper from head to toe.',
  'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800',
  'https://res.cloudinary.com/dtrin6lwv/image/upload/v1780123385/lavishorganic/categories/fltnntqmek8hq3o8yyk1.png',
  2, TRUE,
  'Organic Body Care Products | LavishOrganic',
  'Natural body lotions, scrubs, and oils. 100% organic, cruelty-free body care made in India.'
),
(
  '11111111-0000-0000-0000-000000000003',
  'Hair Care',
  'hair-care',
  'Revitalize your hair with our plant-powered hair care collection. Shampoos, conditioners, and oils for every hair type.',
  'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800',
  'https://res.cloudinary.com/dtrin6lwv/image/upload/v1780124325/lavishorganic/categories/tbovuloi4jh6cwamof5m.png',
  3, TRUE,
  'Organic Hair Care Products | LavishOrganic',
  'Discover our organic shampoos, conditioners, and hair oils for strong, healthy, and shiny hair.'
),
(
  '11111111-0000-0000-0000-000000000004',
  'Wellness',
  'wellness',
  'Support your inner health with our wellness range. Herbal supplements, aromatherapy, and relaxation products.',
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800',
  'https://res.cloudinary.com/dtrin6lwv/image/upload/v1780124325/lavishorganic/categories/tbovuloi4jh6cwamof5m.png',
  4, TRUE,
  'Holistic Wellness & Supplements | LavishOrganic',
  'Support your wellness journey with our pure, organic supplements and essential oils.'
),
(
  '11111111-0000-0000-0000-000000000005',
  'Combo Sets',
  'combo-sets',
  'Gift yourself or a loved one our curated organic combo sets. Save more when you bundle your favourites.',
  'https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=800',
  NULL,
  5, TRUE,
  'Organic Gift Sets & Combos | LavishOrganic',
  'Curated organic skincare gift sets and combo packs. Perfect gifts for every occasion.'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PRODUCTS (10)
-- ============================================================
INSERT INTO products (
  id, name, slug, short_description, description, category_id,
  price, compare_price, cost_price, sku, weight,
  stock_quantity, is_active, is_featured,
  tags, ingredients, how_to_use, benefits, certifications,
  hsn_code, gst_rate, meta_title, meta_description
) VALUES
-- 1. Rose Glow Face Serum
(
  '22222222-0000-0000-0000-000000000001',
  'Rose Glow Vitamin C Face Serum',
  'rose-glow-vitamin-c-face-serum',
  'Brightening serum with pure rose extract and 20% Vitamin C. Fades dark spots in 4 weeks.',
  'Our Rose Glow Vitamin C Face Serum is a potent blend of 20% stabilized Vitamin C, Bulgarian rose extract, and hyaluronic acid. This powerful serum brightens dull skin, fades hyperpigmentation, and delivers intense hydration. Dermatologist-tested and suitable for all skin types.',
  '11111111-0000-0000-0000-000000000001',
  799.00, 1299.00, 280.00, 'LO-FC-001', 30.00,
  150, TRUE, TRUE,
  ARRAY['vitamin-c', 'brightening', 'anti-aging', 'rose', 'serum', 'face'],
  'Aqua, Ascorbic Acid (Vitamin C) 20%, Rosa Damascena Flower Water, Sodium Hyaluronate, Niacinamide, Ferulic Acid, Glycerin, Panthenol, Allantoin, Xanthan Gum',
  'Apply 3-4 drops to clean, dry face and neck in the morning. Gently pat until absorbed. Follow with moisturizer and sunscreen. Use daily for best results.',
  ARRAY['Brightens dull skin', 'Fades dark spots', 'Reduces fine lines', 'Intense hydration', 'Evens skin tone', 'Antioxidant protection'],
  ARRAY['ECOCERT Certified', 'Cruelty Free', 'Dermatologist Tested', 'Vegan'],
  '33049910', 18.00,
  'Rose Glow Vitamin C Face Serum | LavishOrganic',
  'Buy Rose Glow Vitamin C Serum online. 20% Vitamin C + Rose Extract. Brightens skin, fades dark spots in 4 weeks. Dermatologist tested.'
),
-- 2. Neem Turmeric Face Wash
(
  '22222222-0000-0000-0000-000000000002',
  'Neem & Turmeric Purifying Face Wash',
  'neem-turmeric-purifying-face-wash',
  'Antibacterial face wash with neem, turmeric & tea tree. Clears acne and controls oil.',
  'Our Neem & Turmeric Face Wash harnesses the ancient power of Ayurvedic ingredients. Neem''s antibacterial properties fight acne-causing bacteria while turmeric brightens and soothes. Tea tree oil controls excess sebum for a clean, fresh feeling. Sulphate-free and pH-balanced.',
  '11111111-0000-0000-0000-000000000001',
  349.00, 499.00, 120.00, 'LO-FC-002', 100.00,
  200, TRUE, TRUE,
  ARRAY['neem', 'turmeric', 'acne', 'oily-skin', 'face-wash', 'ayurvedic'],
  'Aqua, Azadirachta Indica (Neem) Leaf Extract, Curcuma Longa (Turmeric) Extract, Melaleuca Alternifolia (Tea Tree) Leaf Oil, Cocamidopropyl Betaine, Aloe Barbadensis Gel, Glycerin, Panthenol',
  'Wet face. Apply a small amount and massage in circular motions for 60 seconds. Rinse thoroughly. Use twice daily — morning and night.',
  ARRAY['Fights acne bacteria', 'Controls excess oil', 'Brightens skin', 'Unclogs pores', 'Soothes inflammation', 'pH-balanced'],
  ARRAY['Sulphate Free', 'Paraben Free', 'Cruelty Free', 'Vegan', 'Made in India'],
  '33049910', 18.00,
  'Neem & Turmeric Face Wash | LavishOrganic',
  'Buy Neem Turmeric Face Wash. Ayurvedic, sulphate-free cleanser for acne-prone skin. Controls oil, brightens, fights bacteria.'
),
-- 3. Saffron Night Cream
(
  '22222222-0000-0000-0000-000000000003',
  'Saffron Glow Night Repair Cream',
  'saffron-glow-night-repair-cream',
  'Luxurious overnight repair cream with pure saffron, retinol & shea butter. Wake up glowing.',
  'Indulge in the luxury of pure saffron with our Night Repair Cream. Formulated with kesar (saffron) extract, plant-based retinol (bakuchiol), and shea butter, this cream works while you sleep to repair, brighten, and firm skin. Wake up with visibly smoother, more radiant skin.',
  '11111111-0000-0000-0000-000000000001',
  1199.00, 1799.00, 420.00, 'LO-FC-003', 50.00,
  80, TRUE, TRUE,
  ARRAY['saffron', 'night-cream', 'anti-aging', 'brightening', 'bakuchiol'],
  'Aqua, Butyrospermum Parkii (Shea) Butter, Crocus Sativus (Saffron) Extract, Bakuchiol, Retinyl Palmitate, Vitamin E, Niacinamide, Squalane, Glycerin, Ceramides',
  'Apply a generous amount to cleansed face and neck each evening. Massage gently in upward circular motions. Leave overnight. For best results, use daily.',
  ARRAY['Repairs overnight', 'Reduces fine lines', 'Brightens complexion', 'Deep moisturization', 'Firms skin', 'Anti-aging'],
  ARRAY['ECOCERT Certified', 'Cruelty Free', 'Dermatologist Tested'],
  '33049910', 18.00,
  'Saffron Night Cream | LavishOrganic',
  'Buy Saffron Glow Night Repair Cream. Pure kesar extract + bakuchiol. Anti-aging overnight repair cream for glowing skin.'
),
-- 4. Coconut Body Lotion
(
  '22222222-0000-0000-0000-000000000004',
  'Coconut & Vanilla Body Butter Lotion',
  'coconut-vanilla-body-butter-lotion',
  '24-hour moisturizing body lotion with coconut oil, vanilla, and shea. For silky soft skin.',
  'Our Coconut & Vanilla Body Butter Lotion melts into skin like silk. Made with cold-pressed virgin coconut oil, real vanilla extract, and shea butter, it provides 24-hour deep moisturization without greasiness. Deliciously scented for a spa-like experience every day.',
  '11111111-0000-0000-0000-000000000002',
  499.00, 749.00, 175.00, 'LO-BC-001', 200.00,
  175, TRUE, FALSE,
  ARRAY['coconut', 'vanilla', 'body-lotion', 'moisturizer', 'dry-skin'],
  'Aqua, Cocos Nucifera (Coconut) Oil, Butyrospermum Parkii (Shea) Butter, Vanilla Planifolia Extract, Glycerin, Cetyl Alcohol, Vitamin E, Allantoin, Aloe Vera Gel',
  'Apply liberally to body after bath or shower. Massage in circular motions until absorbed. For best results, apply to slightly damp skin.',
  ARRAY['24-hour moisturization', 'Softens skin', 'Non-greasy', 'Delightful fragrance', 'Suitable for all skin types'],
  ARRAY['Paraben Free', 'Sulphate Free', 'Cruelty Free', 'Vegan'],
  '33049910', 18.00,
  'Coconut Vanilla Body Lotion | LavishOrganic',
  'Buy Coconut & Vanilla Body Butter Lotion. 24-hour moisture, non-greasy. Made with cold-pressed coconut oil and shea butter.'
),
-- 5. Coffee Body Scrub
(
  '22222222-0000-0000-0000-000000000005',
  'Arabica Coffee Exfoliating Body Scrub',
  'arabica-coffee-exfoliating-body-scrub',
  'Energizing body scrub with fine arabica coffee grounds, coconut oil, and brown sugar.',
  'Wake up your skin with our Arabica Coffee Body Scrub. Finely ground arabica coffee beans exfoliate dead skin cells, stimulate circulation, and visibly reduce cellulite. Brown sugar provides gentle secondary exfoliation while coconut oil deeply nourishes. Leave-behind glow guaranteed.',
  '11111111-0000-0000-0000-000000000002',
  449.00, 649.00, 160.00, 'LO-BC-002', 200.00,
  130, TRUE, FALSE,
  ARRAY['coffee', 'scrub', 'exfoliating', 'cellulite', 'body-care'],
  'Coffea Arabica (Coffee) Seed Powder, Saccharum Officinarum (Brown Sugar), Cocos Nucifera (Coconut) Oil, Vanilla Planifolia Extract, Vitamin E Oil, Sweet Almond Oil',
  'In shower, apply to wet skin in circular motions focusing on rough areas (knees, elbows, heels). Massage for 2-3 minutes. Rinse thoroughly. Use 2-3 times per week.',
  ARRAY['Removes dead skin', 'Improves circulation', 'Reduces cellulite appearance', 'Moisturizes', 'Energizing coffee scent'],
  ARRAY['Natural Ingredients', 'Cruelty Free', 'Vegan', 'Made in India'],
  '33049910', 18.00,
  'Coffee Body Scrub | LavishOrganic',
  'Buy Arabica Coffee Exfoliating Body Scrub. Natural exfoliator for smooth, glowing skin. Reduces cellulite. Vegan & cruelty-free.'
),
-- 6. Bhringraj Hair Oil
(
  '22222222-0000-0000-0000-000000000006',
  'Bhringraj & Amla Ayurvedic Hair Oil',
  'bhringraj-amla-ayurvedic-hair-oil',
  'Powerful Ayurvedic hair oil with bhringraj, amla & brahmi for hair growth and strength.',
  'Our Bhringraj & Amla Hair Oil is a time-tested Ayurvedic formulation that promotes hair growth, reduces hair fall, and prevents premature greying. Cold-pressed sesame oil base infused with fresh bhringraj, amla, brahmi, and hibiscus using traditional methods.',
  '11111111-0000-0000-0000-000000000003',
  399.00, 599.00, 140.00, 'LO-HC-001', 100.00,
  160, TRUE, TRUE,
  ARRAY['bhringraj', 'amla', 'hair-oil', 'hair-growth', 'ayurvedic'],
  'Sesamum Indicum (Sesame) Oil, Eclipta Alba (Bhringraj) Extract, Phyllanthus Emblica (Amla) Extract, Bacopa Monnieri (Brahmi) Extract, Hibiscus Rosa-Sinensis Extract, Curry Leaves Extract',
  'Warm oil slightly. Massage into scalp and hair roots using fingertips in circular motions for 10 minutes. Leave for 1-2 hours or overnight. Wash with mild shampoo. Use 2-3 times per week.',
  ARRAY['Promotes hair growth', 'Reduces hair fall', 'Prevents greying', 'Strengthens roots', 'Deep conditioning', 'Dandruff control'],
  ARRAY['Ayurvedic', 'Cold-Pressed', 'Cruelty Free', 'Chemical Free'],
  '33059000', 18.00,
  'Bhringraj Amla Hair Oil | LavishOrganic',
  'Buy Bhringraj Amla Ayurvedic Hair Oil. Reduces hair fall, promotes growth. Cold-pressed, chemical-free. Traditional Ayurvedic formula.'
),
-- 7. Keratin Shampoo
(
  '22222222-0000-0000-0000-000000000007',
  'Plant Keratin Repair Shampoo',
  'plant-keratin-repair-shampoo',
  'Sulphate-free repair shampoo with plant keratin, argan oil, and biotin for damaged hair.',
  'Restore damaged, frizzy hair with our Plant Keratin Repair Shampoo. Enriched with plant-derived keratin proteins, Moroccan argan oil, and biotin, this sulphate-free shampoo gently cleanses while depositing strengthening proteins. Safe for colour-treated hair.',
  '11111111-0000-0000-0000-000000000003',
  549.00, 799.00, 195.00, 'LO-HC-002', 200.00,
  120, TRUE, FALSE,
  ARRAY['shampoo', 'keratin', 'repair', 'damaged-hair', 'argan', 'sulphate-free'],
  'Aqua, Cocamidopropyl Betaine, Sodium Cocoyl Isethionate, Hydrolyzed Keratin, Argania Spinosa (Argan) Kernel Oil, Biotin, Panthenol, Glycerin, Citric Acid',
  'Wet hair thoroughly. Apply shampoo, massage scalp for 2 minutes. Rinse. Repeat if desired. Follow with conditioner. For best results, use 3 times per week.',
  ARRAY['Repairs damage', 'Reduces frizz', 'Strengthens hair', 'Adds shine', 'Colour-safe', 'Sulphate-free'],
  ARRAY['Sulphate Free', 'Paraben Free', 'Cruelty Free', 'Colour Safe'],
  '33059000', 18.00,
  'Plant Keratin Repair Shampoo | LavishOrganic',
  'Buy Plant Keratin Repair Shampoo. Sulphate-free, with argan oil and biotin. Repairs damaged, frizzy hair. Colour-safe formula.'
),
-- 8. Lavender Sleep Mist
(
  '22222222-0000-0000-0000-000000000008',
  'Lavender & Chamomile Sleep Pillow Mist',
  'lavender-chamomile-sleep-pillow-mist',
  'Calming pillow mist with pure lavender, chamomile & valerian for deep, restful sleep.',
  'Our Lavender & Chamomile Sleep Mist is your nightly ritual for deep, restful sleep. Made with pure lavender essential oil, chamomile, and valerian extracts, a few spritzes on your pillow create the perfect sleep environment. Backed by aromatherapy science.',
  '11111111-0000-0000-0000-000000000004',
  299.00, 449.00, 100.00, 'LO-WL-001', 100.00,
  200, TRUE, FALSE,
  ARRAY['lavender', 'sleep', 'aromatherapy', 'pillow-mist', 'chamomile'],
  'Aqua, Lavandula Angustifolia (Lavender) Essential Oil, Matricaria Chamomilla (Chamomile) Extract, Valeriana Officinalis (Valerian) Extract, Alcohol Denat',
  'Shake well before use. Hold 20-30cm from pillow and spray 2-3 times just before bedtime. Can also be spritzed on bedding and in the room. Close eyes and breathe deeply.',
  ARRAY['Promotes deep sleep', 'Reduces anxiety', 'Calming aroma', 'Drug-free', 'Natural ingredients', 'Suitable for all ages'],
  ARRAY['Natural', 'Vegan', 'Cruelty Free', 'Alcohol-Free Formula Available'],
  '33073000', 18.00,
  'Lavender Sleep Pillow Mist | LavishOrganic',
  'Buy Lavender Chamomile Sleep Mist. Natural aromatherapy pillow spray for deep, restful sleep. Made with pure essential oils.'
),
-- 9. Rose Clay Face Mask
(
  '22222222-0000-0000-0000-000000000009',
  'Moroccan Rose Clay Purifying Face Mask',
  'moroccan-rose-clay-purifying-face-mask',
  'Deep-pore cleansing clay mask with Moroccan rose clay, kaolin & rose water. For all skin types.',
  'Our Moroccan Rose Clay Face Mask combines the deep-cleansing power of pink Moroccan clay and kaolin with the soothing hydration of Bulgarian rose water. Draws out impurities, minimizes pores, and leaves skin silky smooth. Suitable for all skin types including sensitive skin.',
  '11111111-0000-0000-0000-000000000001',
  599.00, 899.00, 210.00, 'LO-FC-004', 75.00,
  100, TRUE, FALSE,
  ARRAY['clay-mask', 'rose-clay', 'pore-minimizing', 'deep-cleanse', 'face-mask'],
  'Kaolin Clay, Rosa Canina (Rose Hip) Clay, Rosa Damascena Flower Water, Glycerin, Aloe Barbadensis Gel, Titanium Dioxide, Vitamin E',
  'Apply a generous, even layer to clean, dry face avoiding eye area. Leave for 10-15 minutes until dry. Rinse thoroughly with warm water. Use 1-2 times per week.',
  ARRAY['Deep cleanses pores', 'Controls oil', 'Smooths skin texture', 'Reduces blackheads', 'Soothing', 'Non-drying'],
  ARRAY['Natural Clay', 'Cruelty Free', 'Vegan', 'Dermatologist Tested'],
  '33049910', 18.00,
  'Rose Clay Face Mask | LavishOrganic',
  'Buy Moroccan Rose Clay Face Mask. Deep pore cleansing, pore-minimizing. Suitable for all skin types. Organic ingredients.'
),
-- 10. Glow Starter Kit (Combo)
(
  '22222222-0000-0000-0000-000000000010',
  'Glow Starter Kit — Face Care Essentials',
  'glow-starter-kit-face-care-essentials',
  'Complete face care starter kit: face wash, Vitamin C serum, and night cream. Save 30%.',
  'The LavishOrganic Glow Starter Kit is the perfect introduction to our face care range. This curated trio includes our bestselling Neem Turmeric Face Wash, Rose Glow Vitamin C Serum, and Saffron Night Cream — everything you need for a complete morning and evening skincare routine. Beautifully gift-boxed.',
  '11111111-0000-0000-0000-000000000005',
  1599.00, 2447.00, 560.00, 'LO-CB-001', 180.00,
  60, TRUE, TRUE,
  ARRAY['combo', 'gift-set', 'starter-kit', 'face-care', 'bestseller'],
  'Contains: Neem & Turmeric Face Wash (100ml), Rose Glow Vitamin C Serum (30ml), Saffron Night Cream (50ml)',
  'Morning: Cleanse with face wash → apply Vitamin C serum → moisturizer + SPF. Evening: Cleanse with face wash → apply Night Cream.',
  ARRAY['Complete skincare routine', 'Save 30% vs individual', 'Gift-ready packaging', 'Dermatologist tested', '3 bestsellers in one'],
  ARRAY['ECOCERT Certified', 'Cruelty Free', 'Dermatologist Tested', 'Vegan'],
  '33049910', 18.00,
  'Glow Starter Kit | LavishOrganic Face Care Set',
  'Buy LavishOrganic Glow Starter Kit. 3-piece face care set — face wash, Vitamin C serum & night cream. Save 30%. Perfect gift.'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PRODUCT IMAGES (primary images for each product)
-- ============================================================
INSERT INTO product_images (id, product_id, url, alt_text, sort_order, is_primary) VALUES
('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800', 'Rose Glow Vitamin C Serum', 0, TRUE),
('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800', 'Rose Glow Serum texture', 1, FALSE),
('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800', 'Neem Turmeric Face Wash', 0, TRUE),
('33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800', 'Saffron Night Cream', 0, TRUE),
('33333333-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800', 'Coconut Vanilla Body Lotion', 0, TRUE),
('33333333-0000-0000-0000-000000000006', '22222222-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1601612628452-9e99ced43524?w=800', 'Coffee Body Scrub', 0, TRUE),
('33333333-0000-0000-0000-000000000007', '22222222-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800', 'Bhringraj Amla Hair Oil', 0, TRUE),
('33333333-0000-0000-0000-000000000008', '22222222-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800', 'Plant Keratin Shampoo', 0, TRUE),
('33333333-0000-0000-0000-000000000009', '22222222-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800', 'Lavender Sleep Mist', 0, TRUE),
('33333333-0000-0000-0000-000000000010', '22222222-0000-0000-0000-000000000009', 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=800', 'Rose Clay Face Mask', 0, TRUE),
('33333333-0000-0000-0000-000000000011', '22222222-0000-0000-0000-000000000010', 'https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=800', 'Glow Starter Kit', 0, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PRODUCT VARIANTS
-- ============================================================
INSERT INTO product_variants (product_id, name, value, price_modifier, stock_quantity, sku) VALUES
-- Serum sizes
('22222222-0000-0000-0000-000000000001', 'Size', '30ml', 0, 100, 'LO-FC-001-30ML'),
('22222222-0000-0000-0000-000000000001', 'Size', '60ml', 400, 50, 'LO-FC-001-60ML'),
-- Face Wash sizes
('22222222-0000-0000-0000-000000000002', 'Size', '100ml', 0, 120, 'LO-FC-002-100ML'),
('22222222-0000-0000-0000-000000000002', 'Size', '200ml', 200, 80, 'LO-FC-002-200ML'),
-- Hair Oil sizes
('22222222-0000-0000-0000-000000000006', 'Size', '100ml', 0, 100, 'LO-HC-001-100ML'),
('22222222-0000-0000-0000-000000000006', 'Size', '200ml', 250, 60, 'LO-HC-001-200ML')
ON CONFLICT (sku) DO NOTHING;

-- ============================================================
-- COUPONS (2) [FIX #10]
-- ============================================================
INSERT INTO coupons (code, type, value, min_order_amount, max_discount, usage_limit, per_user_limit, is_active, valid_from, valid_until) VALUES
(
  'WELCOME10',
  'percentage',
  10.00,
  299.00,
  150.00,
  NULL,
  1,
  TRUE,
  NOW(),
  NOW() + INTERVAL '1 year'
),
(
  'ORGANIC20',
  'percentage',
  20.00,
  599.00,
  300.00,
  500,
  1,
  TRUE,
  NOW(),
  NOW() + INTERVAL '6 months'
) ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- OFFERS / BANNERS (1 flash sale) [FIX #10]
-- ============================================================
INSERT INTO offers (id, title, description, image_url, link_url, type, discount_percentage, starts_at, ends_at, is_active, sort_order) VALUES
(
  '44444444-0000-0000-0000-000000000001',
  'Summer Glow Sale — Up to 40% Off',
  'Treat your skin this summer! Get up to 40% off on our bestselling face care range. Limited time offer.',
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1920',
  '/shop?category=face-care&sort=discount',
  'flash_sale',
  40.00,
  NOW(),
  NOW() + INTERVAL '7 days',
  TRUE,
  1
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SAMPLE REVIEWS (5) [FIX #10]
-- ============================================================
INSERT INTO reviews (product_id, rating, title, body, is_verified, is_approved, created_at) VALUES
(
  '22222222-0000-0000-0000-000000000001',
  5,
  'Absolutely love this serum!',
  'I''ve been using the Rose Glow Serum for 6 weeks and the difference is incredible. My dark spots have faded significantly and my skin looks so much brighter. The texture is lightweight and absorbs quickly. Definitely repurchasing!',
  TRUE, TRUE,
  NOW() - INTERVAL '15 days'
),
(
  '22222222-0000-0000-0000-000000000001',
  4,
  'Great results, mild tingling initially',
  'The serum works really well — my skin tone has evened out and I get compliments now. There was slight tingling when I first started using it but that subsided after a week. Very happy with the purchase.',
  TRUE, TRUE,
  NOW() - INTERVAL '8 days'
),
(
  '22222222-0000-0000-0000-000000000002',
  5,
  'Best face wash for oily skin',
  'I have combination-oily skin and this neem face wash is a game changer. My face doesn''t feel stripped but it clears all the oil and keeps breakouts at bay. Love that it''s sulphate-free and has a nice natural scent.',
  TRUE, TRUE,
  NOW() - INTERVAL '20 days'
),
(
  '22222222-0000-0000-0000-000000000006',
  5,
  'Reduced hair fall in 3 weeks',
  'I was losing so much hair and was desperate. My mom recommended this oil and I''m so glad I tried it. Used it 3x a week and in 3 weeks my hairfall reduced noticeably. The smell is authentic Ayurvedic — takes getting used to but results speak for themselves.',
  TRUE, TRUE,
  NOW() - INTERVAL '12 days'
),
(
  '22222222-0000-0000-0000-000000000010',
  5,
  'Perfect gift for my wife',
  'Bought the Glow Starter Kit as an anniversary gift. The packaging is gorgeous — premium box with ribbon. My wife loved it and has been using all 3 products. The serum especially she can''t stop raving about. Will order again.',
  FALSE, TRUE,
  NOW() - INTERVAL '5 days'
);
