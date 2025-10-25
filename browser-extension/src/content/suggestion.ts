// SuggestionManager class for auto-suggestions
export class SuggestionManager {
  private ghostElement: HTMLElement | null = null;
  private currentSuggestion: any = null;
  private isComposing = false;
  private suppressedUntil = 0;
  private element: HTMLElement;
  private inputHandler: (e: Event) => void;
  private keydownHandler: (e: KeyboardEvent) => void;
  private blurHandler: () => void;
  private compositionStartHandler: () => void;
  private compositionEndHandler: () => void;

  constructor(element: HTMLElement) {
    this.element = element;
    this.inputHandler = this.handleInput.bind(this);
    this.keydownHandler = this.handleKeydown.bind(this);
    this.blurHandler = this.clearSuggestion.bind(this);
    this.compositionStartHandler = () => { this.isComposing = true; };
    this.compositionEndHandler = () => { this.isComposing = false; };

    this.element.addEventListener("input", this.inputHandler);
    this.element.addEventListener("keydown", this.keydownHandler);
    this.element.addEventListener("blur", this.blurHandler);
    this.element.addEventListener("compositionstart", this.compositionStartHandler);
    this.element.addEventListener("compositionend", this.compositionEndHandler);
  }

  destroy() {
    this.clearSuggestion();
    this.element.removeEventListener("input", this.inputHandler);
    this.element.removeEventListener("keydown", this.keydownHandler);
    this.element.removeEventListener("blur", this.blurHandler);
    this.element.removeEventListener("compositionstart", this.compositionStartHandler);
    this.element.removeEventListener("compositionend", this.compositionEndHandler);
  }

  async handleInput(e: Event) {
    if (Date.now() < this.suppressedUntil) {
      this.clearSuggestion();
      return;
    }

    if (this.isComposing) {
      return;
    }

    const currentText = this.getCurrentText();
    
    if (!currentText || currentText.length < 2) {
      this.clearSuggestion();
      return;
    }

    if (this.element.getAttribute("contenteditable") === "true") {
      const textContent = this.element.textContent?.trim() || "";
      if (textContent.length === 0) {
        this.clearSuggestion();
        return;
      }
    }

    try {
      const suggestions = await this.fetchSuggestions(currentText);
      
      if (suggestions.length === 0) {
        this.clearSuggestion();
        return;
      }

      const matchingSuggestions = suggestions.filter((suggestion: any) => {
        const content = suggestion.content || suggestion.title || "";
        return content.toLowerCase().startsWith(currentText.toLowerCase());
      });

      if (matchingSuggestions.length === 0) {
        this.clearSuggestion();
        return;
      }

      const bestMatch = matchingSuggestions[0];
      this.showSuggestion(bestMatch, currentText);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      this.clearSuggestion();
    }
  }

  handleKeydown(e: KeyboardEvent) {
    if (e.key === "Tab" && this.currentSuggestion) {
      e.preventDefault();
      e.stopPropagation();
      this.acceptSuggestion();
    } else if (e.key === "Escape" && this.currentSuggestion) {
      e.preventDefault();
      e.stopPropagation();
      this.clearSuggestion();
    } else if (e.key === "Backspace" || e.key === "Delete") {
      setTimeout(() => {
        const currentText = this.getCurrentText();
        if (!currentText || currentText.length < 2) {
          this.clearSuggestion();
        }
      }, 10);
    }
  }

  getCurrentText(): string {
    if (this.element.getAttribute("contenteditable") === "true") {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        return "";
      }

      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(this.element);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      
      const textContent = preCaretRange.cloneContents().textContent || "";
      
      // Get last 2-3 words for sequence matching
      const words = textContent.trim().split(/\s+/);
      const recentWords = words.slice(-2).join(" "); // Get last 2 words
      
      return recentWords || "";
    } else if (this.element.tagName === "TEXTAREA" || this.element.tagName === "INPUT") {
      const input = this.element as HTMLInputElement | HTMLTextAreaElement;
      const cursorPos = input.selectionStart || 0;
      const textBeforeCursor = input.value.substring(0, cursorPos);
      
      // Get last 2-3 words
      const words = textBeforeCursor.trim().split(/\s+/);
      const recentWords = words.slice(-2).join(" ");
      
      return recentWords || "";
    }

