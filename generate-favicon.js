const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Path to the source image
const imagePath = path.join(__dirname, 'images', '7c389157daa23d3137bbe4cd860845f9.jpg');
const outputPath = path.join(__dirname, 'favicon.ico');

async function generateFavicon() {
  try {
    console.log('Loading image...');
    const image = await loadImage(imagePath);
    
    // Create a canvas with favicon dimensions
    const canvas = createCanvas(32, 32);
    const ctx = canvas.getContext('2d');
    
    // Draw the image to the canvas, resizing it to 32x32
    ctx.drawImage(image, 0, 0, 32, 32);
    
    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');
    
    // Write the buffer to the favicon.ico file
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`Favicon created successfully at: ${outputPath}`);
  } catch (error) {
    console.error('Error generating favicon:', error);
  }
}

generateFavicon(); 