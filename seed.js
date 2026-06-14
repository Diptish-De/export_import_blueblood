const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env manually to get connection credentials
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.error(".env file not found at " + envPath);
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
    const parts = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (parts) {
        let key = parts[1];
        let val = parts[2] || '';
        // Strip quotes if any
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        env[key] = val.trim();
    }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase configuration in .env");
    process.exit(1);
}

console.log("Connecting to Supabase at:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    const productsPath = path.join(__dirname, 'public', 'data', 'products.json');
    if (!fs.existsSync(productsPath)) {
        console.error("products.json not found at " + productsPath);
        process.exit(1);
    }

    const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    console.log(`Loaded ${products.length} products from JSON`);

    // Batch insert/upsert to prevent rate-limiting or payload size errors
    const batchSize = 30;
    for (let i = 0; i < products.length; i += batchSize) {
        const chunk = products.slice(i, i + batchSize);
        const batch = chunk.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            subcategory: p.subcategory || null,
            price_range: p.price_range || null,
            hs_code: p.hs_code || null,
            material: p.material || null,
            origin: p.origin || 'India',
            dimensions: p.dimensions || 'Standard',
            weight: p.weight || 'Standard',
            moq: typeof p.moq === 'number' ? p.moq : 1,
            images: p.images || [],
            variants: p.variants || [],
            description: p.description || null
        }));

        console.log(`Inserting batch ${Math.floor(i / batchSize) + 1} (${batch.length} items)...`);
        const { error } = await supabase
            .from('products')
            .upsert(batch, { onConflict: 'id' });

        if (error) {
            console.error(`Error inserting batch starting at index ${i}:`, error);
            process.exit(1);
        }
    }

    console.log("Seeding completed successfully! All items uploaded to Supabase.");
}

seed().catch(err => {
    console.error("Seeding failed:", err);
});
