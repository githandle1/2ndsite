/**
 * Mobile-specific JavaScript for Maya's Website
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Mobile.js loaded - checking for mobile device');
    
    // Enhanced mobile detection to include all modern mobile browsers
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Arc/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
    // Also check viewport width as a fallback for browsers that don't report accurate user agent
    const isMobileViewport = window.innerWidth <= 768;
    
    console.log('Mobile detection:', { isMobile, isMobileViewport, width: window.innerWidth });
    
    if (isMobile || isMobileViewport) {
        console.log('Mobile device detected - initializing mobile view');
        // Force mobile mode for all windows
        document.documentElement.classList.add('mobile-view');
        
        // Setup mobile behaviors first
        setupMobileNavigation();
        setupTouchInteractions();
        optimizeImagesForMobile();
        setupMobileWindowBehavior();
        setupMobileMusicPlayer();
        setupMobileMoodboard();
        
        // Delay showing the earbuds window to ensure DOM is fully ready
        setTimeout(() => {
            // Check if we're on the index page (welcome window)
            if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
                console.log('Showing welcome window on mobile');
                showMobileWindow('about-window');
                updateActiveMobileIcon('about-window');
            } else {
                console.log('Showing welcome window on mobile for desktop.html');
                showMobileWindow('about-window');
                updateActiveMobileIcon('about-window');
            }
        }, 300);
    }
    
    // Add resize listener to handle orientation changes and browser resizing
    window.addEventListener('resize', function() {
        console.log('Window resized:', window.innerWidth);
        if (window.innerWidth <= 768) {
            document.documentElement.classList.add('mobile-view');
            setupMobileWindowBehavior();
            
            // Show welcome window when resizing to mobile with a delay
            setTimeout(() => {
                // Check if we're on the index page (welcome window)
                if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
                    showMobileWindow('about-window');
                    updateActiveMobileIcon('about-window');
                } else {
                    // Always show welcome window on desktop.html too
                    showMobileWindow('about-window');
                    updateActiveMobileIcon('about-window');
                }
            }, 300);
        } else {
            document.documentElement.classList.remove('mobile-view');
        }
    });
});

// Add an additional event listener that runs after all other scripts
// This ensures the welcome window is shown on mobile regardless of other scripts
window.addEventListener('load', function() {
    // Check if on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Arc/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
    if (isMobile && window.location.pathname.includes('desktop.html')) {
        console.log('Window load event - forcing welcome window on mobile');
        
        // Force the welcome window to be shown and earbuds window to be hidden
        // Use a more aggressive approach with multiple attempts
        function forceWelcomeWindow() {
            // Hide all windows first
            document.querySelectorAll('.window').forEach(window => {
                window.classList.remove('active-mobile');
                window.style.display = 'none';
                // Remove any inline styles that might be overriding our display: none
                window.style.removeProperty('display');
            });
            
            // Explicitly hide the winamp window with !important inline style
            const winampWindow = document.getElementById('winamp-window');
            if (winampWindow) {
                winampWindow.style.setProperty('display', 'none', 'important');
                winampWindow.classList.remove('active-mobile');
            }
            
            // Show the welcome window
            const aboutWindow = document.getElementById('about-window');
            if (aboutWindow) {
                aboutWindow.style.setProperty('display', 'flex', 'important');
                aboutWindow.classList.add('active-mobile');
                
                // Apply consistent styling
                const commonStyles = {
                    position: 'fixed',
                    top: '26vh',
                    left: '0',
                    right: '0',
                    bottom: 'auto',
                    height: '48vh',
                    maxHeight: '48vh',
                    width: '84.64%',
                    margin: '0 auto',
                    padding: '0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    border: '2.3px solid #F7C9C3'
                };
                
                // Apply common styles
                Object.assign(aboutWindow.style, commonStyles);
            }
            
            // Update the active icon
            updateActiveMobileIcon('about-window');
        }
        
        // Call immediately
        forceWelcomeWindow();
        
        // And also with a delay to ensure it happens after any other scripts
        setTimeout(forceWelcomeWindow, 500);
        
        // And one more time after a longer delay
        setTimeout(forceWelcomeWindow, 1000);
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
        // Make windows full screen on mobile with !important to override any browser-specific styles
        window.setAttribute('style', `
            width: 100% !important;
            height: calc(100vh - 60px) !important;
            max-height: calc(100vh - 60px) !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            margin: 0 auto !important;
            border-radius: 0 !important;
            position: fixed !important;
            overflow-y: auto !important;
            transform: none !important;
            display: none !important;
            box-sizing: border-box !important;
            -webkit-overflow-scrolling: touch !important;
        `);
        
        // Hide resize handles
        const resizeHandles = window.querySelectorAll('.resize-handle');
        resizeHandles.forEach(handle => {
            handle.style.display = 'none';
        });
        
        // Make title bar sticky
        const titleBar = window.querySelector('.title-bar');
        if (titleBar) {
            titleBar.setAttribute('style', `
                position: sticky !important;
                top: 0 !important;
                z-index: 10 !important;
                height: 40px !important;
                display: flex !important;
                align-items: center !important;
                width: 100% !important;
                box-sizing: border-box !important;
            `);
            
            // Style title text
            const titleText = titleBar.querySelector('.title-bar-text');
            if (titleText) {
                titleText.setAttribute('style', `
                    font-size: 14px !important;
                    flex-grow: 1 !important;
                `);
            }
            
            // Style control buttons
            const controls = titleBar.querySelector('.title-bar-controls');
            if (controls) {
                controls.setAttribute('style', `
                    display: flex !important;
                    gap: 1px !important;
                `);
                
                // Style all buttons to match Windows 98 style
                const buttons = controls.querySelectorAll('button');
                buttons.forEach((button, index) => {
                    button.setAttribute('style', `
                        width: 13px !important;
                        height: 11px !important;
                        background-color: #c0c0c0 !important;
                        border: 1px solid !important;
                        border-color: #ffffff #808080 #808080 #ffffff !important;
                        font-size: 6px !important;
                        display: flex !important;
                        justify-content: center !important;
                        align-items: center !important;
                        cursor: pointer !important;
                        color: black !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        min-width: 0 !important;
                        min-height: 0 !important;
                        box-sizing: border-box !important;
                    `);
                });
                
                // Clear any existing event listeners
                const newControls = controls.cloneNode(true);
                controls.parentNode.replaceChild(newControls, controls);
                
                // Add event listeners for each button
                const newButtons = newControls.querySelectorAll('button');
                newButtons.forEach((button, index) => {
                    if (index === 0) {
                        // First button - Minimize
                        button.addEventListener('click', function(e) {
                            e.stopPropagation();
                            const parentWindow = this.closest('.window');
                            if (parentWindow) {
                                minimizeWindow(parentWindow.id);
                            }
                        });
                    } else if (index === 1) {
                        // Second button - Maximize/Restore
                        button.addEventListener('click', function(e) {
                            e.stopPropagation();
                            const parentWindow = this.closest('.window');
                            if (parentWindow) {
                                maximizeWindow(parentWindow.id);
                            }
                        });
                    } else if (index === 2) {
                        // Third button - Close
                        button.addEventListener('click', function(e) {
                            e.stopPropagation();
                            const parentWindow = this.closest('.window');
                            if (parentWindow) {
                                closeWindow(parentWindow.id);
                            }
                        });
                    }
                });
            }
        }
        
        // Make window content scrollable
        const windowContent = window.querySelector('.window-content');
        if (windowContent) {
            windowContent.setAttribute('style', `
                height: calc(100% - 40px) !important;
                overflow-y: auto !important;
                -webkit-overflow-scrolling: touch !important;
                width: 100% !important;
                box-sizing: border-box !important;
                padding: 15px !important;
            `);
        }
    });
    
    // Show about window by default
    setTimeout(() => {
        showMobileWindow('about-window');
    }, 100);
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
                updateActiveMobileIcon(windowId);
            });
        }
    });
    
    // Add click event to close buttons
    const closeButtons = document.querySelectorAll('.title-bar-controls button:last-child');
    closeButtons.forEach(button => {
        // Only override onclick for mobile view
        if (isMobile) {
            // Remove original onclick
            const parentWindow = button.closest('.window');
            if (parentWindow) {
                const windowId = parentWindow.id;
                button.removeAttribute('onclick');
                
                // Add new click event with improved handling
                button.addEventListener('click', function(e) {
                    // Prevent default behavior and stop propagation immediately
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // First close the current window
                    console.log('Mobile close button clicked for:', windowId);
                    closeWindow(windowId);
                    
                    // Then show the welcome window by default
                    showMobileWindow('about-window');
                    updateActiveMobileIcon('about-window');
                    
                    // Return false to prevent any additional event handling
                    return false;
                });
                
                // Also handle mousedown/touchstart to prevent any window movement
                button.addEventListener('mousedown', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                });
                
                button.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                });
            }
        }
    });
    
    // Add click event to minimize buttons
    const minimizeButtons = document.querySelectorAll('.title-bar-controls button:first-child');
    minimizeButtons.forEach(button => {
        // Only override onclick for mobile view
        if (isMobile) {
            // Remove original onclick
            const parentWindow = button.closest('.window');
            if (parentWindow) {
                button.removeAttribute('onclick');
                
                // Add new click event
                button.addEventListener('click', function() {
                    // When minimizing a window, show the welcome window by default
                    showMobileWindow('about-window');
                    updateActiveMobileIcon('about-window');
                });
            }
        }
    });
}

/**
 * Sets up mobile music player functionality
 */
