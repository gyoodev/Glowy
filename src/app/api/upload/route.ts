
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_IMAGEBB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'ImageBB API key is not configured. Please check your .env.local file and restart the server.' },
      { status: 500 }
    );
  }

  const data = await request.formData();
  const file: File | null = data.get('image') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, error: 'No file uploaded.' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  try {
    // Convert image to WebP format using sharp
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 80 }) // You can adjust quality here, 80 is a good balance
      .toBuffer();

    // Convert the WebP buffer to a base64 string
    const base64Image = webpBuffer.toString('base64');

    // Use FormData to send the base64-encoded image data.
    const formData = new FormData();
    formData.append('image', base64Image);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('ImageBB API Error:', result.error);
      const errorMessage = result?.error?.message || 'Failed to upload image to ImageBB.';
      throw new Error(errorMessage);
    }
    
    // The direct image URL is in result.data.url
    const imageUrl = result.data.url;

    return NextResponse.json({ success: true, filePath: imageUrl });

  } catch (error) {
    console.error('Error processing or uploading file:', error);
    let errorMessage = 'Failed to process or upload image.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
