// ==UserScript==
// @name         x-tab-switcher
// @namespace    http://tampermonkey.net/
// @version      1.0
// @updateURL    https://aimoment29.github.io/PublicTemp/x.user.js
// @description  移除 X/Twitter 的前两个标签页，并默认显示第三个标签页
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        none
// ==/UserScript==

function n() {
    // 检查是否存在至少两个标签页
    const tabs = document.querySelectorAll('div[role="presentation"]');
    return tabs.length >= 2;
}

function r() {
    // 获取所有标签页
    const tabs = Array.from(document.querySelectorAll('div[role="presentation"]'));
    
    // 如果存在足够的标签页
    if (tabs.length >= 2) {
        // 移除前两个标签页
        tabs[0].remove();
        tabs[1].remove();
        
        // 如果存在第三个标签页，点击它
        if (tabs.length >= 3) {
            const thirdTab = tabs[2].querySelector('span');
            if (thirdTab) {
                thirdTab.click();
            }
        }
    }
}

const e = (e, t) => {
    for (const o of e) if ("childList" === o.type && n()) {
        r();
        break
    }
}, t = new MutationObserver(e), o = {childList: !0, subtree: !0};

t.observe(document.body, o), n() && r();