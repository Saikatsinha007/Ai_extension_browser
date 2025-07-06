// Background service worker for AI Tab Assistant Pro
// Enhanced with professional features and better error handling

// Installation and setup
chrome.runtime.onInstalled.addListener((details) => {
  console.log('AI Tab Assistant Pro installed/updated');
  
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    // First-time installation
    handleFirstInstall();
  } else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
    // Extension update
    handleUpdate(details.previousVersion);
  }
});

// Handle first installation
async function handleFirstInstall() {
  try {
    // Check if API key exists
    const result = await chrome.storage.sync.get(['geminiApiKey']);
    
    if (!result.geminiApiKey) {
      // Open options page for API key setup
      await chrome.tabs.create({
        url: chrome.runtime.getURL('options.html'),
        active: true
      });
    }
    
    // Set default settings
    await chrome.storage.sync.set({
      version: '2.0',
      installDate: new Date().toISOString(),
      features: {
        screenshots: true,
        pageAnalysis: true,
        testGeneration: true,
        documentation: true
      },
      preferences: {
        autoAnalyze: false,
        detailedReports: true,
        saveHistory: true
      }
    });
    
    console.log('AI Tab Assistant Pro setup completed');
    
  } catch (error) {
    console.error('Setup error:', error);
  }
}

// Handle extension updates
async function handleUpdate(previousVersion) {
  try {
    console.log(`Updated from version ${previousVersion} to 2.0`);
    
    // Migrate settings if needed
    const settings = await chrome.storage.sync.get();
    if (!settings.version || settings.version !== '2.0') {
      await chrome.storage.sync.set({
        ...settings,
        version: '2.0',
        updateDate: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Update error:', error);
  }
}

// Enhanced message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request.action);
  
  switch (request.action) {
    case 'captureScreenshot':
      handleScreenshotCapture(sender, sendResponse);
      break;
      
    case 'captureFullPageScreenshot':
      handleFullPageScreenshot(sender, sendResponse);
      break;
      
    case 'getTabInfo':
      handleGetTabInfo(sender, sendResponse);
      break;
      
    case 'saveAnalysisHistory':
      handleSaveAnalysisHistory(request.data, sendResponse);
      break;
      
    case 'getAnalysisHistory':
      handleGetAnalysisHistory(sendResponse);
      break;
      
    case 'clearHistory':
      handleClearHistory(sendResponse);
      break;
      
    case 'exportData':
      handleExportData(request.format, sendResponse);
      break;
      
    default:
      console.warn('Unknown action:', request.action);
      sendResponse({ error: 'Unknown action' });
  }
  
  return true; // Keep the message channel open for async response
});

// Enhanced screenshot capture with error handling and optimization
async function handleScreenshotCapture(sender, sendResponse) {
  try {
    if (!sender.tab) {
      throw new Error('No active tab found');
    }
    
    // Check if tab is in a valid state
    if (sender.tab.url.startsWith('chrome://') || sender.tab.url.startsWith('chrome-extension://')) {
      throw new Error('Cannot capture screenshots of Chrome internal pages');
    }
    
    // Capture visible area with high quality
    const dataUrl = await chrome.tabs.captureVisibleTab(sender.tab.windowId, {
      format: 'png',
      quality: 95
    });
    
    if (!dataUrl) {
      throw new Error('Failed to capture screenshot - empty result');
    }
    
    // Validate that we got a proper image
    if (!dataUrl.startsWith('data:image/png;base64,')) {
      throw new Error('Invalid screenshot format received');
    }
    
    // Optional: Save screenshot to local storage for history
    try {
      await saveScreenshotToHistory(dataUrl, sender.tab);
    } catch (historyError) {
      console.warn('Failed to save screenshot to history:', historyError);
    }
    
    sendResponse({ 
      screenshot: dataUrl,
      timestamp: new Date().toISOString(),
      tabInfo: {
        title: sender.tab.title,
        url: sender.tab.url
      }
    });
    
  } catch (error) {
    console.error('Screenshot capture error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to capture screenshot';
    
    if (error.message.includes('Cannot capture')) {
      errorMessage = error.message;
    } else if (error.message.includes('permissions')) {
      errorMessage = 'Screenshot permission denied. Please refresh the page and try again.';
    } else if (error.message.includes('Extension context')) {
      errorMessage = 'Extension context invalidated. Please refresh the page and try again.';
    } else {
      errorMessage = `Screenshot failed: ${error.message}`;
    }
    
    sendResponse({ 
      error: errorMessage
    });
  }
}

// Full page screenshot using chrome.debugger API (advanced feature)
async function handleFullPageScreenshot(sender, sendResponse) {
  try {
    if (!sender.tab) {
      throw new Error('No active tab found');
    }
    
    const tabId = sender.tab.id;
    
    // Attach debugger
    await chrome.debugger.attach({ tabId }, '1.3');
    
    try {
      // Get page dimensions
      const { result: layoutMetrics } = await chrome.debugger.sendCommand(
        { tabId },
        'Page.getLayoutMetrics'
      );
      
      // Set device metrics for full page
      await chrome.debugger.sendCommand({ tabId }, 'Emulation.setDeviceMetricsOverride', {
        width: layoutMetrics.contentSize.width,
        height: layoutMetrics.contentSize.height,
        deviceScaleFactor: 1,
        mobile: false
      });
      
      // Capture full page screenshot
      const { data } = await chrome.debugger.sendCommand(
        { tabId },
        'Page.captureScreenshot',
        { format: 'png', captureBeyondViewport: true }
      );
      
      const dataUrl = `data:image/png;base64,${data}`;
      
      sendResponse({ 
        screenshot: dataUrl,
        type: 'fullPage',
        timestamp: new Date().toISOString()
      });
      
    } finally {
      // Always detach debugger
      await chrome.debugger.detach({ tabId });
    }
    
  } catch (error) {
    console.error('Full page screenshot error:', error);
    sendResponse({ 
      error: `Full page screenshot failed: ${error.message}`
    });
  }
}

// Get comprehensive tab information
async function handleGetTabInfo(sender, sendResponse) {
  try {
    if (!sender.tab) {
      throw new Error('No tab information available');
    }
    
    const tab = sender.tab;
    const tabInfo = {
      id: tab.id,
      title: tab.title,
      url: tab.url,
      favIconUrl: tab.favIconUrl,
      status: tab.status,
      windowId: tab.windowId,
      active: tab.active,
      pinned: tab.pinned,
      audible: tab.audible,
      discarded: tab.discarded,
      autoDiscardable: tab.autoDiscardable,
      mutedInfo: tab.mutedInfo,
      timestamp: new Date().toISOString()
    };
    
    sendResponse({ tabInfo });
    
  } catch (error) {
    console.error('Tab info error:', error);
    sendResponse({ error: error.message });
  }
}

// Save analysis history for user reference
async function handleSaveAnalysisHistory(data, sendResponse) {
  try {
    const settings = await chrome.storage.sync.get(['preferences']);
    
    if (!settings.preferences?.saveHistory) {
      sendResponse({ saved: false, reason: 'History saving disabled' });
      return;
    }
    
    // Get existing history
    const historyResult = await chrome.storage.local.get(['analysisHistory']);
    const history = historyResult.analysisHistory || [];
    
    // Add new entry
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...data
    };
    
    history.unshift(entry);
    
    // Keep only last 50 entries
    const trimmedHistory = history.slice(0, 50);
    
    await chrome.storage.local.set({ analysisHistory: trimmedHistory });
    
    sendResponse({ saved: true, entryId: entry.id });
    
  } catch (error) {
    console.error('Save history error:', error);
    sendResponse({ saved: false, error: error.message });
  }
}

// Get analysis history
async function handleGetAnalysisHistory(sendResponse) {
  try {
    const result = await chrome.storage.local.get(['analysisHistory']);
    const history = result.analysisHistory || [];
    
    sendResponse({ history });
    
  } catch (error) {
    console.error('Get history error:', error);
    sendResponse({ history: [], error: error.message });
  }
}

// Clear analysis history
async function handleClearHistory(sendResponse) {
  try {
    await chrome.storage.local.remove(['analysisHistory', 'screenshotHistory']);
    sendResponse({ cleared: true });
    
  } catch (error) {
    console.error('Clear history error:', error);
    sendResponse({ cleared: false, error: error.message });
  }
}

// Export user data
async function handleExportData(format, sendResponse) {
  try {
    const syncData = await chrome.storage.sync.get();
    const localData = await chrome.storage.local.get();
    
    const exportData = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      settings: syncData,
      history: localData.analysisHistory || [],
      screenshots: localData.screenshotHistory || []
    };
    
    let exportContent;
    let mimeType;
    let fileName;
    
    if (format === 'json') {
      exportContent = JSON.stringify(exportData, null, 2);
      mimeType = 'application/json';
      fileName = `ai-assistant-data-${new Date().toISOString().split('T')[0]}.json`;
    } else {
      throw new Error('Unsupported export format');
    }
    
    // Create download URL
    const blob = new Blob([exportContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    sendResponse({ 
      success: true, 
      downloadUrl: url,
      fileName: fileName
    });
    
  } catch (error) {
    console.error('Export error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Save screenshot to history (optional feature)
async function saveScreenshotToHistory(dataUrl, tab) {
  try {
    const settings = await chrome.storage.sync.get(['preferences']);
    
    if (!settings.preferences?.saveHistory) {
      return;
    }
    
    const historyResult = await chrome.storage.local.get(['screenshotHistory']);
    const history = historyResult.screenshotHistory || [];
    
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      dataUrl: dataUrl.substring(0, 1000) + '...', // Store truncated version
      tabTitle: tab.title,
      tabUrl: tab.url,
      size: dataUrl.length
    };
    
    history.unshift(entry);
    
    // Keep only last 20 screenshots
    const trimmedHistory = history.slice(0, 20);
    
    await chrome.storage.local.set({ screenshotHistory: trimmedHistory });
    
  } catch (error) {
    console.error('Screenshot history save error:', error);
  }
}

// Context menu setup (optional enhancement)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'aiAssistantAnalyze',
    title: 'Analyze with AI Assistant',
    contexts: ['page', 'selection', 'image', 'link'],
    documentUrlPatterns: ['http://*/*', 'https://*/*']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'aiAssistantAnalyze') {
    try {
      // Open popup or send message to content script
      await chrome.action.openPopup();
    } catch (error) {
      console.error('Context menu action error:', error);
    }
  }
});

// Keyboard shortcut handling
chrome.commands.onCommand.addListener(async (command) => {
  switch (command) {
    case 'open-ai-assistant':
      try {
        await chrome.action.openPopup();
      } catch (error) {
        console.error('Keyboard shortcut error:', error);
      }
      break;
      
    case 'quick-screenshot':
      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab) {
          await handleScreenshotCapture({ tab: activeTab }, () => {});
        }
      } catch (error) {
        console.error('Quick screenshot error:', error);
      }
      break;
  }
});

// Performance monitoring
let performanceMetrics = {
  screenshotsCaptured: 0,
  analysisRequests: 0,
  errors: 0,
  startTime: Date.now()
};

// Update metrics
function updateMetrics(type) {
  if (performanceMetrics[type] !== undefined) {
    performanceMetrics[type]++;
  }
}

// Get performance stats
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPerformanceStats') {
    const stats = {
      ...performanceMetrics,
      uptime: Date.now() - performanceMetrics.startTime,
      version: '2.0'
    };
    sendResponse({ stats });
    return true;
  }
});

console.log('AI Tab Assistant Pro background service worker loaded');