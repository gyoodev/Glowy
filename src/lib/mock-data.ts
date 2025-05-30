
import type { Salon, Service, Review, UserProfile, Booking } from '@/types';
import { Scissors, Brush, Palette, Sparkles, Droplets, Sun, Hand, Flame, Eye, ArrowUpCircle } from 'lucide-react';
import { CircleStop } from 'lucide-react';export const mockServices: Service[] = [
  // Women's Hair
  { id: 's1', name: 'Дамска подстрижка', description: 'Шампоан, подстригване и стилизиране за жени.', price: 60, duration: 60, categoryIcon: Scissors },
  { id: 's1a', name: 'Дамска прическа с изправяне/къдрене', description: 'Измиване, изсушаване и стилизиране по желание.', price: 50, duration: 75, categoryIcon: Scissors },
  { id: 's1b', name: 'Официална дамска прическа', description: 'Стилизиране за специални поводи.', price: 80, duration: 90, categoryIcon: Scissors },
  // Men's Hair
  { id: 's2', name: 'Мъжка подстрижка', description: 'Класическо мъжко подстригване и стилизиране.', price: 40, duration: 45, categoryIcon: Scissors },
  { id: 's2a', name: 'Оформяне на брада', description: 'Подстригване и оформяне на брада с бръснене.', price: 25, duration: 30, categoryIcon: Scissors },
  { id: 's2b', name: 'Мъжка прическа с бръснене', description: 'Подстригване и класическо бръснене.', price: 55, duration: 60, categoryIcon: Scissors },
  // Coloring
  { id: 's3', name: 'Цялостно боядисване', description: 'Еднопроцесно боядисване на цялата коса.', price: 120, duration: 120, categoryIcon: Palette }, // Keep existing
  { id: 's4', name: 'Кичури', description: 'Частични или цели кичури.', price: 150, duration: 180, categoryIcon: Sparkles }, // Keep existing
  { id: 's4a', name: 'Балеаж / Омбре', description: 'Техника за изсветляване на косата с плавни преходи.', price: 180, duration: 240, categoryIcon: Sparkles },
  { id: 's4b', name: 'Тониране', description: 'Освежаване на цвета или неутрализиране на нежелани оттенъци.', price: 70, duration: 90, categoryIcon: Palette },
  // Nail Procedures
  { id: 's5', name: 'Класически маникюр', description: 'Почистване, оформяне и лакиране на ноктите.', price: 35, duration: 45, categoryIcon: Brush }, // Keep existing
  { id: 's5a', name: 'Гелак (маникюр)', description: 'Поставяне на дълготраен гел лак.', price: 45, duration: 60, categoryIcon: Brush },
  { id: 's5b', name: 'Поддръжка гелак', description: 'Сваляне и повторно поставяне на гел лак.', price: 50, duration: 75, categoryIcon: Brush },
  { id: 's6', name: 'Класически педикюр', description: 'Релаксиращ педикюр с масаж и лак.', price: 50, duration: 60, categoryIcon: Droplets }, // Keep existing
  { id: 's6a', name: 'Гелак (педикюр)', description: 'Поставяне на дълготраен гел лак на краката.', price: 60, duration: 75, categoryIcon: Droplets },
  // Facial Procedures
  { id: 's7', name: 'Почистваща процедура за лице', description: 'Дълбоко почистване и хидратация.', price: 90, duration: 75, categoryIcon: Sun }, // Keep existing
  { id: 's7a', name: 'Процедура за лице с маска', description: 'Индивидуално подбрана маска според типа кожа.', price: 70, duration: 60, categoryIcon: Sun },
  { id: 's7b', name: 'Терапия за околоочен контур', description: 'Специализирана грижа за нежната кожа около очите.', price: 50, duration: 45, categoryIcon: Sun },
  // Massages
  { id: 'm1', name: 'Класически масаж на цяло тяло', description: 'Релаксиращ масаж за облекчаване на напрежението.', price: 80, duration: 60, categoryIcon: CircleStop },
  { id: 'm2', name: 'Частичен масаж (гръб/врат)', description: 'Таргетиран масаж за конкретни зони.', price: 50, duration: 30, categoryIcon: CircleStop },
  { id: 'm3', name: 'Спортен масаж', description: 'По-дълбок масаж за спортисти или при мускулни болки.', price: 90, duration: 75, categoryIcon: CircleStop },
];

