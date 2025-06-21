'use client';

import Image from 'next/image';
import React from 'react';

interface SalonGalleryProps {
  photos: string[];
  salonName?: string;
  salonCity?: string;
}

const SalonGallery: React.FC<SalonGalleryProps> = ({ photos, salonName, salonCity }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {photos && photos.length > 0 ? (
        photos.map((photo, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden shadow-md hover:scale-105 transition-transform duration-300">
            <Image
              src={photo}
              alt={`Снимка ${index + 1} от галерията на ${salonName || ''} ${salonCity ? ' в ' + salonCity : ''}`}
              width={300} // Provide appropriate width based on your design
              height={300} // Provide appropriate height based on your design
              objectFit="cover"
            />
          </div>
        ))
      ) : (
        <p className="text-muted-foreground col-span-full text-center">Няма добавени снимки в галерията.</p>
      )}
    </div>
  );
};

export default SalonGallery;