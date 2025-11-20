console.log("✅ Prompt Enhancer content script loaded (logo + text underline + floating panel)");

// ---------- STATE ----------
let inputEl = null;              // real input (contenteditable div or textarea)
let debounceTimer = null;
let lastEnhancedPrompt = null;

let iconEl = null;               // logo icon (floating)
let panelEl = null;              // panel that shows suggested prompt (floating)
let isPanelVisible = false;

// ---------- LOG HELPER ----------
function log(...args) {
  console.log("[PromptEnhancer]", ...args);
}

// ---------- UTILS ----------
function getCurrentText() {
  if (!inputEl) return "";

  const tag = inputEl.tagName.toLowerCase();

  if (tag === "textarea") {
    return inputEl.value;
  }

  // For contenteditable divs
  return inputEl.innerText || inputEl.textContent || "";
}

function setCurrentText(newText) {
  if (!inputEl) return;

  const tag = inputEl.tagName.toLowerCase();

  if (tag === "textarea") {
    inputEl.value = newText;
  } else {
    // contenteditable div
    inputEl.innerText = newText;
  }

  // Let ChatGPT know the content changed
  const evt = new Event("input", { bubbles: true });
  inputEl.dispatchEvent(evt);
}

function isInDocument(node) {
  return !!(node && node.isConnected);
}

// Try to find the real ChatGPT input element
function findInputElementOnce() {
  // 1) contenteditable in same form as prompt textarea
  const fallback = document.querySelector('textarea[name="prompt-textarea"]');
  if (fallback && fallback.form) {
    const ceInForm = fallback.form.querySelector('div[contenteditable="true"]');
    if (ceInForm) {
      log("Found contenteditable in same form as prompt textarea");
      return ceInForm;
    }
  }

  // 2) contenteditable[role=textbox]
  const ceTextbox = document.querySelector('div[contenteditable="true"][role="textbox"]');
  if (ceTextbox) {
    log("Found contenteditable[role=textbox]");
    return ceTextbox;
  }

  // 3) any contenteditable div
  const ce = document.querySelector('div[contenteditable="true"]');
  if (ce) {
    log("Found generic contenteditable div");
    return ce;
  }

  // 4) fallback: textarea (last resort)
  const ta = document.querySelector('textarea[name="prompt-textarea"], textarea');
  if (ta) {
    log("Falling back to textarea");
    return ta;
  }

  return null;
}

// ---------- POSITION HELPERS (icon + panel over prompt, not clipped) ----------
function getInputRect() {
  if (!inputEl) return null;
  const rect = inputEl.getBoundingClientRect();
  return {
    left: rect.left + window.scrollX,
    top: rect.top + window.scrollY,
    right: rect.right + window.scrollX,
    bottom: rect.bottom + window.scrollY,
    width: rect.width,
    height: rect.height
  };
}

function updateIconPosition() {
  if (!iconEl || !inputEl) return;
  const rect = getInputRect();
  if (!rect) return;

  // Bottom-right corner, slightly inset
  const size = 26;
  iconEl.style.position = "absolute";
  iconEl.style.left = `${rect.right - size - 6}px`;
  iconEl.style.top = `${rect.bottom - size - 6}px`;
}

function updatePanelPosition() {
  if (!panelEl || !inputEl) return;
  const rect = getInputRect();
  if (!rect) return;

  panelEl.style.position = "absolute";
  const panelWidth = 320; // maxWidth; actual might be smaller

  // Align right edge of panel with right edge of prompt
  const left = rect.right - panelWidth;

  // We need panel height, so temporarily make it visible (if hidden)
  const prevDisplay = panelEl.style.display;
  panelEl.style.display = "block";
  const panelHeight = panelEl.offsetHeight || 40;
  panelEl.style.display = prevDisplay || "none";

  // Position above if there is space, otherwise below
  const spaceAbove = rect.top - window.scrollY;
  const spaceBelow = window.innerHeight - (rect.bottom - window.scrollY);

  let top;
  if (spaceAbove > panelHeight + 16) {
    // show above
    top = rect.top - panelHeight - 8;
  } else {
    // show below
    top = rect.bottom + 8;
  }

  panelEl.style.left = `${left}px`;
  panelEl.style.top = `${top}px`;
}

// ---------- ATTACH ----------
function attachToInput(el) {
  if (!el) return;

  // If we're already attached to this exact element, do nothing
  if (inputEl === el) return;

  inputEl = el;
  log("🔗 Attached to input:", inputEl.tagName, inputEl.className || "");

  inputEl.addEventListener("input", onInputChange);
  inputEl.addEventListener("keyup", onInputChange);

  createIconIfNeeded();
  createPanelIfNeeded();
  updateIconPosition();
  updatePanelPosition();
}

