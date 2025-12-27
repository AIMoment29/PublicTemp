// ==UserScript==
// @name         x-button-adder
// @namespace    http://tampermonkey.net/
// @version      1.4
// @updateURL    https://aimoment29.github.io/PublicTemp/xbutton.user.js
// @description  为 X/Twitter 添加自定义按钮
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect x.defg.uk
// ==/UserScript==

/**
 * 脚本功能说明：
 *
 * 1. 自定义按钮：
 *    - 为每条推文的操作栏添加两个自定义图标按钮（圆形和方形）
 *
 * 2. 推文收集：
 *    - 点击按钮可收集推文信息（URL、内容、时间、作者）
 *    - 将收集的数据发送到外部服务器 (https://x.defg.uk/lark/add)
 *    - 两个按钮分别发送 type1 和 type2 类型
 *
 * 3. 状态提示：
 *    - 显示收集中/成功/失败的提示动画
 *    - 提示框会自动消失
 */

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
function showAlert(message, status = true) {
    const alert = document.createElement('div');
    alert.className = 'custom-alert';
    alert.textContent = message;
    
    // 根据状态设置不同的背景色
    if (status === 'loading') {
        alert.style.background = '#f4a100';  // 黄色
    } else {
        alert.style.background = status ? '#1da1f2' : '#e0245e';  // 蓝色或红色
    }
    
    document.body.appendChild(alert);
    
    // 如果是加载中状态，不自动移除
    if (status !== 'loading') {
        setTimeout(() => {
            alert.remove();
        }, 3000);
    }
    
    return alert;  // 返回alert元素以便后续移除
}

// 发送推文信息的函数
function sendTweetInfo(tweet, type) {
    // 显示加载中提示
    showAlert('收集中...', 'loading');

    const tweetData = {
        type: type,
        url: tweet.querySelector('a[role="link"][href*="/status/"]')?.href || '',
        content: tweet.querySelector('div[data-testid="tweetText"]')?.textContent || '',
        time: tweet.querySelector('time')?.dateTime || '',
        author: tweet.querySelector('div[data-testid="User-Name"] a')?.textContent || ''
    };

    // 使用 GM_xmlhttpRequest 发送数据
    GM_xmlhttpRequest({
        method: 'POST',
        url: 'https://x.defg.uk/lark/add',
        headers: {
            'Content-Type': 'application/json'
        },
        data: JSON.stringify(tweetData),
        onload: function(response) {
            try {
                const result = JSON.parse(response.responseText);
                if (result.code === 200) {
                    showAlert('收集成功！', true);
                } else {
                    showAlert('收集失败：请求异常', false);
                }
            } catch (error) {
                showAlert('收集失败：响应格式错误', false);
            }
        },
        onerror: function(error) {
            showAlert('收集失败：' + (error.statusText || '请检查接口是否正常'), false);
        }
    });
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

// 定期检查新的推文
setInterval(addCustomIcons, 1000);

// 初始执行一次
addCustomIcons();