// Background script for AI Tab Assistant
chrome.runtime.onInstalled.addListener(() => {
  // Prompt user to enter API key on first install
  chrome.storage.sync.get(["geminiApiKey"], (result) => {
    if (!result.geminiApiKey) {
      chrome.tabs.create({
        url: "options.html",
      });
    }
  });
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureScreenshot") {
    chrome.tabs.captureVisibleTab(null, {format: 'png'}, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({error: chrome.runtime.lastError.message});
      } else {
        sendResponse({screenshot: dataUrl});
      }
    });
    return true; // Will respond asynchronously
  }
});