const templateBlocked = document.querySelector("#tmp-url-item-blocked");
const templateAllowed = document.querySelector("#tmp-url-item-allowed");
const listElem = document.querySelector("#url-list");
const title = document.getElementById('title');
const toggleButton = document.getElementById('toggle')

function setPopupState(allowed) {
  title.innerText = browser.i18n.getMessage(allowed ? 'pageActionHeaderAllowing' : 'pageActionHeaderBlocking')
  toggleButton.innerText = browser.i18n.getMessage(allowed ? 'pageActionButtonBlock' : 'pageActionButtonAllow');
  if (allowed) {
    toggleButton.classList.add('default')
  } else {
    toggleButton.classList.remove('default')
  }
}

browser.runtime.getBackgroundPage().then(async (bg) => {
  const { offendingTabs, firstPartyAllowList } = bg;
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const documentHost = new URL(tab.url).hostname;
  let firstPartyAllowed = firstPartyAllowList.has(documentHost);
  setPopupState(firstPartyAllowed);

  toggleButton.addEventListener('click', () => {
    if (firstPartyAllowed) {
      firstPartyAllowList.delete(documentHost);
      firstPartyAllowed = false;
    } else {
      firstPartyAllowList.add(documentHost);
      firstPartyAllowed = true;
    }

    setPopupState(firstPartyAllowed)
  })

  // populate URL list
  if (offendingTabs.has(tab.id)) {
    const { allowed, blocked } = offendingTabs.get(tab.id);
    allowed.forEach((url) => {
      const listEntry = templateAllowed.content.cloneNode(true);
      listEntry.querySelector(".text").textContent = url;
      listElem.appendChild(listEntry);
    });
    blocked.forEach((url) => {
      const listEntry = templateBlocked.content.cloneNode(true);
      listEntry.querySelector(".text").textContent = url;
      listElem.appendChild(listEntry);
    });
  }
});
