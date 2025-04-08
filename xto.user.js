// ==UserScript==
// @name         x-to-expander
// @namespace    http://tampermonkey.net/
// @version      2.2
// @updateURL    https://aimoment29.github.io/PublicTemp/xto.user.js
// @description  将 X/Twitter 的 t.co 短链接替换为原始链接
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        GM_xmlhttpRequest
// @run-at       document-idle
// @connect t.co
// @connect *
// ==/UserScript==

// 用于存储已处理过的链接
const processedUrls = new Map();
// 是否正在处理链接
let isProcessingLinks = false;
// 等待队列
const linkQueue = [];

function expandShortUrl(shortUrl) {
    // 如果已经处理过这个URL，直接返回缓存结果
    if (processedUrls.has(shortUrl)) {
        return Promise.resolve(processedUrls.get(shortUrl));
    }
    
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'GET',
            url: shortUrl,
            followRedirect: true,
            timeout: 5000, // 设置超时，避免长时间等待
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            onload: function(response) {
                let finalUrl = response.finalUrl;
                
                // 如果返回的finalUrl为空或与原始URL相同，尝试从响应体中获取
                if (!finalUrl || finalUrl === shortUrl) {
                    // 尝试从响应体中获取标题标签中的URL
                    const match = response.responseText.match(/<meta\s+http-equiv="refresh"\s+content="[^"]*url=([^"]*)"[^>]*>/i);
                    if (match && match[1]) {
                        finalUrl = match[1];
                    } else {
                        finalUrl = shortUrl; // 如果无法获取，返回原始URL
                    }
                }
                
                // 缓存结果
                processedUrls.set(shortUrl, finalUrl);
                resolve(finalUrl);
            },
            onerror: function(e) {
                processedUrls.set(shortUrl, shortUrl); // 缓存错误结果
                resolve(shortUrl); // 出错时返回原始链接
            },
            ontimeout: function() {
                processedUrls.set(shortUrl, shortUrl); // 缓存超时结果
                resolve(shortUrl); // 超时时返回原始链接
            }
        });
    });
}

// 处理单个链接
async function processLink(link) {
    const _href = link.href;
    
    // 跳过站内链接或已处理的链接
    if (_href.includes('x.com') || _href.includes('twitter.com') || 
        link.dataset.expanded === 'true') {
        return;
    }
    
    try {
        // 异步获取短链接的真实URL
        const fullUrl = await expandShortUrl(_href);

        console.log(fullUrl);
        
        if (fullUrl && fullUrl !== _href) {
            // 使用requestAnimationFrame确保DOM更新不阻塞UI
            requestAnimationFrame(() => {
                // 更新链接
                link.href = fullUrl;
                link.dataset.expanded = 'true';
                
                // 添加点击事件处理
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(fullUrl, '_blank');
                }, true);
            });
        }
    } catch (error) {
        // 错误处理
    }
}

// 批量处理链接队列
async function processLinkQueue() {
    if (isProcessingLinks || linkQueue.length === 0) {
        return;
    }
    
    isProcessingLinks = true;
    
    try {
        // 每次处理一小批链接，不阻塞主线程
        const batch = linkQueue.splice(0, 5); // 每批处理5个链接
        
        // 并行处理多个链接
        await Promise.all(batch.map(link => processLink(link)));
        
        // 如果队列中还有链接，使用setTimeout延迟处理
        if (linkQueue.length > 0) {
            setTimeout(processLinkQueue, 50); // 延迟50ms处理下一批
        }
    } finally {
        isProcessingLinks = false;
    }
}

// 查找并排队处理链接
function queueLinks() {
    const links = document.querySelectorAll('a[href*="t.co"], main a[data-immersive-translate-walked]');
    
    links.forEach(link => {
        // 如果链接未处理且不在队列中，加入队列
        if (!link.dataset.expanded && !link.dataset.queued) {
            link.dataset.queued = 'true';
            linkQueue.push(link);
        }
    });
    
    // 开始处理队列中的链接
    processLinkQueue();
}

// 使用requestIdleCallback在浏览器空闲时处理链接
function scheduleLinksProcessing() {
    if (window.requestIdleCallback) {
        requestIdleCallback(() => {
            queueLinks();
        }, { timeout: 2000 });
    } else {
        // 兼容不支持requestIdleCallback的浏览器
        setTimeout(queueLinks, 1000);
    }
}

// 监听页面变化，处理动态加载的内容
function observePageChanges() {
    // 使用防抖动函数减少频繁调用
    let debounceTimer;
    
    const observer = new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(scheduleLinksProcessing, 300);
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// 在页面完全加载后开始处理
if (document.readyState === 'complete') {
    scheduleLinksProcessing();
    observePageChanges();
} else {
    window.addEventListener('load', () => {
        // 延迟启动，让页面先完成初始渲染
        setTimeout(() => {
            scheduleLinksProcessing();
            observePageChanges();
        }, 1000);
    });
}
