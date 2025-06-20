
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable, type HttpsCallableResult } from 'firebase/functions';
import { auth } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Trash2, UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mapUserProfile } from '@/utils/mappers';

interface NewUserFormState {
  email: string;
  password?: string;
  displayName: string;
  phoneNumber: string;
  role: UserProfile['role'];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const firestoreInstance = getFirestore(auth.app);

  const [newUser, setNewUser] = useState<NewUserFormState>({
    email: '',
    password: '',
    displayName: '',
    phoneNumber: '',
    role: 'customer',
  });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const usersCollection = collection(firestoreInstance, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const usersList = userSnapshot.docs.map(docSnap => mapUserProfile(docSnap.data(), docSnap.id));
      setUsers(usersList);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError("Failed to load users.");
      toast({ title: "Грешка", description: "Неуспешно зареждане на потребителите.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [firestoreInstance, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = useCallback(async (userId: string, userEmail?: string) => {
    console.log(`[AdminUsersPage] Attempting to delete user. UID: ${userId}, Email: ${userEmail}`);
    if (!window.confirm(`Сигурни ли сте, че искате да изтриете потребител ${userEmail || userId}? Тази операция е необратима и ще изтрие потребителя от Firebase Authentication и неговия документ от Firestore.`)) {
      console.log(`[AdminUsersPage] User deletion cancelled by admin. UID: ${userId}`);
      return;
    }

    setIsSubmitting(true);
    console.log(`[AdminUsersPage] Calling 'deleteUserAdmin' Cloud Function for UID: ${userId}`);
    const functions = getFunctions();
    const deleteUserAdminFunction = httpsCallable(functions, 'deleteUserAdmin');

    // Ensure isSubmitting is true while the async operation is in progress
    setIsSubmitting(true);

    try {
      const result = await deleteUserAdminFunction({ uid: userId });
      console.log(`[AdminUsersPage] Cloud Function 'deleteUserAdmin' result for UID ${userId}:`, result);

      toast({ title: "Успех", description: "Потребителят е изтрит успешно." });
      await fetchUsers();
    } catch (err: any) {
      console.error(`[AdminUsersPage] Error deleting user UID ${userId}:`, err);
      let errorMessage = "Неуспешно изтриване на потребителя.";
      let errorTitle = "Грешка при изтриване";

      if (err.code === 'functions/internal') {
        // Specific handling for internal function errors
        errorTitle = "Сървърна грешка при изтриване";
        errorMessage = `Възникна вътрешна грешка във Firebase Cloud Function 'deleteUserAdmin'. Моля, проверете логовете на функцията във Вашата Firebase конзола за повече детайли. (Код: ${err.code})`;
        console.error("[AdminUsersPage] Firebase Cloud Function 'deleteUserAdmin' reported an internal error. Check Firebase console logs for the function.");
      } else if (err.code) {
        // Include the Firebase Functions error code if available
        errorMessage += ` (Код: ${err.code})`;
      }
      if (err.message && err.code !== 'functions/internal') { 
        // Include the error message, but avoid duplication if we have a specific 'internal' message
        errorMessage += ` Съобщение: ${err.message}`;
      }
      if (err.details) {
        // Include any additional details provided by the function error
        errorMessage += ` Детайли: ${JSON.stringify(err.details)}`;
      }

      toast({ title: errorTitle, description: errorMessage, variant: "destructive", duration: 10000 });
    } finally {
      setIsSubmitting(false);
      console.log(`[AdminUsersPage] Finished delete process for UID: ${userId}. isSubmitting set to false.`);
    }
  }, [fetchUsers, toast]);

  const handleUpdateUserRole = useCallback(async (userId: string, newRole: UserProfile['role']) => {
    setIsSubmitting(true);
    setError(null);
    const functions = getFunctions();
    const updateUserRoleAdminFunction = httpsCallable(functions, 'updateUserRoleAdmin');

    try {
      await updateUserRoleAdminFunction({ uid: userId, role: newRole });
      toast({ title: "Успех", description: `Ролята на потребител ${userId} е актуализирана.` });
      setEditingUserId(null);
      await fetchUsers();
    } catch (err: any) {
      console.error('Error updating user role via function:', err);
      setError('Грешка при актуализация на ролята: ' + err.message + '. Уверете се, че Cloud Function "updateUserRoleAdmin" е deploy-ната и работи коректно.');
      toast({ title: 'Грешка при актуализация на ролята', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchUsers, toast]);

  const handleCreateUser = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newUser.password && !confirm("Ще създадете потребител без парола. Той ще може да влезе само чрез Google или друг oAuth доставчик, или ще трябва да нулира паролата си. Продължавате ли?")) {
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const functions = getFunctions(auth.app);
    const createUserAdminFunction = httpsCallable(functions, 'createUserAdmin');

    try {
      const userDataToSend: any = {
        email: newUser.email,
        displayName: newUser.displayName,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
      };
      if (newUser.password) {
        userDataToSend.password = newUser.password;
      }

      const result = await createUserAdminFunction(userDataToSend) as HttpsCallableResult<any>;

      toast({
        title: "Потребителят е създаден",
        description: 'UID: ' + (result.data?.uid || 'N/A') + '. Firestore документът за този потребител трябва да бъде създаден от createUserAdmin Cloud Function.',
      });
      setNewUser({ email: '', password: '', displayName: '', phoneNumber: '', role: 'customer' });
      await fetchUsers();
    } catch (err: any)
       {
      console.error('Error creating user via function:', err);
      let detailedErrorMessage = 'Грешка при създаване на потребител: ' + err.message;
      if (err.code === 'functions/internal') {
        detailedErrorMessage = `Възникна вътрешна грешка във Firebase Cloud Function 'createUserAdmin'. Моля, проверете логовете на функцията във Вашата Firebase конзола. (Код: ${err.code})`;
         console.error("[AdminUsersPage] Firebase Cloud Function 'createUserAdmin' reported an internal error. Check Firebase console logs for the function.");
      } else if (err.details) {
        detailedErrorMessage += ` Детайли: ${JSON.stringify(err.details)}`;
      }
      setError(detailedErrorMessage);
      toast({ title: 'Грешка при създаване на потребител', description: detailedErrorMessage, variant: 'destructive', duration: 10000 });
    } finally {
      setIsSubmitting(false);
    }
  }, [newUser, fetchUsers, toast]);


  if (isLoading && users.length === 0) {
    return (
       <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-1/3 mb-6" />
        <Card className="mb-8">
          <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </CardContent>
          <CardFooter><Skeleton className="h-10 w-32" /></CardFooter>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>{[...Array(6)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}</TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(3)].map((_, i) => (
                  <TableRow key={i}>{[...Array(6)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && users.length === 0) {
     return (
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Грешка при зареждане на потребители</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
         <Button onClick={fetchUsers}>Опитай отново</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6">Управление на потребители</h1>

      {error && <Alert variant="destructive" className="mb-4"><AlertTriangle className="h-4 w-4" /><AlertTitle>Грешка</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

      <Card className="mb-8 shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center"><UserPlus className="mr-2 h-6 w-6 text-primary"/>Създаване на нов потребител</CardTitle>
          <CardDescription>Използва Firebase Cloud Function за създаване.</CardDescription>
        </CardHeader>
        <form onSubmit={handleCreateUser}>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Имейл</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="password">Парола (по избор)</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password || ''}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="displayName">Име за показване</Label>
              <Input
                id="displayName"
                type="text"
                value={newUser.displayName}
                onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                disabled={isSubmitting}
                required
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Телефонен номер</Label>
              <Input
                id="phoneNumber"
                type="text"
                value={newUser.phoneNumber}
                onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="role">Роля</Label>
              <Select
                value={newUser.role}
                onValueChange={(value) => setNewUser({ ...newUser, role: value as NewUserFormState['role'] })}
                disabled={isSubmitting}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Избери роля" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Клиент (Customer)</SelectItem>
                  <SelectItem value="business">Бизнес (Business)</SelectItem>
                  <SelectItem value="admin">Администратор (Admin)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex-col items-start">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Създаване...' : 'Създай потребител'}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
                Забележка: Изисква deploy-ната Firebase Cloud Function 'createUserAdmin'.
            </p>
          </CardFooter>
        </form>
      </Card>

      <Card className="shadow-md">
         <CardHeader>
            <CardTitle className="text-2xl font-semibold">Списък с потребители ({users.length})</CardTitle>
         </CardHeader>
         <CardContent>
            {isLoading && users.length > 0 ? (
                <div className="flex justify-center items-center py-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2">Обновяване на списъка...</p>
                </div>
            ) : users.length === 0 && !error ? (
            <p className="text-muted-foreground text-center py-4">Няма намерени потребители.</p>
            ) : (
            <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">UID</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Имейл</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Име</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Роля</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Телефон</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Действия</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="bg-card divide-y divide-border">
                    {users.map(user => (
                    <TableRow key={user.id}>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{user.id}</TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{user.email || 'N/A'}</TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{user.displayName || user.name || 'N/A'}</TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground capitalize">{user.role || 'N/A'}</TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{user.phoneNumber || 'N/A'}</TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingUserId(editingUserId === user.id ? null : user.id)}
                            className="mr-2"
                            disabled={isSubmitting}
                          >
                           {editingUserId === user.id ? 'Отмени' : 'Редактирай Роля'}
                          </Button>
                          {editingUserId === user.id && (
                            <div className="flex items-center space-x-2 mt-2">
                              <Select
                                value={user.role ?? 'customer'}
                                onValueChange={(value) => handleUpdateUserRole(user.id, value as UserProfile['role'])}
                                disabled={isSubmitting}
                              >
                                <SelectTrigger className="w-[150px]">
                                  <SelectValue placeholder="Избери роля" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="customer">Клиент</SelectItem>
                                  <SelectItem value="business">Бизнес</SelectItem>
                                  <SelectItem value="admin">Админ</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            disabled={isSubmitting}
                          >
                            {isSubmitting && editingUserId !== user.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />} Изтрий
                          </Button>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
