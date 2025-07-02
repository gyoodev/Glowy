
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_IMAGEBB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'ImageBB API key is not configured in .env file.' },
      { status: 500 }
    );
  }

  const data = await request.formData();
  const file: File | null = data.get('image') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, error: 'No file uploaded.' }, { status: 400 });
  }

  // FormData is used to send the file in a multipart/form-data request
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('ImageBB API Error:', result.error);
      throw new Error(result.error?.message || 'Failed to upload image to ImageBB.');
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
