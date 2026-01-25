# Blueblood Exports - Indian Artefact Catalogue Website

A premium, traditional Indian-style catalogue website for an export-import artefacts business.

## 🏺 Features

- **6 Pages**: Home, About, Catalogue, Product Detail, Export Process, Contact
- **Traditional Indian Design**: Terracotta, Ivory, Deep Maroon, Antique Gold, Indigo palette
- **WhatsApp Integration**: Pre-filled inquiry messages with product details
- **Category Filtering**: Filter products by Brass, Wood, Textile, Stone, Metal
- **Responsive Design**: Works on desktop, tablet, and mobile
- **SEO Optimized**: Proper meta tags on all pages

## 📁 Folder Structure

```
├── index.html          # Home page
├── about.html          # About Us page
├── catalogue.html      # Product catalogue with filters
├── product.html        # Product detail page
├── export-process.html # Export process information
├── contact.html        # Contact information
├── README.md           # This file
├── css/
│   ├── index.css       # Design system & base styles
│   └── components.css  # Component styles
├── js/
│   ├── main.js         # Common functionality
│   ├── catalogue.js    # Catalogue page logic
│   └── product.js      # Product page & WhatsApp logic
├── data/
│   └── products.json   # Product catalogue data
└── images/             # Product images (add your own)
```

## 🚀 Getting Started

### Local Development

1. **Simple way** - Open `index.html` directly in your browser

2. **With local server** (recommended):
   ```bash
   npx serve .
   ```
   Then open `http://localhost:3000`

### Deployment

This is a static site. Deploy to:
- **Netlify**: Drag and drop the folder
- **Vercel**: Connect your GitHub repo
- **GitHub Pages**: Push to `gh-pages` branch
- **Any web host**: Upload all files via FTP

## ⚙️ Configuration

### Update WhatsApp Number

Edit `js/product.js` and replace the placeholder:

```javascript
const WHATSAPP_NUMBER = '91XXXXXXXXXX'; // Replace with actual number
```

Also update `contact.html`:
```html
<a href="https://wa.me/91XXXXXXXXXX?text=...">Chat Now</a>
```

### Add/Modify Products

Edit `data/products.json`. Product schema:

```json
{
  "id": "unique_id",
  "name": "Product Name",
  "category": "Brass|Wood|Textile|Stone|Metal",
  "material": "Material Type",
  "origin": "City, India",
  "dimensions": "W x H inches",
  "weight": "X kg",
  "moq": 10,
  "images": ["image1.jpg", "image2.jpg"],
  "description": "Product description text"
}
```

### Use Your Own Images

1. Add images to the `images/` folder
2. Update image paths in `products.json`:
   ```json
   "images": ["images/product1.jpg", "images/product1-alt.jpg"]
   ```

### Update Company Information

- **Company Name**: Search for "Blueblood" in HTML files
- **Email**: Search for "exports@blueblood.com"
- **Address**: Update in footer and contact page
- **Social Links**: Update in footer sections

## 📱 WhatsApp Message Template

When a customer clicks the WhatsApp button, the message includes:

```
Hello, I am interested in the following artefact:

Product Name: [Name]
Quantity: [Selected Quantity]
Material: [Material]
Origin: [Origin]

Please share pricing, export details, and delivery timeline.
```

## 🎨 Customizing Design

### Colors
Edit CSS custom properties in `css/index.css`:

```css
:root {
  --color-terracotta: #C75B39;
  --color-ivory: #F5F0E6;
  --color-maroon: #6B1A1A;
  --color-gold: #C9A962;
  --color-indigo: #2E4057;
}
```

### Fonts
Default fonts (loaded from Google Fonts):
- **Headings**: Playfair Display (serif)
- **Body**: Inter (sans-serif)

---

Built with ❤️ for showcasing India's finest craftsmanship to the world.
