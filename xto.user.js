// ==UserScript==
// @name         x-to-expander
// @namespace    http://tampermonkey.net/
// @version      1.3
// @updateURL    https://aimoment29.github.io/PublicTemp/xto.user.js
// @description  将 X/Twitter 的 t.co 短链接替换为原始链接
// @match        https://x.com/*
// @match        https://twitter.com/*
// @run-at       document-start
// ==/UserScript==

// 处理短链接
function expandShortLinks() {
    // 查找所有 t.co 链接
    const links = document.querySelectorAll('a[href*="t.co"]');
    
    links.forEach(link => {
        // 直接获取链接的文本内容
        const fullUrl = link.textContent.trim();
            
        if (fullUrl && !fullUrl.includes('t.co')) {
            // 更新链接
            link.href = fullUrl;
            
            // 添加点击事件处理
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(fullUrl, '_blank');
            }, true);
        }
    });
}

// 定期检查新的链接
setInterval(expandShortLinks, 1000);

// 在页面加载完成后执行一次
document.addEventListener('DOMContentLoaded', expandShortLinks);
