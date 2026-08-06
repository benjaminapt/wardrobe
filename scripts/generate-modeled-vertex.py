import os
import json
import base64
from google import genai
from google.genai import types

# Config
LIBRARY_PATH = 'data/library.json'
IMPORTED_DIR = 'data/imported'
PROMPT_TEMPLATE = """
Create a professional horizontal 3:2 editorial fashion photograph of a person wearing the exact following clothing item:
Category: {category}
Color: {color}
Tags: {tags}
Name: {name}

Preserve the featured garment precisely. Use understated neutral supporting clothes that complete the outfit without covering or competing with the featured item. Keep the full featured item and every important detail visible. Use a natural pose with arms and accessories away from it. Place the person in a tasteful real-world setting with warm professional natural light, realistic shadows, authentic skin and fabric texture, and restrained editorial color grading. Leave environmental breathing room for flexible cropping. Avoid hidden garment details, invented closures, fake text or logos, extra statement pieces, crossed arms, bags or scarves covering the item, cropped item extremities, extra people, text overlays, watermarks, product-mockup styling, or synthetic AI polish.
"""

def main():
    # Initialize Vertex AI client (uses Application Default Credentials)
    try:
        client = genai.Client(vertexai=True)
    except Exception as e:
        print(f"Error initializing Vertex AI client: {e}")
        print("Did you run `gcloud auth application-default login`?")
        return

    # Load library
    with open(LIBRARY_PATH, 'r') as f:
        library = json.load(f)

    updated_count = 0

    for item in library:
        if not item.get('modeledImage'):
            garment_id = item['id']
            print(f"\nProcessing {item['name']} ({garment_id})...")
            
            prompt = PROMPT_TEMPLATE.format(
                category=item.get('part', 'clothing'),
                color=item.get('color', 'unknown'),
                tags=', '.join(item.get('tags', [])),
                name=item.get('name', 'clothing item')
            )

            try:
                # Call Imagen 3 via Vertex AI
                result = client.models.generate_images(
                    model='imagen-3.0-generate-001',
                    prompt=prompt,
                    config=types.GenerateImagesConfig(
                        number_of_images=1,
                        output_mime_type="image/png",
                        aspect_ratio="3:2"
                    )
                )

                if result.generated_images:
                    image_bytes = result.generated_images[0].image.image_bytes
                    
                    # Save the image
                    out_filename = f"modeled_{garment_id}.png"
                    out_path = os.path.join(IMPORTED_DIR, out_filename)
                    
                    with open(out_path, 'wb') as f_out:
                        f_out.write(image_bytes)
                        
                    print(f"Saved generated image to {out_path}")
                    
                    # Update item in memory
                    item['modeledImage'] = f"/api/import/library/{out_filename}"
                    updated_count += 1
                else:
                    print("No image was returned by the API.")

            except Exception as e:
                print(f"Failed to generate image for {garment_id}: {e}")
                # We can stop early if there's a fatal error like quota or auth
                if "quota" in str(e).lower() or "auth" in str(e).lower() or "permission" in str(e).lower():
                    print("Stopping due to auth/quota error.")
                    break

    # Save library if we updated anything
    if updated_count > 0:
        with open(LIBRARY_PATH, 'w') as f:
            json.dump(library, f, indent=2)
        print(f"\nSuccessfully generated {updated_count} modeled images and updated library.json!")
    else:
        print("\nNo items needed updating or generation failed.")

if __name__ == '__main__':
    main()
