
'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { User, Briefcase } from 'lucide-react';

export default function FaqPage() {
  const customerFaqs = [
    {
      question: "Как да намеря салон близо до мен?",
      answer: "Използвайте нашата търсачка и филтри на страницата 'Салони'. Можете да филтрирате по област, град, рейтинг, ценови диапазон и дори по конкретни услуги, за да намерите най-подходящия за Вас салон.",
    },
    {
      question: "Как мога да резервирам час?",
      answer: "След като изберете салон и услуга, на страницата на салона ще намерите календар за наличност. Изберете свободна дата и час, след което потвърдете резервацията си. За да направите резервация, трябва да сте регистриран потребител и да сте влезли в профила си.",
    },
    {
      question: "Какво представляват AI Препоръките?",
      answer: "Това е нашата интелигентна система, която Ви помага да откриете нови салони и услуги. На страницата 'Glaura Препоръка' можете да опишете какво търсите, а нашият изкуствен интелект ще Ви предложи персонализирани идеи, съобразени с Вашите предпочитания.",
    },
    {
      question: "Мога ли да променя или отменя резервацията си?",
      answer: "В момента, за промяна или отмяна на резервация, моля, свържете се директно със салона, като използвате контактите, посочени в неговия профил. Работим по добавянето на функционалност за онлайн управление на резервациите.",
    },
    {
      question: "Как да оставя отзив за салон?",
      answer: "След като посетите салон, който сте резервирали през нашата платформа, можете да отидете на страницата на салона и да оставите своя отзив и оценка. Трябва да сте влезли в профила си, за да можете да коментирате.",
    },
  ];

  const businessFaqs = [
    {
      question: "Как мога да регистрирам своя бизнес/салон в Glaura?",
      answer: "Ако сте собственик на салон, можете да се регистрирате като 'Бизнес' потребител. След успешна регистрация, от Вашето меню за управление ще имате достъп до опция за създаване и управление на Вашия бизнес профил.",
    },
    {
      question: "Защо моят новорегистриран салон не се вижда на сайта?",
      answer: "Всеки новосъздаден салон преминава през процес на одобрение от администратор, за да се гарантира качеството и достоверността на информацията. Ще получите известие, когато статусът на Вашия салон бъде променен.",
    },
    {
      question: "Как мога да промотирам своя салон?",
      answer: "В менюто за управление на Вашия бизнес ще намерите секция 'Промотирай'. Там можете да изберете от различните ни промоционални пакети, които ще поставят Вашия салон на челни позиции в резултатите от търсенето и на главната страница.",
    },
    {
      question: "Какви методи за плащане се приемат за промоциите?",
      answer: "В момента приемаме плащания чрез PayPal. Това е сигурен и удобен начин да закупите своя промоционален пакет.",
    },
    {
      question: "Сигурни ли са моите лични и бизнес данни?",
      answer: "Ние приемаме сигурността на Вашите данни много сериозно. Моля, прегледайте нашата Политика за поверителност за повече информация относно това как събираме, използваме и защитаваме Вашата лична и бизнес информация.",
    },
  ];

  return (
    <div className="container mx-auto py-12 px-6">
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          Често Задавани Въпроси
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
          Намерете отговори на най-често срещаните въпроси относно нашата платформа.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Customer FAQs */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-primary">
              <User className="mr-3 h-6 w-6" />
              За Клиенти
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {customerFaqs.map((item, index) => (
                <AccordionItem value={`customer-item-${index}`} key={`customer-${index}`}>
                  <AccordionTrigger className="text-base text-left hover:no-underline font-medium">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Business FAQs */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-primary">
              <Briefcase className="mr-3 h-6 w-6" />
              За Бизнеси
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {businessFaqs.map((item, index) => (
                <AccordionItem value={`business-item-${index}`} key={`business-${index}`}>
                  <AccordionTrigger className="text-base text-left hover:no-underline font-medium">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
