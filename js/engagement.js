/**
 * Engagement JS - Handles Exit Intent and other micro-interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    initExitIntent();
});

function initExitIntent() {
    // Prevent showing if already shown in this session or if dismissed for 7 days
    if (localStorage.getItem('exitIntentDismissed')) {
        const dismissedAt = parseInt(localStorage.getItem('exitIntentDismissed'));
        const now = Date.now();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (now - dismissedAt < sevenDays) return;
    }

    if (sessionStorage.getItem('exitIntentShown')) return;

    // Detect mouse leave from top of the window
    document.addEventListener('mouseleave', (e) => {
        if (e.clientY <= 0) {
            showExitIntentModal();
        }
    });
}

function showExitIntentModal() {
    if (sessionStorage.getItem('exitIntentShown')) return;

    // Create Modal if it doesn't exist
    let modal = document.getElementById('exit-intent-modal');
    if (!modal) {
        modal = createExitIntentModal();
        document.body.appendChild(modal);
    }

    modal.classList.add('active');
    sessionStorage.setItem('exitIntentShown', 'true');

    // Add event listeners for closing
    modal.querySelector('.modal-close').onclick = () => closeModal();
    modal.querySelector('.modal-overlay').onclick = () => closeModal();
}

function createExitIntentModal() {
    const modal = document.createElement('div');
    modal.id = 'exit-intent-modal';
    modal.className = 'modal-container';

    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content exit-intent-content">
            <button class="modal-close" aria-label="Close">&times;</button>
            <div class="exit-intent-body">
                <div class="exit-intent-image">
                    <img src="https://images.unsplash.com/photo-1590483734724-38817540c89e?auto=format&fit=crop&q=80&w=400" alt="Artisan Craft">
                </div>
                <div class="exit-intent-text">
                    <h2>Wait! Don't Miss Out</h2>
                    <p>Join our <strong>Collectors Circle</strong> and get 10% off your first artisan discovery.</p>
                    <form id="exit-intent-form" class="newsletter-form">
                        <input type="email" placeholder="Enter your email" required>
                        <button type="submit" class="btn btn-primary">Get My Discount</button>
                    </form>
                    <p class="small-note">We only send stories, no spam.</p>
                </div>
            </div>
        </div>
    `;

    const form = modal.querySelector('#exit-intent-form');
    form.onsubmit = (e) => {
        e.preventDefault();
        const email = form.querySelector('input').value;
        handleSubscription(email, form);
    };

    return modal;
}

function handleSubscription(email, form) {
    // Simulate API call
    const button = form.querySelector('button');
    const originalText = button.textContent;
    button.textContent = 'Sending...';
    button.disabled = true;

    setTimeout(() => {
        form.innerHTML = `<p class="success-message">Welcome to the circle! Check your email for the code <strong>WELCOME10</strong>.</p>`;
        localStorage.setItem('exitIntentDismissed', Date.now().toString());
    }, 1500);
}

function closeModal() {
    const modal = document.getElementById('exit-intent-modal');
    if (modal) {
        modal.classList.remove('active');
        // Dismiss for 7 days if they close it
        localStorage.setItem('exitIntentDismissed', Date.now().toString());
    }
}
