import type { Slide } from '@/components/layout/HeroSlider';

export const slidesData: Slide[] = [
  {
    id: 'slide1',
    imageUrl: 'https://placehold.co/1920x550/E6E6FA/333333.png?text=Beauty+Salon',
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
    imageUrl: 'https://placehold.co/1920x550/FFB6C1/333333.png?text=Relaxing+Spa',
    altText: 'Жена, която се наслаждава на СПА процедура',
    title: 'Релаксиращи СПА Изживявания',
    subtitle: 'Потопете се в свят на спокойствие с нашите ексклузивни СПА процедури.',
    buttonText: 'Виж СПА Услугите',
    buttonLink: '/salons?category=Масажи',
    dataAiHint: 'spa wellness relaxation',
  },
  {
    id: 'slide3',
    imageUrl: 'https://placehold.co/1920x550/F08080/FFFFFF.png?text=Modern+Hairstyles',
    altText: 'Модел с модерна прическа',
    title: 'Модерни Прически и Стилизиране',
    subtitle: 'Подчертайте своята индивидуалност с най-новите тенденции в прическите.',
    buttonText: 'Фризьорски Услуги',
    buttonLink: '/salons?category=Дамски+фризьорски+услуги',
    dataAiHint: 'haircut styling fashion',
  },
];
