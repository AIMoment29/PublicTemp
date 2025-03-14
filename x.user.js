// ==UserScript==
// @name         x-tab-switcher
// @namespace    http://tampermonkey.net/
// @version      3.0
// @updateURL    https://aimoment29.github.io/PublicTemp/x.user.js
// @description  移除 X/Twitter 的前两个标签页，并默认显示第三个标签页，隐藏打开App提示
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        GM_addStyle
// ==/UserScript==

let firstOpen = true
let hasProcessedTabs = false;


function handleTabs() {
    const tablist = document.querySelector('div[role="tablist"]');
    if (!tablist) return;
    
    const tabs = Array.from(tablist.querySelectorAll('div[role="presentation"]'));
    
    // 只有当有足够的标签且第一个标签是 "For you" 时才处理
    if (tabs.length >= 3 && !hasProcessedTabs) {
        const firstTabText = tabs[0].querySelector('span')?.textContent;
        if (firstTabText === 'For you' || firstTabText === '为你推荐' || firstTabText === '关注' || firstTabText === '正在关注' ||firstTabText === 'Following') {
            // 移除前两个标签
            tabs[0].remove();
            tabs[1].remove();
            
            // 点击第三个标签
            if (firstOpen){
                const thirdTab = tabs[2].querySelector('span');
                if (thirdTab) {
                    thirdTab.click();
                    hasProcessedTabs = true;
                }
            }
        }
    }
    
    // 移除发帖按钮
    const composeButton_post = document.querySelector('a[aria-label="Compose a post"]');
    if (composeButton_post) {
        composeButton_post.remove();
    }

    const composeButton_href = document.querySelector('a[href="/compose/post"]');
    if (composeButton_href) {
        composeButton_href.remove();
    }
}

// 监听 URL 变化
let lastUrl = location.href;
setInterval(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        firstOpen = false;
        if (currentUrl === 'https://x.com/home' || currentUrl === 'https://twitter.com/home') {
            hasProcessedTabs = false;
        }
    }
    handleTabs();
}, 1000);

// 初始执行一次
handleTabs();