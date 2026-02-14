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
});

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
