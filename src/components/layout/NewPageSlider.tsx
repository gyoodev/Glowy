
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link'; // Import Link for the button
import { Button } from '@/components/ui/button'; // Import your Button component

const slidesData = [
  {
    id: 1,
    title: 'Намерете Вашия Перфектен Салон',
    description: 'Открийте най-добрите салони за красота и услуги близо до Вас.',
    buttonText: 'Разгледай Салоните',
    buttonLink: '/salons',
    image: 'https://placehold.co/1920x520/E6E6FA/333333.png?text=Perfect+Salon',
    dataAiHint: 'salon search beauty',
  },
  {
    id: 2,
    title: 'Релаксиращи СПА Изживявания',
    description: 'Потопете се в свят на спокойствие с нашите ексклузивни СПА процедури.',
    buttonText: 'Виж СПА Услугите',
    buttonLink: '/salons?category=Масажи', // Example link
    image: 'https://placehold.co/1920x520/FFB6C1/333333.png?text=Relaxing+Spa',
    dataAiHint: 'spa wellness relaxation',
  },
  {
    id: 3,
    title: 'Модерни Прически и Стилизиране',
    description: 'Подчертайте своята индивидуалност с най-новите тенденции в прическите.',
    buttonText: 'Фризьорски Услуги',
    buttonLink: '/salons?category=Дамски+фризьорски+услуги', // Example link
    image: 'https://placehold.co/1920x520/F08080/FFFFFF.png?text=Modern+Hairstyles',
    dataAiHint: 'haircut styling fashion',
  },
];

const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

const NewPageSlider = () => {
  const [current, setCurrent] = useState(0);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slidesData.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slidesData.length) % slidesData.length);
  const goToSlide = (index: number) => setCurrent(index);

  useEffect(() => {
    const interval = setInterval(nextSlide, 7000); // Auto slide every 7 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[420px] md:h-[520px] lg:h-[550px] overflow-hidden rounded-2xl shadow-xl">
      <AnimatePresence initial={false}>
        {slidesData.map((slide, index) => (
          index === current && (
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
              className="absolute top-0 left-0 w-full h-full"
            >
              <Image
                src={slide.image}
                alt={`Slide ${slide.id}: ${slide.title}`}
                fill={true}
                style={{ objectFit: 'cover' }}
                priority={index === 0} // Add priority to the first image
                data-ai-hint={slide.dataAiHint}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#b284da99] via-transparent to-[#ffffff22]"></div>

              <motion.div
                key={`${slide.id}-text`}
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={textVariants}
                className="absolute left-10 md:left-20 top-1/2 transform -translate-y-1/2 text-white max-w-md md:max-w-lg lg:max-w-xl z-10"
              >
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 drop-shadow-md">{slide.title}</h2>
                <p className="text-lg md:text-xl font-light mb-4 md:mb-6 drop-shadow-sm">{slide.description}</p>
                <Button asChild size="lg" className="bg-white text-primary hover:bg-primary/10 hover:text-primary-foreground rounded-full shadow-lg px-6 py-3 md:px-8 md:py-3.5 text-base md:text-lg">
                  <Link href={slide.buttonLink}>
                    {slide.buttonText}
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          )
        ))}
      </AnimatePresence>

      {/* Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-3 md:left-5 top-1/2 transform -translate-y-1/2 bg-white/70 text-gray-800 rounded-full p-2 md:p-3 shadow-md hover:bg-white hover:scale-105 transition z-20"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-3 md:right-5 top-1/2 transform -translate-y-1/2 bg-white/70 text-gray-800 rounded-full p-2 md:p-3 shadow-md hover:bg-white hover:scale-105 transition z-20"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
        {slidesData.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
              idx === current ? 'bg-primary scale-125' : 'bg-white/60 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default NewPageSlider;
