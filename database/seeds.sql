-- ========================================================
-- Hapini Database Seed Script
-- Idempotent (safe to re-run repeatedly without duplicates)
-- Uses fixed deterministic UUIDs and ON CONFLICT handling.
-- ========================================================

-- 1. SEED RETAILERS
INSERT INTO retailers (id, name, slug, base_url, logo_url, rating, is_active)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Amazon India', 'amazon', 'https://www.amazon.in', 'https://placehold.co/120x40?text=Amazon', 4.8, true),
    ('22222222-2222-2222-2222-222222222222', 'Flipkart', 'flipkart', 'https://www.flipkart.com', 'https://placehold.co/120x40?text=Flipkart', 4.7, true),
    ('33333333-3333-3333-3333-333333333333', 'Croma', 'croma', 'https://www.croma.com', 'https://placehold.co/120x40?text=Croma', 4.6, true),
    ('44444444-4444-4444-4444-444444444444', 'Reliance Digital', 'reliance-digital', 'https://www.reliancedigital.in', 'https://placehold.co/120x40?text=Reliance', 4.5, true)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    base_url = EXCLUDED.base_url,
    rating = EXCLUDED.rating,
    updated_at = CURRENT_TIMESTAMP;

-- 2. SEED SAMPLE USER
INSERT INTO users (id, email, password_hash, name, role)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'demo@hapini.com', '$2b$10$abcdefghijklmnopqrstuvDemoHash1234567890', 'Demo User', 'user')
ON CONFLICT (email) DO NOTHING;

