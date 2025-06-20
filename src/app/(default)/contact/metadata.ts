import type { Metadata } from 'next';

// Metadata for the contact page
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Свържете се с нас - Glaura',
    description: 'Имате въпроси или предложения? Свържете се с Glaura чрез нашата форма за контакт.',
    keywords: 'контакти, връзка, телефон, имейл, адрес, запитване', // Keywords specific to contacting a business
  };
}