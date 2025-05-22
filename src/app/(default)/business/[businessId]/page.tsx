'use client';

import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

interface BusinessProfilePageProps {
  // No props needed as we use useParams
}

export default function BusinessProfilePage({}: BusinessProfilePageProps) {
  const params = useParams();
  const businessId = params?.businessId as string;

  // TODO: Fetch business data based on businessId and display it

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Business Profile for: {businessId}</h1>
      {/* Placeholder for business details */}
      <p>Loading or displaying business information here...</p>
      {/* Further sections for services, bookings, etc. */}
    </div>
  );
}