-- 3. SEED PRODUCTS
INSERT INTO products (
    id, legacy_id, name, slug, category, brand, image_url,
    rating, reviews_count, delivery_time, in_stock, review_summary, specs, pros, cons
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    1,
    'iPhone 17 Pro',
    'iphone-17-pro',
    'Smartphones',
    'Apple',
    'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80',
    4.8,
    2840,
    'Tomorrow',
    true,
    'Users widely praise the titanium chassis, exceptional battery optimization, and low-light telephoto performance. The primary critique is the incremental upgrade over last year''s flagship.',
    '[{"label": "Display", "value": "6.3-inch OLED 120Hz"}, {"label": "Processor", "value": "A19 Pro Bionic"}, {"label": "Storage", "value": "256 GB NVMe"}, {"label": "Battery", "value": "3,650 mAh"}]'::jsonb,
    '["Vibrant 120Hz ProMotion Super Retina display", "All-day battery life with efficient thermals", "Industry-leading video recording quality"]'::jsonb,
    '["High price barrier", "Charging speed remains capped at 27W"]'::jsonb
),
(
    '00000000-0000-0000-0000-000000000002',
    2,
    'MacBook Pro 16" M3',
    'macbook-pro-16-m3',
    'Laptops',
    'Apple',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
    4.9,
    1530,
    '2 Days',
    true,
    'Unmatched workstation performance combined with phenomenal 22-hour battery life. Creative professionals laud the Liquid Retina XDR display and silent thermal performance.',
    '[{"label": "Processor", "value": "Apple M3 Pro (12-core CPU)"}, {"label": "Unified Memory", "value": "18 GB Unified"}, {"label": "Storage", "value": "512 GB PCIe SSD"}, {"label": "Display", "value": "16.2-inch Liquid Retina XDR"}]'::jsonb,
    '["Class-leading battery endurance under heavy workloads", "Stunning 1600 nits peak brightness Liquid Retina XDR display", "Studio-quality microphones and 6-speaker spatial audio"]'::jsonb,
    '["Non-upgradeable unified memory and storage", "Heavy chassis compared to MacBook Air"]'::jsonb
),
(
    '00000000-0000-0000-0000-000000000003',
    3,
    'Samsung Galaxy S26 Ultra',
    'samsung-galaxy-s26-ultra',
    'Smartphones',
    'Samsung',
    'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80',
    4.7,
    1980,
    'Tomorrow',
    true,
    'Users love the integrated S-Pen, 200MP periscope zoom capabilities, and anti-reflective Corning Gorilla Armor glass. Some note the squared corners make single-hand use tricky.',
    '[{"label": "Display", "value": "6.8-inch Dynamic AMOLED 2X"}, {"label": "Processor", "value": "Snapdragon 8 Gen 4 for Galaxy"}, {"label": "Camera", "value": "200MP + 50MP + 12MP + 10MP"}, {"label": "Battery", "value": "5,000 mAh"}]'::jsonb,
    '["Best-in-class 100x Space Zoom and periscope lens", "Integrated S-Pen stylus for sketching & notes", "Gorilla Armor glass dramatically cuts ambient glare"]'::jsonb,
    '["Large footprint that can feel sharp in pocket", "Slow 45W wired charging compared to competitors"]'::jsonb
),
(
    '00000000-0000-0000-0000-000000000004',
    4,
    'Sony WH-1000XM5',
    'sony-wh-1000xm5',
    'Audio',
    'Sony',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    4.8,
    3120,
    'Tomorrow',
    true,
    'Market standard for active noise cancellation with 8 specialized microphones and lightweight pressure-relieving earcups. Reviewers point out the headband no longer folds compactly.',
    '[{"label": "Driver Size", "value": "30mm Carbon Fiber"}, {"label": "Battery Life", "value": "30 Hours (ANC On)"}, {"label": "Codecs", "value": "LDAC, AAC, SBC"}]'::jsonb,
    '["Exceptional ANC blocking voices and ambient engine rumble", "Comfortable lightweight memory foam earcups", "Multipoint Bluetooth pairing across two devices"]'::jsonb,
    '["Does not fold into a compact hinge design", "Touch sensor controls can trigger accidentally in rain"]'::jsonb
),
(
    '00000000-0000-0000-0000-000000000005',
    5,
    'Apple Watch Ultra 2',
    'apple-watch-ultra-2',
    'Smartwatches',
    'Apple',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    4.9,
    890,
    'Tomorrow',
    true,
    'Engineered for endurance and extreme sports with a rugged 49mm titanium case, dual-frequency precision GPS, and 3000-nit ultra-bright sapphire display.',
    '[{"label": "Case Size", "value": "49mm Aerospace Titanium"}, {"label": "Brightness", "value": "3,000 Nits Peak"}, {"label": "Water Resistance", "value": "100m (EN13319 Certified)"}]'::jsonb,
    '["Ultra-rugged titanium case with 100m water resistance", "Brightest Apple display ever at 3000 nits", "Up to 72 hours of battery in Low Power Mode"]'::jsonb,
    '["Large 49mm size too bulky for slender wrists", "Exclusive to iPhone users only"]'::jsonb
),
(
    '00000000-0000-0000-0000-000000000006',
    6,
    'Sony PlayStation 5 Slim',
    'sony-playstation-5-slim',
    'Gaming',
    'Sony',
    'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80',
    4.8,
    4210,
    'Tomorrow',
    true,
    '30% smaller volume footprint with a full 1TB internal SSD and attachable Ultra HD Blu-ray disc drive. Immersive DualSense haptic feedback remains the standout feature.',
    '[{"label": "Storage", "value": "1 TB Custom NVMe SSD"}, {"label": "GPU", "value": "10.3 TFLOPS AMD RDNA 2"}, {"label": "Video Out", "value": "HDMI 2.1 (4K 120Hz / 8K)"}]'::jsonb,
    '["Upgraded 1TB fast PCIe 4.0 internal storage", "Revolutionary DualSense adaptive triggers & haptics", "Stunning 4K 120Hz gaming with ray tracing"]'::jsonb,
    '["Vertical stand sold separately", "Can run warm inside tight TV entertainment units"]'::jsonb
),
(
    '00000000-0000-0000-0000-000000000007',
    7,
    'ASUS ROG Zephyrus G16',
    'asus-rog-zephyrus-g16',
    'Laptops',
    'ASUS',
    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
    4.7,
    640,
    '3 Days',
    true,
    'A slim CNC-machined aluminum chassis packed with an RTX 4070 GPU and gorgeous 2.5K 240Hz OLED ROG Nebula display. Fans get audible during AAA gaming sessions.',
    '[{"label": "Processor", "value": "Intel Core Ultra 9 185H"}, {"label": "Graphics", "value": "NVIDIA GeForce RTX 4070 (8GB)"}, {"label": "Display", "value": "16-inch 2.5K 240Hz OLED"}]'::jsonb,
    '["Breathtaking 240Hz G-SYNC OLED gaming panel", "Slim 1.49cm aluminum profile with slash lighting", "Crisp 6-speaker system with punchy bass"]'::jsonb,
    '["Soldered RAM limits future memory upgrades", "Aggressive fan curves under maximum boost"]'::jsonb
),
(
    '00000000-0000-0000-0000-000000000008',
    8,
    'Apple AirPods Max',
    'apple-airpods-max',
    'Audio',
    'Apple',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80',
    4.6,
    1820,
    'Tomorrow',
    false,
    'Exquisite anodized aluminum acoustic chambers, breathable knit mesh canopy, and unmatched computational audio with personalized spatial tracking. Currently out of stock across most channels.',
    '[{"label": "Driver", "value": "40mm Apple dynamic driver"}, {"label": "Weight", "value": "384.8g"}, {"label": "Battery", "value": "20 hours with ANC"}]'::jsonb,
    '["Pristine computational audio with personalized dynamic head tracking", "Finest ambient transparency mode on the market", "Premium stainless steel & magnetic memory foam construction"]'::jsonb,
    '["Currently out of stock", "Smart Case provides minimal protection", "Noticeably heavy at 384g"]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    brand = EXCLUDED.brand,
    image_url = EXCLUDED.image_url,
    rating = EXCLUDED.rating,
    reviews_count = EXCLUDED.reviews_count,
    delivery_time = EXCLUDED.delivery_time,
    in_stock = EXCLUDED.in_stock,
    review_summary = EXCLUDED.review_summary,
    specs = EXCLUDED.specs,
    pros = EXCLUDED.pros,
    cons = EXCLUDED.cons,
    updated_at = CURRENT_TIMESTAMP;

-- 4. SEED RETAILER OFFERS
INSERT INTO offers (product_id, retailer_id, price, price_formatted, original_price, affiliate_url, in_stock, delivery_info)
VALUES
-- iPhone 17 Pro
('00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 75999.00, '₹75,999', 79900.00, 'https://www.amazon.in', true, 'Prime Delivery Tomorrow'),
('00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 74499.00, '₹74,499', 79900.00, 'https://www.flipkart.com', true, 'Express Delivery Tomorrow'),
('00000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 76199.00, '₹76,199', 79900.00, 'https://www.croma.com', true, 'Store Pickup Today'),

-- MacBook Pro 16" M3
('00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 124999.00, '₹1,24,999', 139900.00, 'https://www.amazon.in', true, 'Prime Delivery 2 Days'),
('00000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 126999.00, '₹1,26,999', 139900.00, 'https://www.flipkart.com', true, 'Standard 3 Days'),
('00000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 125999.00, '₹1,25,999', 139900.00, 'https://www.croma.com', true, 'Next Day Dispatch'),

-- Samsung Galaxy S26 Ultra
('00000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 90999.00, '₹90,999', 99999.00, 'https://www.amazon.in', true, 'Prime Delivery Tomorrow'),
('00000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 89999.00, '₹89,999', 99999.00, 'https://www.flipkart.com', true, 'Express Delivery Tomorrow'),
('00000000-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 91499.00, '₹91,499', 99999.00, 'https://www.croma.com', true, 'Store Pickup Available'),

-- Sony WH-1000XM5
('00000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 26990.00, '₹26,990', 29990.00, 'https://www.amazon.in', true, 'Prime Delivery Tomorrow'),
('00000000-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 25490.00, '₹25,490', 29990.00, 'https://www.flipkart.com', true, 'Express Delivery Tomorrow'),
('00000000-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', 27990.00, '₹27,990', 29990.00, 'https://www.croma.com', true, 'Next Day Dispatch'),

-- Apple Watch Ultra 2
('00000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 84900.00, '₹84,900', 89900.00, 'https://www.amazon.in', true, 'Prime Delivery Tomorrow'),
('00000000-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 82499.00, '₹82,499', 89900.00, 'https://www.flipkart.com', true, 'Express Delivery Tomorrow'),
('00000000-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333', 83900.00, '₹83,900', 89900.00, 'https://www.croma.com', true, 'Store Pickup Available'),

-- Sony PlayStation 5 Slim
('00000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 49990.00, '₹49,990', 54990.00, 'https://www.amazon.in', true, 'Prime Delivery Tomorrow'),
('00000000-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 48990.00, '₹48,990', 54990.00, 'https://www.flipkart.com', true, 'Express Delivery Tomorrow'),
('00000000-0000-0000-0000-000000000006', '33333333-3333-3333-3333-333333333333', 49490.00, '₹49,490', 54990.00, 'https://www.croma.com', true, 'Store Pickup Available'),

-- ASUS ROG Zephyrus G16
('00000000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 154990.00, '₹1,54,990', 169990.00, 'https://www.amazon.in', true, 'Prime Delivery 3 Days'),
('00000000-0000-0000-0000-000000000007', '22222222-2222-2222-2222-222222222222', 156490.00, '₹1,56,490', 169990.00, 'https://www.flipkart.com', true, 'Standard Delivery 4 Days'),
('00000000-0000-0000-0000-000000000007', '33333333-3333-3333-3333-333333333333', 153990.00, '₹1,53,990', 169990.00, 'https://www.croma.com', true, 'Next Day Dispatch'),

-- Apple AirPods Max
('00000000-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 52990.00, '₹52,990', 59900.00, 'https://www.amazon.in', false, 'Out of Stock'),
('00000000-0000-0000-0000-000000000008', '22222222-2222-2222-2222-222222222222', 51499.00, '₹51,499', 59900.00, 'https://www.flipkart.com', false, 'Currently Unavailable'),
('00000000-0000-0000-0000-000000000008', '33333333-3333-3333-3333-333333333333', 53990.00, '₹53,990', 59900.00, 'https://www.croma.com', false, 'Notify When Available')
ON CONFLICT (product_id, retailer_id) DO UPDATE SET
    price = EXCLUDED.price,
    price_formatted = EXCLUDED.price_formatted,
    original_price = EXCLUDED.original_price,
    affiliate_url = EXCLUDED.affiliate_url,
    in_stock = EXCLUDED.in_stock,
    delivery_info = EXCLUDED.delivery_info,
    last_checked_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP;

-- 5. SEED PRICE HISTORY POINTS
DELETE FROM price_history;
INSERT INTO price_history (product_id, month, price)
VALUES
-- iPhone 17 Pro
('00000000-0000-0000-0000-000000000001', 'Jan', 82000.00),
('00000000-0000-0000-0000-000000000001', 'Feb', 79000.00),
('00000000-0000-0000-0000-000000000001', 'Mar', 76000.00),
('00000000-0000-0000-0000-000000000001', 'Apr', 74499.00),

-- MacBook Pro 16" M3
('00000000-0000-0000-0000-000000000002', 'Jan', 135000.00),
('00000000-0000-0000-0000-000000000002', 'Feb', 131000.00),
('00000000-0000-0000-0000-000000000002', 'Mar', 128000.00),
('00000000-0000-0000-0000-000000000002', 'Apr', 124999.00),

-- Samsung Galaxy S26 Ultra
('00000000-0000-0000-0000-000000000003', 'Jan', 98000.00),
('00000000-0000-0000-0000-000000000003', 'Feb', 95000.00),
('00000000-0000-0000-0000-000000000003', 'Mar', 92000.00),
('00000000-0000-0000-0000-000000000003', 'Apr', 89999.00),

-- Sony WH-1000XM5
('00000000-0000-0000-0000-000000000004', 'Jan', 29990.00),
('00000000-0000-0000-0000-000000000004', 'Feb', 28490.00),
('00000000-0000-0000-0000-000000000004', 'Mar', 26990.00),
('00000000-0000-0000-0000-000000000004', 'Apr', 25490.00),

-- Apple Watch Ultra 2
('00000000-0000-0000-0000-000000000005', 'Jan', 89900.00),
('00000000-0000-0000-0000-000000000005', 'Feb', 86900.00),
('00000000-0000-0000-0000-000000000005', 'Mar', 84900.00),
('00000000-0000-0000-0000-000000000005', 'Apr', 82499.00),

-- Sony PS5 Slim
('00000000-0000-0000-0000-000000000006', 'Jan', 54990.00),
('00000000-0000-0000-0000-000000000006', 'Feb', 52990.00),
('00000000-0000-0000-0000-000000000006', 'Mar', 50490.00),
('00000000-0000-0000-0000-000000000006', 'Apr', 48990.00),

-- ASUS ROG Zephyrus G16
('00000000-0000-0000-0000-000000000007', 'Jan', 168000.00),
('00000000-0000-0000-0000-000000000007', 'Feb', 162000.00),
('00000000-0000-0000-0000-000000000007', 'Mar', 157000.00),
('00000000-0000-0000-0000-000000000007', 'Apr', 153990.00),

-- Apple AirPods Max
('00000000-0000-0000-0000-000000000008', 'Jan', 59900.00),
('00000000-0000-0000-0000-000000000008', 'Feb', 56900.00),
('00000000-0000-0000-0000-000000000008', 'Mar', 53900.00),
('00000000-0000-0000-0000-000000000008', 'Apr', 51499.00);

-- 6. SEED SAMPLE PRICE ALERT
INSERT INTO price_alerts (user_id, product_id, target_price, email, is_active)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '00000000-0000-0000-0000-000000000001',
    72000.00,
    'demo@hapini.com',
    true
)
ON CONFLICT DO NOTHING;
