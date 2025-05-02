// ==UserScript==
// @name         notebooklm-speed
// @namespace    http://tampermonkey.net/
// @version      1.1
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
    // 标记当前是否正在进行设置操作
    let isSettingSpeed = false;
    
    // 更精确地检测播放控件的菜单图标，支持多语言
    function findPlaybackMenuIcon() {
      // 使用更宽泛的选择器，不再依赖于固定的"more_vert"文本
      const allMatIcons = document.querySelectorAll('mat-icon.google-symbols');
      
      // 从所有mat-icon中筛选出可能是播放控件菜单的图标
      const menuIcons = Array.from(allMatIcons).filter(icon => {
        // 检查是否是竖排三点菜单图标（more_vert）或其他语言版本的同类图标
        const isMenuIcon = icon.textContent && 
                         (icon.textContent.trim() === 'more_vert' ||
                          icon.textContent.trim() === '更多' ||
                          icon.textContent.trim() === '菜单' ||
                          icon.textContent.trim() === 'menu' ||
                          icon.textContent.trim().includes('vert'));
        
        // 确保位于播放控件区域，不是页面其他区域的菜单
        const isInPlayerControls = icon.closest('.audio-controls') || 
                                icon.closest('.player-controls') || 
                                icon.closest('.playback-controls') ||
                                // 查找可能在附近的播放或音频相关元素
                                icon.closest('div')?.querySelector('audio') ||
                                icon.closest('[aria-label*="playback"]') ||
                                icon.closest('[aria-label*="audio"]') ||
                                icon.closest('[aria-label*="播放"]') ||
                                icon.closest('[aria-label*="音频"]');
                                
        return isMenuIcon && isInPlayerControls;
      });
      
      return menuIcons.length > 0 ? menuIcons[0] : null;
    }
    
    // 设置播放速度的完整流程
    function setSpeedTo18x() {
      // 如果已执行成功，或者当前正在进行设置操作，则不再执行
      if (hasExecuted || isSettingSpeed) return;
      
      // 寻找播放控件的菜单图标
      const menuIcon = findPlaybackMenuIcon();
      
      if (!menuIcon) {
        console.log('未找到播放控件相关的菜单图标，继续监控...');
        return;
      }
      
      console.log('找到播放控件的菜单图标，点击中...');
      // 标记正在进行设置，避免重复操作
      isSettingSpeed = true;
      menuIcon.click();
      
      // 步骤2: 等待菜单出现，然后查找速度选项
      setTimeout(() => {
        // 查找菜单项，更精确的选择器
        const menuItems = document.querySelectorAll('.mat-mdc-menu-content .mat-mdc-menu-item');
        
        if (menuItems.length === 0) {
          console.log('未找到菜单项，可能菜单未打开，重置状态继续监控...');
          isSettingSpeed = false; // 重置设置中状态，允许下次尝试
          return;
        }
        
        console.log(`找到${menuItems.length}个菜单项`);
        
        // 查找包含"速度"、"Speed"或数字+x的菜单项，支持多语言
        const speedMenuItem = Array.from(menuItems).find(item => {
          const text = item.textContent || '';
          return text.toLowerCase().includes('速度') || 
                 text.toLowerCase().includes('speed') ||
                 text.toLowerCase().includes('playback') ||
                 text.match(/\d\.?\d*x/); // 匹配如 1.0x 这样的格式
        });
        
        if (!speedMenuItem) {
          console.log('未找到速度菜单项，重置状态继续监控...');
          isSettingSpeed = false; // 重置设置中状态，允许下次尝试
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
            console.log('未找到速度子菜单面板，重置状态继续监控...');
            isSettingSpeed = false; // 重置设置中状态，允许下次尝试
            return;
          }
          
          const speedOptions = latestPanel.querySelectorAll('.mat-mdc-menu-item');
          console.log(`找到${speedOptions.length}个速度选项`);
          
          if (speedOptions.length === 0) {
            console.log('未找到速度选项，重置状态继续监控...');
            isSettingSpeed = false; // 重置设置中状态，允许下次尝试
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
            // 只有在成功点击1.8x选项后才设置hasExecuted为true
            hasExecuted = true;
          } else {
            console.log('未找到1.8x选项，重置状态继续监控...');
            isSettingSpeed = false; // 重置设置中状态，允许下次尝试
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
        
        // 检查是否有播放控件相关的菜单图标
        const menuIcon = findPlaybackMenuIcon();
        
        if (menuIcon) {
          console.log('检测到播放控件及菜单图标，准备设置1.8倍速...');
          // 等待界面稳定后执行
          setTimeout(() => {
            setSpeedTo18x();
            // 只有当hasExecuted为true时（表示成功设置）才断开观察器
            if (hasExecuted) {
              observer.disconnect();
              console.log('成功设置倍速，停止监控');
            }
          }, 1000);
        }
      });
      
      // 观察整个文档的变化
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });
      
      console.log('已设置对播放控件的监控，将持续监控直到成功设置1.8倍速');
      
      // 移除30秒超时限制
    }
    
    // 初始检查
    const initialIcon = findPlaybackMenuIcon();
    if (initialIcon) {
      console.log('页面加载后立即找到播放控件，准备设置1.8倍速...');
      // 等待界面稳定
      setTimeout(setSpeedTo18x, 1000);
      
      // 如果初始尝试失败，开始持续监控
      setTimeout(() => {
        if (!hasExecuted) {
          console.log('初始尝试未成功，开始持续监控...');
          watchForControls();
        }
      }, 3000); // 给初始尝试3秒时间
    } else {
      console.log('页面加载后未找到播放控件，开始监控...');
      watchForControls();
    }
    
    console.log('1.8倍速自动设置脚本已启动（持续监控模式）');
  })();