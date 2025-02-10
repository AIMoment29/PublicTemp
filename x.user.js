// ==UserScript==
// @name         x-tab-switcher
// @namespace    http://tampermonkey.net/
// @version      2.3
// @updateURL    https://aimoment29.github.io/PublicTemp/x.user.js
// @description  移除 X/Twitter 的前两个标签页，并默认显示第三个标签页，隐藏打开App提示
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        GM_addStyle
// ==/UserScript==

function handleTabs() {
    const tablist = document.querySelector('div[role="tablist"]');
    if (!tablist) return false;
    
    const tabs = Array.from(tablist.querySelectorAll('div[role="presentation"]'));
    if (tabs.length >= 3) {
        // 移除前两个标签
        tabs[0].remove();
        tabs[1].remove();
        
        // 点击第三个标签
        const thirdTab = tabs[2].querySelector('span');
        if (thirdTab) {
            thirdTab.click();
            
            // 移除发帖按钮
            const composeButton = document.querySelector('a[aria-label="Compose a post"]');
            if (composeButton) {
                composeButton.remove();
            }
            
            return true;
        }
    }
    return false;
}

// 每500ms检查一次，最多检查10次
const interval = setInterval(() => {
    if (handleTabs()) {
        clearInterval(interval);
    }
}, 500);