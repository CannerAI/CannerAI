// Canner content script — injects helper UI into social sites
console.log("Canner: Content script loaded");

const CONFIG = {
  API_URL: "http://localhost:5000",
  // BUTTON_ICON and BUTTON_COLOR are now handled by CSS and specific elements
};

// helps to track the last focused input
let lastFocusedInput: HTMLElement | null = null;

// Function to check if an element is a valid input for suggestions
function isValidInputElement(element: HTMLElement): boolean {
  const tagName = element.tagName;
  const isEditable = element.getAttribute('contenteditable') === 'true';

  // Check for common input fields or contenteditable elements
  return (
    (tagName === 'INPUT' && ((element as HTMLInputElement).type === 'text' || (element as HTMLInputElement).type === 'search' || (element as HTMLInputElement).type === 'email' || (element as HTMLInputElement).type === 'url')) ||
    tagName === 'TEXTAREA' ||
    isEditable
  );
}

// this function track focused inputs
function trackFocusedInputs() {
  document.addEventListener('focusin', (e) => {
    const target = e.target as HTMLElement;
    if (isValidInputElement(target)) {
      lastFocusedInput = target;
      console.log("Canner: Tracked focused input", target);
    }
  }, true);
}

// Track injected elements to avoid duplicates
const injectedElements = new Set<string>();
const suggestionManagers: Record<string, InlineSuggestionManager> = {} as any;

// NOTE: The rest of the InlineSuggestionManager class from the original code would be here.
// As it's not relevant to the plan's implementation, it's omitted for brevity but should be retained.


// --- Start of New Floating Button Implementation ---

/**
 * Creates and manages the floating Quick Response button.
 * The button starts as a minimized dot and expands on hover.
 */
function createFloatingQRButton() {
  // Create the root container element
  const qrContainer = document.createElement('div');
  qrContainer.id = 'canner-qr-container';

  // Create the minimized 'dot' element
  const qrDot = document.createElement('div');
  qrDot.id = 'canner-qr-dot';

  // Create the expanded 'pencil' button element
  const qrButton = document.createElement('button');
  qrButton.id = 'canner-qr-button';
  // Using an SVG for a clean, scalable icon
  qrButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </svg>
  `;

  // Append children to the container
  qrContainer.appendChild(qrDot);
  qrContainer.appendChild(qrButton);

  // Add mouseover/mouseout listeners to the container to toggle expanded state
  qrContainer.addEventListener('mouseover', () => {
    qrContainer.classList.add('qr-button-expanded');
  });

  qrContainer.addEventListener('mouseout', () => {
    qrContainer.classList.remove('qr-button-expanded');
  });

  // Add click listener to the container to open the modal
  qrContainer.addEventListener('click', () => {
    console.log('Canner: Floating button clicked. Opening modal...');
    openQuickResponseModal();
  });

  // Append the new container to the document body
  document.body.appendChild(qrContainer);
  console.log("Canner: Floating QR button injected.");
}

/**
 * Opens the Quick Response modal.
 * This function likely sends a message to the background script.
 */
function openQuickResponseModal() {
  // This is a common pattern for opening extension UI from a content script
  chrome.runtime.sendMessage({ action: "open_qr_modal" });
  console.log("Canner: Sent message to open QR modal.");
}

// --- End of New Floating Button Implementation ---


// --- Script Initialization ---

function main() {
  trackFocusedInputs();
  createFloatingQRButton();
  // Other initialization logic for features like InlineSuggestionManager can go here
}

// Ensure the script runs after the DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}