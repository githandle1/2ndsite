document.addEventListener('DOMContentLoaded', function() {
    // Add a slight animation to the welcome window
    const welcomeWindow = document.querySelector('.welcome-window');
    welcomeWindow.style.opacity = '0';
    
    setTimeout(() => {
        welcomeWindow.style.transition = 'opacity 1s ease-in-out';
        welcomeWindow.style.opacity = '1';
    }, 300);
    
    // Add click effect to the enter button
    const enterButton = document.querySelector('.enter-button a');
    enterButton.addEventListener('click', function(e) {
        // If you want to stay on the same page instead of navigating to main.html
        // e.preventDefault();
        this.style.borderColor = '#808080 #fff #fff #808080';
        setTimeout(() => {
            this.style.borderColor = '#fff #808080 #808080 #fff';
        }, 100);
    });
    
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
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        currentDateElement.textContent = now.toLocaleDateString('en-US', options);
    }
} 