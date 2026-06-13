const fs = require('fs');
const path = require('path');

const productsFilePath = path.join(__dirname, 'public', 'data', 'products.json');
const productsDir = path.join(__dirname, 'public', 'images', 'products');

// Read products.json
const products = JSON.parse(fs.readFileSync(productsFilePath, 'utf8'));

// Helper to sanitize strings for safe filenames
function sanitize(str) {
    if (!str) return '';
    return String(str)
        .replace(/[^a-zA-Z0-9\s-_]/g, '') // Keep only alphanumeric, spaces, hyphens, underscores
        .trim()
        .replace(/\s+/g, '_'); // Replace spaces with underscores
}

// Build map of currentLocalPath -> newLocalPath
const renameMap = {};
const filenameCounts = {}; // To handle duplicates/multiple images for same product

function getNewPath(currentPath, product, variant = null) {
    if (!currentPath || !currentPath.startsWith('/images/products/')) {
        return currentPath;
    }
    
    // If already mapped, return it
    if (renameMap[currentPath]) {
        return renameMap[currentPath];
    }

    const subcategory = sanitize(product.subcategory || 'product');
    const productName = sanitize(product.name || 'item');
    const productId = sanitize((variant && variant.id) || product.id || 'id');
    const hsCode = sanitize((variant && variant.hs_code) || product.hs_code || 'hscode');
    
    // Get extension
    const ext = path.extname(currentPath) || '.jpg';
    
    // Create clean base name: Subcategory_ProductName_ProductID_HSCode
    const baseName = `${subcategory}_${productName}_${productId}_${hsCode}`.substring(0, 150); // safety length limit
    
    // Check for duplicates
    if (!filenameCounts[baseName]) {
        filenameCounts[baseName] = 1;
    } else {
        filenameCounts[baseName]++;
    }
    
    const suffix = filenameCounts[baseName] > 1 ? `_${filenameCounts[baseName]}` : '';
    const finalFilename = `${baseName}${suffix}${ext}`;
    
    const newPath = `/images/products/${finalFilename}`;
    renameMap[currentPath] = newPath;
    return newPath;
}

// First pass: scan products and build renameMap
products.forEach(product => {
    // Process main product images
    if (product.images) {
        product.images.forEach(img => {
            getNewPath(img, product);
        });
    }
    // Process variant images
    if (product.variants) {
        product.variants.forEach(variant => {
            if (variant.image) {
                getNewPath(variant.image, product, variant);
            }
        });
    }
});

console.log(`Prepared renaming map for ${Object.keys(renameMap).length} unique images.`);

// Physically rename files on disk
let renamedCount = 0;
let missingCount = 0;

Object.entries(renameMap).forEach(([oldRelPath, newRelPath]) => {
    const oldFullPath = path.join(__dirname, 'public', oldRelPath);
    const newFullPath = path.join(__dirname, 'public', newRelPath);
    
    if (fs.existsSync(oldFullPath)) {
        fs.renameSync(oldFullPath, newFullPath);
        renamedCount++;
    } else {
        // If it was already renamed (in case of double run or overlaps), skip
        if (fs.existsSync(newFullPath)) {
            renamedCount++;
        } else {
            console.warn(`File not found: ${oldFullPath}`);
            missingCount++;
        }
    }
});

console.log(`Physical renaming complete. Success: ${renamedCount}, Missing: ${missingCount}`);

// Update products.json structure
const updatedProducts = products.map(product => {
    const newProduct = { ...product };
    if (newProduct.images) {
        newProduct.images = newProduct.images.map(img => renameMap[img] || img);
    }
    if (newProduct.variants) {
        newProduct.variants = newProduct.variants.map(variant => {
            const newVariant = { ...variant };
            if (newVariant.image) {
                newVariant.image = renameMap[newVariant.image] || newVariant.image;
            }
            return newVariant;
        });
    }
    return newProduct;
});

fs.writeFileSync(productsFilePath, JSON.stringify(updatedProducts, null, 2), 'utf8');
console.log("Successfully updated public/data/products.json with clean image paths!");
