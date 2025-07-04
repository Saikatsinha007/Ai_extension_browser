// Options page script for AI Tab Assistant Pro
// Enhanced with professional features and comprehensive settings management

document.addEventListener('DOMContentLoaded', () => {
    initializeOptionsPage();
});

// Initialize the options page
async function initializeOptionsPage() {
    await loadSavedSettings();
    setupEventListeners();
    await loadStatistics();
    setupAdvancedSettings();
}

// Load all saved settings from storage
async function loadSavedSettings() {
    try {
        // Load sync storage (settings)
        const syncData = await chrome.storage.sync.get();
        
        // Load API key
        if (syncData.geminiApiKey) {
            document.getElementById('api-key').value = syncData.geminiApiKey;
        }
        
        // Load feature settings
        const features = syncData.features || {};
        document.getElementById('feature-screenshots').checked = features.screenshots !== false;
        document.getElementById('feature-analysis').checked = features.pageAnalysis !== false;
        document.getElementById('feature-testing').checked = features.testGeneration !== false;
        document.getElementById('feature-docs').checked = features.documentation !== false;
        
        // Load preferences
        const preferences = syncData.preferences || {};
        document.getElementById('pref-detailed').checked = preferences.detailedReports !== false;
        document.getElementById('pref-history').checked = preferences.saveHistory !== false;
        document.getElementById('pref-auto').checked = preferences.autoAnalyze === true;
        
        // Load advanced settings
        const advancedSettings = syncData.advancedSettings || {};
        const temperatureSlider = document.getElementById('ai-temperature');
        const temperatureValue = document.getElementById('temperature-value');
        const maxTokensSelect = document.getElementById('max-tokens');
        
        temperatureSlider.value = advancedSettings.temperature || 0.7;
        temperatureValue.textContent = temperatureSlider.value;
        maxTokensSelect.value = advancedSettings.maxTokens || 4096;
        
    } catch (error) {
        console.error('Error loading settings:', error);
        showMessage('Error loading settings. Using defaults.', 'error');
    }
}

// Setup all event listeners
function setupEventListeners() {
    // API key visibility toggle
    document.getElementById('api-key').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveSettings();
        }
    });
    
    // Temperature slider updates
    const temperatureSlider = document.getElementById('ai-temperature');
    const temperatureValue = document.getElementById('temperature-value');
    
    temperatureSlider.addEventListener('input', (e) => {
        temperatureValue.textContent = e.target.value;
    });
    
    // Auto-save on checkbox changes
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            saveSettings(false); // Silent save
        });
    });
    
    // Auto-save on select changes
    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
        select.addEventListener('change', () => {
            saveSettings(false); // Silent save
        });
    });
    
    // Auto-save on range input changes
    temperatureSlider.addEventListener('change', () => {
        saveSettings(false); // Silent save
    });
}

// Setup advanced settings functionality
function setupAdvancedSettings() {
    // Any additional advanced settings setup can go here
    console.log('Advanced settings initialized');
}

// Save all settings to storage
async function saveSettings(showSuccessMessage = true) {
    try {
        const saveButton = document.getElementById('save-text');
        const originalText = saveButton.textContent;
        
        if (showSuccessMessage) {
            saveButton.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Saving...</div>';
        }
        
        // Get API key
        const apiKey = document.getElementById('api-key').value.trim();
        
        // Validate API key if provided
        if (apiKey && !isValidGeminiApiKey(apiKey)) {
            throw new Error('Please enter a valid Gemini API key (starts with "AIza" and is at least 30 characters)');
        }
        
        // Collect feature settings
        const features = {
            screenshots: document.getElementById('feature-screenshots').checked,
            pageAnalysis: document.getElementById('feature-analysis').checked,
            testGeneration: document.getElementById('feature-testing').checked,
            documentation: document.getElementById('feature-docs').checked
        };
        
        // Collect preferences
        const preferences = {
            detailedReports: document.getElementById('pref-detailed').checked,
            saveHistory: document.getElementById('pref-history').checked,
            autoAnalyze: document.getElementById('pref-auto').checked
        };
        
        // Collect advanced settings
        const advancedSettings = {
            temperature: parseFloat(document.getElementById('ai-temperature').value),
            maxTokens: parseInt(document.getElementById('max-tokens').value)
        };
        
        // Prepare settings object
        const settingsToSave = {
            version: '2.0',
            lastSaved: new Date().toISOString(),
            features,
            preferences,
            advancedSettings
        };
        
        // Add API key if provided
        if (apiKey) {
            settingsToSave.geminiApiKey = apiKey;
        }
        
        // Save to Chrome storage
        await chrome.storage.sync.set(settingsToSave);
        
        if (showSuccessMessage) {
            saveButton.textContent = originalText;
            showMessage('Settings saved successfully! Your AI assistant is ready to use.', 'success');
            
            // Close tab after delay if this was first setup
            const isFirstSetup = !apiKey || apiKey.length === 0;
            if (isFirstSetup && apiKey) {
                setTimeout(() => {
                    chrome.tabs.getCurrent((tab) => {
                        if (tab) {
                            chrome.tabs.remove(tab.id);
                        }
                    });
                }, 3000);
            }
        }
        
    } catch (error) {
        console.error('Error saving settings:', error);
        document.getElementById('save-text').textContent = '💾 Save Settings';
        showMessage(error.message || 'Failed to save settings. Please try again.', 'error');
    }
}

