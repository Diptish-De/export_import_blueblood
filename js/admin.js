/**
 * Admin Portal Logic
 * Handles Authentication, Mock Data Generation, and UI Rendering
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- AUTHENTICATION ---
    const loginOverlay = document.getElementById('loginOverlay');
    const loginForm = document.getElementById('loginForm');
    const adminPinInput = document.getElementById('adminPin');
    const loginError = document.getElementById('loginError');
    const adminApp = document.getElementById('adminApp');
    const logoutBtn = document.getElementById('logoutBtn');

    // Simple mocked auth
    const CORRECT_PIN = "2026"; // Simple PIN for demo

    // Check session
    if (sessionStorage.getItem('admin_authenticated') === 'true') {
        showApp();
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const enteredPin = adminPinInput.value.trim();

        if (enteredPin === CORRECT_PIN) {
            sessionStorage.setItem('admin_authenticated', 'true');
            showApp();
        } else {
            loginError.textContent = "Incorrect PIN. Try 2026";
            adminPinInput.value = '';
            adminPinInput.focus();
            setTimeout(() => loginError.textContent = '', 3000);
        }
    });

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('admin_authenticated');
        window.location.reload();
    });

    function showApp() {
        loginOverlay.classList.add('hidden');
        adminApp.classList.remove('hidden');
        initDashboard();
    }

    // --- NAVIGATION ---
    const navBtns = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view-section');
    const pageTitle = document.getElementById('pageTitle');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            navBtns.forEach(b => b.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));

            // Add active to clicked
            btn.classList.add('active');
            const viewId = btn.dataset.view;
            document.getElementById(`view-${viewId}`).classList.add('active');

            // Update Title
            pageTitle.textContent = btn.innerText.trim();
        });
    });

    // --- DATA & DASHBOARD ---

    function initDashboard() {
        renderKPIs();
        renderCharts();
        renderTables();
        renderProducts();
    }

    // Mock Data Generators
    function getMockInquiries() {
        const localData = JSON.parse(localStorage.getItem('blueblood_inquiries') || '[]');
        const mocks = [
            { id: 'INQ-1045', name: 'John Peterson', country: 'USA', email: 'john@artgallery.ny', interest: 'Brass Statues', status: 'New', date: '2 hrs ago' },
            { id: 'INQ-1044', name: 'Sarah Jenkins', country: 'UK', email: 'sarah.j@interiors.co.uk', interest: 'Textiles', status: 'Processed', date: '5 hrs ago' },
            { id: 'INQ-1043', name: 'Al-Fayed Imports', country: 'UAE', email: 'procurement@alfayed.ae', interest: 'Bulk Order', status: 'Negotiating', date: '1 day ago' },
            { id: 'INQ-1042', name: 'Hans Weber', country: 'Germany', email: 'h.weber@berlin-art.de', interest: 'Wood Carvings', status: 'New', date: '1 day ago' },
            { id: 'INQ-1041', name: 'Elena Rossi', country: 'Italy', email: 'elena@vatican-suppliers.it', interest: 'Stone Idols', status: 'Processed', date: '2 days ago' }
        ];
        return [...localData, ...mocks];
    }

    function renderKPIs() {
        // Just randomizing slightly for "Live" feel
        const inquiries = 142;
        const pipeline = 450000;

        document.getElementById('kpiInquiries').textContent = inquiries;
        document.getElementById('kpiPipeline').textContent = '$' + pipeline.toLocaleString();
        document.getElementById('kpiRegion').textContent = 'USA (45%)';
        document.getElementById('navInquiryCount').textContent = '2'; // 2 New
    }

    function renderCharts() {
        const ctxTrend = document.getElementById('trendChart').getContext('2d');
        const ctxCategory = document.getElementById('categoryChart').getContext('2d');

        // Trend Chart
        new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
                datasets: [{
                    label: 'Inquiries',
                    data: [12, 19, 15, 25, 32, 45],
                    borderColor: '#d4a84b',
                    backgroundColor: 'rgba(212, 168, 75, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });

        // Category Chart
        new Chart(ctxCategory, {
            type: 'doughnut',
            data: {
                labels: ['Brass', 'Wood', 'Textile', 'Stone'],
                datasets: [{
                    data: [40, 25, 20, 15],
                    backgroundColor: [
                        '#d4a84b', // Gold
                        '#8b4513', // Wood color roughly
                        '#ef4444', // Reddish
                        '#9ca3af'  // Grey
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'right', labels: { color: '#9ca3af' } } }
            }
        });
    }

    function renderTables() {
        const data = getMockInquiries();
        const dashboardTable = document.getElementById('dashboardRecentTable');
        const inquiriesTable = document.getElementById('inquiriesTableBody');

        const rowsHTML = data.map(item => `
            <tr>
                <td>${item.id}</td>
                <td>
                    <div style="font-weight:600">${item.name}</div>
                    <div style="font-size:0.8em; color:var(--text-secondary)">${item.country}</div>
                </td>
                <td>${item.country}</td>
                <td>${item.interest}</td>
                <td><span class="status-badge status-${item.status.toLowerCase()}">${item.status}</span></td>
                <td><button class="action-btn">View</button></td>
            </tr>
        `).join('');

        // Dashboard only shows first 5
        if (dashboardTable) dashboardTable.innerHTML = rowsHTML;

        // Inquiries tab shows standard table
        const fullRowsHTML = data.map(item => `
            <tr>
                <td>${item.date}</td>
                <td>
                    <div style="font-weight:600">${item.name}</div>
                    <div style="font-size:0.8em; color:var(--text-secondary)">${item.country}</div>
                </td>
                <td>${item.email}</td>
                <td>${item.interest}</td>
                <td><span class="status-badge status-${item.status.toLowerCase()}">${item.status}</span></td>
                <td>
                    <button class="action-btn primary" onclick="alert('Opening details for ${item.id}')">Respond</button>
                    <button class="action-btn">Archive</button>
                </td>
            </tr>
        `).join('');

        if (inquiriesTable) inquiriesTable.innerHTML = fullRowsHTML;
    }

    async function renderProducts() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        try {
            // Try to fetch real data
            const response = await fetch('/data/products.json');
            const products = await response.json();

            grid.innerHTML = products.map(p => `
                <div class="product-admin-card">
                    <img src="${p.images ? p.images[0] : ''}" class="product-admin-img">
                    <div class="product-admin-info">
                        <h4>${p.name}</h4>
                        <div class="product-stats">
                            <span>ID: ${p.id}</span>
                            <span>Stock: In Stock</span>
                        </div>
                        <div style="display:flex; gap:5px;">
                            <button class="action-btn" style="flex:1">Edit</button>
                            <button class="action-btn" style="flex:1; color:var(--danger); border-color:var(--danger)">Hide</button>
                        </div>
                    </div>
                </div>
            `).join('');

        } catch (e) {
            console.log("Could not load products.json, using fallback");
            grid.innerHTML = '<p style="padding:1rem">No product data found.</p>';
        }
    }

});
