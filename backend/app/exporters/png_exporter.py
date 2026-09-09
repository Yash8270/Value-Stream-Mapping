import io
from PIL import Image, ImageDraw, ImageFont
from app.schemas.vsm import VSMModel

class VSMPNGExporter:
    def export(self, vsm: VSMModel) -> bytes:
        """
        Generates a high-resolution PNG of the VSM.
        Use 300 DPI minimum.
        """
        # Create a large blank canvas
        img = Image.new('RGB', (4000, 2000), color=(255, 255, 255))
        draw = ImageDraw.Draw(img)
        
        try:
            # Try to load a font, fallback to default
            font = ImageFont.truetype("arial.ttf", 40)
            title_font = ImageFont.truetype("arial.ttf", 60)
        except:
            font = ImageFont.load_default()
            title_font = font
            
        # Draw Title
        draw.text((100, 100), f"Value Stream Map: {vsm.project.get('name', 'Untitled')}", fill=(0,0,0), font=title_font)
        draw.text((100, 180), f"Product: {vsm.project.get('product', 'Unknown')}", fill=(100,100,100), font=font)
        
        # Draw Nodes
        for node in vsm.nodes:
            x = node.position.get("x", 0) * 2 # Scale up for better resolution
            y = node.position.get("y", 0) * 2
            
            draw.rectangle([x, y, x+300, y+100], fill=(173,216,230), outline=(0,0,0), width=3)
            draw.text((x+20, y+30), str(node.label)[:20], fill=(0,0,0), font=font)
            
        # Draw connections
        for conn in vsm.connections:
            source = next((n for n in vsm.nodes if n.id == conn.source), None)
            target = next((n for n in vsm.nodes if n.id == conn.target), None)
            if source and target:
                sx = source.position.get("x", 0) * 2 + 300
                sy = source.position.get("y", 0) * 2 + 50
                tx = target.position.get("x", 0) * 2
                ty = target.position.get("y", 0) * 2 + 50
                draw.line([(sx, sy), (tx, ty)], fill=(0,0,0), width=5)
        
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        return buffer.getvalue()
