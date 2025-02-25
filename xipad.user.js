// ==UserScript==
// @name         x-tab-switcher
// @namespace    http://tampermonkey.net/
// @version      2.0
// @updateURL    https://aimoment29.github.io/PublicTemp/xipad.user.js
// @description  移除 X/Twitter 的前两个标签页，并默认显示第三个标签页，隐藏打开App提示
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

let firstOpen = true
let hasProcessedTabs = false;

// 处理布局的函数
function handleLayout() {
    
    // 隐藏侧边栏而不是删除
    const sidebarColumn = document.querySelector('div[data-testid="sidebarColumn"]');
    if (sidebarColumn) {
        sidebarColumn.style.display = 'none';
    }

    // 设置主列宽度为100%并移除限制类
    // 在脚本开始执行时添加样式
    const style = document.createElement('style');
    style.textContent = `
        .r-1ye8kvj {
            max-width: none !important;
        }
    `;
    document.head.appendChild(style);

    // 添加自定义图标
    addCustomIcons();
}

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
    
    // 移除发帖按钮（这个可以一直检查）
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
        firstOpen= false;
        // 只有在返回主页时才重置状态
        if (currentUrl === 'https://x.com/home' || currentUrl === 'https://twitter.com/home') {
            hasProcessedTabs = false;
        }
    }
    handleTabs();
    handleLayout(); // 每次检查都处理布局
}, 1000);

// 初始执行布局处理
handleLayout();

// 添加提示样式
const style = document.createElement('style');
style.textContent = `
    .custom-alert {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1da1f2;
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
        z-index: 9999;
        animation: slideIn 0.3s ease-out, fadeOut 0.3s ease-out 2s forwards;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    
    @keyframes slideIn {
        from { transform: translateY(-100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

// 显示提示的函数
function showAlert(message) {
    const alert = document.createElement('div');
    alert.className = 'custom-alert';
    alert.textContent = message;
    document.body.appendChild(alert);
    
    // 3秒后移除提示
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

// 发送推文信息的函数
function sendTweetInfo(tweet, type) {
    const tweetData = {
        url: tweet.querySelector('a[role="link"][href*="/status/"]')?.href || '',
        author: tweet.querySelector('div[data-testid="User-Name"] a')?.textContent || '',
        content: tweet.querySelector('div[data-testid="tweetText"]')?.textContent || '',
        time: tweet.querySelector('time')?.dateTime || '',
        type: type
    };

    // 显示收集到的数据
    showAlert(`收集成功！
        类型: ${type}
        作者: ${tweetData.author}
        内容: ${tweetData.content.substring(0, 50)}...
        时间: ${tweetData.time}
        链接: ${tweetData.url}`);
        }

function addCustomIcons() {
    const actionBars = document.querySelectorAll('div[role="group"]');
    
    actionBars.forEach(bar => {
        if (bar.querySelector('.custom-icon')) return;
        
        const tweetElement = bar.closest('article');
        
        // 创建第一个图标
        const icon1 = document.createElement('div');
        icon1.className = 'custom-icon';
        icon1.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
        `;
        icon1.style.cursor = 'pointer';
        icon1.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (tweetElement) {
                sendTweetInfo(tweetElement, 'type1');
            }
        };

        // 创建第二个图标
        const icon2 = document.createElement('div');
        icon2.className = 'custom-icon';
        icon2.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
            </svg>
        `;
        icon2.style.cursor = 'pointer';
        icon2.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (tweetElement) {
                sendTweetInfo(tweetElement, 'type2');
            }
        };

        // 添加样式
        icon1.style.padding = '8px';
        icon2.style.padding = '8px';

        // 将图标添加到操作栏
        bar.appendChild(icon1);
        bar.appendChild(icon2);
    });
}