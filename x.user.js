// ==UserScript==
// @name         x-tab-switcher
// @namespace    http://tampermonkey.net/
// @version      1.2
// @updateURL    https://aimoment29.github.io/PublicTemp/x.user.js
// @description  移除 X/Twitter 的前两个标签页，并默认显示第三个标签页，隐藏打开App提示
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        GM_addStyle
// ==/UserScript==

// 添加CSS来隐藏打开App的弹窗
GM_addStyle(`
    div[data-testid="AppPrompt"],
    div[data-testid="appPrompt"] {
        display: none !important;
    }
`);

function n() {
    var e = Array.from(document.querySelectorAll("span")).find(e => "For you" === e.textContent),
        t = Array.from(document.querySelectorAll("span")).find(e => "Following" === e.textContent),
        f = Array.from(document.querySelectorAll("span")).find(e => "美食天下" === e.textContent);
    return e && t && f
}

function r() {
    document.querySelectorAll("span").forEach(e => {
        if ("For you" == e.textContent) {
            e.closest('div[role="presentation"]').remove()
        } else if ("Following" == e.textContent) {
            e.closest('div[role="presentation"]').remove()
        } else if ("美食天下" == e.textContent) {
            e.click()
        }
    })
}

const e = (e, t) => {
    for (const o of e) if ("childList" === o.type && n()) {
        r();
        break
    }
}, t = new MutationObserver(e), o = {childList: !0, subtree: !0};

t.observe(document.body, o), n() && r();