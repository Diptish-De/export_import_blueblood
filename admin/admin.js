/**
 * Blueblood Exports - Export Costing & Quotation Admin Portal Logic
 */

import './admin.css';
import { supabase } from '../js/supabase.js';

// --- STATE MANAGEMENT ---
let state = {
    products: [],
    customCosts: JSON.parse(localStorage.getItem('bb_custom_costs') || '{}'),
    exchangeRates: JSON.parse(localStorage.getItem('bb_exchange_rates') || JSON.stringify({
        INR: 83.35,
        EUR: 0.92,
        GBP: 0.79,
        AED: 3.67,
        USD: 1.00
    })),
    costingFees: JSON.parse(localStorage.getItem('bb_costing_fees') || JSON.stringify({
        inlandTransport: 3500,  // INR
        portHandling: 4500,     // INR
        documentation: 2500,    // INR
        clearance: 6000,        // INR
        misc: 1500,             // INR
        profitMargin: 15,       // %
        markup: 10              // %
    })),
    insurance: JSON.parse(localStorage.getItem('bb_insurance') || JSON.stringify({
        percent: 0.25,          // %
        minAmount: 50           // USD
    })),
    freightMatrix: JSON.parse(localStorage.getItem('bb_freight_matrix') || JSON.stringify([
        { country: 'USA', port: 'Port of New York', LCL: 150, F20: 3200, F40: 4500, F40HQ: 5200, Air: 4.5 },
        { country: 'USA', port: 'Port of Los Angeles', LCL: 120, F20: 2800, F40: 3800, F40HQ: 4400, Air: 4.2 },
        { country: 'UK', port: 'Port of Felixstowe', LCL: 95, F20: 2200, F40: 3100, F40HQ: 3600, Air: 3.8 },
        { country: 'Germany', port: 'Port of Hamburg', LCL: 110, F20: 2400, F40: 3300, F40HQ: 3900, Air: 3.9 },
        { country: 'UAE', port: 'Port of Jebel Ali', LCL: 65, F20: 1400, F40: 2000, F40HQ: 2400, Air: 2.1 },
        { country: 'Australia', port: 'Port of Sydney', LCL: 135, F20: 2900, F40: 4100, F40HQ: 4800, Air: 4.6 }
    ])),
    currentQuoteItems: [],
    quotations: JSON.parse(localStorage.getItem('bb_saved_quotations') || '[]')
};

// --- INITIALIZATION ---
function init() {
    setupAuth();
    setupNavigation();
    setupCostingForms();
    setupQuoteGenerator();
    setupCurrencyForm();
    loadProducts();
    renderDashboard();
    renderQuoteHistory();
}

// --- AUTHENTICATION ---
function setupAuth() {
    const loginOverlay = document.getElementById('loginOverlay');
    const loginForm = document.getElementById('loginForm');
    const adminPin = document.getElementById('adminPin');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminApp = document.getElementById('adminApp');

    const isAuthenticated = sessionStorage.getItem('admin_authenticated') === 'true';
    if (isAuthenticated) {
        loginOverlay.classList.add('hidden');
        adminApp.classList.remove('hidden');
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (adminPin.value === '2026') {
            sessionStorage.setItem('admin_authenticated', 'true');
            loginOverlay.classList.add('hidden');
            adminApp.classList.remove('hidden');
        } else {
            loginError.textContent = 'Incorrect Access PIN. Try 2026';
            adminPin.value = '';
            setTimeout(() => { loginError.textContent = ''; }, 3000);
        }
    });

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('admin_authenticated');
        window.location.reload();
    });
}

// --- NAVIGATION ---
function setupNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view-section');
    const pageTitle = document.getElementById('pageTitle');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));

            btn.classList.add('active');
            const target = btn.dataset.view;
            document.getElementById(`view-${target}`).classList.add('active');
            pageTitle.textContent = btn.innerText.trim();

            if (target === 'dashboard') renderDashboard();
            if (target === 'quote-history') renderQuoteHistory();
            if (target === 'product-master') renderProductMaster();
            if (target === 'freight-costing') renderFreightMatrix();
        });
    });
}

// --- LOAD PRODUCTS FROM SUPABASE ---
async function loadProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*');

        if (error) throw error;
        state.products = data || [];
    } catch (err) {
        console.error('Failed to load products from Supabase, loading local JSON fallback:', err);
        try {
            const res = await fetch('/data/products.json');
            state.products = await res.json();
        } catch (jsonErr) {
            console.error('JSON Fallback failed:', jsonErr);
        }
    }

    populateProductSelectors();
    renderProductMaster();
}

