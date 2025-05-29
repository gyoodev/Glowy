'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
// import { gsap } from 'gsap';

export default function LoadingScreenAnimation() {
  // useEffect(() => {
  //   if (typeof window !== 'undefined') {
  //     import('gsap').then((module) => {
  //       const { gsap } = module;
  //       setTimeout(() => {
  //         gsap.to('#loading-screen', {
  //           opacity: 0,
  //           duration: 1,
  //           onComplete: () => {
  //             document.getElementById('loading-screen')?.remove();
  //           },
  //         });
  //       });
  //     }
  //   }, []);

  return null; // This component doesn't render anything visible
}