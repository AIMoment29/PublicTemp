// ==UserScript==
// @name         ChatGPT Swipe to Input
// @namespace    http://tampermonkey.net/
// @version      1.3
// @updateURL    https://aimoment29.github.io/PublicTemp/chatgptfingercopy.user.js
// @description  检测横向滑动并将文本填入ChatGPT输入框
// @author       xiniu
// @match        https://chatgpt.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // 滑动检测配置
    const config = {
        minSwipeDistance: 40,     // 最小横向滑动距离（像素）
        maxSwipeTime: 1000,       // 最大滑动时间（毫秒）
        directionThreshold: 1.2   // 横向滑动判定阈值（水平/垂直距离比率）
    };
    
    // 初始化触摸变量
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let touchElement = null;
    
    // 监听触摸开始事件
    document.addEventListener('touchstart', function(event) {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        touchStartTime = new Date().getTime();
        touchElement = document.elementFromPoint(touchStartX, touchStartY);
    }, false);
    
    // 监听触摸结束事件
    document.addEventListener('touchend', function(event) {
        const touchEndX = event.changedTouches[0].clientX;
        const touchEndY = event.changedTouches[0].clientY;
        const touchEndTime = new Date().getTime();
        
        // 计算滑动距离和时间
        const distanceX = Math.abs(touchEndX - touchStartX);
        const distanceY = Math.abs(touchEndY - touchStartY);
        const elapsedTime = touchEndTime - touchStartTime;
        
        // 判断是否为有效的横向滑动
        const isHorizontalSwipe = distanceX > distanceY * config.directionThreshold;
        const isValidSwipe = isHorizontalSwipe && distanceX > config.minSwipeDistance && elapsedTime < config.maxSwipeTime;
        
        if (isValidSwipe && touchElement) {
            // 查找包含触摸元素的 p 标签
            const paragraphElement = findParentParagraph(touchElement);
            
            if (paragraphElement) {
                // 获取整个p标签的文本内容
                const text = paragraphElement.textContent.trim();

                // 弹出文本内容
                alert('滑动元素文本内容：\n' + text);
                
                // 找到ChatGPT输入框
                const chatInput = document.querySelector('textarea[data-virtualkeyboard="true"]');
                if (chatInput && text) {
                    // 获取当前输入框内容
                    const currentText = chatInput.value;
                    
                    // 将文本填入输入框并添加换行符
                    chatInput.value = currentText + (currentText ? '\n' : '') + text + '\n';
                    
                    // 触发输入事件以更新输入框高度和内部状态
                    const inputEvent = new Event('input', { bubbles: true });
                    chatInput.dispatchEvent(inputEvent);
                    
                    // 聚焦到输入框
                    chatInput.focus();
                    
                    // 滚动输入框到底部
                    // chatInput.scrollTop = chatInput.scrollHeight;

                }
                
                // 显示滑动距离 (调试用)
                console.log(`检测到横向滑动: ${distanceX}px，垂直距离: ${distanceY}px，时间: ${elapsedTime}ms`);
            }
        }
    }, false);
    
    // 查找包含元素的最近的p标签
    function findParentParagraph(element) {
        // 如果元素本身就是p标签，直接返回
        if (element.tagName === 'P') {
            return element;
        }
        
        // 向上查找最近的p标签
        let current = element;
        while (current && current !== document.body) {
            if (current.tagName === 'P') {
                return current;
            }
            
            // 如果找不到p标签但是当前是消息元素，也可以使用
            if (current.classList && 
                (current.classList.contains('message') || 
                 current.classList.contains('markdown') || 
                 current.classList.contains('text-message'))) {
                return current;
            }
            
            current = current.parentElement;
        }
        
        // 如果没有找到p标签，尝试从触摸元素开始查找任何子p标签
        const pElements = element.querySelectorAll('p');
        if (pElements.length > 0) {
            // 返回第一个p标签
            return pElements[0];
        }
        
        // 如果实在找不到p标签，返回原始元素
        return element;
    }
})();