
'use client';

import { useState, useEffect } from 'react';
import { getFirestore, collection, query, orderBy, getDocs, Timestamp, doc, updateDoc } from 'firebase/firestore';

interface ContactEntry {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  createdAt: Timestamp;
  isAnswered: boolean;
}

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const firestore = getFirestore(); // Initialize Firestore

  useEffect(() => {
    const fetchContacts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const contactsCollection = collection(firestore, 'contacts');
        const contactsQuery = query(contactsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(contactsQuery);

        const fetchedContacts: ContactEntry[] = [];
        querySnapshot.forEach((docSnap) => { // Renamed doc to docSnap to avoid conflict with doc import
          fetchedContacts.push({
            id: docSnap.id,
            ...docSnap.data() as Omit<ContactEntry, 'id'>
          });
        });
        setContacts(fetchedContacts);
      } catch (err: any) {
        console.error("Error fetching contacts:", err);
        setError("Failed to fetch contact entries. Please check Firestore rules and collection name.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, [firestore]); // firestore dependency is correct

  const handleToggleAnswered = async (contactId: string, currentStatus: boolean) => {
    try {
      const contactRef = doc(firestore, 'contacts', contactId);
      await updateDoc(contactRef, {
        isAnswered: !currentStatus
      });
      setContacts(prevContacts =>
        prevContacts.map(contact =>
          contact.id === contactId ? { ...contact, isAnswered: !currentStatus } : contact
        )
      );
    } catch (err) {
      console.error("Error updating contact status:", err);
      alert("Failed to update contact status.");
    }
  };

  if (isLoading) {
    return <div className="container mx-auto py-10">Зареждане на запитвания...</div>;
  }

  if (error) {
    return <div className="container mx-auto py-10 text-destructive">Грешка: {error}</div>;
  }

  return (
    <div className="container mx-auto py-10 px-6">
      <h1 className="text-3xl font-bold mb-6">Запитвания</h1>
      {contacts.length === 0 ? (
        <p>Няма намерени запитвания.</p>
      ) : (
        <div className="space-y-6">
          {contacts.map(contact => (
            <div key={contact.id} className={`p-4 border rounded-md shadow-sm ${contact.isAnswered ? 'bg-green-50 dark:bg-green-900/30' : 'bg-card'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">{contact.subject || 'Без тема'}</h3>
                  <p className="text-sm text-muted-foreground">От: {contact.name} ({contact.email})</p>
                  <p className="mt-2 text-foreground">{contact.message}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Получено: {contact.createdAt.toDate().toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleToggleAnswered(contact.id, contact.isAnswered)}
                  className={`px-3 py-1 text-xs rounded-md ${
                    contact.isAnswered
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {contact.isAnswered ? 'Маркирай като неотговорено' : 'Маркирай като отговорено'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
