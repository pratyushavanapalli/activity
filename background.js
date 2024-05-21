let trackedWebsites = {};
let activeTabId = null;

// Listen for tab activation
chrome.tabs.onActivated.addListener(function(activeInfo) {
    activeTabId = activeInfo.tabId;
    trackWebsiteTime();
});

// Listen for tab update
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (tabId === activeTabId && changeInfo.url) {
        activeTabId = tabId;
        trackWebsiteTime();
    }
});

// Listen for message from content script to track website
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'trackWebsite') {
        var websiteUrl = message.url;
        if (!trackedWebsites[websiteUrl]) {
            trackedWebsites[websiteUrl] = 0;
        }
        sendResponse({status: 'success'});
    }
});

// Track time spent on website
function trackWebsiteTime() {
    if (activeTabId) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            var tab = tabs[0];
            var websiteUrl = tab.url;
            if (websiteUrl.startsWith('http') || websiteUrl.startsWith('https')) {
                if (!trackedWebsites[websiteUrl]) {
                    trackedWebsites[websiteUrl] = 0;
                }
                setInterval(function() {
                    trackedWebsites[websiteUrl]++;
                    chrome.runtime.sendMessage({action: 'updateTrackedWebsites', data: getTrackedWebsites()});
                }, 1000); // Update time spent every second
            }
        });
    }
}

// Get tracked websites data
function getTrackedWebsites() {
    var data = [];
    for (var website in trackedWebsites) {
        data.push({url: website, timeSpent: trackedWebsites[website]});
    }
    return data;
}
