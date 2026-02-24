document.addEventListener('DOMContentLoaded', function() {
    // Subtle fade-in for welcome window - start immediately, no delay
    const welcomeWindow = document.querySelector('.welcome-window');
    if (welcomeWindow) {
        welcomeWindow.style.transition = 'opacity 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)';
        welcomeWindow.style.opacity = '1'; // Visible immediately (critical CSS may have set this)
        // Only apply fade-in if we're on index (has welcome window with content)
        if (document.querySelector('.enter-button')) {
            welcomeWindow.style.opacity = '0';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    welcomeWindow.style.opacity = '1';
                });
            });
        }
    }
    
    // Add click effect to the enter button (index page only)
    const enterButton = document.querySelector('.enter-button a');
    if (enterButton) {
        enterButton.addEventListener('click', function(e) {
            this.style.borderColor = '#808080 #fff #fff #808080';
            setTimeout(() => {
                this.style.borderColor = '#fff #808080 #808080 #fff';
            }, 100);
            
            const audioPlayer = document.getElementById('audio-player');
            if (audioPlayer && !audioPlayer.paused) {
                localStorage.setItem('audioCurrentTime', audioPlayer.currentTime);
            }
        });
    }
    
    // Update the current date
    updateCurrentDate();
    
    // Update date every day at midnight
    setInterval(updateCurrentDate, 1000 * 60 * 60); // Check every hour
});

// Function to update the current date
function updateCurrentDate() {
    const currentDateElement = document.getElementById('current-date');
    if (currentDateElement) {
        const now = new Date();
        
        // Create a custom date string without time
        const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
        const month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][now.getMonth()];
        const day = now.getDate();
        const year = now.getFullYear();
        
        // Format: "Weekday, Month Day, Year"
        const formattedDate = `${weekday}, ${month} ${day}, ${year}`;
        console.log('Updating date to:', formattedDate);
        currentDateElement.textContent = formattedDate;
    }
} 