// ---------- ICON UI (with your logo + debug + fallback) ----------
function createIconIfNeeded() {
  if (iconEl) return;

  iconEl = document.createElement("div");
  iconEl.style.width = "26px";
  iconEl.style.height = "26px";
  iconEl.style.borderRadius = "999px";
  iconEl.style.display = "flex";
  iconEl.style.alignItems = "center";
  iconEl.style.justifyContent = "center";
  iconEl.style.cursor = "pointer";
  iconEl.style.background = "rgba(0, 0, 0, 0.04)";
  iconEl.style.boxShadow = "0 0 0 1px rgba(0, 0, 0, 0.08)";
  iconEl.style.zIndex = "999999"; // high so it's not clipped
  iconEl.style.transition = "background 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease";
  iconEl.title = "Click to see enhanced prompt";

  const img = document.createElement("img");

  // 🔍 DEBUG: check chrome.runtime + URL
  let logoUrl = null;
  try {
    if (typeof chrome !== "undefined" && chrome.runtime && typeof chrome.runtime.getURL === "function") {
      logoUrl = chrome.runtime.getURL("assets/logo-24.png");
    }
  } catch (e) {
    log("❌ Error calling chrome.runtime.getURL:", e);
  }

  log("🔍 chrome.runtime exists:", !!(typeof chrome !== "undefined" && chrome.runtime));
  log("🔍 Logo URL resolved to:", logoUrl);

  if (logoUrl) {
    img.src = logoUrl;
  } else {
    // avoid chrome-extension://invalid
    img.src = "";
    log("⚠️ No valid logo URL, using text fallback icon.");
  }

  img.alt = "Prompt enhancer";
  img.style.width = "16px";
  img.style.height = "16px";
  img.style.display = "block";
  img.style.pointerEvents = "none";

  img.addEventListener("error", () => {
    log("❌ Failed to load logo image from assets/logo-24.png, using text fallback.");
    img.style.display = "none";
    const fallbackSpan = document.createElement("span");
    fallbackSpan.textContent = "P";
    fallbackSpan.style.fontSize = "14px";
    fallbackSpan.style.fontWeight = "600";
    fallbackSpan.style.color = "#111827";
    fallbackSpan.style.pointerEvents = "none";
    iconEl.appendChild(fallbackSpan);
  });

  iconEl.appendChild(img);

  iconEl.addEventListener("mouseenter", () => {
    iconEl.style.transform = "scale(1.04)";
    iconEl.style.boxShadow = "0 0 0 1px rgba(0, 0, 0, 0.18)";
  });
  iconEl.addEventListener("mouseleave", () => {
    iconEl.style.transform = "scale(1)";
    if (!lastEnhancedPrompt) {
      iconEl.style.boxShadow = "0 0 0 1px rgba(0, 0, 0, 0.08)";
    }
  });

  iconEl.addEventListener("click", onIconClick);

  document.body.appendChild(iconEl);
  setIconIdle();
  updateIconPosition();
}

function setIconIdle() {
  if (!iconEl) return;
  iconEl.style.opacity = "0.6";
  iconEl.style.background = "rgba(0, 0, 0, 0.04)";
  iconEl.style.boxShadow = "0 0 0 1px rgba(0, 0, 0, 0.08)";
  iconEl.title = "Prompt enhancer (waiting for text)";
}

function setIconLoading() {
  if (!iconEl) return;
  iconEl.style.opacity = "1";
  iconEl.style.background = "rgba(0, 0, 0, 0.06)";
  iconEl.style.boxShadow = "0 0 0 1px rgba(37, 99, 235, 0.4)"; // blue outline
  iconEl.title = "Enhancing prompt...";
}

function setIconReady() {
  if (!iconEl) return;
  iconEl.style.opacity = "1";
  iconEl.style.background = "rgba(22, 163, 74, 0.08)"; // light green
  iconEl.style.boxShadow = "0 0 0 1px rgba(22, 163, 74, 0.5)";
  iconEl.title = "Click to view enhanced prompt";
}

// ---------- PANEL UI (floating, not clipped) ----------
function createPanelIfNeeded() {
  if (panelEl) return;

  panelEl = document.createElement("div");
  panelEl.style.maxWidth = "320px";
  panelEl.style.padding = "8px 10px";
  panelEl.style.borderRadius = "8px";
  panelEl.style.background = "#ffffff";
  panelEl.style.boxShadow = "0 4px 14px rgba(0, 0, 0, 0.15)";
  panelEl.style.fontSize = "13px";
  panelEl.style.lineHeight = "1.4";
  panelEl.style.cursor = "pointer";
  panelEl.style.zIndex = "999999";
  panelEl.style.display = "none";
  panelEl.style.whiteSpace = "pre-wrap";
  panelEl.style.color = "#000000";   // 🔥 force text to be black always

  panelEl.addEventListener("click", onPanelClick);

  document.body.appendChild(panelEl);
}

