// ==UserScript==
// @name         ChatGPT Simple Swipe Copy
// @namespace    http://tampermonkey.net/
// @version      1.0
// @updateURL    https://aimoment29.github.io/PublicTemp/chatgptfingercopy.user.js
// @description  识别横向滑动手势并将整个p标签内容复制到ChatGPT输入框
// @author       xiniu
// @match        https://chat.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // 滑动检测配置
    const config = {
        minSwipeDistance: 40,    // 最小横向滑动距离（像素）
        maxSwipeTime: 1000,      // 最大滑动时间（毫秒）
        directionThreshold: 1.2  // 横向滑动判定阈值
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
                
                // 找到ChatGPT输入框
                const chatInput = document.querySelector('textarea[data-id="root"]');
                if (chatInput && text) {
                    // 将文本填入输入框
                    chatInput.value = text;
                    
                    // 触发输入事件
                    const inputEvent = new Event('input', { bubbles: true });
                    chatInput.dispatchEvent(inputEvent);
                    
                    // 聚焦到输入框
                    chatInput.focus();
                    
                    // 显示反馈
                    showFeedback(text);
                }
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
    
    // 显示反馈提示
    function showFeedback(text) {
        const feedback = document.createElement('div');
        feedback.style.position = 'fixed';
        feedback.style.bottom = '80px';
        feedback.style.left = '50%';
        feedback.style.transform = 'translateX(-50%)';
        feedback.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        feedback.style.color = 'white';
        feedback.style.padding = '8px 12px';
        feedback.style.borderRadius = '4px';
        feedback.style.zIndex = '10000';
        feedback.style.maxWidth = '80%';
        feedback.style.textOverflow = 'ellipsis';
        feedback.style.overflow = 'hidden';
        feedback.style.whiteSpace = 'nowrap';
        
        const previewText = text.length > 40 ? text.substring(0, 37) + '...' : text;
        feedback.textContent = `已复制: ${previewText}`;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            document.body.removeChild(feedback);
        }, 1500);
    }
})();