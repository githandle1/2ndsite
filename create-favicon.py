#!/usr/bin/env python3
import os
from PIL import Image

def create_favicon():
    # Path to the source image
    image_path = os.path.join(os.path.dirname(__file__), 'images', '7c389157daa23d3137bbe4cd860845f9.jpg')
    output_path = os.path.join(os.path.dirname(__file__), 'favicon.ico')
    
    # Check if the source image exists
    if not os.path.exists(image_path):
        print(f"Error: Source image not found at {image_path}")
        return False
    
    try:
        # Open the source image
        img = Image.open(image_path)
        
        # Resize the image to favicon dimensions
        favicon = img.resize((32, 32))
        
        # Save as ICO
        favicon.save(output_path, format='ICO')
        
        print(f"Favicon created successfully at: {output_path}")
        return True
    except Exception as e:
        print(f"Error creating favicon: {e}")
        return False

if __name__ == "__main__":
    create_favicon() 