<?php
// Path to the source image
$imagePath = __DIR__ . '/images/7c389157daa23d3137bbe4cd860845f9.jpg';
$outputPath = __DIR__ . '/favicon.ico';

// Check if the source image exists
if (!file_exists($imagePath)) {
    die("Error: Source image not found at $imagePath");
}

// Create image from file
$sourceImage = imagecreatefromjpeg($imagePath);
if (!$sourceImage) {
    die("Error: Failed to create image from file");
}

// Create a new true color image with favicon dimensions
$favicon = imagecreatetruecolor(32, 32);
if (!$favicon) {
    die("Error: Failed to create true color image");
}

// Resize the source image to favicon dimensions
if (!imagecopyresampled($favicon, $sourceImage, 0, 0, 0, 0, 32, 32, imagesx($sourceImage), imagesy($sourceImage))) {
    die("Error: Failed to resize image");
}

// Save the favicon
if (imagepng($favicon, $outputPath)) {
    echo "Favicon created successfully at: $outputPath";
} else {
    echo "Error: Failed to save favicon";
}

// Free up memory
imagedestroy($sourceImage);
imagedestroy($favicon);
?> 