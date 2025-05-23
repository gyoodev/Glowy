
'use client';

import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../../lib/firebase'; // Changed from @/lib/firebase
import type { UserProfile } from '@/types';

interface NewUserFormState {
  email: string;
  password: string;
  displayName: string;
  phoneNumber: string;
  role: 'user' | 'business' | 'admin';
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<NewUserFormState>({
    email: '',
    password: '',
    displayName: '',
    phoneNumber: '',
    role: 'user',
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const db = getFirestore(auth.app);
      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const usersList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
      setUsers(usersList);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError("Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = (userId: string) => {
    console.log(`Attempting to delete user: ${userId}`);
    alert(`СИМУЛАЦИЯ: Изтриване на потребител ${userId}. В реално приложение, това трябва да извика Firebase Function, която изтрива потребителя от Firebase Authentication и неговия Firestore документ. Тази функция трябва да бъде защитена, за да може да се извиква само от администратори.`);
    // To implement:
    // 1. Create a Firebase Function (e.g., 'deleteUserAdmin').
    // 2. This function takes 'userId' as input.
    // 3. Uses Firebase Admin SDK to delete the user from Auth: admin.auth().deleteUser(userId)
    // 4. Deletes the user's document from Firestore: admin.firestore().collection('users').doc(userId).delete()
    // 5. Call this function using httpsCallable from the client.
    // 6. Re-fetch users on success.
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const functions = getFunctions();
    const createUserAdminFunction = httpsCallable(functions, 'createUserAdmin');

    try {
      const result: any = await createUserAdminFunction(newUser);
      alert('Потребителят е създаден успешно: ' + (result.data?.uid || 'N/A') + '. Firestore документът за този потребител трябва да бъде създаден от createUserAdmin Cloud Function.');
      setNewUser({ email: '', password: '', displayName: '', phoneNumber: '', role: 'user' });
      await fetchUsers(); // Re-fetch users to update the list
    } catch (err: any) {
      console.error('Error creating user via function:', err);
      setError('Грешка при създаване на потребител: ' + err.message + '. Уверете се, че Cloud Function "createUserAdmin" е deploy-ната и работи коректно, и че имате права да я извикате.');
      alert('Грешка при създаване на потребител: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Управление на потребители</h1>

      {error && <p className="text-destructive mb-4">Грешка: {error}</p>}

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
            {isSubmitting ? 'Създаване...' : 'Създай потребител'}
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
        ) : users.length === 0 && !error ? (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{user.email || 'N/A'}</td>
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
