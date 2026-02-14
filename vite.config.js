import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                about: resolve(__dirname, 'about.html'),
                catalogue: resolve(__dirname, 'catalogue.html'),
                product: resolve(__dirname, 'product.html'),
                contact: resolve(__dirname, 'contact.html'),
                exportProcess: resolve(__dirname, 'export-process.html'),
                privacyPolicy: resolve(__dirname, 'privacy-policy.html'),
                termsConditions: resolve(__dirname, 'terms-conditions.html'),
                shippingPolicy: resolve(__dirname, 'shipping-policy.html'),
                error404: resolve(__dirname, '404.html'),
            },
        },
    },
});
