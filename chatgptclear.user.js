// ==UserScript==
// @name         ChatGPT Clear Button
// @namespace    http://tampermonkey.net/
// @version      2.1
// @updateURL    https://aimoment29.github.io/PublicTemp/chatgptclear.user.js
// @description  在ChatGPT页面添加一个简洁的清空按钮
// @author       xiniu
// @match        https://chatgpt.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';
    
    // 简化的配置项
    const config = {
        top: '80px',              // 按钮顶部位置
        right: '20px',            // 按钮右侧位置
        opacity: 0.3,             // 按钮透明度 (30%)
        zIndex: 2147483647        // 确保按钮在最上层
    };
    
    // 添加清空按钮
    function addClearButton() {
        // 检查按钮是否已存在
        if (document.getElementById('chatgpt-clear-button')) {
            return;
        }
        
        // 创建按钮
        const button = document.createElement('button');
        button.id = 'chatgpt-clear-button';
        button.textContent = 'clear';
        
        // 设置样式 - 简洁的圆形按钮，黑字白底黑框，30%透明度
        Object.assign(button.style, {
            position: 'fixed',
            top: config.top,
            right: config.right,
            width: '40px',
            height: '40px',
            padding: '0',
            backgroundColor: 'white',
            color: 'black',
            border: '1px solid black',
            borderRadius: '50%',
            fontWeight: 'normal',
            zIndex: config.zIndex.toString(),
            cursor: 'pointer',
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            textAlign: 'center',
            lineHeight: '40px',
            opacity: config.opacity.toString(),
            userSelect: 'none'
        });
        
        // 添加点击事件
        button.addEventListener('click', function() {
            clearChatGPTEditor();
        });
        
        // 添加到页面
        document.body.appendChild(button);
    }
    
    // 清空ChatGPT编辑器
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
    
    // 监听页面变化，确保按钮存在
    function setupButtonMaintenance() {
        // 创建观察器
        const observer = new MutationObserver(function() {
            if (!document.getElementById('chatgpt-clear-button')) {
                addClearButton();
            }
        });
        
        // 开始观察
        observer.observe(document.body, { childList: true, subtree: true });
        
        // 监听URL变化
        let lastUrl = location.href;
        setInterval(function() {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                setTimeout(addClearButton, 1000);
            }
        }, 1000);
    }
    
    // 初始化
    function initialize() {
        // 延迟添加按钮，确保页面加载完成
        setTimeout(function() {
            addClearButton();
            setupButtonMaintenance();
        }, 1000);
    }
    
    // 当页面加载完成时初始化
    if (document.readyState === 'complete') {
        initialize();
    } else {
        window.addEventListener('load', initialize);
    }
})();