// Test API connection
async function testConnection() {
    const testButton = document.querySelector('.button.secondary');
    const originalText = testButton.textContent;
    
    try {
        testButton.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Testing...</div>';
        
        const apiKey = document.getElementById('api-key').value.trim();
        
        if (!apiKey) {
            throw new Error('Please enter your API key first');
        }
        
        if (!isValidGeminiApiKey(apiKey)) {
            throw new Error('Invalid API key format');
        }
        
        // Test the API with a simple request
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Hello! Please respond with "API test successful"' }] }],
                    generationConfig: { temperature: 0.1, maxOutputTokens: 50 }
                })
            }
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API test failed (${response.status})`);
        }
        
        const data = await response.json();
        const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!aiResponse) {
            throw new Error('Empty response from API');
        }
        
        testButton.textContent = originalText;
        showMessage('🎉 API connection successful! Your AI assistant is working perfectly.', 'success');
        
    } catch (error) {
        console.error('API test error:', error);
        testButton.textContent = originalText;
        showMessage(`❌ API test failed: ${error.message}`, 'error');
    }
}

// Load and display usage statistics
async function loadStatistics() {
    try {
        // Get performance stats from background script
        const response = await chrome.runtime.sendMessage({ action: 'getPerformanceStats' });
        
        if (response && response.stats) {
            const stats = response.stats;
            
            // Update statistics display
            document.getElementById('stat-analyses').textContent = stats.analysisRequests || 0;
            document.getElementById('stat-screenshots').textContent = stats.screenshotsCaptured || 0;
            document.getElementById('stat-uptime').textContent = Math.round((stats.uptime || 0) / (1000 * 60 * 60 * 24)); // Convert to days
            
            // Calculate success rate
            const totalRequests = (stats.analysisRequests || 0) + (stats.screenshotsCaptured || 0);
            const successRate = totalRequests > 0 ? Math.round(((totalRequests - (stats.errors || 0)) / totalRequests) * 100) : 100;
            document.getElementById('stat-success').textContent = `${successRate}%`;
        }
        
    } catch (error) {
        console.error('Error loading statistics:', error);
        // Set default values
        document.getElementById('stat-analyses').textContent = '0';
        document.getElementById('stat-screenshots').textContent = '0';
        document.getElementById('stat-uptime').textContent = '0';
        document.getElementById('stat-success').textContent = '100%';
    }
}

// Export user data
async function exportData() {
    try {
        const response = await chrome.runtime.sendMessage({ 
            action: 'exportData', 
            format: 'json' 
        });
        
        if (response && response.success) {
            // Create download link
            const link = document.createElement('a');
            link.href = response.downloadUrl;
            link.download = response.fileName;
            link.click();
            
            showMessage('📥 Data exported successfully!', 'success');
        } else {
            throw new Error(response.error || 'Export failed');
        }
        
    } catch (error) {
        console.error('Export error:', error);
        showMessage(`❌ Export failed: ${error.message}`, 'error');
    }
}

// Clear analysis history
async function clearHistory() {
    if (!confirm('Are you sure you want to clear all analysis history? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await chrome.runtime.sendMessage({ action: 'clearHistory' });
        
        if (response && response.cleared) {
            showMessage('🗑️ Analysis history cleared successfully!', 'success');
            // Reset statistics
            await loadStatistics();
        } else {
            throw new Error(response.error || 'Failed to clear history');
        }
        
    } catch (error) {
        console.error('Clear history error:', error);
        showMessage(`❌ Failed to clear history: ${error.message}`, 'error');
    }
}

// Reset all settings to defaults
async function resetSettings() {
    if (!confirm('Are you sure you want to reset all settings to defaults? Your API key will be preserved.')) {
        return;
    }
    
    try {
        // Get current API key
        const currentSettings = await chrome.storage.sync.get(['geminiApiKey']);
        
        // Clear all settings
        await chrome.storage.sync.clear();
        await chrome.storage.local.clear();
        
        // Restore API key if it existed
        if (currentSettings.geminiApiKey) {
            await chrome.storage.sync.set({ geminiApiKey: currentSettings.geminiApiKey });
        }
        
        // Reload the page to show defaults
        window.location.reload();
        
    } catch (error) {
        console.error('Reset error:', error);
        showMessage(`❌ Failed to reset settings: ${error.message}`, 'error');
    }
}

// Toggle advanced settings visibility
function toggleAdvanced() {
    const content = document.getElementById('advanced-content');
    const arrow = document.getElementById('advanced-arrow');
    
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        arrow.textContent = '▲';
    } else {
        content.classList.add('hidden');
        arrow.textContent = '▼';
    }
}

// Toggle API key visibility
function toggleApiKeyVisibility() {
    const apiKeyInput = document.getElementById('api-key');
    const toggleButton = document.querySelector('.toggle-visibility');
    
    if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        toggleButton.textContent = '🙈';
    } else {
        apiKeyInput.type = 'password';
        toggleButton.textContent = '👁️';
    }
}

// Validate Gemini API key format
function isValidGeminiApiKey(apiKey) {
    return apiKey && apiKey.startsWith('AIza') && apiKey.length >= 30;
}

// Show success or error message
function showMessage(message, type) {
    const successElement = document.getElementById('success-message');
    const errorElement = document.getElementById('error-message');
    
    // Hide both messages first
    successElement.style.display = 'none';
    errorElement.style.display = 'none';
    
    // Show the appropriate message
    if (type === 'success') {
        successElement.textContent = message;
        successElement.style.display = 'block';
        
        // Auto-hide success messages after 5 seconds
        setTimeout(() => {
            successElement.style.display = 'none';
        }, 5000);
    } else {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Auto-hide error messages after 8 seconds
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 8000);
    }
}

// Update statistics periodically
setInterval(loadStatistics, 30000); // Update every 30 seconds

// Handle page unload
window.addEventListener('beforeunload', () => {
    // Save settings one final time
    saveSettings(false);
});

console.log('AI Tab Assistant Pro options page loaded');