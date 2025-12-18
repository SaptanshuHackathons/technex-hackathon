console.log("Astra Content Script Loaded");

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "SCRAPE") {
        // Mock scraping: Get page title and some text
        const data = {
            title: document.title,
            url: window.location.href,
            content: document.body.innerText.substring(0, 500) // Mock snippet
        };
        sendResponse({ success: true, data });
    }
    return true; // Keep channel open
});
