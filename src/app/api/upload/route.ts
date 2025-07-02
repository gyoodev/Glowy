import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file: File | null = data.get('image') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, error: 'No file uploaded.' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Define the path to the public/uploads directory
  const uploadsDir = join(process.cwd(), 'public', 'uploads');

  try {
    // Ensure the uploads directory exists
    await mkdir(uploadsDir, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      console.error('Error creating uploads directory:', error);
      return NextResponse.json({ success: false, error: 'Failed to create upload directory.' }, { status: 500 });
    }
  }
  
  // Generate a unique filename and convert to .webp
  const uniqueFilename = `${uuidv4()}.webp`;
  const filePath = join(uploadsDir, uniqueFilename);
  const publicPath = `/uploads/${uniqueFilename}`;

  try {
    // Use sharp to convert to WebP and save
    await sharp(buffer)
      .webp({ quality: 80 }) // Adjust quality as needed
      .toFile(filePath);

    console.log(`File uploaded and converted to WebP at: ${filePath}`);
    return NextResponse.json({ success: true, filePath: publicPath });
  } catch (error) {
    console.error('Error processing or saving file:', error);
    return NextResponse.json({ success: false, error: 'Failed to process image.' }, { status: 500 });
  }
}