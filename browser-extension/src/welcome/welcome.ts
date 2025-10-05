// Welcome page script

console.log("Canner Welcome Page Loaded");

// Close button functionality
const closeBtn = document.getElementById("closeBtn");
if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    window.close();
  });
}

// Track page view
chrome.storage.local.set({
  welcomePageViewed: true,
  welcomePageViewedAt: new Date().toISOString(),
});

// Add smooth scroll for internal links
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

// Analytics (optional - can be removed if not needed)
console.log("Welcome page analytics:", {
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  language: navigator.language,
});
