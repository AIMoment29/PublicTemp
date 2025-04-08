// ==UserScript==
// @name         ChatGPT Clear Button
// @namespace    http://tampermonkey.net/
// @version      2.0
// @updateURL    https://aimoment29.github.io/PublicTemp/chatgptclear.user.js
// @description  在ChatGPT页面添加一个简洁的清空按钮
// @author       xiniu
// @match        https://chatgpt.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';
    
    // 配置项
    const config = {
        buttonDelay: 3000,        // 添加浮动按钮的延迟时间（毫秒）
        buttonPollingInterval: 5000, // 定期检查按钮是否存在的间隔（毫秒）
        zIndex: 2147483647,       // 最大z-index值，确保按钮在最上层
        buttonPosition: {          // 浮动按钮位置
            top: '80px',
            right: '20px'
        },
        opacity: 0.3              // 按钮透明度 (30%)
    };
    
    // 添加永久可见的浮动按钮
    function addFloatingButton() {
        // 检查按钮是否已存在
        if (document.getElementById('chatgpt-clear-button-floating')) {
            return; // 已存在则不重复添加
        }
        
        // 创建浮动按钮
        const floatingButton = document.createElement('button');
        floatingButton.id = 'chatgpt-clear-button-floating';
        floatingButton.textContent = 'clear';
        
        // 设置按钮样式 - 简洁的圆形按钮，黑字白底黑框，30%透明度
        Object.assign(floatingButton.style, {
            position: 'fixed',
            top: config.buttonPosition.top,
            right: config.buttonPosition.right,
            width: '40px',          // 固定宽度，保持圆形
            height: '40px',         // 固定高度，保持圆形
            padding: '0',
            backgroundColor: 'white',
            color: 'black',
            border: '1px solid black',
            borderRadius: '50%',    // 使按钮成为圆形
            fontWeight: 'normal',
            zIndex: config.zIndex.toString(),
            cursor: 'pointer',
            boxShadow: 'none',      // 移除阴影
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            textAlign: 'center',
            lineHeight: '40px',     // 垂直居中文本
            pointerEvents: 'auto',  // 确保可点击
            userSelect: 'none',     // 防止选中文本
            opacity: config.opacity.toString() // 设置透明度为30%
        });
        
        // 添加点击事件
        floatingButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            clearChatGPTEditor();
        });
        
        // 添加到body的最后，确保在最上层
        document.body.appendChild(floatingButton);
    }
    
    // 确保按钮存在
    function ensureButtonExists() {
        const button = document.getElementById('chatgpt-clear-button-floating');
        if (!button) {
            addFloatingButton();
        } else {
            // 确保按钮在最上层
            button.style.zIndex = config.zIndex.toString();
            button.style.opacity = config.opacity.toString();
        }
    }
    
    // 创建一个包含浮动按钮的容器，并作为Shadow DOM
    function createButtonWithShadowDOM() {
        // 检查是否已存在
        if (document.getElementById('chatgpt-clear-button-container')) {
            return;
        }
        
        // 创建容器
        const container = document.createElement('div');
        container.id = 'chatgpt-clear-button-container';
        Object.assign(container.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '0',
            height: '0',
            zIndex: config.zIndex.toString(),
            pointerEvents: 'none'
        });
        
        // 创建Shadow DOM
        const shadow = container.attachShadow({ mode: 'open' });
        
        // 在Shadow DOM中创建按钮
        const button = document.createElement('button');
        button.textContent = 'clear';
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            button {
                position: fixed;
                top: ${config.buttonPosition.top};
                right: ${config.buttonPosition.right};
                width: 40px;
                height: 40px;
                padding: 0;
                background-color: white;
                color: black;
                border: 1px solid black;
                border-radius: 50%;
                font-weight: normal;
                cursor: pointer;
                font-family: Arial, sans-serif;
                font-size: 12px;
                text-align: center;
                line-height: 40px;
                pointer-events: auto;
                user-select: none;
                opacity: ${config.opacity};
            }
        `;
        
        // 添加点击事件
        button.addEventListener('click', function() {
            clearChatGPTEditor();
        });
        
        // 将样式和按钮添加到Shadow DOM
        shadow.appendChild(style);
        shadow.appendChild(button);
        
        // 添加到文档
        document.body.appendChild(container);
    }
    
    // 清空ChatGPT编辑器 - 不显示任何提示
    function clearChatGPTEditor() {
        const editor = document.querySelector('[contenteditable="true"].ProseMirror');
        if (editor) {
            // 聚焦编辑器
            editor.focus();
            
            // 选择所有内容
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(editor);
            selection.removeAllRanges();
            selection.addRange(range);
            
            // 删除所有内容
            document.execCommand('delete', false, null);
        }
    }
    
    // 监听导航事件
    function listenForNavigation() {
        // 监听URL变化
        let lastUrl = location.href;
        
        // 使用MutationObserver检测导航变化
        const observer = new MutationObserver(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                setTimeout(ensureButtonExists, 2000);
            }
        });
        
        observer.observe(document, { subtree: true, childList: true });
    }
    
    // 初始化函数
    function initialize() {
        // 检查是否在chatgpt.com域名下
        if (!window.location.hostname.includes('chatgpt.com')) {
            return;
        }
        
        // 延迟添加浮动按钮，确保在页面完全加载后添加
        setTimeout(() => {
            // 使用两种不同的方法添加按钮，增加成功率
            addFloatingButton();
            createButtonWithShadowDOM();
            
            // 监听导航事件
            listenForNavigation();
            
            // 定期检查按钮是否存在
            setInterval(ensureButtonExists, config.buttonPollingInterval);
        }, config.buttonDelay);
    }
    
    // 当文档准备就绪时初始化
    if (document.readyState === 'complete') {
        initialize();
    } else {
        window.addEventListener('load', initialize);
    }
})();