// New categories for Eyelashes and Eyebrows
export const mockEyelashEyebrowServices: Service[] = [
  { id: 'ee1', name: 'Оформяне на вежди', description: 'Професионално оформяне на вежди с пинсета или конец.', price: 25, duration: 30, categoryIcon: Eye },
  { id: 'ee2', name: 'Боядисване на вежди', description: 'Боядисване на вежди за по-изразителен поглед.', price: 20, duration: 20, categoryIcon: Eye },
  { id: 'ee3', name: 'Поставяне на мигли (косъм по косъм)', description: 'Удължаване и сгъстяване на миглите чрез техника косъм по косъм.', price: 120, duration: 120, categoryIcon: ArrowUpCircle },
  { id: 'ee4', name: 'Поддръжка на мигли', description: 'Поддръжка и попълване на поставени мигли.', price: 60, duration: 60, categoryIcon: ArrowUpCircle },
];

export const mockReviews: Review[] = [
  { id: 'r1', userName: 'Алиса Чудесникова', rating: 5, comment: 'Абсолютно обожавам новата си прическа! Стилистката беше невероятна.', date: '2024-05-10T10:00:00Z', userAvatar: 'https://placehold.co/40x40.png' },
  { id: 'r2', userName: 'Боби Строителя', rating: 4, comment: 'Страхотно обслужване и приятелски настроен персонал. Цветът ми стана перфектен.', date: '2024-05-12T14:30:00Z', userAvatar: 'https://placehold.co/40x40.png' },
  { id: 'r3', userName: 'Чарли Браун', rating: 5, comment: 'Най-добрата процедура за лице, която съм имала! Толкова релаксиращо!', date: '2024-05-15T11:00:00Z' },
];

export const mockSalons: Salon[] = [
  {
    id: 'salon1',
    name: 'Студио Блясък и Красота',
    description: 'Изживейте лукс и трансформация в Студио Блясък и Красота. Предлагаме широка гама от козметични услуги, за да изглеждате и да се чувствате по най-добрия начин. Нашите експертни стилисти са посветени на предоставянето на персонализирана грижа в шикозна и релаксираща атмосфера.',
    address: 'бул. Красота 123, гр. Блясък, БС 12345',
    city: 'гр. Блясък',
    rating: 4.8,
    priceRange: 'moderate',
    photos: [
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
    ],
    services: [mockServices[0], mockServices[2], mockServices[4], mockServices[7], mockServices[8], mockServices[9]], // Example services from the expanded list
    reviews: mockReviews.slice(0, 2),
    heroImage: 'https://placehold.co/1200x400.png',
    availability: {
      [(new Date(Date.now() + 86400000 * 1)).toISOString().split('T')[0]]: ['09:00', '10:00', '14:00', '15:00'],
      [(new Date(Date.now() + 86400000 * 2)).toISOString().split('T')[0]]: ['09:30', '11:00', '13:00', '16:00'],
      [(new Date(Date.now() + 86400000 * 3)).toISOString().split('T')[0]]: ['10:00', '12:00', '15:30'],
    }
  },
  {
    id: 'salon2',
    name: 'Авангард',
    description: 'Модерни стилове и класически подстрижки в Авангард. Специализираме в трансформации на косата и прецизно стилизиране. Нашият салон предоставя жизнена и приятелска среда за всички ваши нужди от грижа за косата.',
    address: 'ул. Стил 456, гр. Модерен, МД 67890',
    city: 'гр. Модерен',
    rating: 4.5,
    priceRange: 'cheap',
    photos: [
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
    ],
    services: [mockServices[1], mockServices[3]],
    reviews: [mockReviews[1]], // Corrected to use a valid review
    heroImage: 'https://placehold.co/1200x400.png',
     availability: {
      [(new Date(Date.now() + 86400000 * 1)).toISOString().split('T')[0]]: ['10:00', '11:00', '13:00', '14:00'],
      [(new Date(Date.now() + 86400000 * 2)).toISOString().split('T')[0]]: ['10:30', '12:00', '15:00'],
    }
  },
  {
    id: 'salon3',
    name: 'Спокоен СПА & Салон',
    description: 'Отдайте се на спокойствие в Спокоен СПА & Салон. Предлагаме холистичен подход към красотата и благосъстоянието, от подмладяващи процедури за лице до луксозни маникюри и педикюри. Избягайте от ежедневието и намерете своето спокойствие при нас.',
    address: 'ул. Релакс 789, Тиха долина, ТД 10112',
    city: 'Тиха долина',
    rating: 4.9,
    priceRange: 'expensive',
    photos: [
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
    ],
    services: [mockServices[4], mockServices[5], mockServices[6], mockServices[10], mockServices[11], mockServices[12], mockServices[13], mockServices[14]], // Example services
    reviews: mockReviews,
    heroImage: 'https://placehold.co/1200x400.png',
    availability: {
      [(new Date(Date.now() + 86400000 * 1)).toISOString().split('T')[0]]: ['11:00', '14:30'],
      [(new Date(Date.now() + 86400000 * 3)).toISOString().split('T')[0]]: ['10:00', '11:30', '13:30', '16:30'],
    }
  },
];