    return "";
  }

  async fetchSuggestions(currentText: string): Promise<any[]> {
    return new Promise((resolve) => {
      chrome.storage.local.get(["responses"], (result) => {
        const responses = result.responses || [];
        const query = currentText.toLowerCase();
        
        const matchingResponses = responses.filter((response: any) => {
          const content = (response.content || response.title || "").toLowerCase();
          
          // Check if the saved message contains the current sequence
          return content.includes(query) && content.length > query.length;
        });
        
        resolve(matchingResponses);
      });
    });
  }

  showSuggestion(suggestion: any, currentText: string) {
    this.currentSuggestion = suggestion;
    const fullText = suggestion.content || suggestion.title || "";
    
    const isLinkedIn = window.location.hostname.includes("linkedin");
    const isTwitter = window.location.hostname.includes("twitter") || window.location.hostname.includes("x.com");
    
    if (isTwitter) {
      let remainingText = fullText;
      if (fullText.toLowerCase().startsWith(currentText.toLowerCase())) {
        remainingText = fullText.substring(currentText.length);
      }
      
      const maxLength = 70;
      if (remainingText.length > maxLength) {
        remainingText = remainingText.substring(0, maxLength - 3) + "...";
      }
      
      this.createGhostElement(remainingText, currentText, fullText, "twitter");
    } else {
      this.createGhostElement(fullText, currentText, fullText, "linkedin");
    }
  }

  createGhostElement(text: string, currentText: string, fullText: string, platform: string) {
    this.clearGhostElement();

    if (this.element.getAttribute("contenteditable") === "true") {
      const ghost = document.createElement("div");
      ghost.className = "canner-ghost-suggestion";

      if (platform === "linkedin") {
        ghost.textContent = fullText;
        ghost.style.cssText = `
          position: fixed;
          color: rgba(102, 112, 122, 0.3);
          pointer-events: none;
          z-index: 9999;
          white-space: pre-wrap;
          overflow-wrap: break-word;
          word-wrap: break-word;
          font-family: inherit;
          font-size: inherit;
          font-weight: inherit;
          line-height: inherit;
          max-width: calc(100% - 40px);
          display: block;
        `;
        this.positionLinkedInOverlay(ghost);
      } else {
        ghost.textContent = text;
        ghost.style.cssText = `
          position: fixed;
          color: rgba(102, 112, 122, 0.7);
          pointer-events: none;
          z-index: 10000;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-family: inherit;
          font-size: inherit;
          font-weight: inherit;
          line-height: inherit;
          max-width: 300px;
          display: inline-block;
        `;
        this.positionTwitterOverlay(ghost);
      }

      this.ghostElement = ghost;
    }
  }

  positionLinkedInOverlay(ghost: HTMLElement) {
    const rect = this.element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(this.element);
    
    ghost.style.fontFamily = computedStyle.fontFamily;
    ghost.style.fontSize = computedStyle.fontSize;
    ghost.style.fontWeight = computedStyle.fontWeight;
    ghost.style.lineHeight = computedStyle.lineHeight;
    
    ghost.style.left = `${rect.left + 10}px`;
    ghost.style.top = `${rect.top + 10}px`;
    ghost.style.width = `${rect.width - 20}px`;
    
    document.body.appendChild(ghost);
  }

  positionTwitterOverlay(ghost: HTMLElement) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const elementRect = this.element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(this.element);
    
    ghost.style.fontFamily = computedStyle.fontFamily;
    ghost.style.fontSize = computedStyle.fontSize;
    ghost.style.fontWeight = computedStyle.fontWeight;
    ghost.style.lineHeight = computedStyle.lineHeight;
    
    let left = rect.right + 1;
    let top = rect.top;
    
    const fontSize = parseFloat(computedStyle.fontSize) || 16;
    const lineHeightAdjustment = 0.85 * fontSize;
    top = rect.top + (rect.height - fontSize) / 2 + lineHeightAdjustment - fontSize;
    
    if (left + ghost.offsetWidth > elementRect.right - 5) {
      const availableSpace = elementRect.right - left - 10;
      if (availableSpace > 100) {
        const maxWidth = Math.min(250, availableSpace);
        ghost.style.maxWidth = `${maxWidth}px`;
      } else if (availableSpace > 50) {
        ghost.style.maxWidth = `${availableSpace}px`;
      } else {
        ghost.remove();
        return;
      }
    }
    
    ghost.style.left = `${left}px`;
    ghost.style.top = `${top}px`;
    
    document.body.appendChild(ghost);
  }

  clearGhostElement() {
    if (this.ghostElement) {
      this.ghostElement.remove();
      this.ghostElement = null;
    }
  }

  clearSuggestion() {
    this.currentSuggestion = null;
    this.clearGhostElement();
  }

  acceptSuggestion() {
    if (!this.currentSuggestion) {
      return;
    }

    this.suppressedUntil = Date.now() + 500;

    const fullText = this.currentSuggestion.content || this.currentSuggestion.title || "";
    const currentText = this.getCurrentText();

    if (this.element.getAttribute("contenteditable") === "true") {
      this.replaceInContentEditable(fullText, currentText);
    } else if (this.element.tagName === "TEXTAREA" || this.element.tagName === "INPUT") {
      this.replaceInInput(fullText, currentText);
    }

    this.clearSuggestion();
  }

  replaceInContentEditable(fullText: string, currentText: string) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    
    // Replace all content with the suggested text
    range.selectNodeContents(this.element);
    range.deleteContents();
    
    const textNode = document.createTextNode(fullText);
    range.insertNode(textNode);
    
    // Move cursor to end
    const newRange = document.createRange();
    newRange.setStartAfter(textNode);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
    
    this.element.dispatchEvent(new InputEvent("input", { bubbles: true }));
    this.element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  replaceInInput(fullText: string, currentText: string) {
    const input = this.element as HTMLInputElement | HTMLTextAreaElement;
    
    // Replace all content with the suggested text
    input.value = fullText;
    
    // Move cursor to end
    input.setSelectionRange(fullText.length, fullText.length);
    
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }
}
