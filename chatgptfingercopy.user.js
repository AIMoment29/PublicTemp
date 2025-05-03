// ==UserScript==
// @name         ChatGPT Swipe to Input
// @namespace    http://tampermonkey.net/
// @version      1.22
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
                    // 使用新方法识别滑动覆盖的完整行
                    const fullLines = extractFullLinesFromSwipe(paragraphElement, touchStartY, touchEndY);
                    
                    if (fullLines && fullLines.length > 0) {
                        // 合并完整行，保留换行符
                        const linesText = fullLines.join('\n');
                        
                        // 检查是否已经输入过这段文本
                        if (!recentInputs.has(linesText) && linesText) {
                            // 输入文本到ChatGPT编辑器
                            insertTextToChatGPT(linesText);
                            
                            // 记录这段文本已被输入
                            recentInputs.add(linesText);
                            
                            // 在控制台显示调试信息
                            console.log(`检测到滑动覆盖${fullLines.length}行，文本: ${linesText.substring(0, 50)}${linesText.length > 50 ? '...' : ''}`);
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
    
    // 新方法：使用直接和简单的方式提取滑动覆盖的完整行内容
    function extractFullLinesFromSwipe(element, startY, endY) {
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
            
            // 提取文本和处理逻辑
            
            // 首先检查是否为代码块，代码块通常使用pre/code标签
            const preElements = element.querySelectorAll('pre, code');
            if (preElements.length > 0) {
                for (const preElement of preElements) {
                    const preRect = preElement.getBoundingClientRect();
                    
                    // 检查滑动是否覆盖了代码块
                    if (!(bottomY < preRect.top || topY > preRect.bottom)) {
                        // 找到了被滑动覆盖的代码块
                        const codeText = preElement.textContent;
                        const codeLines = codeText.split('\n');
                        
                        // 估算代码块中的行高
                        const lineHeight = preRect.height / codeLines.length || 20; // 默认行高20px
                        
                        // 计算滑动覆盖的行范围
                        const startLineIndex = Math.max(0, Math.floor((topY - preRect.top) / lineHeight));
                        const endLineIndex = Math.min(codeLines.length - 1, Math.ceil((bottomY - preRect.top) / lineHeight));
                        
                        // 提取完整行范围
                        return codeLines.slice(startLineIndex, endLineIndex + 1).filter(line => line.trim());
                    }
                }
            }
            
            // 处理普通段落文本 - 最简单的方法：把所有文本按换行符拆分成行
            const allText = element.innerText || element.textContent; // innerText保留换行格式
            const lines = allText.split('\n').filter(line => line.trim());
            
            // 如果只有一行，直接返回
            if (lines.length <= 1) {
                return [allText.trim()];
            }
            
            // 尝试构建每一行的区域范围
            const lineRects = [];
            const lineHeight = rect.height / lines.length || 20; // 估算行高，备用方案
            
            // 更准确的方法：尝试使用Range获取每行的位置
            for (let i = 0; i < lines.length; i++) {
                // 创建一个容器来估算行位置
                const range = document.createRange();
                const textNodes = [];
                
                // 查找所有文本节点
                const walker = document.createTreeWalker(
                    element,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );
                
                let node;
                let textContent = '';
                while (node = walker.nextNode()) {
                    textContent += node.textContent;
                    textNodes.push(node);
                    
                    // 当积累的文本超过当前行所需文本量，计算位置
                    if (textContent.includes(lines[i])) {
                        // 找到了包含这一行的文本节点
                        range.selectNode(node);
                        const rangeRect = range.getBoundingClientRect();
                        
                        // 估算这一行的顶部位置
                        // 如果文本节点包含多行，需要按比例估算
                        const nodeLines = node.textContent.split('\n');
                        if (nodeLines.length > 1) {
                            const nodeLineIndex = nodeLines.findIndex(l => l.includes(lines[i]));
                            if (nodeLineIndex !== -1) {
                                const nodeLineTop = rangeRect.top + (nodeLineIndex * (rangeRect.height / nodeLines.length));
                                const nodeLineBottom = nodeLineTop + (rangeRect.height / nodeLines.length);
                                
                                lineRects.push({
                                    index: i,
                                    line: lines[i],
                                    top: nodeLineTop,
                                    bottom: nodeLineBottom,
                                    middle: (nodeLineTop + nodeLineBottom) / 2
                                });
                                
                                break;
                            }
                        }
                        
                        // 如果不能精确定位，使用估算
                        lineRects.push({
                            index: i,
                            line: lines[i],
                            estimated: true,
                            top: rect.top + (i * lineHeight),
                            bottom: rect.top + ((i + 1) * lineHeight),
                            middle: rect.top + (i + 0.5) * lineHeight
                        });
                        
                        break;
                    }
                }
                
                // 如果没找到，使用估算
                if (lineRects.length <= i) {
                    lineRects.push({
                        index: i,
                        line: lines[i],
                        estimated: true,
                        top: rect.top + (i * lineHeight),
                        bottom: rect.top + ((i + 1) * lineHeight),
                        middle: rect.top + (i + 0.5) * lineHeight
                    });
                }
            }
            
            // 算法改进：更宽松的行覆盖判断
            // 1. 如果行的任何部分在滑动范围内，或
            // 2. 如果滑动范围的任何部分在行内，则选择该行
            const selectedLines = [];
            for (const lineRect of lineRects) {
                // 检查行是否与滑动范围有交叉（更宽松的判断）
                const hasOverlap = !(lineRect.bottom < topY || lineRect.top > bottomY);
                if (hasOverlap) {
                    selectedLines.push(lineRect.line);
                }
            }
            
            return selectedLines.length > 0 ? selectedLines : lines;
            
        } catch (e) {
            console.error('提取完整行失败:', e);
            // 出错时返回整段文本，确保至少有内容
            return [element.textContent.trim()];
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