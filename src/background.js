// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "openBookmarkPlus",
    title: "Open Bookmark Plus",
    contexts: ["all"]
  });
});

// 监听右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "openBookmarkPlus") {
    // 使用 action.openPopup() 打开默认的 popup
    chrome.action.openPopup();
  }
});

// 监听快捷键命令
chrome.commands.onCommand.addListener((command) => {
  if (command === '_execute_action') {
    // 快捷键会自动触发默认的 popup，不需要额外处理
    console.log('Shortcut activated: Alt+Q');
  }
});

// 打开居中的弹出窗口
function openCenteredPopup() {
  const width = 400;
  const height = 600;
  
  // 获取当前窗口以计算居中位置
  chrome.windows.getCurrent((currentWindow) => {
    const left = Math.round((currentWindow.width - width) / 2 + currentWindow.left);
    const top = Math.round((currentWindow.height - height) / 2 + currentWindow.top);

    chrome.windows.create({
      url: chrome.runtime.getURL("index.html"),
      type: "popup",
      width: width,
      height: height,
      left: left,
      top: top
    });
  });
}