// ==UserScript==
// @name         notebooklm-speed
// @namespace    http://tampermonkey.net/
// @version      1.0
// @updateURL    https://aimoment29.github.io/PublicTemp/notebooklmspeed.user.js
// @description  自动设置notebooklm的播放速度为1.8倍速
// @match        https://notebooklm.google.com/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    // 目标播放速度
    const targetSpeed = 1.8;
    // 执行状态标志 - 确保只执行一次
    let hasExecuted = false;
    
    // 更精确地检测more_vert图标
    function findMoreVertIcon() {
      // 使用更严格的选择器，确保只匹配播放控制相关的more_vert图标
      const allMatIcons = document.querySelectorAll('mat-icon.google-symbols');
      
      // 从所有mat-icon中筛选出确实包含more_vert文本的图标
      const moreIcons = Array.from(allMatIcons).filter(icon => {
        return icon.textContent && 
               icon.textContent.trim() === 'more_vert' &&
               // 确保位于播放控件区域，不是页面其他区域的菜单
               (icon.closest('.audio-controls') || 
                icon.closest('.player-controls') || 
                icon.closest('.playback-controls') ||
                // 查找可能在附近的播放或音频相关元素
                icon.closest('div')?.querySelector('audio') ||
                icon.closest('[aria-label*="playback"]') ||
                icon.closest('[aria-label*="audio"]'));
      });
      
      return moreIcons.length > 0 ? moreIcons[0] : null;
    }
    
    // 设置播放速度的完整流程
    function setSpeedTo18x() {
      if (hasExecuted) return; // 如果已执行过，不再执行
      
      // 寻找正确的more_vert图标
      const moreIcon = findMoreVertIcon();
      
      if (!moreIcon) {
        console.log('未找到播放控件相关的more_vert图标，操作终止');
        return;
      }
      
      console.log('找到播放控件的more_vert图标，点击中...');
      hasExecuted = true; // 标记为已执行
      moreIcon.click();
      
      // 步骤2: 等待菜单出现，然后查找速度选项
      setTimeout(() => {
        // 查找菜单项，更精确的选择器
        const menuItems = document.querySelectorAll('.mat-mdc-menu-content .mat-mdc-menu-item');
        
        if (menuItems.length === 0) {
          console.log('未找到菜单项，可能菜单未打开，操作终止');
          return;
        }
        
        console.log(`找到${menuItems.length}个菜单项`);
        
        // 查找包含"速度"或"Speed"的菜单项
        const speedMenuItem = Array.from(menuItems).find(item => {
          const text = item.textContent || '';
          return text.toLowerCase().includes('速度') || 
                 text.toLowerCase().includes('speed') ||
                 text.match(/\d\.?\d*x/); // 匹配如 1.0x 这样的格式
        });
        
        if (!speedMenuItem) {
          console.log('未找到速度菜单项，操作终止');
          return;
        }
        
        console.log('找到速度菜单项，点击中...', speedMenuItem.textContent);
        speedMenuItem.click();
        
        // 步骤3: 等待速度子菜单出现，然后点击1.8x选项
        setTimeout(() => {
          // 使用更精确的选择器查找最新打开的菜单面板中的选项
          const speedPanels = document.querySelectorAll('.mat-mdc-menu-panel');
          const latestPanel = speedPanels[speedPanels.length - 1]; // 最后打开的菜单面板
          
          if (!latestPanel) {
            console.log('未找到速度子菜单面板，操作终止');
            return;
          }
          
          const speedOptions = latestPanel.querySelectorAll('.mat-mdc-menu-item');
          console.log(`找到${speedOptions.length}个速度选项`);
          
          if (speedOptions.length === 0) {
            console.log('未找到速度选项，操作终止');
            return;
          }
          
          // 查找1.8x选项
          const option18x = Array.from(speedOptions).find(option => {
            return option.textContent && option.textContent.includes('1.8');
          });
          
          if (option18x) {
            console.log('找到1.8x选项，点击中...');
            option18x.click();
            console.log('已成功设置1.8x播放速度');
          } else {
            console.log('未找到1.8x选项，操作终止');
          }
        }, 500);
      }, 500);
    }
    
    // 设置MutationObserver以监视图标和控制元素的出现
    function watchForControls() {
      const observer = new MutationObserver((mutations) => {
        // 如果已执行过，不再检查
        if (hasExecuted) {
          observer.disconnect();
          return;
        }
        
        // 检查是否有播放控件相关的more_vert图标
        const moreIcon = findMoreVertIcon();
        
        if (moreIcon) {
          console.log('检测到播放控件及more_vert图标，准备设置1.8倍速...');
          // 等待界面稳定后执行
          setTimeout(() => {
            setSpeedTo18x();
            // 执行完成后断开观察器
            observer.disconnect();
          }, 1000);
        }
      });
      
      // 观察整个文档的变化
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });
      
      console.log('已设置对播放控件的监控');
      
      // 设置安全停止机制，30秒后如果还未执行则停止监控
      setTimeout(() => {
        if (!hasExecuted) {
          console.log('30秒超时，未检测到播放控件，停止监控');
          observer.disconnect();
        }
      }, 30000);
    }
    
    // 初始检查
    const initialIcon = findMoreVertIcon();
    if (initialIcon) {
      console.log('页面加载后立即找到播放控件，准备设置1.8倍速...');
      // 等待界面稳定
      setTimeout(setSpeedTo18x, 1000);
    } else {
      console.log('页面加载后未找到播放控件，开始监控...');
      watchForControls();
    }
    
    console.log('1.8倍速自动设置脚本已启动');
  })();