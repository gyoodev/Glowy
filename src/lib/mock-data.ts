
import type { Salon, Service, Review, UserProfile, Booking } from '@/types';
import { Scissors, Brush, Palette, Sparkles, Droplets, Sun, Hand, Flame, Eye, ArrowUpCircle, type Icon as LucideIcon } from 'lucide-react';
import { CircleStop } from 'lucide-react';

export const mockServices: Service[] = [
  // Women's Hair
  { id: 's1', name: 'Дамска подстрижка', category: 'Дамски фризьорски услуги', description: 'Шампоан, подстригване и стилизиране за жени.', price: 60, duration: 60, categoryIcon: Scissors },
  { id: 's1a', name: 'Дамска прическа с изправяне/къдрене', category: 'Дамски фризьорски услуги', description: 'Измиване, изсушаване и стилизиране по желание.', price: 50, duration: 75, categoryIcon: Scissors },
  { id: 's1b', name: 'Официална дамска прическа', category: 'Дамски фризьорски услуги', description: 'Стилизиране за специални поводи.', price: 80, duration: 90, categoryIcon: Scissors },
  // Men's Hair
  { id: 's2', name: 'Мъжка подстрижка', category: 'Мъжки фризьорски услуги', description: 'Класическо мъжко подстригване и стилизиране.', price: 40, duration: 45, categoryIcon: Scissors },
  { id: 's2a', name: 'Оформяне на брада', category: 'Мъжки фризьорски услуги', description: 'Подстригване и оформяне на брада с бръснене.', price: 25, duration: 30, categoryIcon: Scissors },
  { id: 's2b', name: 'Мъжка прическа с бръснене', category: 'Мъжки фризьорски услуги', description: 'Подстригване и класическо бръснене.', price: 55, duration: 60, categoryIcon: Scissors },
  // Coloring
  { id: 's3', name: 'Цялостно боядисване', category: 'Боядисване', description: 'Еднопроцесно боядисване на цялата коса.', price: 120, duration: 120, categoryIcon: Palette },
  { id: 's4', name: 'Кичури', category: 'Боядисване', description: 'Частични или цели кичури.', price: 150, duration: 180, categoryIcon: Sparkles },
  { id: 's4a', name: 'Балеаж / Омбре', category: 'Боядисване', description: 'Техника за изсветляване на косата с плавни преходи.', price: 180, duration: 240, categoryIcon: Sparkles },
  { id: 's4b', name: 'Тониране', category: 'Боядисване', description: 'Освежаване на цвета или неутрализиране на нежелани оттенъци.', price: 70, duration: 90, categoryIcon: Palette },
  // Nail Procedures
  { id: 's5', name: 'Класически маникюр', category: 'Маникюр и Педикюр', description: 'Почистване, оформяне и лакиране на ноктите.', price: 35, duration: 45, categoryIcon: Brush },
  { id: 's5a', name: 'Гелак (маникюр)', category: 'Маникюр и Педикюр', description: 'Поставяне на дълготраен гел лак.', price: 45, duration: 60, categoryIcon: Brush },
  { id: 's5b', name: 'Поддръжка гелак', category: 'Маникюр и Педикюр', description: 'Сваляне и повторно поставяне на гел лак.', price: 50, duration: 75, categoryIcon: Brush },
  { id: 's6', name: 'Класически педикюр', category: 'Маникюр и Педикюр', description: 'Релаксиращ педикюр с масаж и лак.', price: 50, duration: 60, categoryIcon: Droplets },
  { id: 's6a', name: 'Гелак (педикюр)', category: 'Маникюр и Педикюр', description: 'Поставяне на дълготраен гел лак на краката.', price: 60, duration: 75, categoryIcon: Droplets },
  // Facial Procedures
  { id: 's7', name: 'Почистваща процедура за лице', category: 'Козметични процедури за лице', description: 'Дълбоко почистване и хидратация.', price: 90, duration: 75, categoryIcon: Sun },
  { id: 's7a', name: 'Процедура за лице с маска', category: 'Козметични процедури за лице', description: 'Индивидуално подбрана маска според типа кожа.', price: 70, duration: 60, categoryIcon: Sun },
  { id: 's7b', name: 'Терапия за околоочен контур', category: 'Козметични процедури за лице', description: 'Специализирана грижа за нежната кожа около очите.', price: 50, duration: 45, categoryIcon: Sun },
  // Massages
  { id: 'm1', name: 'Класически масаж на цяло тяло', category: 'Масажи', description: 'Релаксиращ масаж за облекчаване на напрежението.', price: 80, duration: 60, categoryIcon: CircleStop },
  { id: 'm2', name: 'Частичен масаж (гръб/врат)', category: 'Масажи', description: 'Таргетиран масаж за конкретни зони.', price: 50, duration: 30, categoryIcon: CircleStop },
  { id: 'm3', name: 'Спортен масаж', category: 'Масажи', description: 'По-дълбок масаж за спортисти или при мускулни болки.', price: 90, duration: 75, categoryIcon: CircleStop },
  // Eyelash & Eyebrow
  { id: 'ee1', name: 'Оформяне на вежди', category: 'Мигли и вежди', description: 'Професионално оформяне на вежди с пинсета или конец.', price: 25, duration: 30, categoryIcon: Eye },
  { id: 'ee2', name: 'Боядисване на вежди', category: 'Мигли и вежди', description: 'Боядисване на вежди за по-изразителен поглед.', price: 20, duration: 20, categoryIcon: Eye },
  { id: 'ee3', name: 'Поставяне на мигли (косъм по косъм)', category: 'Мигли и вежди', description: 'Удължаване и сгъстяване на миглите чрез техника косъм по косъм.', price: 120, duration: 120, categoryIcon: ArrowUpCircle },
  { id: 'ee4', name: 'Поддръжка на мигли', category: 'Мигли и вежди', description: 'Поддръжка и попълване на поставени мигли.', price: 60, duration: 60, categoryIcon: ArrowUpCircle },
];

