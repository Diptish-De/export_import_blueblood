const fs = require('fs');
const path = require('path');
const https = require('https');

const productsFilePath = path.join(__dirname, 'public', 'data', 'products.json');
const destDir = path.join(__dirname, 'public', 'images', 'products');

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

// Read products.json
const products = JSON.parse(fs.readFileSync(productsFilePath, 'utf8'));

// Extract unique IndiaMART URLs
const uniqueUrls = new Set();
products.forEach(p => {
    if (p.images) {
        p.images.forEach(img => {
            if (img.includes('imimg.com')) {
                uniqueUrls.add(img);
            }
        });
    }
    if (p.variants) {
        p.variants.forEach(v => {
            if (v.image && v.image.includes('imimg.com')) {
                uniqueUrls.add(v.image);
            }
        });
    }
});

const urlList = Array.from(uniqueUrls);
console.log(`Found ${urlList.length} unique IndiaMART URLs to download.`);

// Generate a clean filename for each URL to avoid collisions
const urlMap = {};
urlList.forEach((url, index) => {
    // Get file name from URL
    let parsedUrl;
    try {
        parsedUrl = new URL(url);
    } catch (e) {
        // Fallback simple parsing if URL is not absolute
        parsedUrl = { pathname: url.split('/').pop() };
    }
    const pathname = parsedUrl.pathname || '';
    let baseName = path.basename(pathname);
    
    // Clean query params or hashes
    baseName = baseName.split('?')[0].split('#')[0];
    
    // Ensure file extension
    let ext = path.extname(baseName);
    if (!ext || !['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext.toLowerCase())) {
        ext = '.jpg'; // default fallback
    }
    
    // Derive a clean, collision-free filename
    // Example: product_001_original_name.jpg
    const safeName = baseName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const finalFilename = `img_${String(index + 1).padStart(4, '0')}_${safeName}`;
    
    urlMap[url] = `/images/products/${finalFilename}`;
});

// Download helper function
function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                file.close();
                fs.unlink(destPath, () => {}); // delete incomplete file
                reject(new Error(`Failed to get '${url}' (Status Code: ${response.statusCode})`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            file.close();
            fs.unlink(destPath, () => {}); // delete incomplete file
            reject(err);
        });
    });
}

// Download coordinator with concurrency control
async function downloadAll() {
    const limit = 15; // Max concurrent downloads
    let active = 0;
    let index = 0;
    let completed = 0;
    let failed = 0;

    return new Promise((resolve) => {
        function checkNext() {
            if (index >= urlList.length && active === 0) {
                resolve({ completed, failed });
                return;
            }

            while (active < limit && index < urlList.length) {
                const url = urlList[index++];
                const localPath = urlMap[url];
                const destPath = path.join(__dirname, 'public', localPath);
                
                active++;
                
                // Check if file already exists to avoid redownloading
                if (fs.existsSync(destPath)) {
                    completed++;
                    active--;
                    // Print progress occasionally
                    if (completed % 50 === 0 || completed === urlList.length) {
                        console.log(`Progress: ${completed}/${urlList.length} images processed...`);
                    }
                    continue;
                }

                downloadFile(url, destPath)
                    .then(() => {
                        completed++;
                        active--;
                        if (completed % 50 === 0 || completed === urlList.length) {
                            console.log(`Progress: ${completed}/${urlList.length} images downloaded...`);
                        }
                        checkNext();
                    })
                    .catch((err) => {
                        console.error(`Error downloading ${url}:`, err.message);
                        failed++;
                        active--;
                        checkNext();
                    });
            }
        }

        checkNext();
    });
}

async function run() {
    console.log("Starting image downloads...");
    const stats = await downloadAll();
    console.log(`Download finished. Successfully downloaded/skipped: ${stats.completed}, Failed: ${stats.failed}`);

    // Update products.json
    console.log("Updating products.json with local image paths...");
    const updatedProducts = products.map(p => {
        const newP = { ...p };
        if (newP.images) {
            newP.images = newP.images.map(img => urlMap[img] || img);
        }
        if (newP.variants) {
            newP.variants = newP.variants.map(v => {
                const newV = { ...v };
                if (newV.image) {
                    newV.image = urlMap[newV.image] || newV.image;
                }
                return newV;
            });
        }
        return newP;
    });

    fs.writeFileSync(productsFilePath, JSON.stringify(updatedProducts, null, 2), 'utf8');
    console.log("Successfully updated public/data/products.json!");
}

run().catch(console.error);
