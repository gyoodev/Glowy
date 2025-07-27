import type { Slide } from '@/components/layout/HeroSlider';

export const slidesData: Slide[] = [
  {
    id: 'slide1',
    imageUrl: 'https://images.unsplash.com/photo-1637777277435-3c44f82fd0c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxzYWxvbiUyMGludGVyaW9yJTIwYmVhdXR5fGVufDB8fHx8MTc1MzYyODE1OHww&ixlib=rb-4.1.0&q=80&w=1080',
    altText: 'Интериор на модерен салон за красота',
    title: 'Намерете Вашия Перфектен Салон',
    subtitle: 'Открийте най-добрите салони за красота и услуги близо до Вас.',
    buttonText: 'Разгледай Салоните',
    buttonLink: '/salons',
    dataAiHint: 'salon interior beauty',
    priority: true, // Mark the first slide's image as priority
  },
  {
    id: 'slide2',
    imageUrl: 'https://images.unsplash.com/photo-1591343395082-e120087004b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxzcGElMjB3ZWxsbmVzcyUyMHJlbGF4YXRpb258ZW58MHx8fHwxNzUzNjI4MTU4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    altText: 'Жена, която се наслаждава на СПА процедура',
    title: 'Релаксиращи СПА Изживявания',
    subtitle: 'Потопете се в свят на спокойствие с нашите ексклузивни СПА процедури.',
    buttonText: 'Виж СПА Услугите',
    buttonLink: '/salons?category=Масажи',
    dataAiHint: 'spa wellness relaxation',
  },
  {
    id: 'slide3',
    imageUrl: 'https://images.unsplash.com/photo-1693591936914-14645081663a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxoYWlyY3V0JTIwc3R5bGluZyUyMGZhc2hpb258ZW58MHx8fHwxNzUzNjI4MTU3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    altText: 'Модел с модерна прическа',
    title: 'Модерни Прически и Стилизиране',
    subtitle: 'Подчертайте своята индивидуалност с най-новите тенденции в прическите.',
    buttonText: 'Фризьорски Услуги',
    buttonLink: '/salons?category=Дамски+фризьорски+услуги',
    dataAiHint: 'haircut styling fashion',
  },
];
