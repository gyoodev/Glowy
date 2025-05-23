
'use client';

import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '@/lib/firebase'; // Assuming auth is used to initialize firestore
import type { UserProfile } from '@/types'; // Import UserProfile type

// Interface for the new user form
interface NewUserFormState {
  email: string;
  password: string;
  displayName: string;
  phoneNumber: string;
  role: 'user' | 'business' | 'admin'; // Define possible roles
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]); // Use UserProfile type
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState<NewUserFormState>({ // Use NewUserFormState
    email: '',
    password: '',
    displayName: '',
    phoneNumber: '',
    role: 'user', // Default role
  });


  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const db = getFirestore(auth.app); // Initialize Firestore with the same app as auth
      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const usersList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile)); // Cast to UserProfile
      setUsers(usersList);
      console.log("Fetched users:", usersList); // Log for verification
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = (userId: string) => {
    // Placeholder for delete functionality
    // In a real app, you'd call a Firebase Function to delete the user from Auth and their Firestore doc
    console.log(`Deleting user: ${userId}`);
    alert(`Симулация: Изтриване на потребител ${userId}. Имплементирайте реална логика, включително извикване на Firebase Function за изтриване от Firebase Auth.`);
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const functions = getFunctions();
    // Ensure your Cloud Function is named 'createUserAdmin' or adjust the name here.
    // This function should handle creating the user in Firebase Auth AND their Firestore document.
    const createUserAdminFunction = httpsCallable(functions, 'createUserAdmin');

    try {
      const result: any = await createUserAdminFunction(newUser);
      alert('Потребителят е създаден успешно: ' + result.data.uid + '. Моля, обърнете внимание, че Firestore документът за този потребител трябва да бъде създаден от createUserAdmin Cloud Function.');
      setNewUser({ email: '', password: '', displayName: '', phoneNumber: '', role: 'user' }); // Clear form
      await fetchUsers(); // Re-fetch users to update the list
    } catch (error: any) {
      console.error('Error creating user via function:', error);
      alert('Грешка при създаване на потребител: ' + error.message + '. Уверете се, че Cloud Function "createUserAdmin" е deploy-ната и работи коректно.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Управление на потребители</h1>

      {/* Section for Creating New User */}
      <div className="mb-8 p-6 bg-card rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Създаване на нов потребител (чрез Cloud Function)</h2>
        <form onSubmit={handleCreateUser}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">Имейл</label>
              <input
                id="email"
                type="email"
                className="mt-1 block w-full border border-input rounded-md shadow-sm p-2 bg-background text-foreground"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">Парола</label>
              <input
                id="password"
                type="password"
                className="mt-1 block w-full border border-input rounded-md shadow-sm p-2 bg-background text-foreground"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-foreground">Име за показване</label>
              <input
                id="displayName"
                type="text"
                className="mt-1 block w-full border border-input rounded-md shadow-sm p-2 bg-background text-foreground"
                value={newUser.displayName}
                onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-foreground">Телефонен номер</label>
              <input
                id="phoneNumber"
                type="text"
                className="mt-1 block w-full border border-input rounded-md shadow-sm p-2 bg-background text-foreground"
                value={newUser.phoneNumber}
                onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-foreground">Роля</label>
              <select
                id="role"
                className="mt-1 block w-full border border-input rounded-md shadow-sm p-2 bg-background text-foreground"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as NewUserFormState['role'] })}
                disabled={isSubmitting}
              >
                <option value="user">Потребител (User)</option>
                <option value="business">Бизнес (Business)</option>
                <option value="admin">Администратор (Admin)</option>
              </select>
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50" disabled={isSubmitting}>
            {isSubmitting ? 'Създаване...' : 'Създаване на потребител'}
          </button>
        </form>
         <p className="mt-4 text-sm text-muted-foreground">
            Забележка: Създаването на потребители тук изисква deploy-ната Firebase Cloud Function с име 'createUserAdmin', която създава потребителя в Firebase Authentication и записва неговия Firestore документ с избраната роля.
          </p>
      </div>

      <div className="p-6 bg-card rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Списък с потребители</h2>
        {isLoading ? (
          <p>Зареждане на потребители...</p>
        ) : users.length === 0 ? (
          <p>Няма намерени потребители.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">UID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Имейл</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Име</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Роля</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Телефон</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{user.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{user.displayName || user.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{user.role || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{user.phoneNumber || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        Изтрий (Симулация)
                      </button>
                       {/* TODO: Add Edit button/functionality here if needed, likely to change role */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
