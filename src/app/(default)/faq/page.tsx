
'use client';

import React from 'react';
import {
  Accordion,

  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function FaqPage() {
  const faqItems = [
    {
      question: "Как да намеря салон близо до мен?",
      answer: "Можете да използвате нашата търсачка на главната страница и да филтрирате по местоположение (град). Също така, можете да разгледате картата, ако е налична такава функционалност.",
    },
    {
      question: "Как мога да резервирам час?",
      answer: "След като изберете салон и услуга, на страницата на салона ще намерите календар за наличност. Изберете свободна дата и час, след което потвърдете резервацията си. Трябва да сте регистриран потребител.",
    },
    {
      question: "Мога ли да променя или отменя резервацията си?",
      answer: "В момента, за промяна или отмяна на резервация, моля, свържете се директно със салона. Работим по добавянето на функционалност за онлайн управление на резервациите от Вашия профил.",
    },
    {
      question: "Как да оставя отзив за салон?",
      answer: "След като посетите салон и използвате услуга, която сте резервирали през нашата платформа, ще получите покана (или можете да отидете на страницата на салона) да оставите отзив. Трябва да сте влезли в профила си.",
    },
    {
      question: "Как мога да регистрирам своя бизнес/салон в Glowy?",
      answer: "Ако сте собственик на салон, можете да се регистрирате като 'Бизнес' потребител. След това, от Вашия профил, ще имате достъп до опция за създаване и управление на Вашия бизнес профил в платформата.",
    },
    {
      question: "Сигурни ли са моите лични данни?",
      answer: "Ние приемаме сигурността на Вашите данни много сериозно. Моля, прегледайте нашата Политика за поверителност за повече информация относно това как събираме, използваме и защитаваме Вашата информация.",
    },
  ];

  return (
    <div className="container mx-auto py-10 px-6">
      <h1 className="text-3xl font-bold mb-8 text-center text-foreground">Често Задавани Въпроси (ЧЗВ)</h1>
      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {faqItems.map((item, index) => (
            <AccordionItem value={`item-${index}`} key={index}>
              <AccordionTrigger className="text-lg text-left hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
