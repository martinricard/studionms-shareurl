/**
 * StreamElements Overlay URL Sharing Tool
 * Notice Me Senpai Studio
 * Main JavaScript File
 */

// ============================================
// MOUSE CURSOR GLOW EFFECT
// ============================================
const cursorGlow = document.getElementById('cursor-glow');
let mouseX = 0;
let mouseY = 0;
let glowX = 0;
let glowY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// Smooth follow animation
function animateGlow() {
    glowX += (mouseX - glowX) * 0.1;
    glowY += (mouseY - glowY) * 0.1;
    
    cursorGlow.style.left = glowX + 'px';
    cursorGlow.style.top = glowY + 'px';
    
    requestAnimationFrame(animateGlow);
}
animateGlow();

// ============================================
// HISTORY MANAGEMENT
// ============================================
const STORAGE_KEY = 'streamelements_url_history';

/**
 * Load history from localStorage
 * @returns {Object} History object with categories
 */
function loadHistory() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
}

/**
 * Save history to localStorage
 * @param {Object} history - History object to save
 */
function saveHistory(history) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

/**
 * Add URL to history
 * @param {string} url - The URL to add
 */
function addToHistory(url) {
    const history = loadHistory();
    const category = document.getElementById('categoryInput1').value.trim() || 
                   document.getElementById('categoryInput2').value.trim() || 
                   'Uncategorized';
    
    if (!history[category]) {
        history[category] = [];
    }

    // Check if URL already exists in this category
    const exists = history[category].some(item => item.url === url);
    if (!exists) {
        history[category].unshift({
            url: url,
            date: new Date().toISOString()
        });
        
        saveHistory(history);
        renderHistory();
    }
}

/**
 * Render history to the DOM
 */
