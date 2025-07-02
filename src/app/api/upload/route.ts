
import { NextRequest, NextResponse } from 'next/server';

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

  // Convert the file to a base64 string for a more robust upload method.
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64Image = buffer.toString('base64');

  // Use FormData to send the base64-encoded image data.
  const formData = new FormData();
  formData.append('image', base64Image);

  try {
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
    console.error('Error uploading file to ImageBB:', error);
    let errorMessage = 'Failed to upload image.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
