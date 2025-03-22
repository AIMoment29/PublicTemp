// ==UserScript==
// @name         ChatGPT Swipe to Input
// @namespace    http://tampermonkey.net/
// @version      1.11
// @updateURL    https://aimoment29.github.io/PublicTemp/chatgptfingercopy.user.js
// @description  检测横向滑动并将文本填入ChatGPT输入框，不触发输入法弹出
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
                
                // 输入文本到ChatGPT编辑器
                insertTextToChatGPT(text);
                
                // 在控制台显示调试信息
                console.log(`检测到有效滑动，文本: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
            }
        }
    }, false);
    
    // 将文本插入到ChatGPT编辑器
    function insertTextToChatGPT(text) {
        // 首先尝试找到ProseMirror编辑器元素
        const editor = document.querySelector('[contenteditable="true"].ProseMirror');
        
        if (editor) {
            // 聚焦编辑器
            editor.focus();
            
            // 确保光标在编辑器末尾
            moveCursorToEnd(editor);
            
            // 方法1: 使用execCommand插入文本（较老但兼容性好）
            try {
                // 创建文本节点
                const textWithNewline = text + '\n';
                
                // 使用document.execCommand插入文本
                document.execCommand('insertText', false, textWithNewline);
                
                // 取消编辑器焦点，防止输入法弹出
                removeEditorFocus();
                return;
            } catch (e) {
                console.error("execCommand方法失败:", e);
            }
            
            // 方法2: 如果execCommand失败，尝试模拟键盘输入
            try {
                // 确保光标在编辑器末尾
                moveCursorToEnd(editor);
                
                // 创建并分发input事件
                const inputEvent = new InputEvent('input', {
                    bubbles: true,
                    cancelable: true,
                    inputType: 'insertText',
                    data: text + '\n'
                });
                
                editor.dispatchEvent(inputEvent);
                
                // 取消编辑器焦点，防止输入法弹出
                removeEditorFocus();
                return;
            } catch (e) {
                console.error("InputEvent方法失败:", e);
            }
            
            // 方法3: 如果上面方法都失败，尝试直接追加文本节点
            try {
                // 确保光标在编辑器末尾
                moveCursorToEnd(editor);
                
                // 创建文本节点
                const textNode = document.createTextNode(text + '\n');
                
                // 获取当前选择
                const selection = window.getSelection();
                const range = selection.getRangeAt(0);
                
                // 插入文本
                range.insertNode(textNode);
                
                // 取消编辑器焦点，防止输入法弹出
                removeEditorFocus();
                return;
            } catch (e) {
                console.error("直接DOM操作方法失败:", e);
            }
        } else {
            // 如果找不到编辑器，输出错误日志
            console.error("找不到ChatGPT编辑器组件，请更新选择器");
        }
    }
    
    // 将光标移动到编辑器末尾
    function moveCursorToEnd(editor) {
        try {
            // 获取选择对象
            const selection = window.getSelection();
            const range = document.createRange();
            
            // 如果编辑器有子节点
            if (editor.childNodes.length > 0) {
                const lastNode = editor.lastChild;
                
                // 如果最后一个节点是文本节点
                if (lastNode.nodeType === Node.TEXT_NODE) {
                    range.setStart(lastNode, lastNode.length);
                    range.setEnd(lastNode, lastNode.length);
                } 
                // 如果最后一个节点是元素节点
                else {
                    range.selectNodeContents(lastNode);
                    range.collapse(false); // false表示折叠到末尾
                }
            } else {
                // 如果编辑器是空的
                range.selectNodeContents(editor);
                range.collapse(false);
            }
            
            // 应用范围
            selection.removeAllRanges();
            selection.addRange(range);
        } catch (e) {
            console.error("移动光标到末尾失败:", e);
        }
    }
    
    // 移除编辑器焦点，防止输入法弹出
    function removeEditorFocus() {
        try {
            // 延时略微延后取消焦点，确保文本已插入
            setTimeout(() => {
                // 创建一个隐形的按钮元素
                const dummyElement = document.createElement('button');
                dummyElement.style.position = 'absolute';
                dummyElement.style.left = '-9999px';
                dummyElement.style.top = '-9999px';
                dummyElement.style.opacity = '0';
                dummyElement.tabIndex = -1;
                
                // 添加到文档
                document.body.appendChild(dummyElement);
                
                // 聚焦到这个不可见元素
                dummyElement.focus();
                
                // 清除选择
                if (window.getSelection) {
                    window.getSelection().removeAllRanges();
                }
                
                // 移除这个临时元素
                setTimeout(() => {
                    document.body.removeChild(dummyElement);
                }, 100);
            }, 50);
        } catch (e) {
            console.error("移除焦点失败:", e);
        }
    }
    
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