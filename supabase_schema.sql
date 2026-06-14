-- Create the products table for Blueblood Exports
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,                  -- Product unique SKU/ID (e.g. BBE-MUK-TB-0001)
    name TEXT NOT NULL,                   -- Product Name
    category TEXT NOT NULL,               -- Category (e.g. Furniture, Handicrafts)
    subcategory TEXT,                     -- Subcategory (e.g. Table, Chest/Drawer, Cabinet)
    price_range TEXT,                     -- Price range string (e.g. 28750-30187.5)
    hs_code TEXT,                         -- HS Export Code
    material TEXT,                        -- Material composition (e.g. Bone Inlay, Wood)
    origin TEXT DEFAULT 'India',          -- Country of origin
    dimensions TEXT DEFAULT 'Standard',   -- Dimensions
    weight TEXT DEFAULT 'Standard',       -- Weight
    moq INTEGER DEFAULT 1,                -- Minimum Order Quantity
    images TEXT[] NOT NULL,               -- Array of image URLs/paths (for sliding gallery)
    variants JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of variant options (id, color, image, price, hs_code)
    description TEXT,                     -- Full product description
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create a policy allowing public read access to products
CREATE POLICY "Allow public read access" ON products
    FOR SELECT USING (true);
