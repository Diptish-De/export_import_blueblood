/**
 * Contact JS - Handles form submissions
 */

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }

    const newsletterForms = document.querySelectorAll('.newsletter-form');
    newsletterForms.forEach(form => {
        form.addEventListener('submit', handleNewsletterSubmit);
    });

    initWhatsAppLeadCapture();
});

/* --- WHATSAPP LEAD CAPTURE MODAL --- */
function initWhatsAppLeadCapture() {
    const waBtns = document.querySelectorAll('.whatsapp-float');
    if (waBtns.length === 0) return;

    // Check if user already provided info
    const hasProvidedInfo = localStorage.getItem('blueblood_wa_lead');

    // Create Modal HTML
    const modalHTML = `
        <div class="cart-overlay" id="waOverlay" style="z-index: 100000; position: fixed; inset: 0; background: rgba(0,0,0,0.5); opacity: 0; pointer-events: none; transition: 0.3s ease;"></div>
        <div class="cart-drawer" id="waDrawer" style="z-index: 100001; position: fixed; right: -400px; top: 0; height: 100vh; width: 100%; max-width: 400px; background: var(--color-white); transition: 0.4s ease; display: flex; flex-direction: column; box-shadow: -4px 0 15px rgba(0,0,0,0.1);">
            <div class="cart-drawer-header" style="padding: 1.5rem; border-bottom: 1px solid var(--color-gray-200); display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 40px; height: 40px; background: #25D366; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </div>
                    <div>
                        <h3 style="margin: 0; font-family: 'Cinzel', serif; color: var(--color-maroon); font-size: 1.2rem;">Chat with Us</h3>
                        <p style="margin: 0; font-size: 0.8rem; color: #25D366; font-weight: 500;">Typically replies in minutes</p>
                    </div>
                </div>
                <button id="closeWa" aria-label="Close" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--color-gray-500); padding: 0.5rem;">&times;</button>
            </div>
            <div style="padding: 2rem 1.5rem; flex: 1; overflow-y: auto;">
                <p style="margin-bottom: 1.5rem; color: var(--color-gray-600); line-height: 1.6;">Please share your contact details to connect directly with our export experts on WhatsApp.</p>
                <form id="waLeadForm">
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.9rem;">Full Name *</label>
                        <input type="text" id="waName" required class="form-control" placeholder="John Doe" style="width: 100%; padding: 0.75rem; border: 1px solid var(--color-gray-300); border-radius: var(--radius-sm);">
                    </div>
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.9rem;">Email Address *</label>
                        <input type="email" id="waEmail" required class="form-control" placeholder="john@company.com" style="width: 100%; padding: 0.75rem; border: 1px solid var(--color-gray-300); border-radius: var(--radius-sm);">
                    </div>
                    <div class="form-group" style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.9rem;">WhatsApp Number *</label>
                        <input type="tel" id="waPhone" required class="form-control" placeholder="+1 234 567 8900" style="width: 100%; padding: 0.75rem; border: 1px solid var(--color-gray-300); border-radius: var(--radius-sm);">
                    </div>
                    <button type="submit" class="btn btn-whatsapp" style="width: 100%; padding: 1rem; display: flex; justify-content: center; align-items: center; gap: 0.5rem; font-size: 1rem;">
                       Start WhatsApp Chat
                    </button>
                </form>
                <p style="font-size: 0.75rem; color: var(--color-gray-500); margin-top: 1rem; text-align: center;">We respect your privacy. By proceeding, you agree to our Terms.</p>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const overlay = document.getElementById('waOverlay');
    const drawer = document.getElementById('waDrawer');
    const closeBtn = document.getElementById('closeWa');
    const form = document.getElementById('waLeadForm');
    let currentWaUrl = '';

    function openModal(url) {
        currentWaUrl = url;
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
        drawer.style.right = '0';
        drawer.classList.add('is-open');
    }

    function closeModal() {
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        drawer.style.right = '-400px';
        drawer.classList.remove('is-open');
    }

    waBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!hasProvidedInfo) {
                e.preventDefault();
                // Prevent event bubbling so document clicks don't immediately fire
                e.stopPropagation();

                const url = btn.getAttribute('href');
                if (drawer.classList.contains('is-open')) {
                    closeModal();
                } else {
                    openModal(url);
                }
            }
            // If they have already provided info, let the default ahref target="_blank" handle it
        });
    });

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    // Also listen on document for safety
    document.addEventListener('click', (e) => {
        if (drawer.classList.contains('is-open')) {
            // If the click is not inside the drawer and not on the overlay (handled above)
            let isFloatClick = false;
            waBtns.forEach(btn => { if (btn.contains(e.target)) isFloatClick = true; });

            if (!drawer.contains(e.target) && e.target !== overlay && !isFloatClick) {
                closeModal();
            }
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // In a real app, you would send this to your API
        const leadData = {
            name: document.getElementById('waName').value,
            email: document.getElementById('waEmail').value,
            phone: document.getElementById('waPhone').value,
            timestamp: new Date().toISOString()
        };

        console.log("Lead Captured before WhatsApp:", leadData);

        // Save locally so we don't ask again this session
        localStorage.setItem('blueblood_wa_lead', 'true');

        // Enhance the WhatsApp text with their name
        let finalUrl = currentWaUrl;
        if (finalUrl.includes('?text=')) {
            // Decode the existing text, append the introduction, re-encode
            let textMatch = finalUrl.match(/\?text=(.*)/);
            if (textMatch) {
                let decoded = decodeURIComponent(textMatch[1]);
                decoded = `Hello, I'm ${leadData.name}. ` + decoded;
                finalUrl = finalUrl.replace(/\?text=.*/, `?text=${encodeURIComponent(decoded)}`);
            }
        } else {
            // If no text parameter exists, append one
            finalUrl += (finalUrl.includes('?') ? '&' : '?') + `text=${encodeURIComponent(`Hello, I'm ${leadData.name}. I'm interested in your artefacts.`)}`;
        }

        closeModal();

        // Open the WhatsApp link
        window.open(finalUrl, '_blank');

        // Remove preventDefault on future clicks the heavy handed way: clone and replace node
        // Actually, reloading the hasProvidedInfo check logic is better:
        waBtns.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            // new btn has no listeners, will just act like a normal link
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.setAttribute('href', finalUrl); // update href on the dom element
        });
    });
}