export const mockUserProfile: UserProfile = {
  id: 'user1',
  userId: 'user1', // Added missing userId field
  name: 'Яна Доева',
  email: 'yana.doeva@example.com',
  profilePhotoUrl: 'https://placehold.co/100x100.png',
  preferences: {
    favoriteServices: ['Дамска подстрижка', 'Процедура за лице'],
    priceRange: 'moderate',
    preferredLocations: ['гр. Блясък', 'гр. Модерен'],
  },
};

export const mockBookings: Booking[] = [
  { id: 'b1', salonId: 'salon1', salonName: 'Студио Блясък и Красота', serviceId: 's1', serviceName: 'Дамска подстрижка', date: '2024-04-20T00:00:00Z', time: '10:00', status: 'completed', userId: 'user1', clientName: 'Яна Доева', clientEmail: 'yana.doeva@example.com', clientPhoneNumber: '0888123456' },
  { id: 'b2', salonId: 'salon3', salonName: 'Спокоен СПА & Салон', serviceId: 's7', serviceName: 'Процедура за лице', date: '2024-05-05T00:00:00Z', time: '15:00', status: 'completed', userId: 'user1', clientName: 'Яна Доева', clientEmail: 'yana.doeva@example.com', clientPhoneNumber: '0888123456' },
  { id: 'b3', salonId: 'salon1', salonName: 'Студио Блясък и Красота', serviceId: 's5', serviceName: 'Маникюр', date: (new Date(Date.now() + 86400000 * 5)).toISOString().split('T')[0], time: '11:00', status: 'confirmed', userId: 'user1', clientName: 'Яна Доева', clientEmail: 'yana.doeva@example.com', clientPhoneNumber: '0888123456' },
];

export const getSalonById = (id: string): Salon | undefined => mockSalons.find(salon => salon.id === id);

export const allBulgarianCities: string[] = [
  "София", "Пловдив", "Варна", "Бургас", "Русе", "Стара Загора",
  "Плевен", "Сливен", "Добрич", "Шумен", "Перник", "Хасково",
  "Ямбол", "Пазарджик", "Благоевград", "Велико Търново", "Враца",
  "Габрово", "Видин", "Монтана", "Кюстендил", "Кърджали",
  "Търговище", "Ловеч", "Силистра", "Разград", "Смолян"
];