function populateProductSelectors() {
    const select = document.getElementById('quoteProductSelect');
    if (!select) return;
    
    // Clear
    select.innerHTML = '<option value="">-- Select Product --</option>';
    
    state.products.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.name} (${p.id})`;
        select.appendChild(opt);
    });
}

// --- COSTING MODULE CALCULATIONS ---
function getProductCosts(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return null;

    // Use customized override costs if present, otherwise default
    const custom = state.customCosts[productId] || {};
    
    // Fallback procurement prices in INR
    let defaultProcCost = 5000; // default base procurement cost
    if (product.price_range) {
        // e.g. "28750-30187.5" -> pick lower bound or average
        const bounds = product.price_range.split('-').map(Number);
        if (bounds.length > 0 && !isNaN(bounds[0])) {
            defaultProcCost = bounds[0];
        }
    }

    return {
        procCost: Number(custom.procCost !== undefined ? custom.procCost : defaultProcCost),
        pkgCost: Number(custom.pkgCost !== undefined ? custom.pkgCost : 800), // default packaging cost INR
        moq: Number(custom.moq !== undefined ? custom.moq : (product.moq || 10)),
        weight: Number(custom.weight !== undefined ? custom.weight : 15), // default kg
        dimensions: custom.dimensions || product.dimensions || '60x60x75 cm',
        uom: custom.uom || 'Unit'
    };
}

// Calculates FOB price in INR and USD
function calculateFOB(productId, quantity) {
    const costs = getProductCosts(productId);
    if (!costs) return null;

    const fees = state.costingFees;
    
    // Inland handling costs share per item (divided by total order quantity, or flat rate base check)
    // To make it professional, we amortize order-level inland/docs fees across the item quantity
    const totalOrderLevelFees = Number(fees.inlandTransport) + Number(fees.portHandling) + Number(fees.documentation) + Number(fees.clearance) + Number(fees.misc);
    const orderFeesPerItem = totalOrderLevelFees / quantity;

    const baseCostPrice = costs.procCost + costs.pkgCost + orderFeesPerItem;
    
    // Markup % and Margin %
    // Markup adds cost multiplier, Margin modifies final selling price formula
    const markupFactor = 1 + (Number(fees.markup) / 100);
    const profitMarginFactor = 1 - (Number(fees.profitMargin) / 100);

    const costWithMarkup = baseCostPrice * markupFactor;
    
    // Selling Price = Cost / (1 - Margin)
    let unitFobINR = costWithMarkup;
    if (profitMarginFactor > 0 && profitMarginFactor < 1) {
        unitFobINR = costWithMarkup / profitMarginFactor;
    }

    const unitFobUSD = unitFobINR / state.exchangeRates.INR;

    return {
        unitBaseINR: costs.procCost,
        unitPkgINR: costs.pkgCost,
        unitFobINR: unitFobINR,
        unitFobUSD: unitFobUSD,
        totalFobINR: unitFobINR * quantity,
        totalFobUSD: unitFobUSD * quantity,
        weight: costs.weight,
        dimensions: costs.dimensions
    };
}

// Calculates CIF price (FOB + Freight + Insurance)
function calculateCIF(productId, quantity, country, port, freightMode) {
    const fobData = calculateFOB(productId, quantity);
    if (!fobData) return null;

    // Lookup Freight
    const freightRateRecord = state.freightMatrix.find(f => f.country === country && f.port === port);
    let freightCostUSD = 0;

    if (freightRateRecord) {
        const modeRate = freightRateRecord[freightMode];
        if (modeRate !== undefined) {
            if (freightMode === 'LCL') {
                // LCL is per CBM. Assume average item is 0.25 CBM
                const totalCbm = 0.25 * quantity;
                freightCostUSD = modeRate * totalCbm;
            } else if (freightMode === 'Air') {
                // Air is per kg
                const totalWeight = fobData.weight * quantity;
                freightCostUSD = modeRate * totalWeight;
            } else {
                // Container FCL is flat rate per shipment. Amortize or flat add?
                // For a single quotation item, add the container flat rate
                freightCostUSD = modeRate;
            }
        }
    } else {
        // Fallback default freight
        freightCostUSD = 500;
    }

    const unitFreightUSD = freightCostUSD / quantity;

    // Insurance Calculation (CIF value needs insurance. Insurance = Marine Rate % of CIF)
    // Insurance = (FOB + Freight) * (InsuranceRate% / 100)
    const insConfig = state.insurance;
    const baseInsUSD = (fobData.totalFobUSD + freightCostUSD) * (Number(insConfig.percent) / 100);
    const finalInsuranceUSD = Math.max(baseInsUSD, Number(insConfig.minAmount));
    const unitInsuranceUSD = finalInsuranceUSD / quantity;

    const unitCifUSD = fobData.unitFobUSD + unitFreightUSD + unitInsuranceUSD;

    return {
        ...fobData,
        unitFreightUSD: unitFreightUSD,
        unitInsuranceUSD: unitInsuranceUSD,
        unitCifUSD: unitCifUSD,
        totalCifUSD: unitCifUSD * quantity,
        totalFreightUSD: freightCostUSD,
        totalInsuranceUSD: finalInsuranceUSD
    };
}

// --- QUOTATION GENERATOR INTERACTIVE ENGINE ---
function setupQuoteGenerator() {
    const addBtn = document.getElementById('addProductBtn');
    const select = document.getElementById('quoteProductSelect');
    const qtyInput = document.getElementById('quoteProductQty');
    const quoteForm = document.getElementById('quoteForm');
    const saveBtn = document.getElementById('saveQuoteBtn');
    const printBtn = document.getElementById('printQuoteBtn');

    // Trigger instant calculations on changes of inputs
    ['quoteCountry', 'quotePort', 'quoteCurrency', 'quoteIncoterm', 'quoteFreightMode'].forEach(id => {
        document.getElementById(id).addEventListener('change', updateQuoteCalculations);
    });

    addBtn.addEventListener('click', () => {
        const productId = select.value;
        const qty = parseInt(qtyInput.value);

        if (!productId || isNaN(qty) || qty <= 0) {
            alert('Please select a valid product and quantity.');
            return;
        }

        const product = state.products.find(p => p.id === productId);
        if (!product) return;

        // Check if already added
        const existing = state.currentQuoteItems.find(item => item.id === productId);
        if (existing) {
            existing.quantity += qty;
        } else {
            state.currentQuoteItems.push({
                id: productId,
                name: product.name,
                quantity: qty
            });
        }

        updateQuoteCalculations();
        qtyInput.value = 10;
        select.value = '';
    });

    saveBtn.addEventListener('click', saveCurrentQuotation);
    printBtn.addEventListener('click', printCurrentQuotation);
}

function updateQuoteCalculations() {
    const country = document.getElementById('quoteCountry').value;
    const port = document.getElementById('quotePort').value;
    const currency = document.getElementById('quoteCurrency').value;
    const incoterm = document.getElementById('quoteIncoterm').value;
    const freightMode = document.getElementById('quoteFreightMode').value;

    const tbody = document.getElementById('quoteSelectedItems');
    if (state.currentQuoteItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No items added yet. Choose a product above.</td></tr>`;
        resetQuoteSummaries();
        document.getElementById('printQuoteBtn').disabled = true;
        return;
    }

    let totalBaseINR = 0;
    let totalHandlingINR = 0;
    let totalFreightUSD = 0;
    let totalInsuranceUSD = 0;
    let grandTotalUSD = 0;

    const currencySymbolMap = { USD: '$', INR: '₹', EUR: '€', GBP: '£', AED: 'Dh' };
    const curSymbol = currencySymbolMap[currency];
    const rateToTarget = state.exchangeRates[currency];

    tbody.innerHTML = state.currentQuoteItems.map((item, idx) => {
        const calcs = calculateCIF(item.id, item.quantity, country, port, freightMode);
        if (!calcs) return '';

        totalBaseINR += calcs.unitBaseINR * item.quantity;
        // Amortized handling fees
        const amortizedHandling = (calcs.unitFobINR - calcs.unitBaseINR - calcs.unitPkgINR) * item.quantity;
        totalHandlingINR += (calcs.unitPkgINR * item.quantity) + amortizedHandling;
        totalFreightUSD += calcs.totalFreightUSD;
        totalInsuranceUSD += calcs.totalInsuranceUSD;

        const unitFobTarget = calcs.unitFobUSD * rateToTarget;
        const unitCifTarget = calcs.unitCifUSD * rateToTarget;
        const totalTarget = (incoterm === 'CIF' ? calcs.totalCifUSD : calcs.totalFobUSD) * rateToTarget;
        
        grandTotalUSD += incoterm === 'CIF' ? calcs.totalCifUSD : calcs.totalFobUSD;

        return `
            <tr>
                <td><strong>${item.id}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">${item.name}</span></td>
                <td>${item.quantity}</td>
                <td>₹${calcs.unitBaseINR.toFixed(2)}</td>
                <td>${curSymbol}${unitFobTarget.toFixed(2)}</td>
                <td>${curSymbol}${unitCifTarget.toFixed(2)}</td>
                <td><strong>${curSymbol}${totalTarget.toFixed(2)}</strong></td>
                <td>
                    <button class="action-btn danger small" onclick="removeQuoteItem('${item.id}')">Remove</button>
                </td>
            </tr>
        `;
    }).join('');

    // Update Currency Labels
    document.querySelectorAll('.currency-label').forEach(el => el.textContent = currency);

    // Update Summary Row
    const grandTotalTarget = grandTotalUSD * rateToTarget;

    document.getElementById('summaryBaseCost').textContent = `₹${totalBaseINR.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('summaryHandlingCost').textContent = `₹${totalHandlingINR.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('summaryFreightCost').textContent = `${curSymbol}${(totalFreightUSD * rateToTarget).toFixed(2)}`;
    document.getElementById('summaryInsuranceCost').textContent = `${curSymbol}${(totalInsuranceUSD * rateToTarget).toFixed(2)}`;
    document.getElementById('summaryGrandTotal').textContent = `${curSymbol}${grandTotalTarget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    document.getElementById('printQuoteBtn').disabled = false;
}

function resetQuoteSummaries() {
    document.getElementById('summaryBaseCost').textContent = '₹0.00';
    document.getElementById('summaryHandlingCost').textContent = '₹0.00';
    document.getElementById('summaryFreightCost').textContent = '0.00';
    document.getElementById('summaryInsuranceCost').textContent = '0.00';
    document.getElementById('summaryGrandTotal').textContent = '$0.00';
}

window.removeQuoteItem = (productId) => {
    state.currentQuoteItems = state.currentQuoteItems.filter(item => item.id !== productId);
    updateQuoteCalculations();
};

// --- SAVE / EDIT QUOTATIONS ---
function saveCurrentQuotation() {
    const buyerName = document.getElementById('quoteBuyerName').value.trim();
    const companyName = document.getElementById('quoteCompanyName').value.trim();
    const country = document.getElementById('quoteCountry').value;
    const port = document.getElementById('quotePort').value.trim();
    const currency = document.getElementById('quoteCurrency').value;
    const incoterm = document.getElementById('quoteIncoterm').value;
    const freightMode = document.getElementById('quoteFreightMode').value;
    const paymentTerms = document.getElementById('quotePaymentTerms').value;
    const validity = parseInt(document.getElementById('quoteValidity').value);

    if (!buyerName || !companyName || !port || state.currentQuoteItems.length === 0) {
        alert('Please fill out all required fields and add at least one product.');
        return;
    }

    const editQuoteId = document.getElementById('editQuoteId').value;
    
    // Calculations
    let grandTotalUSD = 0;
    const calculatedItems = state.currentQuoteItems.map(item => {
        const calcs = calculateCIF(item.id, item.quantity, country, port, freightMode);
        const itemVal = incoterm === 'CIF' ? calcs.totalCifUSD : calcs.totalFobUSD;
        grandTotalUSD += itemVal;
        return {
            ...item,
            unitFobUSD: calcs.unitFobUSD,
            unitCifUSD: calcs.unitCifUSD,
            totalUSD: itemVal
        };
    });

    if (editQuoteId) {
        // Edit Mode
        const idx = state.quotations.findIndex(q => q.id === editQuoteId);
        if (idx !== -1) {
            state.quotations[idx] = {
                ...state.quotations[idx],
                buyerName, companyName, country, port, currency, incoterm, freightMode, paymentTerms, validity,
                items: calculatedItems,
                grandTotalUSD,
                updatedAt: new Date().toISOString()
            };
        }
        document.getElementById('editQuoteId').value = '';
        alert('Quotation updated successfully!');
    } else {
        // Create Mode
        const newQuote = {
            id: 'BBE-QT-' + Math.floor(100000 + Math.random() * 900000),
            buyerName, companyName, country, port, currency, incoterm, freightMode, paymentTerms, validity,
            items: calculatedItems,
            grandTotalUSD,
            createdAt: new Date().toISOString()
        };
        state.quotations.unshift(newQuote);
        alert('Quotation saved successfully!');
    }

    localStorage.setItem('bb_saved_quotations', JSON.stringify(state.quotations));
    state.currentQuoteItems = [];
    document.getElementById('quoteForm').reset();
    updateQuoteCalculations();
    renderQuoteHistory();
}

// --- QUOTATION HISTORY ---
function renderQuoteHistory() {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;

    const searchVal = document.getElementById('searchQuoteInput')?.value.toLowerCase() || '';
    const filtered = state.quotations.filter(q => 
        q.buyerName.toLowerCase().includes(searchVal) ||
        q.companyName.toLowerCase().includes(searchVal) ||
        q.port.toLowerCase().includes(searchVal) ||
        q.id.toLowerCase().includes(searchVal)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No quotations found.</td></tr>`;
        return;
    }

    const currencySymbolMap = { USD: '$', INR: '₹', EUR: '€', GBP: '£', AED: 'Dh' };

    tbody.innerHTML = filtered.map(q => {
        const curSymbol = currencySymbolMap[q.currency] || '$';
        const convertedTotal = q.grandTotalUSD * state.exchangeRates[q.currency];

        return `
            <tr>
                <td>${new Date(q.createdAt).toLocaleDateString()}</td>
                <td><strong>${q.id}</strong></td>
                <td>${q.buyerName}</td>
                <td>${q.companyName}</td>
                <td>${q.country}</td>
                <td><span class="badge-status processed">${q.incoterm}</span></td>
                <td><strong>${curSymbol}${convertedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                <td>
                    <div style="display:flex; gap:6px;">
                        <button class="action-btn small" onclick="loadQuoteForEdit('${q.id}')">Edit</button>
                        <button class="action-btn small" onclick="duplicateQuotation('${q.id}')">Duplicate</button>
                        <button class="action-btn small" onclick="printSavedQuotation('${q.id}')">Print/PDF</button>
                        <button class="action-btn danger small" onclick="deleteQuotation('${q.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.loadQuoteForEdit = (quoteId) => {
    const quote = state.quotations.find(q => q.id === quoteId);
    if (!quote) return;

    document.getElementById('editQuoteId').value = quote.id;
    document.getElementById('quoteBuyerName').value = quote.buyerName;
    document.getElementById('quoteCompanyName').value = quote.companyName;
    document.getElementById('quoteCountry').value = quote.country;
    document.getElementById('quotePort').value = quote.port;
    document.getElementById('quoteCurrency').value = quote.currency;
    document.getElementById('quoteIncoterm').value = quote.incoterm;
    document.getElementById('quoteFreightMode').value = quote.freightMode;
    document.getElementById('quotePaymentTerms').value = quote.paymentTerms;
    document.getElementById('quoteValidity').value = quote.validity;

    state.currentQuoteItems = quote.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity
    }));

    updateQuoteCalculations();
    
    // Switch View
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-view="quote-generator"]').classList.add('active');
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    document.getElementById('view-quote-generator').classList.add('active');
    document.getElementById('pageTitle').textContent = 'Create Quote (Edit Mode)';
};

window.duplicateQuotation = (quoteId) => {
    const quote = state.quotations.find(q => q.id === quoteId);
    if (!quote) return;

    const dup = {
        ...quote,
        id: 'BBE-QT-' + Math.floor(100000 + Math.random() * 900000),
        createdAt: new Date().toISOString(),
        buyerName: quote.buyerName + ' (Copy)'
    };

    state.quotations.unshift(dup);
    localStorage.setItem('bb_saved_quotations', JSON.stringify(state.quotations));
    renderQuoteHistory();
    alert('Quotation duplicated successfully!');
};

window.deleteQuotation = (quoteId) => {
    if (!confirm('Are you sure you want to delete this quotation?')) return;
    state.quotations = state.quotations.filter(q => q.id !== quoteId);
    localStorage.setItem('bb_saved_quotations', JSON.stringify(state.quotations));
    renderQuoteHistory();
};

// --- PRINT & PDF ENGINE ---
function buildPDFHtml(quote) {
    const currencySymbolMap = { USD: '$', INR: '₹', EUR: '€', GBP: '£', AED: 'Dh' };
    const curSymbol = currencySymbolMap[quote.currency] || '$';
    const rateToTarget = state.exchangeRates[quote.currency];

    let itemsRows = '';
    quote.items.forEach((item, idx) => {
        const unitVal = (quote.incoterm === 'CIF' ? item.unitCifUSD : item.unitFobUSD) * rateToTarget;
        const totalVal = item.totalUSD * rateToTarget;
        itemsRows += `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${item.id}</strong></td>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${curSymbol}${unitVal.toFixed(2)}</td>
                <td>${curSymbol}${totalVal.toFixed(2)}</td>
            </tr>
        `;
    });

    const grandTotalTarget = quote.grandTotalUSD * rateToTarget;

    return `
        <div class="print-header">
            <div class="print-logo-section">
                <h1>BLUEBLOOD EXPORTS</h1>
                <p>Premium Handcrafted Indian Artefacts & Furniture</p>
                <p>GSTIN: 27AABCB1234F1Z0 | Corporate Office: Mumbai, India</p>
            </div>
            <div class="print-meta-section">
                <h2>QUOTATION</h2>
                <p><strong>Quote Ref:</strong> ${quote.id}</p>
                <p><strong>Date:</strong> ${new Date(quote.createdAt).toLocaleDateString()}</p>
                <p><strong>Validity:</strong> ${quote.validity} Days</p>
            </div>
        </div>

        <div class="print-details-grid">
            <div>
                <h3>Exporter / Consignor</h3>
                <p><strong>Blueblood Exports (OPC) Private Limited</strong></p>
                <p>Near Royal Opera House, Charni Road</p>
                <p>Mumbai, Maharashtra, India - 400004</p>
                <p>Email: exports@blueblood.com | Phone: +91 7812028686</p>
            </div>
            <div>
                <h3>Buyer / Consignee</h3>
                <p><strong>${quote.buyerName}</strong></p>
                <p>Company: ${quote.companyName}</p>
                <p>Country: ${quote.country}</p>
                <p>Destination Port: ${quote.port}</p>
            </div>
        </div>

        <table class="print-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>SKU</th>
                    <th>Product Description</th>
                    <th>Quantity</th>
                    <th>Unit Price (${quote.incoterm})</th>
                    <th>Total Price (${quote.currency})</th>
                </tr>
            </thead>
            <tbody>
                ${itemsRows}
            </tbody>
        </table>

        <div class="print-summary">
            <div class="print-summary-row">
                <span>Incoterm:</span>
                <span><strong>${quote.incoterm} (${quote.port})</strong></span>
            </div>
            <div class="print-summary-row">
                <span>Freight Mode:</span>
                <span><strong>${quote.freightMode}</strong></span>
            </div>
            <div class="print-summary-row total">
                <span>Grand Total (${quote.currency}):</span>
                <span>${curSymbol}${grandTotalTarget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
        </div>

        <div class="print-terms">
            <h3>Standard Payment & Delivery Terms</h3>
            <p>1. <strong>Payment Terms:</strong> ${quote.paymentTerms}</p>
            <p>2. <strong>Delivery Timeline:</strong> Approximately 45-60 days from advance deposit receipt.</p>
            <p>3. <strong>FOB Charges:</strong> Includes all export packing, inland trucking, custom clearance, and forwarder handling fees at Mumbai port.</p>
            <p>4. <strong>Insurance:</strong> Marine Insurance coverage included under Institute Cargo Clauses (A) if CIF is specified.</p>
        </div>

        <div class="print-signature-box">
            <div class="signature-line">
                Prepared By: Blueblood Exports
            </div>
            <div class="signature-line">
                Accepted By: Buyer/Representative
            </div>
        </div>
    `;
}

function printCurrentQuotation() {
    const country = document.getElementById('quoteCountry').value;
    const port = document.getElementById('quotePort').value;
    const currency = document.getElementById('quoteCurrency').value;
    const incoterm = document.getElementById('quoteIncoterm').value;
    const freightMode = document.getElementById('quoteFreightMode').value;
    const paymentTerms = document.getElementById('quotePaymentTerms').value;
    const validity = parseInt(document.getElementById('quoteValidity').value);

    let grandTotalUSD = 0;
    const calculatedItems = state.currentQuoteItems.map(item => {
        const calcs = calculateCIF(item.id, item.quantity, country, port, freightMode);
        grandTotalUSD += incoterm === 'CIF' ? calcs.totalCifUSD : calcs.totalFobUSD;
        return {
            ...item,
            unitFobUSD: calcs.unitFobUSD,
            unitCifUSD: calcs.unitCifUSD,
            totalUSD: incoterm === 'CIF' ? calcs.totalCifUSD : calcs.totalFobUSD
        };
    });

    const tempQuote = {
        id: 'BBE-QT-TEMP',
        buyerName: document.getElementById('quoteBuyerName').value || 'Buyer Specimen',
        companyName: document.getElementById('quoteCompanyName').value || 'Company Specimen',
        country, port, currency, incoterm, freightMode, paymentTerms, validity,
        items: calculatedItems,
        grandTotalUSD,
        createdAt: new Date().toISOString()
    };

    const container = document.getElementById('printQuotationLayout');
    container.innerHTML = buildPDFHtml(tempQuote);
    window.print();
}

window.printSavedQuotation = (quoteId) => {
    const quote = state.quotations.find(q => q.id === quoteId);
    if (!quote) return;

    const container = document.getElementById('printQuotationLayout');
    container.innerHTML = buildPDFHtml(quote);
    window.print();
};

// --- PRODUCT COST MASTER EDITING ---
function renderProductMaster() {
    const tbody = document.getElementById('productMasterTableBody');
    if (!tbody) return;

    tbody.innerHTML = state.products.map(p => {
        const costs = getProductCosts(p.id);
        const img = p.images && p.images[0] ? p.images[0] : '';
        return `
            <tr>
                <td><img src="${img}" class="product-cost-img" alt=""></td>
                <td><strong>${p.id}</strong><br><span style="font-size:0.8rem; color:var(--text-muted);">${p.name}</span></td>
                <td>
                    <input type="number" id="proc-${p.id}" value="${costs.procCost}" style="width:100px; padding:4px;">
                </td>
                <td>
                    <input type="text" id="uom-${p.id}" value="${costs.uom}" style="width:60px; padding:4px;">
                </td>
                <td>
                    <input type="text" id="dim-${p.id}" value="${costs.dimensions}" style="width:120px; padding:4px;">
                </td>
                <td>
                    <input type="number" id="wt-${p.id}" value="${costs.weight}" style="width:70px; padding:4px;">
                </td>
                <td>
                    <input type="number" id="pkg-${p.id}" value="${costs.pkgCost}" style="width:80px; padding:4px;">
                </td>
                <td>
                    <input type="number" id="moq-${p.id}" value="${costs.moq}" style="width:60px; padding:4px;">
                </td>
                <td>
                    <button class="action-btn primary small" onclick="saveCustomProductCost('${p.id}')">Save</button>
                </td>
            </tr>
        `;
    }).join('');
}

window.saveCustomProductCost = (productId) => {
    const procCost = parseFloat(document.getElementById(`proc-${productId}`).value);
    const uom = document.getElementById(`uom-${productId}`).value.trim();
    const dimensions = document.getElementById(`dim-${productId}`).value.trim();
    const weight = parseFloat(document.getElementById(`wt-${productId}`).value);
    const pkgCost = parseFloat(document.getElementById(`pkg-${productId}`).value);
    const moq = parseInt(document.getElementById(`moq-${productId}`).value);

    state.customCosts[productId] = { procCost, uom, dimensions, weight, pkgCost, moq };
    localStorage.setItem('bb_custom_costs', JSON.stringify(state.customCosts));
    alert('Product pricing attributes saved successfully!');
    populateProductSelectors();
    updateQuoteCalculations();
};

document.getElementById('resetProductsBtn')?.addEventListener('click', () => {
    if (!confirm('Are you sure you want to reset all customized costs to default?')) return;
    state.customCosts = {};
    localStorage.removeItem('bb_custom_costs');
    renderProductMaster();
    populateProductSelectors();
    updateQuoteCalculations();
});

// --- COSTING DEFAULTS & FREIGHT ---
function setupCostingForms() {
    const feesForm = document.getElementById('costingFeesForm');
    
    // Load values into form
    document.getElementById('feeInlandTransport').value = state.costingFees.inlandTransport;
    document.getElementById('feePortHandling').value = state.costingFees.portHandling;
    document.getElementById('feeDocumentation').value = state.costingFees.documentation;
    document.getElementById('feeClearance').value = state.costingFees.clearance;
    document.getElementById('feeMisc').value = state.costingFees.misc;
    document.getElementById('feeProfitMargin').value = state.costingFees.profitMargin;
    document.getElementById('feeMarkup').value = state.costingFees.markup;

    document.getElementById('insurancePercent').value = state.insurance.percent;
    document.getElementById('insuranceMinAmount').value = state.insurance.minAmount;

    feesForm.addEventListener('submit', (e) => {
        e.preventDefault();
        state.costingFees = {
            inlandTransport: parseFloat(document.getElementById('feeInlandTransport').value),
            portHandling: parseFloat(document.getElementById('feePortHandling').value),
            documentation: parseFloat(document.getElementById('feeDocumentation').value),
            clearance: parseFloat(document.getElementById('feeClearance').value),
            misc: parseFloat(document.getElementById('feeMisc').value),
            profitMargin: parseFloat(document.getElementById('feeProfitMargin').value),
            markup: parseFloat(document.getElementById('feeMarkup').value)
        };
        
        state.insurance = {
            percent: parseFloat(document.getElementById('insurancePercent').value),
            minAmount: parseFloat(document.getElementById('insuranceMinAmount').value)
        };

        localStorage.setItem('bb_costing_fees', JSON.stringify(state.costingFees));
        localStorage.setItem('bb_insurance', JSON.stringify(state.insurance));
        
        alert('Costing defaults saved!');
        updateQuoteCalculations();
    });
}

function renderFreightMatrix() {
    const tbody = document.getElementById('freightMatrixBody');
    if (!tbody) return;

    tbody.innerHTML = state.freightMatrix.map((f, idx) => `
        <tr>
            <td><strong>${f.country}</strong></td>
            <td>${f.port}</td>
            <td>
                <input type="number" value="${f.LCL}" onchange="updateFreightRate(${idx}, 'LCL', this.value)" style="width:65px; padding:2px;">
            </td>
            <td>
                <input type="number" value="${f.F20}" onchange="updateFreightRate(${idx}, 'F20', this.value)" style="width:65px; padding:2px;">
            </td>
            <td>
                <input type="number" value="${f.F40}" onchange="updateFreightRate(${idx}, 'F40', this.value)" style="width:65px; padding:2px;">
            </td>
            <td>
                <input type="number" value="${f.F40HQ}" onchange="updateFreightRate(${idx}, 'F40HQ', this.value)" style="width:65px; padding:2px;">
            </td>
            <td>
                <input type="number" value="${f.Air}" onchange="updateFreightRate(${idx}, 'Air', this.value)" style="width:55px; padding:2px;">
            </td>
        </tr>
    `).join('');
}

window.updateFreightRate = (idx, field, value) => {
    state.freightMatrix[idx][field] = parseFloat(value);
    localStorage.setItem('bb_freight_matrix', JSON.stringify(state.freightMatrix));
    updateQuoteCalculations();
};

// --- CURRENCY EXCHANGE ---
function setupCurrencyForm() {
    const form = document.getElementById('currencyExchangeForm');
    if (!form) return;

    document.getElementById('rateINR').value = state.exchangeRates.INR;
    document.getElementById('rateEUR').value = state.exchangeRates.EUR;
    document.getElementById('rateGBP').value = state.exchangeRates.GBP;
    document.getElementById('rateAED').value = state.exchangeRates.AED;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        state.exchangeRates.INR = parseFloat(document.getElementById('rateINR').value);
        state.exchangeRates.EUR = parseFloat(document.getElementById('rateEUR').value);
        state.exchangeRates.GBP = parseFloat(document.getElementById('rateGBP').value);
        state.exchangeRates.AED = parseFloat(document.getElementById('rateAED').value);

        localStorage.setItem('bb_exchange_rates', JSON.stringify(state.exchangeRates));
        alert('Exchange rates updated successfully!');
        updateQuoteCalculations();
    });
}

// --- DASHBOARD OVERVIEW COUNTS ---
function renderDashboard() {
    document.getElementById('kpiTotalQuotes').textContent = state.quotations.length;
    
    let totalFob = 0;
    let totalCif = 0;
    
    const count = state.quotations.length;

    // Calculate averages based on FOB and CIF
    state.quotations.forEach(q => {
        totalFob += q.grandTotalUSD; // If quote is CIF, estimate FOB value
        // Simply use quote grand totals to build average indicators
        if (q.incoterm === 'CIF') {
            totalCif += q.grandTotalUSD;
            totalFob += q.grandTotalUSD * 0.85; // estimate FOB as 85% of CIF
        } else {
            totalFob += q.grandTotalUSD;
            totalCif += q.grandTotalUSD * 1.15; // estimate CIF as 115% of FOB
        }
    });

    const avgFob = count > 0 ? (totalFob / count) : 0;
    const avgCif = count > 0 ? (totalCif / count) : 0;

    document.getElementById('kpiAvgFob').textContent = '$' + avgFob.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('kpiAvgCif').textContent = '$' + avgCif.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Top product calculation
    const skuCounts = {};
    state.quotations.forEach(q => {
        q.items.forEach(item => {
            skuCounts[item.id] = (skuCounts[item.id] || 0) + item.quantity;
        });
    });

    let topSku = '-';
    let maxQty = 0;
    for (const sku in skuCounts) {
        if (skuCounts[sku] > maxQty) {
            maxQty = skuCounts[sku];
            topSku = sku;
        }
    }
    document.getElementById('kpiTopProduct').textContent = topSku;

    // Recent Quotes Table
    const tbody = document.getElementById('dashboardRecentTable');
    const recent = state.quotations.slice(0, 5);

    if (recent.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No quotations created yet.</td></tr>`;
        return;
    }

    const currencySymbolMap = { USD: '$', INR: '₹', EUR: '€', GBP: '£', AED: 'Dh' };

    tbody.innerHTML = recent.map(q => {
        const curSymbol = currencySymbolMap[q.currency] || '$';
        const convertedTotal = q.grandTotalUSD * state.exchangeRates[q.currency];
        return `
            <tr>
                <td>${new Date(q.createdAt).toLocaleDateString()}</td>
                <td><strong>${q.id}</strong></td>
                <td>${q.buyerName} (${q.companyName})</td>
                <td><span class="badge-status processed">${q.incoterm}</span></td>
                <td><strong>${curSymbol}${convertedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                <td>
                    <button class="action-btn small" onclick="loadQuoteForEdit('${q.id}')">View</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Search quotation listener
document.getElementById('searchQuoteInput')?.addEventListener('input', renderQuoteHistory);
document.getElementById('clearSearchBtn')?.addEventListener('click', () => {
    const input = document.getElementById('searchQuoteInput');
    if (input) input.value = '';
    renderQuoteHistory();
});

// Run Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
