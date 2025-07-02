// Options page script for AI Tab Assistant

document.addEventListener('DOMContentLoaded', () => {
    loadSavedSettings();
    setupEventListeners();
});

// Load saved API key if it exists
function loadSavedSettings() {
    chrome.storage.sync.get(['geminiApiKey'], (result) => {
        if (result.geminiApiKey) {
            document.getElementById('api-key').value = result.geminiApiKey;
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Handle form submission
    document.getElementById('settings-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveSettings();
    });

    // Handle Enter key in API key field
    document.getElementById('api-key').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveSettings();
        }
    });
}

// Save settings
function saveSettings() {
    const apiKey = document.getElementById('api-key').value.trim();

    if (!apiKey) {
        showMessage('Please enter your Gemini API key.', 'error');
        return;
    }

    // Validate API key format (basic check)
    if (!apiKey.startsWith('AIza') || apiKey.length < 30) {
        showMessage('Please enter a valid Gemini API key.', 'error');
        return;
    }

    // Save to Chrome storage
    chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
        if (chrome.runtime.lastError) {
            showMessage('Error saving settings. Please try again.', 'error');
            return;
        }

        showMessage('Settings saved successfully!', 'success');
        
        // Close the tab after a short delay
        setTimeout(() => {
            // Try to close the current tab
            chrome.tabs.getCurrent((tab) => {
                if (tab) {
                    chrome.tabs.remove(tab.id);
                } else {
                    // Fallback for when window.close() is available
                    window.close();
                }
            });
        }, 2000);
    });
}

// Show success/error message
function showMessage(message, type) {
    const messageElement = document.getElementById('success-message');
    messageElement.textContent = message;
    messageElement.className = type === 'error' ? 'error-message' : 'success-message';
    messageElement.style.display = 'block';

    // Hide message after 5 seconds
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 5000);
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

// Add error message styling
const style = document.createElement('style');
style.textContent = `
    .error-message {
        background: #f8d7da;
        color: #721c24;
        padding: 12px 16px;
        border-radius: 8px;
        margin-top: 20px;
        display: none;
        font-weight: 500;
        border: 1px solid #f5c6cb;
    }
`;
document.head.appendChild(style);