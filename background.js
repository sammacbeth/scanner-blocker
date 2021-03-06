const localhosts = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);
const offendingTabs = new Map();
const firstPartyAllowList = new Set();

function requestListener(details) {
  const { tabId, documentUrl, url, type } = details;
  // ignore main_frame requests
  if (type === "main_frame") {
    if (offendingTabs.has(tabId)) {
      offendingTabs.delete(tabId);
      browser.pageAction.hide(tabId);
    }
    return;
  }
  const documentHost = new URL(documentUrl).hostname;
  // if first party is not localhost, block
  if (!localhosts.has(documentHost)) {
    if (!offendingTabs.has(tabId)) {
      offendingTabs.set(tabId, {
        allowed: new Set(),
        blocked: new Set(),
      });
    }
    const shouldBlock = !firstPartyAllowList.has(documentHost);
    const tabInfo = offendingTabs.get(tabId);
    browser.pageAction.show(tabId);

    if (shouldBlock) {
      tabInfo.blocked.add(url);
    } else {
      tabInfo.allowed.add(url);
    }
    return {
      cancel: shouldBlock,
    };
  }
}

browser.webRequest.onBeforeRequest.addListener(
  requestListener,
  {
    urls: [...localhosts].map(h => `http://${h}/*`),
  },
  ["blocking"]
);

browser.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (localhosts.has(details.ip)) {
      const hostname = new URL(details.url).hostname;
      if (!localhosts.has(hostname)) {
        console.log('add new localhost alias', hostname);
        localhosts.add(hostname);
        browser.webRequest.onBeforeRequest.addListener(requestListener, { urls: [`http://${hostname}/*`] }, ['blocking'])
      }
    }
  },
  {
    urls: ['<all_urls>'],
  },
)

window.offendingTabs = offendingTabs;
window.firstPartyAllowList = firstPartyAllowList;
