# Blueblood Exports - Admin Portal Access Guide

## 🚀 Accessing the Portal
Once your site is deployed to Vercel (e.g., `https://blueblood-exports.vercel.app`), you can access the admin portal securely.

### **URL**
Append `/admin/` to your website's main URL:
- **`https://<your-project>.vercel.app/admin/`**

*(Note: The trailing slash `/` is recommended but Vercel handles it automatically)*

### **Security**
- **Public Visibility**: Hidden. There are **no links** to this portal on the public-facing website.
- **Login**: You will see a lock screen.
- **PIN**: **2026**

---

## 🛠 Features Dashboard
Once logged in, you have access to:

1.  **Dashboard**:
    - Real-time **inquiry count**.
    - **Pipeline Value** (auto-checks currency rates).
    - **Inquiry Trends** chart.

2.  **Inquiries (CRM)**:
    - View all contact form submissions.
    - **Add Notes**: Click "Respond" to add internal status notes.
    - **Filter**: Sort by New, Processed, or Negotiating.

3.  **Products**:
    - Direct view of your catalog data (`/data/products.json`).
    - Use this to check stock status and IDs.

4.  **Settings**:
    - **Currency**: Switch between USD, INR, EUR.
    - (Updates your pipeline value instantly).

---

## 💡 Troubleshooting
- **Link not working?** Ensure you typed `/admin/` correctly.
- **Changes not showing?** The site may be caching. Do a hard refresh (Ctrl+F5) or wait 1-2 minutes after deployment.
- **Forgot PIN?** It is hardcoded as `2026`.

---
*Generated for Blueblood Exports Administration*