// New categories for Eyelashes and Eyebrows - This is now merged into mockServices
// export const mockEyelashEyebrowServices: Service[] = [ ... ];

export const mockReviews: Review[] = [
  { id: 'r1', userName: 'Алиса Чудесникова', rating: 5, comment: 'Абсолютно обожавам новата си прическа! Стилистката беше невероятна.', date: '2024-05-10T10:00:00Z', userAvatar: 'https://placehold.co/40x40.png', userId: 'user1', salonId: 'salon1' },
  { id: 'r2', userName: 'Боби Строителя', rating: 4, comment: 'Страхотно обслужване и приятелски настроен персонал. Цветът ми стана перфектен.', date: '2024-05-12T14:30:00Z', userAvatar: 'https://placehold.co/40x40.png', userId: 'user2', salonId: 'salon2' },
  { id: 'r3', userName: 'Чарли Браун', rating: 5, comment: 'Най-добрата процедура за лице, която съм имала! Толкова релаксиращо!', date: '2024-05-15T11:00:00Z', userAvatar: 'https://placehold.co/40x40.png', userId: 'user3', salonId: 'salon3' },
];

export const mockSalons: Salon[] = [
  {
    id: 'salon1',
    ownerId: 'owner1',
    name: 'Студио Блясък и Красота',
    description: 'Изживейте лукс и трансформация в Студио Блясък и Красота. Предлагаме широка гама от козметични услуги, за да изглеждате и да се чувствате по най-добрия начин. Нашите експертни стилисти са посветени на предоставянето на персонализирана грижа в шикозна и релаксираща атмосфера.',
    region: 'Бургас',
    address: 'бул. Красота 123',
    city: 'Бургас',
    rating: 4.8,
    priceRange: 'moderate',
    photos: [
      'https://placehold.co/600x400.png?text=Salon+Image+1',
      'https://placehold.co/600x400.png?text=Salon+Image+2',
      'https://placehold.co/600x400.png?text=Salon+Image+3',
    ],
    services: [mockServices[0], mockServices[2], mockServices[4], mockServices[7], mockServices[8], mockServices[9]],
    reviewCount: 2,
    heroImage: 'https://placehold.co/1200x400.png?text=Beauty+Studio+Shine',
    availability: {
      [(new Date(Date.now() + 86400000 * 1)).toISOString().split('T')[0]]: ['09:00', '10:00', '14:00', '15:00'],
      [(new Date(Date.now() + 86400000 * 2)).toISOString().split('T')[0]]: ['09:30', '11:00', '13:00', '16:00'],
      [(new Date(Date.now() + 86400000 * 3)).toISOString().split('T')[0]]: ['10:00', '12:00', '15:30'],
    },
    createdAt: new Date().toISOString(),
    status: 'approved',
  },
  {
    id: 'salon2',
    ownerId: 'owner2',
    name: 'Авангард',
    description: 'Модерни стилове и класически подстрижки в Авангард. Специализираме в трансформации на косата и прецизно стилизиране. Нашият салон предоставя жизнена и приятелска среда за всички ваши нужди от грижа за косата.',
    region: 'София-град',
    address: 'ул. Стил 456',
    city: 'София',
    rating: 4.5,
    priceRange: 'cheap',
    photos: [
      'https://placehold.co/600x400.png?text=Salon+Image+A',
      'https://placehold.co/600x400.png?text=Salon+Image+B',
    ],
    services: [mockServices[1], mockServices[3]],
    reviewCount: 1,
    heroImage: 'https://placehold.co/1200x400.png?text=Avantgarde+Hair',
     availability: {
      [(new Date(Date.now() + 86400000 * 1)).toISOString().split('T')[0]]: ['10:00', '11:00', '13:00', '14:00'],
      [(new Date(Date.now() + 86400000 * 2)).toISOString().split('T')[0]]: ['10:30', '12:00', '15:00'],
    },
    createdAt: new Date().toISOString(),
    status: 'approved',
  },
  {
    id: 'salon3',
    ownerId: 'owner3',
    name: 'Спокоен СПА & Салон',
    description: 'Отдайте се на спокойствие в Спокоен СПА & Салон. Предлагаме холистичен подход към красотата и благосъстоянието, от подмладяващи процедури за лице до луксозни маникюри и педикюри. Избягайте от ежедневието и намерете своето спокойствие при нас.',
    region: 'Пловдив',
    address: 'ул. Релакс 789',
    city: 'Пловдив',
    rating: 4.9,
    priceRange: 'expensive',
    photos: [
      'https://placehold.co/600x400.png?text=Spa+Image+1',
      'https://placehold.co/600x400.png?text=Spa+Image+2',
      'https://placehold.co/600x400.png?text=Spa+Image+3',
      'https://placehold.co/600x400.png?text=Spa+Image+4',
    ],
    services: [mockServices[4], mockServices[5], mockServices[6], mockServices[10], mockServices[11], mockServices[12], mockServices[13], mockServices[14]],
    reviewCount: 3,
    heroImage: 'https://placehold.co/1200x400.png?text=Tranquil+Spa',
    availability: {
      [(new Date(Date.now() + 86400000 * 1)).toISOString().split('T')[0]]: ['11:00', '14:30'],
      [(new Date(Date.now() + 86400000 * 3)).toISOString().split('T')[0]]: ['10:00', '11:30', '13:30', '16:30'],
    },
    createdAt: new Date().toISOString(),
    status: 'approved',
  },
];