function setupMobileMusicPlayer() {
    // Get music player elements
    const playlistItems = document.querySelectorAll('.playlist-item');
    
    if (!playlistItems || playlistItems.length === 0) {
        console.log('Playlist items not found');
        return;
    }
    
    console.log('Setting up mobile music player with tap-to-play/pause functionality');
    
    // Make playlist items more touch-friendly and enhance tap behavior
    playlistItems.forEach((item, itemIndex) => {
        // Remove any existing event listeners
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        // Add enhanced touch event handling
        newItem.addEventListener('touchstart', function() {
            this.style.backgroundColor = 'rgba(247, 201, 195, 0.5)';
        });
        
        newItem.addEventListener('touchend', function(e) {
            e.preventDefault();
            this.style.backgroundColor = '';
            
            // Get the current audio and player state
            const audio = window.audio || document.querySelector('audio');
            const isPlaying = !audio.paused;
            const currentTrack = window.currentTrack !== undefined ? window.currentTrack : 0;
            
            // If this is the currently playing track, toggle play/pause
            if (itemIndex === currentTrack) {
                if (isPlaying) {
                    // Pause the current track
                    audio.pause();
                    console.log('Paused track:', itemIndex);
                } else {
                    // Resume the current track
                    audio.play().catch(err => console.error('Error resuming playback:', err));
                    console.log('Resumed track:', itemIndex);
                }
            } else {
                // Play a different track - use the existing click handler
                this.click();
                console.log('Playing new track:', itemIndex);
            }
            
            // Add visual feedback
            setTimeout(() => {
                // Remove active class from all items
                playlistItems.forEach(i => {
                    i.classList.remove('active');
                });
                
                // Add active class to this item
                this.classList.add('active');
            }, 100);
        });
        
        newItem.addEventListener('touchcancel', function() {
            this.style.backgroundColor = '';
        });
    });
    
    // Ensure audio context is resumed on user interaction for iOS
    document.addEventListener('touchstart', function() {
        // Check if audio context exists and is suspended
        if (window.audioContext && window.audioContext.state === 'suspended') {
            window.audioContext.resume();
        }
    }, { once: true });
}

