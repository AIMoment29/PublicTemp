// ==UserScript==
// @name         x-to-expander
// @namespace    http://tampermonkey.net/
// @version      2.0
// @updateURL    https://aimoment29.github.io/PublicTemp/xto.user.js
// @description  将 X/Twitter 的 t.co 短链接替换为原始链接
// @match        https://x.com/*
// @match        https://twitter.com/*
// @run-at       document-start
// ==/UserScript==

// 处理短链接
function expandShortLinks() {
    // 查找所有 t.co 链接和 main 标签下的沉浸式翻译处理过的链接
    const links = document.querySelectorAll('a[href*="t.co"], main a[data-immersive-translate-walked]');
    
    links.forEach(link => {

        let _href = link.href

        if(_href.includes('x.com') || _href.includes('twitter.com')) {
            return;
        }

        // 获取链接文本并去除末尾的省略号和所有类型的空格
        let fullUrl = link.textContent.trim()
            .replace('...', '')
            .replace('…', '')
            .replace('%E2%80%A6', '')
            .replace(/\s+/g, '');  // 移除所有类型的空格
            
        // 如果链接包含 x.com 或 twitter.com，则跳过处理
        if (fullUrl) {
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
