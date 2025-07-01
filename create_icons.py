#!/usr/bin/env python3
"""
Simple script to create basic PNG icons for the Chrome extension.
Creates colored square icons that represent folders.
"""

def create_simple_png(width, height, color_rgb, filename):
    """Create a simple PNG file with solid color"""
    import struct
    import zlib
    
    def write_png(buf, width, height):
        # PNG signature
        buf.extend([137, 80, 78, 71, 13, 10, 26, 10])
        
        # IHDR chunk
        ihdr = struct.pack('>2I5B', width, height, 8, 2, 0, 0, 0)
        write_chunk(buf, b'IHDR', ihdr)
        
        # IDAT chunk - image data
        raw_data = []
        for y in range(height):
            raw_data.append(0)  # filter type
            for x in range(width):
                if (x < width//8 or x > width-width//8 or 
                    y < height//8 or y > height-height//8):
                    # Border - use main color
                    raw_data.extend(color_rgb)
                else:
                    # Inside - lighter version for folder effect
                    lighter = [min(255, c + 40) for c in color_rgb]
                    raw_data.extend(lighter)
        
        compressor = zlib.compressobj()
        compressed = compressor.compress(bytes(raw_data))
        compressed += compressor.flush()
        write_chunk(buf, b'IDAT', compressed)
        
        # IEND chunk
        write_chunk(buf, b'IEND', b'')
        
        return buf
    
    def write_chunk(buf, chunk_type, data):
        buf.extend(struct.pack('>I', len(data)))
        buf.extend(chunk_type)
        buf.extend(data)
        crc = zlib.crc32(chunk_type + data) & 0xffffffff
        buf.extend(struct.pack('>I', crc))
    
    buf = bytearray()
    png_data = write_png(buf, width, height)
    
    with open(filename, 'wb') as f:
        f.write(png_data)

# Create icons with ChatGPT green color
green_color = [16, 163, 127]  # #10a37f

create_simple_png(16, 16, green_color, '/Users/mark.s/WindSurf/chatgpt-folder-extension/icons/icon16.png')
create_simple_png(48, 48, green_color, '/Users/mark.s/WindSurf/chatgpt-folder-extension/icons/icon48.png')
create_simple_png(128, 128, green_color, '/Users/mark.s/WindSurf/chatgpt-folder-extension/icons/icon128.png')

print("Created all PNG icons successfully!")
print("Icons are simple green squares that Chrome will accept.")
print("You can replace them with better icons later using the SVG files as reference.")