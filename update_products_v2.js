const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const src1 = "C:\\Users\\DIPTISH\\.gemini\\antigravity\\brain\\406902d5-d8ea-46f8-a17f-c6ad01214167\\.system_generated\\steps\\56\\content.md";
const src2 = "C:\\Users\\DIPTISH\\.gemini\\antigravity\\brain\\406902d5-d8ea-46f8-a17f-c6ad01214167\\.system_generated\\steps\\57\\content.md";
const src3 = "C:\\Users\\DIPTISH\\.gemini\\antigravity\\brain\\406902d5-d8ea-46f8-a17f-c6ad01214167\\.system_generated\\steps\\58\\content.md";

const productsFile = "d:\\export_import_blueblood\\public\\data\\products.json";

function extractCSV(mdFile) {
   let text = fs.readFileSync(mdFile, 'utf-8');
   let lines = text.split('\n');
   let csvStartIndex = lines.findIndex(l => l.startsWith('Product Name'));
   if (csvStartIndex === -1) return "";
   let csvText = lines.slice(csvStartIndex).join('\n');
   return csvText;
}

let idCounter = 1000;
function generateId(prefix) { return prefix + "-" + (idCounter++); }

const colors = ["Sky Blue", "Pistachio", "Chocolate Brown", "Charcoal Black", "Graphite Grey", "White", "Black", "Blue", "Green", "Red", "Yellow", "Brown", "Grey", "Orange", "Pink", "Golden"];

function getBaseNameAndColor(name) {
    let baseName = name;
    let colorFound = null;
    for (let c of colors) {
        let regex = new RegExp(`\\b${c}\\b`, "i");
        if (regex.test(baseName)) {
            colorFound = c;
            baseName = baseName.replace(regex, "").replace(/\s{2,}/g, ' ').trim();
            break;
        }
    }
    return { baseName, colorFound };
}

function parseCSVStream(text, rowCallback) {
   return new Promise((resolve) => {
       const results = [];
       const Readable = require('stream').Readable;
       const s = new Readable();
       s.push(text);
       s.push(null);
       s.pipe(csv())
        .on('data', (data) => {
            if (!data['Product Name']) return;
            const res = rowCallback(data);
            if (res) results.push(res);
        })
        .on('end', () => resolve(results));
   });
}

function processCSV1(text) {
    return parseCSVStream(text, (data) => {
        const subcategory = data['Subcategory'] || 'Table';
        let material = data['Product Name'].match(/(Wood|Brass|Bone Inlay|Leather|Metal|Glass|Teak|Mango)/i);
        material = material ? material[0] : 'Mixed';
        const { baseName, colorFound } = getBaseNameAndColor(data['Product Name']);
        
        return {
            originalName: data['Product Name'].trim(),
            baseName: baseName,
            color: colorFound || "Default",
            id: data['Product ID'] || generateId('f-new'),
            category: 'Furniture',
            subcategory: subcategory,
            price_range: data['Price (INR)'] || '',
            hs_code: data['HS Code'] || '',
            material: material,
            origin: "India",
            dimensions: "Standard",
            weight: "Standard",
            moq: 1,
            image: data['Product Image']
        };
    });
}

function processCSV2(text) {
    return parseCSVStream(text, (data) => {
        const subcategory = data['Subcategory'] || 'Chair';
        let material = data['Product Name'].match(/(Wood|Brass|Sheesham|Teak|Rattan|Iron|Steel|Mango)/i);
        material = material ? material[0] : 'Mixed';
        const { baseName, colorFound } = getBaseNameAndColor(data['Product Name']);
        
        return {
            originalName: data['Product Name'].trim(),
            baseName: baseName,
            color: colorFound || "Default",
            id: data['Unique Code'] || generateId('f-chr'),
            category: 'Furniture',
            subcategory: subcategory,
            price_range: data['Price (INR)'] || '',
            hs_code: data['HS Code'] || '',
            material: material,
            origin: "India",
            dimensions: "Standard",
            weight: "Standard",
            moq: 1,
            image: data['Product Image']
        };
    });
}

function processCSV3(text) {
    return parseCSVStream(text, (data) => {
        let subcategory = data['Category'] || 'Dokra';
        if (subcategory.toLowerCase() === 'dhokra') subcategory = 'Dokra';
        let type = data['Sub Category'] || 'Showpiece';
        if (type.toLowerCase() === 'dhokra') type = 'Dokra';
        let material = data['Category'] || 'Mixed';
        if (material.toLowerCase() === 'dhokra') material = 'Dokra';

        const { baseName, colorFound } = getBaseNameAndColor(data['Product Name']);
        
        return {
            originalName: data['Product Name'].trim(),
            baseName: baseName,
            color: colorFound || "Default",
            id: data['Unique Code'] || generateId('h-new'),
            category: 'Handicraft',
            subcategory: subcategory,
            type: type,
            price_range: data['Price (INR)'] || '',
            hs_code: data['HS Code'] || '',
            material: material,
            origin: "India",
            dimensions: "Standard",
            weight: "Standard",
            moq: 1,
            image: data['Product Image']
        };
    });
}

async function run() {
    let p1 = await processCSV1(extractCSV(src1));
    let p2 = await processCSV2(extractCSV(src2));
    let p3 = await processCSV3(extractCSV(src3));
    
    let all = [...p1, ...p2, ...p3];
    
    all.forEach(p => {
        if (p.subcategory.toLowerCase() === 'dhokra') p.subcategory = 'Dokra';
        if (p.material.toLowerCase() === 'dhokra') p.material = 'Dokra';
        p.originalName = p.originalName.replace(/Dhokra/ig, 'Dokra');
        p.baseName = p.baseName.replace(/Dhokra/ig, 'Dokra');
    });

    let grouped = new Map();
    
    all.forEach(item => {
        // Group by base name (case insensitive)
        let key = item.baseName.toLowerCase();
        
        if (!grouped.has(key)) {
            grouped.set(key, {
                id: item.id, // Primary ID from the first item
                name: item.baseName,
                category: item.category,
                subcategory: item.subcategory,
                price_range: item.price_range,
                hs_code: item.hs_code,
                material: item.material,
                origin: item.origin,
                dimensions: item.dimensions,
                weight: item.weight,
                moq: item.moq,
                images: [],
                variants: [],
                description: `Authentic ${item.subcategory} - ${item.baseName}. High-quality Indian craftsmanship suitable for global export.`
            });
        }
        
        let gp = grouped.get(key);
        // Add image to main images list if not present
        if (!gp.images.includes(item.image) && item.image) {
            gp.images.push(item.image);
        }
        
        // Add variant info
        gp.variants.push({
            id: item.id,
            color: item.color,
            image: item.image,
            price: item.price_range,
            hs_code: item.hs_code
        });

        // Ensure description is there
        if (gp.description) gp.description = gp.description.replace(/Dhokra/ig, 'Dokra');
    });
    
    // Sort variants by color or deduplicate variants with same color? We keep them all, it gives multiple images per color
    
    let finalProducts = Array.from(grouped.values());
    console.log("Reduced " + all.length + " rows to " + finalProducts.length + " grouped products.");
    fs.writeFileSync(productsFile, JSON.stringify(finalProducts, null, 2));
}

run();
