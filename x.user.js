// ==UserScript==
// @name         x-tab-switcher
// @namespace    http://tampermonkey.net/
// @version      1.6
// @updateURL    https://aimoment29.github.io/PublicTemp/x.user.js
// @description  移除 X/Twitter 的前两个标签页，并默认显示第三个标签页，隐藏打开App提示
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        GM_addStyle
// ==/UserScript==

// 禁用 Safari 的 Smart App Banner
const disableAppBanner = () => {
    if (!document.querySelector('meta[name="apple-itunes-app"]')) {
        const meta = document.createElement('meta');
        meta.name = 'apple-itunes-app';
        meta.content = 'app-id=none';
        document.head.appendChild(meta);
    }
};

// 在 DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', disableAppBanner);

// 添加CSS来隐藏打开App的弹窗
GM_addStyle(`
    div[data-testid="AppPrompt"],
    div[data-testid="appPrompt"] {
        display: none !important;
    }
`);

function n() {
    const tabs = document.querySelector('div[role="tablist"]')?.querySelectorAll('div[role="presentation"]');
    return tabs?.length >= 3;
}

function r() {
    const tablist = document.querySelector('div[role="tablist"]');
    if (!tablist) return;
    
    const tabs = Array.from(tablist.querySelectorAll('div[role="presentation"]'));
    if (tabs.length >= 3) {
        // 移除第二和第三个标签
        tabs[0].remove();
        tabs[1].remove();
        // 点击第四个标签
        const thirdTab = tabs[2].querySelector('span');
        if (thirdTab) {
            thirdTab.click();
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