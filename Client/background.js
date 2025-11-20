console.log("🔧 Background script loaded");

// Listen for messages from contentScript
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "enhancePrompt") {
    console.log("📨 Received enhancePrompt request:", msg.originalPrompt);

    fetch("http://localhost:3000/enhance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ originalPrompt: msg.originalPrompt })
    })
      .then(res => res.json())
      .then(data => {
        console.log("📥 Backend responded:", data);

        sendResponse({
          enhancedPrompt: data.enhancedPrompt || null
        });
      })
      .catch(err => {
        console.error("❌ Backend fetch error:", err);
        sendResponse({
          enhancedPrompt: null
        });
      });

    return true; // REQUIRED to keep sendResponse alive (async)
  }
});