/**
 * Shows a specific window on mobile and hides others
 */
function showMobileWindow(windowId) {
    console.log('Showing mobile window:', windowId);
    
    // Hide all windows first
    document.querySelectorAll('.window').forEach(window => {
        window.classList.remove('active-mobile');
        window.style.display = 'none';
    });
    
    // Show the target window
    const targetWindow = document.getElementById(windowId);
    if (targetWindow) {
        console.log('Target window found:', windowId);
        targetWindow.classList.add('active-mobile');
        targetWindow.style.display = 'flex';
        targetWindow.style.flexDirection = 'column';
        
        // Apply consistent styling for all windows
        const commonStyles = {
            position: 'fixed',
            top: '26vh',
            left: '0',
            right: '0',
            bottom: 'auto',
            height: '48vh',
            maxHeight: '48vh',
            width: '84.64%',
            margin: '0 auto',
            padding: '0',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            border: '2.3px solid #F7C9C3'
        };
        
        // Apply common styles
        Object.assign(targetWindow.style, commonStyles);
        
        // Special handling for winamp window
        if (windowId === 'winamp-window') {
            console.log('Applying special styling for winamp window');
            // Ensure the winamp window has the same styling as the welcome window
            // but with specific adjustments for its content
            targetWindow.querySelector('.title-bar').style.backgroundColor = '#F7C9C3';
            targetWindow.querySelector('.title-bar').style.color = '#333';
        }
        // Special handling for about window
        else if (windowId === 'about-window') {
            // Apply specific styling for the welcome window
            targetWindow.style.height = '60vh';
            targetWindow.style.maxHeight = '60vh';
            targetWindow.style.width = '105.8%';
            targetWindow.style.top = '20vh';
            targetWindow.style.left = '0';
            targetWindow.style.right = '0';
            targetWindow.style.margin = '0 auto';
            targetWindow.style.borderRadius = '8px';
            targetWindow.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            targetWindow.style.backgroundColor = '#ffffff';
            targetWindow.style.border = '2.3px solid #F7C9C3';
            
            // Ensure the title bar has the pale pink color
            const titleBar = targetWindow.querySelector('.title-bar');
            if (titleBar) {
                titleBar.style.backgroundColor = '#F7C9C3';
                titleBar.style.padding = '3px 8px';
                titleBar.style.color = '#333';
            }
            
            // Adjust the window content
            const windowContent = targetWindow.querySelector('.window-content');
            if (windowContent) {
                windowContent.style.height = 'calc(60vh - 30px)';
                windowContent.style.display = 'flex';
                windowContent.style.flexDirection = 'column';
                windowContent.style.alignItems = 'center';
                windowContent.style.justifyContent = 'flex-start';
                windowContent.style.padding = '15px';
                windowContent.style.overflow = 'auto';
            }
            
            // Reduce spacing between title bar and profile picture
            const aboutHeader = targetWindow.querySelector('.about-header');
            if (aboutHeader) {
                aboutHeader.style.margin = '0';
                aboutHeader.style.padding = '0';
                aboutHeader.style.height = '0';
            }
            
            const aboutMain = targetWindow.querySelector('.about-main');
            if (aboutMain) {
                aboutMain.style.display = 'flex';
                aboutMain.style.flexDirection = 'column';
                aboutMain.style.alignItems = 'center';
                aboutMain.style.gap = '10px';
                aboutMain.style.width = '100%';
            }
            
            const profileSection = targetWindow.querySelector('.profile-section');
            if (profileSection) {
                profileSection.style.marginBottom = '10px';
                profileSection.style.padding = '0';
            }
            
            const profileBox = targetWindow.querySelector('.profile-box');
            if (profileBox) {
                profileBox.style.marginTop = '0';
            }
            
            // Adjust the about content
            const aboutContent = targetWindow.querySelector('.about-content');
            if (aboutContent) {
                aboutContent.style.padding = '0';
                aboutContent.style.justifyContent = 'flex-start';
            }
        } else {
            // For other windows, use full height
            targetWindow.style.height = 'calc(100vh - 60px)';
            targetWindow.style.maxHeight = 'calc(100vh - 60px)';
            targetWindow.style.width = '100%';
            targetWindow.style.top = '0';
            targetWindow.style.left = '0';
            targetWindow.style.borderRadius = '0';
        }
        
        // Update active mobile icon
        updateActiveMobileIcon(windowId);
    } else {
        console.error('Target window not found:', windowId);
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

// Make these functions available globally
window.updateActiveMobileIcon = updateActiveMobileIcon;
window.showMobileWindow = showMobileWindow;

/**
 * Minimizes a window on mobile
 */
function minimizeWindow(windowId) {
    console.log('Minimizing window:', windowId);
    const window = document.getElementById(windowId);
    if (!window) return;
    
    // Check if window is already minimized
    const isMinimized = window.classList.contains('minimized');
    
    if (isMinimized) {
        // Restore window
        window.classList.remove('minimized');
        
        // Restore original size based on window type
        if (windowId === 'about-window') {
            window.style.height = '60vh';
            window.style.width = '80%';
            window.style.top = '20vh';
            
            const windowContent = window.querySelector('.window-content');
            if (windowContent) {
                windowContent.style.height = 'calc(60vh - 30px)';
                windowContent.style.display = 'flex';
            }
        } else {
            window.style.height = 'calc(100vh - 60px)';
            window.style.width = '100%';
            window.style.top = '0';
            
            const windowContent = window.querySelector('.window-content');
            if (windowContent) {
                windowContent.style.height = 'calc(100% - 40px)';
                windowContent.style.display = 'block';
            }
        }
    } else {
        // Minimize window
        window.classList.add('minimized');
        
        // Save current position and size
        window.dataset.originalHeight = window.style.height;
        window.dataset.originalWidth = window.style.width;
        window.dataset.originalTop = window.style.top;
        
        // Shrink window to just the title bar
        window.style.height = '40px';
        window.style.width = '200px';
        window.style.top = 'calc(100vh - 100px)';
        
        // Hide content
        const windowContent = window.querySelector('.window-content');
        if (windowContent) {
            windowContent.style.display = 'none';
        }
    }
}

/**
 * Maximizes a window on mobile
 */
function maximizeWindow(windowId) {
    console.log('Maximizing window:', windowId);
    const window = document.getElementById(windowId);
    if (!window) return;
    
    // Check if window is already maximized
    const isMaximized = window.classList.contains('maximized');
    
    if (isMaximized) {
        // Restore window
        window.classList.remove('maximized');
        
        // Restore original size based on window type
        if (windowId === 'about-window') {
            window.style.height = '60vh';
            window.style.width = '80%';
            window.style.top = '20vh';
            
            const windowContent = window.querySelector('.window-content');
            if (windowContent) {
                windowContent.style.height = 'calc(60vh - 30px)';
            }
        } else {
            window.style.height = 'calc(100vh - 60px)';
            window.style.width = '100%';
            window.style.top = '0';
            
            const windowContent = window.querySelector('.window-content');
            if (windowContent) {
                windowContent.style.height = 'calc(100% - 40px)';
            }
        }
    } else {
        // Maximize window
        window.classList.add('maximized');
        
        // Save current position and size
        window.dataset.originalHeight = window.style.height;
        window.dataset.originalWidth = window.style.width;
        window.dataset.originalTop = window.style.top;
        
        // Expand window to full screen
        window.style.height = '100vh';
        window.style.width = '100%';
        window.style.top = '0';
        
        // Adjust content
        const windowContent = window.querySelector('.window-content');
        if (windowContent) {
            windowContent.style.height = 'calc(100vh - 40px)';
        }
    }
}

/**
 * Closes a window on mobile
 */
function closeWindow(windowId) {
    console.log('Closing window:', windowId);
    const window = document.getElementById(windowId);
    if (!window) return;
    
    // Hide the window
    window.classList.remove('active-mobile');
    window.style.display = 'none';
}

/**
 * Sets up mobile moodboard functionality
 */
function setupMobileMoodboard() {
    const moodboardWindow = document.getElementById('moodboard-window');
    
    if (!moodboardWindow) {
        console.log('Moodboard window not found');
        return;
    }
    
    console.log('Setting up mobile moodboard');
    
    // Ensure the moodboard is properly sized on mobile
    function adjustMoodboardSize() {
        if (window.innerWidth <= 768) {
            const windowHeight = window.innerHeight;
            const mobileMenuHeight = document.querySelector('.mobile-menu')?.offsetHeight || 60;
            moodboardWindow.style.height = `${windowHeight - mobileMenuHeight}px`;
            
            // Apply consistent mobile styling
            moodboardWindow.style.width = '100%';
            moodboardWindow.style.top = '0';
            moodboardWindow.style.left = '0';
            moodboardWindow.style.margin = '0';
            moodboardWindow.style.borderRadius = '0';
            
            // Style the title bar consistently
            const titleBar = moodboardWindow.querySelector('.title-bar');
            if (titleBar) {
                titleBar.style.borderRadius = '0';
                titleBar.style.padding = '10px 15px';
            }
        }
    }
    
    // Adjust size on orientation change
    window.addEventListener('resize', adjustMoodboardSize);
    window.addEventListener('orientationchange', adjustMoodboardSize);
    
    // Initial adjustment
    adjustMoodboardSize();
    
    // Enhance touch experience for moodboard
    const moodboardContent = moodboardWindow.querySelector('.moodboard-content');
    if (moodboardContent) {
        // Add touch feedback
        moodboardContent.addEventListener('touchstart', function(e) {
            this.style.opacity = '0.9';
        });
        
        moodboardContent.addEventListener('touchend', function(e) {
            this.style.opacity = '1';
            
            // Prevent default to avoid any unwanted behaviors
            e.preventDefault();
        });
        
        // Ensure proper tap handling
        moodboardContent.addEventListener('click', function(e) {
            // Make sure the click event propagates properly
            e.stopPropagation();
            showNextMoodboardImage();
        });
    }
    
    // Add the moodboard window to the mobile windows list
    if (!mobileWindows.includes('moodboard-window')) {
        mobileWindows.push('moodboard-window');
    }
} 