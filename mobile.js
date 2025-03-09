/**
 * Mobile-specific JavaScript for Maya's Website
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
    if (isMobile) {
        // Add mobile-specific event listeners and behaviors
        setupMobileNavigation();
        setupTouchInteractions();
        optimizeImagesForMobile();
        setupMobileWindowBehavior();
        setupMobileMusicPlayer();
    }
});

/**
 * Sets up mobile navigation
 */
function setupMobileNavigation() {
    // Make mobile menu sticky at bottom
    const mobileMenu = document.querySelector('.mobile-menu');
    if (mobileMenu) {
        // Ensure it's visible
        mobileMenu.style.display = 'block';
        
        // Add active state to mobile icons
        const mobileIcons = document.querySelectorAll('.mobile-icon');
        mobileIcons.forEach(icon => {
            icon.addEventListener('touchstart', function() {
                this.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            });
            
            icon.addEventListener('touchend', function() {
                this.style.backgroundColor = 'transparent';
            });
        });
    }
}

/**
 * Sets up touch interactions for mobile
 */
function setupTouchInteractions() {
    // Add touch feedback to all clickable elements
    const clickableElements = document.querySelectorAll('a, button, .icon, .mobile-icon');
    
    clickableElements.forEach(element => {
        element.addEventListener('touchstart', function() {
            this.style.opacity = '0.7';
        });
        
        element.addEventListener('touchend', function() {
            this.style.opacity = '1';
        });
    });
    
    // Prevent zoom on double tap for iOS
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

/**
 * Optimizes images for mobile
 */
function optimizeImagesForMobile() {
    // Find all images
    const images = document.querySelectorAll('img');
    
    // Add loading="lazy" attribute to all images
    images.forEach(img => {
        img.setAttribute('loading', 'lazy');
        
        // Add a max-width to ensure images don't overflow
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
    });
}

/**
 * Sets up mobile window behavior
 */
function setupMobileWindowBehavior() {
    // Get all windows
    const windows = document.querySelectorAll('.window');
    
    // Hide all windows initially
    windows.forEach(window => {
        // Make windows full screen on mobile
        window.style.width = '100%';
        window.style.height = 'calc(100vh - 60px)';
        window.style.top = '0';
        window.style.left = '0';
        window.style.borderRadius = '0';
        window.style.position = 'fixed';
        window.style.overflowY = 'auto';
        window.style.display = 'none'; // Hide by default
        
        // Add -webkit-overflow-scrolling: touch for smooth scrolling
        window.style.webkitOverflowScrolling = 'touch';
        
        // Hide resize handles
        const resizeHandles = window.querySelectorAll('.resize-handle');
        resizeHandles.forEach(handle => {
            handle.style.display = 'none';
        });
        
        // Make title bar sticky
        const titleBar = window.querySelector('.title-bar');
        if (titleBar) {
            titleBar.style.position = 'sticky';
            titleBar.style.top = '0';
            titleBar.style.zIndex = '10';
            
            // Adjust title bar height and alignment
            titleBar.style.height = '40px';
            titleBar.style.display = 'flex';
            titleBar.style.alignItems = 'center';
            titleBar.style.padding = '0 10px';
            
            // Style title text
            const titleText = titleBar.querySelector('.title-bar-text');
            if (titleText) {
                titleText.style.fontSize = '14px';
                titleText.style.flexGrow = '1';
            }
            
            // Style control buttons
            const controls = titleBar.querySelector('.title-bar-controls');
            if (controls) {
                controls.style.display = 'flex';
                controls.style.gap = '5px';
                
                // Hide minimize and maximize buttons on mobile
                const buttons = controls.querySelectorAll('button');
                buttons.forEach((button, index) => {
                    if (index < buttons.length - 1) {
                        button.style.display = 'none';
                    } else {
                        // Style close button
                        button.style.width = '30px';
                        button.style.height = '30px';
                        button.style.fontSize = '16px';
                        button.style.display = 'flex';
                        button.style.alignItems = 'center';
                        button.style.justifyContent = 'center';
                    }
                });
            }
        }
        
        // Adjust window content
        const content = window.querySelector('.window-content');
        if (content) {
            content.style.padding = '15px';
            content.style.height = 'auto';
            content.style.minHeight = 'calc(100vh - 100px)';
        }
    });
    
    // Show about window by default
    const aboutWindow = document.getElementById('about-window');
    if (aboutWindow) {
        aboutWindow.style.display = 'block';
        aboutWindow.classList.add('active-mobile');
    }
    
    // Set up mobile navigation between windows
    setupMobileWindowNavigation();
}

/**
 * Sets up navigation between windows on mobile
 */
function setupMobileWindowNavigation() {
    // Get all mobile icons
    const mobileIcons = document.querySelectorAll('.mobile-icon');
    
    mobileIcons.forEach(icon => {
        // Get the onclick attribute value
        const onclickAttr = icon.getAttribute('onclick');
        
        // If it contains toggleWindow, extract the window ID
        if (onclickAttr && onclickAttr.includes('toggleWindow')) {
            // Extract window ID from toggleWindow('window-id')
            const windowId = onclickAttr.match(/toggleWindow\('([^']+)'\)/)[1];
            
            // Store window ID as data attribute
            icon.setAttribute('data-window-id', windowId);
            
            // Remove the original onclick
            icon.removeAttribute('onclick');
            
            // Add new click event listener
            icon.addEventListener('click', function() {
                showMobileWindow(windowId);
            });
        }
    });
    
    // Add click event to close buttons
    const closeButtons = document.querySelectorAll('.title-bar-controls button:last-child');
    closeButtons.forEach(button => {
        // Remove original onclick
        const parentWindow = button.closest('.window');
        if (parentWindow) {
            button.removeAttribute('onclick');
            
            // Add new click event
            button.addEventListener('click', function() {
                parentWindow.style.display = 'none';
                parentWindow.classList.remove('active-mobile');
                
                // Show the about window when closing other windows
                if (parentWindow.id !== 'about-window') {
                    showMobileWindow('about-window');
                }
            });
        }
    });
}

/**
 * Sets up mobile music player functionality
 */
function setupMobileMusicPlayer() {
    // Get music player elements
    const playButton = document.querySelector('.winamp-controls button:nth-child(2)');
    const stopButton = document.querySelector('.winamp-controls button:nth-child(3)');
    const prevButton = document.querySelector('.winamp-controls button:nth-child(1)');
    const nextButton = document.querySelector('.winamp-controls button:nth-child(4)');
    const playlistItems = document.querySelectorAll('.playlist-item');
    
    if (!playButton || !stopButton || !prevButton || !nextButton) {
        console.log('Music player controls not found');
        return;
    }
    
    // Make buttons larger and more touch-friendly
    [playButton, stopButton, prevButton, nextButton].forEach(button => {
        if (button) {
            button.style.width = '40px';
            button.style.height = '40px';
            button.style.margin = '0 5px';
            button.style.fontSize = '18px';
        }
    });
    
    // Make playlist items more touch-friendly
    playlistItems.forEach(item => {
        item.style.padding = '12px 8px';
        item.style.fontSize = '14px';
        
        // Ensure click events work properly on mobile
        item.addEventListener('touchend', function(e) {
            e.preventDefault();
            // Trigger the click event that's already set up in desktop.html
            this.click();
        });
    });
    
    // Ensure audio context is resumed on user interaction for iOS
    document.addEventListener('touchstart', function() {
        // Check if audio context exists and is suspended
        if (window.audioContext && window.audioContext.state === 'suspended') {
            window.audioContext.resume();
        }
    }, { once: true });
    
    // Add special handling for the music window
    const winampWindow = document.getElementById('winamp-window');
    if (winampWindow) {
        // When the music window is shown, make sure it's properly sized
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'style' && 
                    winampWindow.style.display !== 'none') {
                    // Ensure the visualizer canvas is properly sized
                    const canvas = document.getElementById('visualizer');
                    if (canvas) {
                        setTimeout(() => {
                            canvas.width = canvas.offsetWidth;
                            canvas.height = canvas.offsetHeight;
                            // Redraw visualization if needed
                            if (typeof drawVisualization === 'function') {
                                drawVisualization();
                            }
                        }, 100);
                    }
                }
            });
        });
        
        observer.observe(winampWindow, { attributes: true });
    }
}