export const mockUserProfile: UserProfile = {
  id: 'user1',
  userId: 'user1',
  name: 'Яна Доева',
  email: 'yana.doeva@example.com',
  profilePhotoUrl: 'https://placehold.co/100x100.png',
  role: 'customer',
  preferences: {
    favoriteServices: ['Дамска подстрижка', 'Процедура за лице'],
    priceRange: 'moderate',
    preferredLocations: ['Бургас', 'София'],
  },
  createdAt: new Date().toISOString(),
};

export const mockBookings: Booking[] = [
  { id: 'b1', salonId: 'salon1', salonName: 'Студио Блясък и Красота', serviceId: 's1', serviceName: 'Дамска подстрижка', date: '2024-04-20T00:00:00Z', time: '10:00', status: 'completed', userId: 'user1', clientName: 'Яна Доева', clientEmail: 'yana.doeva@example.com', clientPhoneNumber: '0888123456', startTime: '2024-04-20T10:00:00Z', endTime: '2024-04-20T11:00:00Z', createdAt: new Date().toISOString(), service: mockServices.find(s=>s.id === 's1')},
  { id: 'b2', salonId: 'salon3', salonName: 'Спокоен СПА & Салон', serviceId: 's7', serviceName: 'Процедура за лице', date: '2024-05-05T00:00:00Z', time: '15:00', status: 'completed', userId: 'user1', clientName: 'Яна Доева', clientEmail: 'yana.doeva@example.com', clientPhoneNumber: '0888123456', startTime: '2024-05-05T15:00:00Z', endTime: '2024-05-05T16:15:00Z', createdAt: new Date().toISOString(), service: mockServices.find(s=>s.id === 's7') },
  { id: 'b3', salonId: 'salon1', salonName: 'Студио Блясък и Красота', serviceId: 's5', serviceName: 'Маникюр', date: (new Date(Date.now() + 86400000 * 5)).toISOString().split('T')[0], time: '11:00', status: 'confirmed', userId: 'user1', clientName: 'Яна Доева', clientEmail: 'yana.doeva@example.com', clientPhoneNumber: '0888123456', startTime: new Date(Date.now() + 86400000 * 5 + 11*60*60*1000).toISOString() , endTime: new Date(Date.now() + 86400000 * 5 + (11*60+45)*60*1000).toISOString(), createdAt: new Date().toISOString(), service: mockServices.find(s=>s.id === 's5') },
];

