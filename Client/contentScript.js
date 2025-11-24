// contentScript.js
(function () {
  const LOG_PREFIX = "[PromptEnhancer]";
  const MIN_TEXT_LENGTH = 3; // don't enhance super short stuff

  let attachedInputEl = null;        // textarea or contenteditable
  let iconEl = null;                 // floating logo icon
  let panelEl = null;                // suggestion panel

  let currentText = "";              // latest text from input
  let latestEnhancedPrompt = null;   // last enhanced result from backend
  let latestEnhancedSource = null;   // text that produced that enhanced result

  let isEnhancing = false;           // true while waiting for backend
  let isApplyingEnhanced = false;    // true while we programmatically set text

  function log(...args) {
    console.log(LOG_PREFIX, ...args);
  }

  // ---------- INPUT HELPERS ----------

  function getInputText(el) {
    if (!el) return "";
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      return el.value;
    }
    return el.innerText || el.textContent || "";
  }

  function setInputText(el, text) {
    if (!el) return;
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      el.value = text;
    } else {
      el.innerText = text;
    }

    const ev = new Event("input", { bubbles: true });
    el.dispatchEvent(ev);
  }

  // ---------- UI: UNDERLINE ----------

  function applyUnderline() {
    if (!attachedInputEl) return;
    attachedInputEl.style.textDecoration = "underline wavy red";
    attachedInputEl.style.textDecorationThickness = "1.5px";
  }

  function clearUnderline() {
    if (!attachedInputEl) return;
    attachedInputEl.style.textDecoration = "";
  }

  // ---------- UI: PANEL ----------

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
    panelEl.style.zIndex = "999999999";
    panelEl.style.display = "none";
    panelEl.style.whiteSpace = "pre-wrap";
    panelEl.style.color = "#000000"; // black text

    panelEl.addEventListener("click", onPanelClick);
    document.body.appendChild(panelEl);
  }

  function positionPanel() {
    if (!panelEl || !iconEl || iconEl.style.display === "none") return;
    const rect = iconEl.getBoundingClientRect();

    panelEl.style.position = "fixed";
    // place it above / to the left of the icon
    panelEl.style.left = `${Math.max(rect.left - 320 + rect.width, 8)}px`;
    panelEl.style.bottom = `${window.innerHeight - rect.top + 8}px`;
  }

  function showPanelWithText(text) {
    createPanelIfNeeded();
    panelEl.textContent = text;
    panelEl.style.display = "block";
    positionPanel();
  }

  function showPanelLoading() {
    createPanelIfNeeded();
    panelEl.textContent = "Enhancing your prompt…";
    panelEl.style.display = "block";
    positionPanel();
  }

  function showPanelError(message) {
    createPanelIfNeeded();
    panelEl.textContent = message || "Could not enhance prompt. Try again.";
    panelEl.style.display = "block";
    positionPanel();
  }

  function hidePanel() {
    if (!panelEl) return;
    panelEl.style.display = "none";
  }

  // ---------- UI: ICON ----------

  function createIconIfNeeded() {
    if (iconEl) return;

    iconEl = document.createElement("button");
    iconEl.type = "button";
    iconEl.setAttribute("aria-label", "Enhance prompt");

    iconEl.style.width = "30px";
    iconEl.style.height = "30px";
    iconEl.style.borderRadius = "50%";
    iconEl.style.background = "#ffffff";
    iconEl.style.border = "1px solid rgba(0,0,0,0.15)";
    iconEl.style.display = "flex";
    iconEl.style.alignItems = "center";
    iconEl.style.justifyContent = "center";
    iconEl.style.cursor = "pointer";
    iconEl.style.position = "fixed";
    iconEl.style.zIndex = "999999999";
    iconEl.style.padding = "0";

    const img = document.createElement("img");
    let logoUrl = "assets/logo-24.png";
    try {
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL) {
        logoUrl = chrome.runtime.getURL("assets/logo-24.png");
      }
    } catch (e) {
      log("⚠️ Could not resolve logo via chrome.runtime.getURL, using raw path.");
    }
    img.src = logoUrl;
    img.alt = "Prompt Enhancer";
    img.style.width = "20px";
    img.style.height = "20px";

    iconEl.appendChild(img);
    iconEl.addEventListener("click", onIconClick);

    document.body.appendChild(iconEl);
  }

  function positionIcon() {
    if (!attachedInputEl || !iconEl) return;

    const rect = attachedInputEl.getBoundingClientRect();

    iconEl.style.left = `${rect.right - 36}px`;
    iconEl.style.top = `${rect.bottom - 40}px`;
  }

  // ---------- BACKEND CALL (via background.js) ----------

  function callBackendEnhance(rawText) {
    return new Promise((resolve) => {
      if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
        log("❌ chrome.runtime.sendMessage not available");
        resolve(null);
        return;
      }

      chrome.runtime.sendMessage(
        {
          type: "enhancePrompt",
          originalPrompt: rawText
        },
        (response) => {
          log("📥 Response from background.js:", response);
          if (!response || typeof response.enhancedPrompt !== "string") {
            resolve(null);
            return;
          }
          resolve(response.enhancedPrompt);
        }
      );
    });
  }

  // ---------- EVENT HANDLERS ----------

  function onInputChange() {
    if (!attachedInputEl) return;

    const text = getInputText(attachedInputEl);

    // If we ourselves just set the text, ignore this event once
    if (isApplyingEnhanced) {
      log("↩️ Ignoring input event from applying enhanced prompt");
      isApplyingEnhanced = false;
      return;
    }

    currentText = text;

    // User changed something → old suggestion is invalid
    latestEnhancedPrompt = null;
    latestEnhancedSource = null;
    clearUnderline();
    hidePanel();
  }

  async function onIconClick() {
    if (!attachedInputEl) return;

    const rawText = getInputText(attachedInputEl).trim();
    if (!rawText || rawText.length < MIN_TEXT_LENGTH) {
      hidePanel();
      clearUnderline();
      return;
    }

    // If we already enhanced this exact text, don't call backend again.
    if (latestEnhancedPrompt && latestEnhancedSource === rawText) {
      log("🔁 Reusing cached enhanced prompt (no new API call).");
      showPanelWithText(latestEnhancedPrompt + "\n\n(click to replace prompt)");
      applyUnderline();
      return;
    }

    if (isEnhancing) {
      log("⏳ Already enhancing, ignoring extra click.");
      showPanelLoading();
      return;
    }

    isEnhancing = true;
    currentText = rawText;
    showPanelLoading();

    const enhanced = await callBackendEnhance(rawText);
    isEnhancing = false;

    if (!enhanced) {
      log("⚠️ No enhanced prompt returned from backend.");
      showPanelError("Could not enhance prompt. Try again.");
      return;
    }

    latestEnhancedPrompt = enhanced;
    latestEnhancedSource = rawText;

    applyUnderline();
    showPanelWithText(enhanced + "\n\n(click to replace prompt)");
  }

  function onPanelClick() {
    if (!attachedInputEl || !latestEnhancedPrompt) return;

    log("🔁 Applying enhanced prompt into ChatGPT box.");
    isApplyingEnhanced = true;
    setInputText(attachedInputEl, latestEnhancedPrompt);
    hidePanel();
    clearUnderline(); // optional: you can keep underline if you like
  }

  // ---------- ATTACH TO CHATGPT INPUT ----------

  function findChatGPTInput() {
    // Newer ChatGPT UI
    const newEditable = document.querySelector(
      'div[data-message-editor="true"] div[contenteditable="true"]'
    );
    if (newEditable) return newEditable;

    // Generic contenteditable fallback
    const allEditables = document.querySelectorAll('div[contenteditable="true"]');
    for (const el of allEditables) {
      const name = el.getAttribute("name") || "";
      const ariaLabel = el.getAttribute("aria-label") || "";
      if (
        name.toLowerCase().includes("prompt") ||
        ariaLabel.toLowerCase().includes("message") ||
        ariaLabel.toLowerCase().includes("chat")
      ) {
        return el;
      }
    }

    // Old-style textarea fallback
    const textarea = document.querySelector('textarea[name="prompt-textarea"], textarea');
    if (textarea) return textarea;

    return null;
  }

  function attachToInput(inputEl) {
    if (!inputEl || attachedInputEl === inputEl) return;

    attachedInputEl = inputEl;
    log("🔗 Attached to input:", attachedInputEl);

    attachedInputEl.addEventListener("input", onInputChange);

    createIconIfNeeded();
    positionIcon();
    hidePanel();
    clearUnderline();
  }

  function initObserver() {
    const initial = findChatGPTInput();
    if (initial) {
      log("✅ Prompt Enhancer content script loaded (logo + text underline + floating panel)");
      attachToInput(initial);
    } else {
      log("⏳ Waiting for ChatGPT input to appear...");
    }

    const observer = new MutationObserver(() => {
      const found = findChatGPTInput();
      if (found && found !== attachedInputEl) {
        attachToInput(found);
      }
      positionIcon();
      positionPanel();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.addEventListener("resize", () => {
      positionIcon();
      positionPanel();
    });
  }

  // ---------- START ----------
  initObserver();
})();