async function handleContactSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const status = document.getElementById('form-status');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Initial UI state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    status.style.display = 'block';
    status.className = 'status-loading';
    status.textContent = 'Submitting your message...';

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
        // Use Formspree or similar (using a placeholder endpoint)
        // For development, we'll simulate a 1s delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock success
        form.reset();
        status.className = 'success-message';
        status.style.padding = 'var(--space-4)';
        status.style.background = 'var(--color-cream)';
        status.style.color = 'var(--color-terracotta)';
        status.innerHTML = `<strong>Success!</strong> Your message has been sent. We'll get back to you soon.`;

        submitBtn.textContent = 'Message Sent!';
        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';
            status.style.display = 'none';
        }, 5000);

    } catch (error) {
        status.className = 'error-message';
        status.textContent = 'Oops! There was a problem submitting your form. Please try again.';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
    }
}

async function handleNewsletterSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const emailInput = form.querySelector('input[type="email"]');
    const submitBtn = form.querySelector('button');

    if (!emailInput || !emailInput.value) return;

    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loader-tiny"></span>';

    try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Show success in place of form or via toast
        if (window.showToast) {
            window.showToast('Successfully subscribed!');
        } else {
            alert('Thank you for subscribing!');
        }

        emailInput.value = '';
        submitBtn.innerHTML = 'Subscribed!';

        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }, 3000);

    } catch (error) {
        alert('Subscription failed. Please try again.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}
