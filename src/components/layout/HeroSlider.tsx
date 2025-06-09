
"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface Slide {
  id: string;
  imageUrl: string;
  altText: string;
  title: string;
  subtitle?: string;
  buttonText: string;
  buttonLink: string;
  dataAiHint: string;
  priority?: boolean;
  titleColor?: string;
  subtitleColor?: string;
  buttonVariant?: "default" | "secondary" | "outline" | "ghost" | "link" | "destructive";
  textAlign?: "left" | "center" | "right";
}

interface HeroSliderProps {
  slides: Slide[];
}

export function HeroSlider({ slides }: HeroSliderProps) {
  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      className="w-full relative"
      data-ai-hint="hero image slider"
    >
      <CarouselContent className="-ml-0">
        {slides.map((slide) => (
          <CarouselItem key={slide.id} className="pl-0 basis-full">
            <div className="relative w-full h-[60vh] md:h-[75vh] lg:h-[550px] overflow-hidden rounded-lg shadow-xl">
              <Image
                src={slide.imageUrl}
                alt={slide.altText}
                fill
                priority={slide.priority}
                className="object-cover"
                data-ai-hint={slide.dataAiHint}
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4 md:p-8">
                <div
                  className={cn(
                    "max-w-2xl space-y-4 md:space-y-6",
                    slide.textAlign === "left" && "text-left items-start",
                    slide.textAlign === "center" && "text-center items-center",
                    slide.textAlign === "right" && "text-right items-end",
                     !slide.textAlign && "text-center items-center" // Default to center
                  )}
                >
                  <h1
                    className={cn(
                      "text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight",
                      slide.titleColor || "text-white"
                    )}
                  >
                    {slide.title}
                  </h1>
                  {slide.subtitle && (
                    <p
                      className={cn(
                        "text-lg md:text-xl max-w-xl",
                        slide.subtitleColor || "text-gray-200"
                      )}
                    >
                      {slide.subtitle}
                    </p>
                  )}
                  <Button
                    asChild
                    size="lg"
                    variant={slide.buttonVariant || "default"}
                    className="text-base md:text-lg py-3 px-6 md:py-4 md:px-8"
                  >
                    <Link href={slide.buttonLink}>{slide.buttonText}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3 md:bottom-8">
        <CarouselPrevious className="static translate-x-0 translate-y-0 bg-white/80 hover:bg-white text-primary disabled:bg-white/50 disabled:text-muted-foreground" />
        <CarouselNext className="static translate-x-0 translate-y-0 bg-white/80 hover:bg-white text-primary disabled:bg-white/50 disabled:text-muted-foreground" />
      </div>
    </Carousel>
  )
}
