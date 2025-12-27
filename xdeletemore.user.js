// ==UserScript==
// @name         X Delete Discover More
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  删除X页面上的"Discover more"/"发现更多"元素及其后面的元素
// @updateURL    https://aimoment29.github.io/PublicTemp/xdeletemore.user.js
// @author       You
// @match        https://twitter.com/*
// @match        https://x.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

/**
 * 脚本功能说明：
 *
 * 1. 删除推荐内容：
 *    - 查找并隐藏包含 "Discover more"/"发现更多"/"更多发现" 文本的元素
 *    - 同时隐藏该元素之后的所有推荐内容
 *
 * 2. 多语言支持：
 *    - 支持英文 "Discover more"
 *    - 支持中文 "发现更多" 和 "更多发现"
 *
 * 3. 动态监控：
 *    - 使用 MutationObserver 监控 DOM 变化
 *    - 每3秒定期清理，确保新加载的内容也被处理
 */

(function() {
    'use strict';
    
    // 需要删除的文本列表（支持多语言）
    const targetTexts = ['Discover more', '发现更多', '更多发现'];
    
    // 清理函数 - 查找并删除目标元素
    function cleanDiscoverMore() {
        // 查找所有可能包含"Discover more"的容器
        const containers = document.querySelectorAll('div[data-testid="cellInnerDiv"]');
        
        // 遍历所有容器
        containers.forEach((container, index) => {
            // 查找容器内的所有span元素
            const spans = container.querySelectorAll('span');
            
            // 检查是否有span包含目标文本
            let foundTarget = false;
            for (const span of spans) {
                const spanText = span.textContent.trim();
                
                if (targetTexts.some(target => spanText.includes(target))) {
                    foundTarget = true;
                    console.log('找到目标文本:', spanText);
                    break;
                }
            }
            
            // 如果找到目标文本，删除当前div和后面的div
            if (foundTarget) {
                console.log('删除发现更多元素及其后续元素');
                
                // 删除当前容器
                container.style.display = 'none';
                
                // 尝试删除后续的容器
                const nextContainers = Array.from(containers).slice(index + 1);
                for (const nextContainer of nextContainers) {
                    nextContainer.style.display = 'none';
                }
            }
        });
    }
    
    // 创建一个MutationObserver监视DOM变化
    function observeChanges() {
        const observer = new MutationObserver((mutations) => {
            // 当DOM变化时，尝试清理"Discover more"元素
            cleanDiscoverMore();
        });
        
        // 开始观察document.body的子树变化
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('X Delete Discover More: 开始监控页面变化');
    }
    
    // 初始清理
    function initialize() {
        // 首次运行清理
        cleanDiscoverMore();
        
        // 设置观察器监控变化
        observeChanges();
        
        // 定期清理，以防观察器错过某些更新
        setInterval(cleanDiscoverMore, 3000);
    }
    
    // 确保页面加载完成后再初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    console.log('X Delete Discover More 脚本已加载');
})();
