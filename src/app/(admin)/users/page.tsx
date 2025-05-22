
'use client';

import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '@/lib/firebase'; // Assuming auth is used to initialize firestore

interface User {
  id: string;
  [key: string]: any; // Allow other properties
}
export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    displayName: '',
    phoneNumber: '',
    role: 'user', // Default role
  });


  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const db = getFirestore(auth.app); // Initialize Firestore with the same app as auth
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        const usersList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(usersList);
        console.log("Fetched users:", usersList); // Log for verification
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleDeleteUser = (userId: string) => {
    console.log(`Deleting user: ${userId}`);
  };

  return (
    <div>
 <h1 className="text-3xl font-bold mb-6">Управление на потребители</h1>

      {/* Section for Creating New User */}
 <div className="mb-8 p-6 bg-white rounded shadow">
 <h2 className="text-2xl font-semibold mb-4">Създаване на нов потребител</h2>
 <form onSubmit={(e) => {
          e.preventDefault(); // Prevent default form submission

          const functions = getFunctions();
          const createUser = httpsCallable(functions, 'createUserAdmin');

          createUser(newUser)
            .then((result: any) => {
              // Handle success
              alert('User created successfully: ' + result.data.uid);
              setNewUser({ email: '', password: '', displayName: '', phoneNumber: '', role: 'user' }); // Clear form
            })
            .catch((error) => {
              alert('Error creating user: ' + error.message);
            });
        }}>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
 <div>
 <label className="block text-sm font-medium text-gray-700">Email</label>
 <input
              type="email"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              required
            />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700">Парола</label>
 <input
              type="password"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              required
            />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700">Име за показване</label>
 <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={newUser.displayName}
              onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
            />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700">Телефонен номер</label>
 <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={newUser.phoneNumber}
              onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
            />
 </div>
 </div>
          {/* Role selection can be added here later */}
 <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Създаване на потребител</button>
 </form>
 </div>

      {isLoading ? (
        <p>Loading users...</p>
      ) : (
        <div>
          <h2>Fetched Users:</h2>
          {/* This is a temporary placeholder - replace with actual user display */}
          {users.length > 0 ? (
            <ul>
              {users.map(user => (
                <li key={user.id}>{user.id} - {JSON.stringify(user)}</li> // Display basic user info
              ))}
            </ul>
          ) : (
            <p>No users found.</p>
          )}
        </div>
      )}
    </div>
  );
}
