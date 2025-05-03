// ==UserScript==
// @name         ChatGPT Swipe to Input
// @namespace    http://tampermonkey.net/
// @version      1.21
// @updateURL    https://aimoment29.github.io/PublicTemp/chatgptfingercopy.user.js
// @description  检测从左向右的单指横向滑动并将文本填入ChatGPT输入框，不触发输入法弹出，防止重复输入，显示成功方法
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
        directionThreshold: 1.2,  // 横向滑动判定阈值（水平/垂直距离比率）
        requireRightDirection: true, // 是否要求只有从左向右滑动有效
        singleFingerOnly: true    // 是否只接受单指滑动
    };
    
    // 用于记录已输入的文本，防止重复输入
    let recentInputs = new Set();
    
    // 初始化触摸变量
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let touchElement = null;
    let isSingleFingerTouch = false; // 标记是否是单指触摸开始的
    
    // 监听触摸开始事件
    document.addEventListener('touchstart', function(event) {
        // 检查是否只有一根手指触摸
        if (config.singleFingerOnly) {
            if (event.touches.length !== 1) {
                isSingleFingerTouch = false;
                return;
            }
            isSingleFingerTouch = true;
        }
        
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        touchStartTime = new Date().getTime();
        touchElement = document.elementFromPoint(touchStartX, touchStartY);
    }, false);
    
    // 监听触摸过程中的事件，检测是否变成了多指触摸
    document.addEventListener('touchmove', function(event) {
        if (config.singleFingerOnly && isSingleFingerTouch) {
            // 如果在移动过程中变成了多指触摸，取消这次滑动
            if (event.touches.length > 1) {
                isSingleFingerTouch = false;
            }
        }
    }, false);
    
    // 监听触摸结束事件
    document.addEventListener('touchend', function(event) {
        // 如果要求单指操作但不是单指触摸开始的，直接返回
        if (config.singleFingerOnly && !isSingleFingerTouch) {
            return;
        }
        
        // 检查是否只有一根手指触摸结束
        if (config.singleFingerOnly && event.touches.length > 0) {
            // 如果还有其他手指在屏幕上，说明是多指操作
            return;
        }
        
        const touchEndX = event.changedTouches[0].clientX;
        const touchEndY = event.changedTouches[0].clientY;
        const touchEndTime = new Date().getTime();
        
        // 计算滑动距离和时间
        const distanceX = touchEndX - touchStartX; // 不取绝对值，保留方向信息
        const distanceY = Math.abs(touchEndY - touchStartY);
        const elapsedTime = touchEndTime - touchStartTime;
        
        // 检查方向 - 如果启用了方向限制，检查是否是从左向右滑动
        const isRightDirection = !config.requireRightDirection || distanceX > 0;
        
        // 判断是否为有效的横向滑动
        const isHorizontalSwipe = Math.abs(distanceX) > distanceY * config.directionThreshold;
        const isValidSwipe = isHorizontalSwipe && 
                            Math.abs(distanceX) > config.minSwipeDistance && 
                            elapsedTime < config.maxSwipeTime &&
                            isRightDirection;
        
        if (isValidSwipe && touchElement) {
            // 检查是否在表格单元格内
            const tableCell = findTableCell(touchElement);
            if (tableCell) {
                // 如果是表格单元格，只获取单元格文本
                const cellText = tableCell.textContent.trim();
                
                // 检查是否已经输入过这段文本
                if (!recentInputs.has(cellText) && cellText) {
                    // 输入文本到ChatGPT编辑器
                    insertTextToChatGPT(cellText);
                    
                    // 记录这段文本已被输入
                    recentInputs.add(cellText);
                    
                    // 在控制台显示调试信息
                    console.log(`检测到表格单元格滑动，文本: ${cellText.substring(0, 50)}${cellText.length > 50 ? '...' : ''}`);
                } else if (cellText) {
                    console.log(`跳过重复表格单元格文本: ${cellText.substring(0, 50)}${cellText.length > 50 ? '...' : ''}`);
                }
            } else {
                // 查找包含触摸元素的段落
                const paragraphElement = findParentParagraph(touchElement);
                
                if (paragraphElement) {
                    // 获取滑动覆盖的完整行
                    const completeLines = getCompleteLinesInSwipeRange(paragraphElement, touchStartY, touchEndY);
                    
                    if (completeLines && completeLines.length > 0) {
                        // 合并完整行，保留换行符
                        const linesText = completeLines.join('\n');
                        
                        // 如果成功获取到滑动范围内的完整行
                        if (!recentInputs.has(linesText) && linesText) {
                            // 输入文本到ChatGPT编辑器
                            insertTextToChatGPT(linesText);
                            
                            // 记录这段文本已被输入
                            recentInputs.add(linesText);
                            
                            // 在控制台显示调试信息
                            console.log(`检测到滑动覆盖${completeLines.length}行，文本: ${linesText.substring(0, 50)}${linesText.length > 50 ? '...' : ''}`);
                        } else if (linesText) {
                            console.log(`跳过重复滑动文本: ${linesText.substring(0, 50)}${linesText.length > 50 ? '...' : ''}`);
                        }
                    } else {
                        // 如果无法获取滑动范围文本，回退到整个段落
                        const fullText = paragraphElement.textContent.trim();
                        
                        if (fullText && !recentInputs.has(fullText)) {
                            // 输入文本到ChatGPT编辑器
                            insertTextToChatGPT(fullText);
                            
                            // 记录这段文本已被输入
                            recentInputs.add(fullText);
                            
                            // 在控制台显示调试信息
                            console.log(`检测到段落滑动(回退)，文本: ${fullText.substring(0, 50)}${fullText.length > 50 ? '...' : ''}`);
                        } else if (fullText) {
                            console.log(`跳过重复段落文本: ${fullText.substring(0, 50)}${fullText.length > 50 ? '...' : ''}`);
                        }
                    }
                }
            }
        }
        
        // 重置单指触摸标记
        isSingleFingerTouch = false;
    }, false);
    
    // 获取滑动范围内的完整行
    function getCompleteLinesInSwipeRange(element, startY, endY) {
        try {
            // 确保开始和结束坐标是有序的（从上到下）
            const topY = Math.min(startY, endY);
            const bottomY = Math.max(startY, endY);
            
            // 获取段落的位置和尺寸
            const rect = element.getBoundingClientRect();
            
            // 如果滑动范围完全在段落元素之外，返回null
            if (bottomY < rect.top || topY > rect.bottom) {
                return null;
            }
            
            // 收集段落中的所有行及其位置信息
            const allLines = [];
            const allLineRects = [];
            
            // 方法1: 使用特殊选择器尝试找出预格式化文本中的行（如代码块）
            const preElements = element.querySelectorAll('pre, code');
            if (preElements.length > 0) {
                // 处理代码块或预格式化文本
                for (const preElement of preElements) {
                    if (!preElement.textContent.trim()) continue;
                    
                    // 代码块通常已经有换行符，按换行符分割
                    const codeLines = preElement.textContent.split('\n');
                    if (codeLines.length > 1) {
                        // 这是一个多行代码块，尝试估算每行的高度
                        const preRect = preElement.getBoundingClientRect();
                        const lineHeight = preRect.height / codeLines.length;
                        
                        // 根据位置估算被滑动覆盖的行
                        const firstLineIndex = Math.max(0, Math.floor((topY - preRect.top) / lineHeight));
                        const lastLineIndex = Math.min(codeLines.length - 1, Math.ceil((bottomY - preRect.top) / lineHeight));
                        
                        return codeLines.slice(firstLineIndex, lastLineIndex + 1).filter(line => line.trim());
                    }
                }
            }
            
            // 方法2: 分析普通文本段落的行结构
            // 分析段落中的文本节点，尝试识别行
            const walker = document.createTreeWalker(
                element, 
                NodeFilter.SHOW_TEXT, 
                null, 
                false
            );
            
            let node;
            let lineIndex = 0;
            while (node = walker.nextNode()) {
                if (!node.textContent.trim()) continue;
                
                const range = document.createRange();
                range.selectNodeContents(node);
                
                const rects = range.getClientRects();
                
                // 对于每个文本矩形，我们假设它代表一个行或行的一部分
                for (let i = 0; i < rects.length; i++) {
                    const rect = rects[i];
                    if (rect.width < 20) continue; // 跳过非常窄的矩形，可能是行首或行尾
                    
                    // 存储行位置信息
                    allLineRects.push({
                        top: rect.top,
                        bottom: rect.bottom,
                        middle: (rect.top + rect.bottom) / 2,
                        index: lineIndex
                    });
                    
                    // 为简单起见，我们假设每个文本节点的每个矩形是一个单独的行
                    // 实际上可能会更复杂，特别是当有内联样式时
                    if (rects.length === 1) {
                        // 单行文本节点
                        allLines.push(node.textContent.trim());
                    } else {
                        // 多行文本节点，需要按行分割
                        // 这是一个简化的方法，假设文本均匀分布在各行
                        const approxLinesCount = rects.length;
                        const textPerLine = Math.ceil(node.textContent.length / approxLinesCount);
                        
                        // 为这个矩形分配一部分文本
                        const startChar = i * textPerLine;
                        const endChar = Math.min(startChar + textPerLine, node.textContent.length);
                        let lineText = node.textContent.substring(startChar, endChar).trim();
                        
                        // 对于已经有换行的文本，可以尝试更智能地分割
                        const splitByNewline = node.textContent.split('\n');
                        if (splitByNewline.length > 1 && splitByNewline.length >= rects.length) {
                            lineText = splitByNewline[i].trim();
                        }
                        
                        allLines.push(lineText);
                    }
                    
                    lineIndex++;
                }
            }
            
            // 如果没有找到行，尝试备选方法
            if (allLines.length === 0) {
                // 备选方法：直接按换行符分割文本
                const fullText = element.textContent.trim();
                const lines = fullText.split('\n').filter(line => line.trim());
                
                if (lines.length <= 1) {
                    // 如果只有一行或没有行，返回全文
                    return [fullText];
                }
                
                // 在没有明确位置信息的情况下，尝试估算覆盖了哪些行
                const elementHeight = rect.height;
                const lineHeight = elementHeight / lines.length;
                
                const startLine = Math.max(0, Math.floor((topY - rect.top) / lineHeight));
                const endLine = Math.min(lines.length - 1, Math.ceil((bottomY - rect.top) / lineHeight));
                
                return lines.slice(startLine, endLine + 1);
            }
            
            // 找出滑动覆盖的行
            const coveredLineIndices = new Set();
            for (const lineRect of allLineRects) {
                // 如果行的中点在滑动范围内，或者滑动范围覆盖了行的大部分
                if (lineRect.middle >= topY && lineRect.middle <= bottomY) {
                    coveredLineIndices.add(lineRect.index);
                }
            }
            
            // 根据覆盖的行索引获取完整行文本
            const coveredLines = Array.from(coveredLineIndices).map(index => allLines[index]);
            
            return coveredLines.length > 0 ? coveredLines : null;
            
        } catch (e) {
            console.error('获取完整行失败:', e);
            return null;
        }
    }
    
    // 查找表格单元格
    function findTableCell(element) {
        // 检查元素本身是否为td或th
        if (element.tagName === 'TD' || element.tagName === 'TH') {
            return element;
        }
        
        // 向上查找最近的td或th
        let current = element;
        while (current && current !== document.body) {
            if (current.tagName === 'TD' || current.tagName === 'TH') {
                return current;
            }
            current = current.parentElement;
        }
        
        return null; // 没有找到表格单元格
    }
    
    // 添加touchcancel事件处理，重置状态
    document.addEventListener('touchcancel', function() {
        isSingleFingerTouch = false;
    }, false);
    
    // 监听输入框变化，检测清空情况
    function checkInputFieldEmpty() {
        const editor = document.querySelector('[contenteditable="true"].ProseMirror');
        if (editor && editor.textContent.trim() === '') {
            // 如果输入框是空的，清空记录的输入，允许重新添加相同文本
            recentInputs.clear();
            console.log('输入框已清空，重置文本记录');
        }
    }
    
    // 定期检查输入框是否为空
    setInterval(checkInputFieldEmpty, 1000);
    
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
                const result = document.execCommand('insertText', false, textWithNewline);
                
                if (result) {
                    // 取消编辑器焦点，防止输入法弹出
                    // removeEditorFocus();
                    return;
                }
            } catch (e) {
                console.error("execCommand方法失败:", e);
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
    
    // 监听输入框提交事件，清空记录的输入
    document.addEventListener('click', function(event) {
        // 检查是否点击了发送按钮
        if (event.target.closest('button[data-testid="send-button"]')) {
            // 点击发送按钮后，清空记录的输入
            setTimeout(() => {
                recentInputs.clear();
                console.log('消息已发送，重置文本记录');
            }, 500); // 等待500毫秒，确保消息已发送
        }
    }, false);
})();