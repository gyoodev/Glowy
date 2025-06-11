
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const slidesData = [
  {
    id: 1,
    title: 'Намерете Вашия Перфектен Салон',
    description: 'Открийте най-добрите салони за красота и услуги близо до Вас.',
    buttonText: 'Разгледай Салоните',
    buttonLink: '/salons',
    image: 'https://placehold.co/1920x520/E6E6FA/333333.png?text=Beauty+Salon',
    dataAiHint: 'salon search beauty',
  },
  {
    id: 2,
    title: 'Релаксиращи СПА Изживявания',
    description: 'Потопете се в свят на спокойствие с нашите ексклузивни СПА процедури.',
    buttonText: 'Виж СПА Услугите',
    buttonLink: '/salons?category=Масажи',
    image: 'https://placehold.co/1920x520/FFB6C1/333333.png?text=Relaxing+Spa',
    dataAiHint: 'spa wellness relaxation',
  },
  {
    id: 3,
    title: 'Модерни Прически и Стилизиране',
    description: 'Подчертайте своята индивидуалност с най-новите тенденции в прическите.',
    buttonText: 'Фризьорски Услуги',
    buttonLink: '/salons?category=Дамски+фризьорски+услуги',
    image: 'https://placehold.co/1920x520/F08080/FFFFFF.png?text=Modern+Hairstyles',
    dataAiHint: 'haircut styling fashion',
  },
];

const slideVariants = {
  enter: (direction: number) => {
    return {
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    };
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    };
  },
};

const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut', delay: 0.3 }, // Added slight delay for text
  },
};

const NewPageSlider = () => {
  const [[page, direction], setPage] = useState([0, 0]); // page is the current slide index, direction is for animation

  const currentSlide = slidesData[page];

  const paginate = (newDirection: number) => {
    setPage([(page + newDirection + slidesData.length) % slidesData.length, newDirection]);
  };

  const goToSlide = (slideIndex: number) => {
    const newDirection = slideIndex > page ? 1 : -1;
    setPage([slideIndex, newDirection]);
  };

  useEffect(() => {
    const interval = setInterval(() => paginate(1), 7000); // Auto slide every 7 seconds
    return () => clearInterval(interval);
  }, [page]); // Re-create interval if page changes to reset timer logic correctly

  return (
    <div className="relative w-full h-[420px] md:h-[520px] lg:h-[550px] overflow-hidden rounded-2xl shadow-xl">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        {currentSlide && (
            <motion.div
              key={currentSlide.id} // Use slide id for key
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.3 }
              }}
              className="absolute top-0 left-0 w-full h-full"
            >
              <Image
                src={currentSlide.image}
                alt={`Slide ${currentSlide.id}: ${currentSlide.title}`}
                fill={true}
                style={{ objectFit: 'cover' }}
                priority={page === 0} 
                data-ai-hint={currentSlide.dataAiHint}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#b284da99] via-transparent to-[#ffffff22]"></div>

              <motion.div
                key={`${currentSlide.id}-text-container`} // Ensure text animates with slide
                initial="hidden"
                animate="visible"
                exit="hidden" // This might not be strictly necessary with mode="wait" if content is part of keyed motion.div
                variants={textVariants}
                className="absolute left-4 right-4 md:left-12 lg:left-20 md:right-auto top-1/2 transform -translate-y-1/2 text-white text-center md:text-left max-w-full md:max-w-lg lg:max-w-xl z-10 p-2"
              >
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 drop-shadow-md">{currentSlide.title}</h2>
                <p className="text-base sm:text-lg md:text-xl font-light mb-4 md:mb-6 drop-shadow-sm leading-relaxed">{currentSlide.description}</p>
                <Button asChild size="lg" className="bg-white text-primary hover:bg-primary/10 hover:text-primary-foreground rounded-full shadow-lg px-6 py-3 md:px-8 md:py-3.5 text-sm sm:text-base md:text-lg">
                  <Link href={currentSlide.buttonLink}>
                    {currentSlide.buttonText}
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Arrows */}
      <button
        onClick={() => paginate(-1)}
        className="absolute left-3 md:left-5 top-1/2 transform -translate-y-1/2 bg-white/70 text-gray-800 rounded-full p-2 md:p-3 shadow-md hover:bg-white hover:scale-105 transition z-20"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={() => paginate(1)}
        className="absolute right-3 md:right-5 top-1/2 transform -translate-y-1/2 bg-white/70 text-gray-800 rounded-full p-2 md:p-3 shadow-md hover:bg-white hover:scale-105 transition z-20"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-12 md:bottom-8 lg:bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
        {slidesData.map((slide, slideIndex) => (
          <button
            key={slide.id}
            onClick={() => goToSlide(slideIndex)}
            className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
              slideIndex === page ? 'bg-primary scale-125' : 'bg-white/60 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${slideIndex + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default NewPageSlider;
