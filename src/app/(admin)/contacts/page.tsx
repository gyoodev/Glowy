typescriptreact
'use client';

import React, { useState, useEffect } from 'react';
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

  return (
    <div className="container mx-auto py-10 px-6">
      <h1 className="text-3xl font-bold mb-6">Admin - Contact Entries</h1>
      {isLoading && <p>Loading contact entries...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!isLoading && !error && contacts.length === 0 && <p>No contact entries found.</p>}
      {!isLoading && !error && contacts.length > 0 && (
        <div className="space-y-6">
          {contacts.map(contact => (
            <div key={contact.id} className={`p-4 border rounded-md ${contact.isAnswered ? 'bg-gray-100' : 'bg-white'}`}>
              <h3 className="text-xl font-semibold">{contact.subject || 'No Subject'}</h3>
              <p className="text-sm text-gray-600">From: {contact.name} ({contact.email})</p>
              <p className="mt-2 text-gray-800">{contact.message}</p>
              <p className="mt-2 text-xs text-gray-500">Received: {contact.createdAt.toDate().toLocaleString()}</p>
              <p className="mt-1 text-sm font-medium">{contact.isAnswered ? 'Status: Answered' : 'Status: Pending'}</p>
              {/* Add button to mark as answered here later */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}