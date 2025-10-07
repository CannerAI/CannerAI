// Professional Welcome Page Script

console.log("Canner Welcome Page Loaded - Professional Edition");

// Close button functionality
const closeBtn = document.getElementById("closeBtn");
if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    window.close();
  });
}

// Track page view with enhanced analytics
chrome.storage.local.set({
  welcomePageViewed: true,
  welcomePageViewedAt: new Date().toISOString(),
  welcomePageVersion: '2.0-professional',
  userAgent: navigator.userAgent,
  language: navigator.language,
  platform: navigator.platform
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e: Event) => {
    e.preventDefault();
    const href = (anchor as HTMLAnchorElement).getAttribute("href");
    if (href) {
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  });
});

// Add intersection observer for scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-in');
    }
  });
}, observerOptions);

// Observe feature cards and steps
document.querySelectorAll('.feature-card, .step').forEach(card => {
  observer.observe(card);
});

// Track user interactions for analytics
const trackInteraction = (action: string, element: string) => {
  console.log(`User interaction: ${action} on ${element}`);
  // In production, this would send to analytics service
};

// Add click tracking to important elements
document.querySelectorAll('.btn, .nav-link').forEach(element => {
  element.addEventListener('click', () => {
    const action = element.classList.contains('btn') ? 'click_button' : 'click_link';
    const elementName = element.textContent?.trim() || 'unknown';
    trackInteraction(action, elementName);
  });
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // ESC to close
  if (e.key === 'Escape') {
    window.close();
  }
});

// Performance monitoring
const loadTime = performance.now();
console.log(`Page loaded in ${loadTime.toFixed(2)}ms`);

// Service worker ready check (if applicable)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(() => {
    console.log('Service worker ready');
  });
}
