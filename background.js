function configureSidePanelBehavior() {
  if (!chrome.sidePanel?.setPanelBehavior) return;

  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
    // Ignore: if unsupported in current Chrome version, extension still works in web mode.
  });
}

chrome.runtime.onInstalled.addListener(() => {
  configureSidePanelBehavior();
});

chrome.runtime.onStartup.addListener(() => {
  configureSidePanelBehavior();
});

configureSidePanelBehavior();