function showPanel() {
  if (!panelEl || !lastEnhancedPrompt) return;

  panelEl.textContent = lastEnhancedPrompt + "\n\n(click to replace prompt)";
  panelEl.style.display = "block";
  updatePanelPosition();
  isPanelVisible = true;
}

function hidePanel() {
  if (!panelEl) return;
  panelEl.style.display = "none";
  isPanelVisible = false;
}

// ---------- RED UNDERLINE UNDER TEXT ----------
function addRedUnderline() {
  if (!inputEl) return;
  // Apply wavy red underline to text itself (not the full box border)
  inputEl.style.textDecorationLine = "underline";
  inputEl.style.textDecorationStyle = "wavy";
  inputEl.style.textDecorationColor = "rgba(220, 38, 38, 0.9)";
}

function clearRedUnderline() {
  if (!inputEl) return;
  inputEl.style.textDecorationLine = "";
  inputEl.style.textDecorationStyle = "";
  inputEl.style.textDecorationColor = "";
}

// ---------- CLEAR STATE ----------
function clearEnhancedState() {
  lastEnhancedPrompt = null;
  hidePanel();
  clearRedUnderline();
  setIconIdle();
}

// ---------- EVENT HANDLERS ----------
function onInputChange() {
  if (!inputEl) return;

  const text = getCurrentText();
  log("✏️ onInputChange fired. Current text:", JSON.stringify(text));

  // New typing clears previous enhancement
  clearEnhancedState();
  updateIconPosition();
  updatePanelPosition();

  if (!text.trim()) {
    log("📝 Input is empty, nothing to enhance yet.");
    clearTimeout(debounceTimer);
    return;
  }

  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    handleDebouncedText(text);
  }, 700);
}

async function handleDebouncedText(text) {
  log("💡 Debounced text ready to send to backend:", text);

  setIconLoading();

  const enhanced = await callBackendEnhance(text);

  if (!enhanced || typeof enhanced !== "string") {
    log("⚠️ No enhanced prompt returned from backend.");
    setIconIdle();
    return;
  }

  lastEnhancedPrompt = enhanced;
  log("✅ Stored enhanced prompt:", lastEnhancedPrompt);

  setIconReady();
  addRedUnderline(); // underline the text itself
  updateIconPosition();
  updatePanelPosition();
}

// When user clicks the icon
function onIconClick(event) {
  event.stopPropagation(); // don't trigger ChatGPT stuff
  if (!lastEnhancedPrompt) {
    log("ℹ️ Icon clicked, but no enhanced prompt yet.");
    return;
  }

  if (isPanelVisible) {
    hidePanel();
  } else {
    showPanel();
  }
}

// When user clicks the panel → replace prompt
function onPanelClick(event) {
  event.stopPropagation();

  if (!lastEnhancedPrompt) return;

  log("🔁 Replacing prompt with enhanced version.");
  setCurrentText(lastEnhancedPrompt);
  hidePanel();
  setIconIdle();
  clearRedUnderline();
}

// ---------- BACKEND CALL (DEV STUB) ----------
// ---------- BACKEND CALL THROUGH BACKGROUND SCRIPT ----------
async function callBackendEnhance(rawText) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        type: "enhancePrompt",
        originalPrompt: rawText
      },
      (response) => {
        if (!response) {
          log("❌ No response from background.js");
          resolve(null);
          return;
        }

        log("📥 Response from background.js:", response);

        resolve(response.enhancedPrompt || null);
      }
    );
  });
}


// ---------- KICK-OFF ----------
setTimeout(() => {
  const el = findInputElementOnce();
  if (el) attachToInput(el);
  else log("First attempt: no input element found yet.");
}, 500);

const observer = new MutationObserver(() => {
  if (!inputEl || !isInDocument(inputEl)) {
    const el = findInputElementOnce();
    if (el) attachToInput(el);
  } else {
    // Input may move/resize as user types; keep icon/panel in sync
    updateIconPosition();
    if (isPanelVisible) {
      updatePanelPosition();
    }
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});

// Also update on scroll/resize so icon/panel stay aligned with prompt
window.addEventListener("scroll", () => {
  updateIconPosition();
  if (isPanelVisible) updatePanelPosition();
}, { passive: true });

window.addEventListener("resize", () => {
  updateIconPosition();
  if (isPanelVisible) updatePanelPosition();
});