/**
 * Shows a specific window on mobile and hides others
 */
function showMobileWindow(windowId) {
    // Hide all windows
    const windows = document.querySelectorAll('.window');
    windows.forEach(window => {
        window.style.display = 'none';
        window.classList.remove('active-mobile');
    });
    
    // Show the selected window
    const targetWindow = document.getElementById(windowId);
    if (targetWindow) {
        targetWindow.style.display = 'block';
        targetWindow.classList.add('active-mobile');
        
        // Scroll to top
        targetWindow.scrollTop = 0;
        
        // Update active state on mobile icons
        updateActiveMobileIcon(windowId);
        
        // Special handling for music player window
        if (windowId === 'winamp-window') {
            // Resize visualizer if it exists
            const canvas = document.getElementById('visualizer');
            if (canvas) {
                setTimeout(() => {
                    canvas.width = canvas.offsetWidth;
                    canvas.height = canvas.offsetHeight;
                    // Redraw visualization if needed
                    if (typeof drawVisualization === 'function') {
                        drawVisualization();
                    }
                }, 100);
            }
        }
    }
}

/**
 * Updates the active state on mobile icons
 */
function updateActiveMobileIcon(windowId) {
    // Remove active class from all icons
    const mobileIcons = document.querySelectorAll('.mobile-icon');
    mobileIcons.forEach(icon => {
        icon.classList.remove('active');
    });
    
    // Find the icon that corresponds to this window and add active class
    mobileIcons.forEach(icon => {
        const onclickAttr = icon.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(windowId)) {
            icon.classList.add('active');
        }
    });
    
    // For icons that have been updated with event listeners
    mobileIcons.forEach(icon => {
        // Check if this icon has a click event that shows the target window
        const iconWindowId = icon.getAttribute('data-window-id');
        if (iconWindowId === windowId) {
            icon.classList.add('active');
        }
    });
} 