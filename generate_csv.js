const fs = require('fs');
const path = require('path');

const productsFilePath = path.join(__dirname, 'public', 'data', 'products.json');
const furnitureCsvPath = path.join(__dirname, 'furniture_products.csv');
const handicraftCsvPath = path.join(__dirname, 'handicraft_products.csv');

// Read products.json
const products = JSON.parse(fs.readFileSync(productsFilePath, 'utf8'));

// Helper function to escape CSV values
function escapeCSV(val) {
    if (val === null || val === undefined) return '';
    let str = String(val).trim();
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        str = '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

// Helper to convert relative paths to absolute domain URLs
function getAbsoluteUrl(relPath) {
    if (!relPath) return '';
    if (relPath.startsWith('http://') || relPath.startsWith('https://')) return relPath;
    const formattedPath = relPath.startsWith('/') ? relPath : '/' + relPath;
    return `https://www.bluebloodexports.com${formattedPath}`;
}

// Helper to generate CSV content
function buildCsv(rows) {
    const header = ['Product Name', 'Price (INR)', 'Product ID', 'HS Code', 'Subcategory', 'Clean Image URL'];
    const csvRows = [header.join(',')];
    
    rows.forEach(r => {
        const line = [
            escapeCSV(r.name),
            escapeCSV(r.price),
            escapeCSV(r.id),
            escapeCSV(r.hs_code),
            escapeCSV(r.subcategory),
            escapeCSV(r.image_url)
        ];
        csvRows.push(line.join(','));
    });
    
    return csvRows.join('\n');
}

const furnitureRows = [];
const handicraftRows = [];

products.forEach(product => {
    const isFurniture = product.category && product.category.toLowerCase() === 'furniture';
    const isHandicraft = product.category && product.category.toLowerCase() === 'handicraft';
    
    if (!isFurniture && !isHandicraft) {
        // Skip or default to something else if needed
        return;
    }
    
    // If the product has variants, export each variant as a row
    if (product.variants && product.variants.length > 0) {
        product.variants.forEach(variant => {
            // Append color to Product Name if it is not Default
            let displayName = product.name;
            if (variant.color && variant.color.toLowerCase() !== 'default') {
                displayName = `${product.name} (${variant.color})`;
            }
            
            const row = {
                name: displayName,
                price: variant.price || product.price_range || '',
                id: variant.id || product.id,
                hs_code: variant.hs_code || product.hs_code || '',
                subcategory: product.subcategory || '',
                image_url: getAbsoluteUrl(variant.image || (product.images && product.images[0]))
            };
            
            if (isFurniture) {
                furnitureRows.push(row);
            } else {
                handicraftRows.push(row);
            }
        });
    } else {
        // Fallback if no variants (though the database has them all grouped)
        const row = {
            name: product.name,
            price: product.price_range || '',
            id: product.id,
            hs_code: product.hs_code || '',
            subcategory: product.subcategory || '',
            image_url: getAbsoluteUrl(product.images && product.images[0])
        };
        
        if (isFurniture) {
            furnitureRows.push(row);
        } else {
            handicraftRows.push(row);
        }
    }
});

// Write CSV files
fs.writeFileSync(furnitureCsvPath, buildCsv(furnitureRows), 'utf8');
console.log(`Successfully generated Furniture CSV: ${furnitureRows.length} rows at ${furnitureCsvPath}`);

fs.writeFileSync(handicraftCsvPath, buildCsv(handicraftRows), 'utf8');
console.log(`Successfully generated Handicrafts CSV: ${handicraftRows.length} rows at ${handicraftCsvPath}`);
