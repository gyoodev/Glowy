
import type { Salon, Service, Review, UserProfile, Booking } from '@/types';
import { Scissors, Brush, Palette, Sparkles, Droplets, Sun } from 'lucide-react';

export const mockServices: Service[] = [
  { id: 's1', name: 'Дамска подстрижка', description: 'Шампоан, подстригване и стилизиране за жени.', price: 60, duration: 60, categoryIcon: Scissors },
  { id: 's2', name: 'Мъжка подстрижка', description: 'Класическо мъжко подстригване и стилизиране.', price: 40, duration: 45, categoryIcon: Scissors },
  { id: 's3', name: 'Цялостно боядисване', description: 'Еднопроцесно боядисване на цялата коса.', price: 120, duration: 120, categoryIcon: Palette },
  { id: 's4', name: 'Кичури', description: 'Частични или цели кичури.', price: 150, duration: 180, categoryIcon: Sparkles },
  { id: 's5', name: 'Маникюр', description: 'Класически маникюр с лак.', price: 35, duration: 45, categoryIcon: Brush },
  { id: 's6', name: 'Педикюр', description: 'Релаксиращ педикюр с масаж и лак.', price: 50, duration: 60, categoryIcon: Droplets },
  { id: 's7', name: 'Процедура за лице', description: 'Дълбоко почистваща и ревитализираща процедура за лице.', price: 90, duration: 75, categoryIcon: Sun },
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
    services: [mockServices[0], mockServices[2], mockServices[4], mockServices[6]],
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
    reviews: [mockReviews[2]],
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
    services: [mockServices[4], mockServices[5], mockServices[6]],
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
  { id: 'b1', salonId: 'salon1', salonName: 'Студио Блясък и Красота', serviceId: 's1', serviceName: 'Дамска подстрижка', date: '2024-04-20T00:00:00Z', time: '10:00', status: 'completed' },
  { id: 'b2', salonId: 'salon3', salonName: 'Спокоен СПА & Салон', serviceId: 's7', serviceName: 'Процедура за лице', date: '2024-05-05T00:00:00Z', time: '15:00', status: 'completed' },
  { id: 'b3', salonId: 'salon1', salonName: 'Студио Блясък и Красота', serviceId: 's5', serviceName: 'Маникюр', date: (new Date(Date.now() + 86400000 * 5)).toISOString().split('T')[0], time: '11:00', status: 'confirmed' },
];

export const getSalonById = (id: string): Salon | undefined => mockSalons.find(salon => salon.id === id);

export const allBulgarianCities: string[] = [
  "София", "Пловдив", "Варна", "Бургас", "Русе", "Стара Загора", 
  "Плевен", "Сливен", "Добрич", "Шумен", "Перник", "Хасково", 
  "Ямбол", "Пазарджик", "Благоевград", "Велико Търново", "Враца", 
  "Габрово", "Видин", "Монтана", "Кюстендил", "Кърджали", 
  "Търговище", "Ловеч", "Силистра", "Разград", "Смолян"
];
