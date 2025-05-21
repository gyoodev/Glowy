'use client';

import { useState, useEffect, useCallback } from 'react';
import { getFirestore, collection, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';

interface ContactEntry {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  createdAt: Timestamp;
  isAnswered: boolean;
}

export default function AdminContactEntriesPage() {
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null); // To track which contact is being updated
  const firestore = getFirestore();

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const contactsCollection = collection(firestore, 'contacts');
        const contactsQuery = query(contactsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(contactsQuery);

        const fetchedContacts: ContactEntry[] = [];
        querySnapshot.forEach((doc) => {
          fetchedContacts.push({
            id: doc.id,
            ...doc.data() as Omit<ContactEntry, 'id'> // Type assertion for fetched data
          });
        });
        setContacts(fetchedContacts);
      } catch (err: any) {
        console.error("Error fetching contacts:", err);
        setError("Failed to fetch contact entries.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, [firestore]);

  const markAsAnswered = useCallback(async (contactId: string) => {
    setUpdatingId(contactId);
    try {
      // Assuming you have imported `doc` and `updateDoc` from 'firebase/firestore'
      // Add these imports at the top:
      // import { doc, updateDoc } from 'firebase/firestore';
      const contactDocRef = doc(firestore, 'contacts', contactId);
      await updateDoc(contactDocRef, {
        isAnswered: true,
      });

      // Update local state
      setContacts(prevContacts =>
        prevContacts.map(contact =>
          contact.id === contactId ? { ...contact, isAnswered: true } : contact
        )
      );
      console.log(`Contact ${contactId} marked as answered.`);
    } catch (err: any) {
      console.error(`Error marking contact ${contactId} as answered:`, err);
      // Optionally show a toast or error message to the admin
    } finally {
      setUpdatingId(null);
    }
  }, [firestore]); // Include firestore in the dependency array

  return (
    <div className="container mx-auto py-10 px-6">
      <h1 className="text-3xl font-bold mb-6">Admin - Contact Entries</h1>
      {isLoading && <p>Loading contact entries...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!isLoading && !error && contacts.length === 0 && <p>No contact entries found.</p>}
      {!isLoading && !error && contacts.length > 0 && (
        <div className="space-y-6">
          {contacts.map(contact => {
            <div key={contact.id} className={`p-4 border rounded-md ${contact.isAnswered ? 'bg-gray-100' : 'bg-white'}`}>
              <h3 className="text-xl font-semibold">{contact.subject || 'No Subject'}</h3>
              <p className="text-sm text-gray-600">From: {contact.name} ({contact.email})</p>
              <p className="mt-2 text-gray-800">{contact.message}</p>
              <p className="mt-2 text-xs text-gray-500">Received: {contact.createdAt.toDate().toLocaleString()}</p>
              <p className="mt-1 text-sm font-medium">{contact.isAnswered ? 'Status: Answered' : 'Status: Pending'}</p>
              {/* Add button to mark as answered here later */}
              {!contact.isAnswered && (
                <button
                  onClick={() => markAsAnswered(contact.id)}
                  disabled={updatingId === contact.id}
                  className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingId === contact.id ? 'Marking...' : 'Mark as Answered'}
                </button>
              )}
            </div>
          })}
        </div>
      )}
    </div>
  );
}