export const getSalonById = (id: string): Salon | undefined => mockSalons.find(salon => salon.id === id);

export const allBulgarianCities: string[] = [
  "София", "Пловдив", "Варна", "Бургас", "Русе", "Стара Загора",
  "Плевен", "Сливен", "Добрич", "Шумен", "Перник", "Хасково",
  "Ямбол", "Пазарджик", "Благоевград", "Велико Търново", "Враца",
  "Габрово", "Видин", "Монтана", "Кюстендил", "Кърджали",
  "Търговище", "Ловеч", "Силистра", "Разград", "Смолян"
];

export const bulgarianRegionsAndCities: { region: string; cities: string[] }[] = [
    { region: 'Благоевград', cities: ['Благоевград', 'Банско', 'Гоце Делчев', 'Петрич', 'Разлог', 'Сандански', 'Якоруда'] },
    { region: 'Бургас', cities: ['Бургас', 'Айтос', 'Карнобат', 'Несебър', 'Поморие', 'Созопол', 'Царево'] },
    { region: 'Варна', cities: ['Варна', 'Аксаково', 'Белослав', 'Девня', 'Долни чифлик', 'Провадия', 'Суворово'] },
    { region: 'Велико Търново', cities: ['Велико Търново', 'Горна Оряховица', 'Елена', 'Лясковец', 'Павликени', 'Свищов', 'Стражица'] },
    { region: 'Видин', cities: ['Видин', 'Белоградчик', 'Брегово', 'Грамада', 'Димово', 'Кула'] },
    { region: 'Враца', cities: ['Враца', 'Бяла Слатина', 'Козлодуй', 'Криводол', 'Мездра', 'Оряхово', 'Роман'] },
    { region: 'Габрово', cities: ['Габрово', 'Дряново', 'Севлиево', 'Трявна'] },
    { region: 'Добрич', cities: ['Добрич', 'Балчик', 'Генерал Тошево', 'Каварна', 'Тервел', 'Шабла'] },
    { region: 'Кърджали', cities: ['Кърджали', 'Ардино', 'Джебел', 'Крумовград', 'Момчилград'] },
    { region: 'Кюстендил', cities: ['Кюстендил', 'Бобов дол', 'Дупница', 'Кочериново', 'Рила', 'Сапарева баня'] },
    { region: 'Ловеч', cities: ['Ловеч', 'Априлци', 'Летница', 'Луковит', 'Тетевен', 'Троян', 'Ябланица'] },
    { region: 'Монтана', cities: ['Монтана', 'Берковица', 'Бойчиновци', 'Брусарци', 'Вълчедръм', 'Лом', 'Чипровци'] },
    { region: 'Пазарджик', cities: ['Пазарджик', 'Батак', 'Белово', 'Брацигово', 'Велинград', 'Панагюрище', 'Пещера', 'Ракитово', 'Септември', 'Стрелча'] },
    { region: 'Перник', cities: ['Перник', 'Брезник', 'Земен', 'Ковачевци', 'Радомир', 'Трън'] },
    { region: 'Плевен', cities: ['Плевен', 'Белене', 'Гулянци', 'Долна Митрополия', 'Долни Дъбник', 'Искър', 'Кнежа', 'Левски', 'Никопол', 'Пордим', 'Червен бряг'] },
    { region: 'Пловдив', cities: ['Пловдив', 'Асеновград', 'Брезово', 'Калофер', 'Карлово', 'Кричим', 'Перущица', 'Първомай', 'Раковски', 'Садово', 'Сопот', 'Стамболийски', 'Съединение', 'Хисаря'] },
    { region: 'Разград', cities: ['Разград', 'Исперих', 'Кубрат', 'Лозница', 'Самуил', 'Цар Калоян'] },
    { region: 'Русе', cities: ['Русе', 'Бяла', 'Ветово', 'Две могили', 'Сливо поле'] },
    { region: 'Силистра', cities: ['Силистра', 'Алфатар', 'Главиница', 'Дулово', 'Кайнарджа', 'Тутракан'] },
    { region: 'Сливен', cities: ['Сливен', 'Котел', 'Нова Загора', 'Твърдица'] },
    { region: 'Смолян', cities: ['Смолян', 'Баните', 'Девин', 'Доспат', 'Мадан', 'Неделино', 'Рудозем', 'Чепеларе', 'Златоград'] },
    { region: 'София-град', cities: ['София'] },
    { region: 'София-област', cities: ['Божурище', 'Ботевград', 'Годеч', 'Горна Малина', 'Долна баня', 'Драгоман', 'Елин Пелин', 'Етрополе', 'Златица', 'Ихтиман', 'Копривщица', 'Костенец', 'Костинброд', 'Правец', 'Самоков', 'Своге', 'Сливница'] },
    { region: 'Стара Загора', cities: ['Стара Загора', 'Братя Даскалови', 'Гурково', 'Гълъбово', 'Казанлък', 'Мъглиж', 'Николаево', 'Опан', 'Павел баня', 'Раднево', 'Чирпан'] },
    { region: 'Търговище', cities: ['Търговище', 'Антоново', 'Омуртаг', 'Опака', 'Попово'] },
    { region: 'Хасково', cities: ['Хасково', 'Димитровград', 'Ивайловград', 'Любимец', 'Маджарово', 'Минерални бани', 'Свиленград', 'Симеоновград', 'Тополовград', 'Харманли'] },
    { region: 'Шумен', cities: ['Шумен', 'Велики Преслав', 'Върбица', 'Каолиново', 'Каспичан', 'Нови пазар', 'Смядово'] },
    { region: 'Ямбол', cities: ['Ямбол', 'Болярово', 'Елхово', 'Стралджа', 'Тунджа'] },
].sort((a, b) => a.region.localeCompare(b.region, 'bg'));

export const allBulgarianRegions = bulgarianRegionsAndCities.map(r => r.region);

export const bulgarianCitiesWithNeighborhoods: Record<string, string[]> = {
  "София": ["Център", "Лозенец", "Младост 1", "Младост 2", "Младост 3", "Младост 4", "Люлин", "Надежда", "Овча купел", "Студентски град", "Витоша", "Бояна", "Гео Милев", "Изток", "Западен парк"],
  "Пловдив": ["Център", "Кършияка", "Смирненски", "Тракия", "Южен", "Каменица 1", "Каменица 2", "Кючук Париж"],
  "Варна": ["Център", "Гръцка махала", "Чайка", "Владислав Варненчик", "Младост", "Аспарухово", "Виница", "Бриз", "Левски"],
  "Бургас": ["Център", "Лазур", "Братя Миладинови", "Славейков", "Изгрев", "Меден рудник", "Сарафово", "Възраждане"],
  "Русе": ["Център", "Възраждане", "Здравец", "Родина", "Чародейка"],
  "Стара Загора": ["Център", "Три чучура", "Железник", "Казански", "Самара"],
};
    