function renderHistory() {
    const history = loadHistory();
    const container = document.getElementById('historyContainer');
    
    // Check if history is empty
    const hasItems = Object.keys(history).length > 0 && 
                   Object.values(history).some(items => items.length > 0);
    
    if (!hasItems) {
        container.innerHTML = '<div class="history-empty">no urls saved yet. generate some urls to see them here!</div>';
        return;
    }

    let html = '<div class="history-categories">';
    
    // Sort categories alphabetically, but keep "Uncategorized" at the end
    const sortedCategories = Object.keys(history).sort((a, b) => {
        if (a === 'Uncategorized') return 1;
        if (b === 'Uncategorized') return -1;
        return a.localeCompare(b);
    });

    sortedCategories.forEach(category => {
        const items = history[category];
        if (items.length === 0) return;

        html += `
            <div class="history-category">
                <div class="category-header">
                    <span class="category-name">${escapeHtml(category)}</span>
                    <span class="category-count">${items.length} url${items.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="history-items">
        `;

        items.forEach((item, index) => {
            const date = new Date(item.date);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            
            html += `
                <div class="history-item">
                    <div class="history-item-content">
                        <div class="history-item-url">${escapeHtml(item.url)}</div>
                        <div class="history-item-date">${formattedDate}</div>
                    </div>
                    <div class="history-item-actions">
                        <button class="btn-history-action" onclick="copyHistoryUrl('${escapeHtml(item.url)}')">
                            copy
                        </button>
                        <button class="btn-history-action btn-history-delete" onclick="deleteHistoryItem('${escapeHtml(category)}', ${index})">
                            delete
                        </button>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

/**
 * Copy URL from history
 * @param {string} url - The URL to copy
 */
function copyHistoryUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
        showToast('copied from history!');
    }).catch(err => {
        alert('Failed to copy: ' + err);
    });
}

/**
 * Delete single history item
 * @param {string} category - Category name
 * @param {number} index - Item index
 */
function deleteHistoryItem(category, index) {
    const history = loadHistory();
    if (history[category]) {
        history[category].splice(index, 1);
        
        // Remove category if empty
        if (history[category].length === 0) {
            delete history[category];
        }
        
        saveHistory(history);
        renderHistory();
    }
}

/**
 * Clear all history
 */
function clearHistory() {
    if (confirm('Are you sure you want to clear all history?')) {
        localStorage.removeItem(STORAGE_KEY);
        renderHistory();
    }
}

// ============================================
// URL GENERATION
// ============================================

/**
 * Method 1: Parse full StreamElements overlay link
 */
function parseFullLink() {
    const input = document.getElementById('fullLink').value.trim();
    const result = document.getElementById('result1');
    const error = document.getElementById('error1');
    const shareUrlElement = document.getElementById('shareUrl1');

    // Hide previous results
    result.classList.remove('show');
    error.classList.remove('show');

    if (!input) {
        showError(error, 'Please enter a URL');
        return;
    }

    try {
        // Check if it's a StreamElements URL
        if (!input.includes('streamelements.com')) {
            showError(error, 'This doesn\'t appear to be a StreamElements URL');
            return;
        }

        // Try to find the account ID pattern (24 hex characters)
        const accountIdPattern = /[a-f0-9]{24}/i;
        const match = input.match(accountIdPattern);
        
        if (!match) {
            showError(error, 'Could not find account ID in the URL. The account ID should be a 24-character hexadecimal string.');
            return;
        }

        const accountId = match[0];

        // Generate the shareable URL
        const shareUrl = `https://streamelements.com/dashboard/overlays/share/${accountId}/`;
        
        shareUrlElement.textContent = shareUrl;
        result.classList.add('show');

        // Add to history
        addToHistory(shareUrl);
        
        // Clear category input after adding
        document.getElementById('categoryInput1').value = '';

    } catch (e) {
        showError(error, 'Invalid URL format. Please enter a valid StreamElements overlay URL');
    }
}

/**
 * Method 2: Build shareable URL from account ID
 */
function buildShareUrl() {
    const accountId = document.getElementById('overlayId').value.trim();
    const result = document.getElementById('result2');
    const error = document.getElementById('error2');
    const shareUrlElement = document.getElementById('shareUrl2');

    // Hide previous results
    result.classList.remove('show');
    error.classList.remove('show');

    if (!accountId) {
        showError(error, 'Please enter an account ID');
        return;
    }

    // Basic validation - check if it looks like a MongoDB ObjectId (24 hex characters)
    if (!/^[a-f0-9]{24}$/i.test(accountId)) {
        showError(error, 'Account ID should be 24 hexadecimal characters (0-9, a-f)');
        return;
    }

    // Generate the shareable URL
    const shareUrl = `https://streamelements.com/dashboard/overlays/share/${accountId}/`;
    
    shareUrlElement.textContent = shareUrl;
    result.classList.add('show');

    // Add to history
    addToHistory(shareUrl);
    
    // Clear category input after adding
    document.getElementById('categoryInput2').value = '';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Copy to clipboard function
 * @param {string} elementId - ID of element containing text to copy
 * @param {string} toastId - ID of toast notification element
 */
function copyToClipboard(elementId, toastId) {
    const text = document.getElementById(elementId).textContent;
    const toast = document.getElementById(toastId);

    navigator.clipboard.writeText(text).then(() => {
        // Show toast notification
        toast.classList.add('show');
        
        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }).catch(err => {
        alert('Failed to copy to clipboard: ' + err);
    });
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 */
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '30px';
    toast.style.right = '30px';
    toast.style.zIndex = '10000';
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Show error message
 * @param {HTMLElement} errorElement - Error element to show message in
 * @param {string} message - Error message
 */
function showError(errorElement, message) {
    errorElement.textContent = message;
    errorElement.classList.add('show');
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// EVENT LISTENERS
// ============================================

// Allow Enter key to trigger generation
document.getElementById('fullLink').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        parseFullLink();
    }
});

document.getElementById('overlayId').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        buildShareUrl();
    }
});

// Load history on page load
document.addEventListener('DOMContentLoaded', function() {
    renderHistory();
});
