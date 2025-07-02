import { NextRequest, NextResponse } from 'next/server';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { app } from '@/lib/firebase'; // Import the initialized app

// Initialize Firebase Storage
const storage = getStorage(app);

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file: File | null = data.get('image') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, error: 'No file uploaded.' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // Generate a unique filename and convert to .webp
  const uniqueFilename = `${uuidv4()}.webp`;

  try {
    // Use sharp to convert to WebP and get the buffer
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 80 }) // Adjust quality as needed
      .toBuffer();

    // Create a reference to the file in Firebase Storage
    const storageRef = ref(storage, `uploads/${uniqueFilename}`);

    // Upload the file's buffer
    const uploadResult = await uploadBytes(storageRef, webpBuffer, {
        contentType: 'image/webp'
    });

    // Get the public download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);

    console.log(`File uploaded to Firebase Storage and available at: ${downloadURL}`);
    return NextResponse.json({ success: true, filePath: downloadURL });

  } catch (error) {
    console.error('Error processing or uploading file to Firebase Storage:', error);
    let errorMessage = 'Failed to process or upload image.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
