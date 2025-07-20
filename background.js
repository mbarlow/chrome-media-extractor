chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: initializeMediaExtractor,
  });
});

function initializeMediaExtractor() {
  document.dispatchEvent(new CustomEvent("MEDIA_EXTRACTOR_TOGGLE"));
}

// Handle download requests from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "download") {
    chrome.downloads.download({
      url: message.url,
      filename: message.filename,
      saveAs: false,
    });
  }
});
