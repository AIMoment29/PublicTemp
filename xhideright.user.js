// ==UserScript==
// @name         x右侧隐藏
// @namespace    http://tampermonkey.net/
// @version      1.0
// @updateURL    https://aimoment29.github.io/PublicTemp/xhideright.user.js
// @description  隐藏 X/Twitter 右侧边栏并全屏显示，移除发帖按钮
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        GM_addStyle
// ==/UserScript==

/**
 * 脚本功能说明：
 *
 * 1. 布局优化：
 *    - 隐藏右侧边栏（sidebarColumn）
 *    - 移除主列最大宽度限制，使内容区域全屏显示
 *
 * 2. 界面简化：
 *    - 移除发帖按钮（Compose a post）
 */

// 标记是否已添加样式
let styleAdded = false;

function handleLayout() {
    // 隐藏侧边栏
    const sidebarColumn = document.querySelector('div[data-testid="sidebarColumn"]');
    if (sidebarColumn) {
        sidebarColumn.style.display = 'none';
    }

    // 设置主列宽度为100%并移除限制类（只添加一次）
    if (!styleAdded) {
        const style = document.createElement('style');
        style.textContent = `
            .r-1ye8kvj {
                max-width: none !important;
            }
        `;
        document.head.appendChild(style);
        styleAdded = true;
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

// 定期执行布局处理
setInterval(handleLayout, 500);

// 初始执行
handleLayout();
