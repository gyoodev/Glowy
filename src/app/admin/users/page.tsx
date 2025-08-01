
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getFirestore, collection, getDocs, where, query as firestoreQuery, doc, deleteDoc } from 'firebase/firestore'; // Renamed query and added doc, deleteDoc
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
import { AlertTriangle, Trash2, UserPlus, Loader2, Copy, UserX } from 'lucide-react'; // Added UserX
import { useToast } from '@/hooks/use-toast';
import { mapUserProfile } from '@/utils/mappers';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'; // Added TooltipProvider

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
  const [filter, setFilter] = useState<'all' | 'deactivationRequested'>('all');
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
      let q;
      if (filter === 'deactivationRequested') {
        q = firestoreQuery(usersCollection, where('deactivationRequested', '==', true));
      } else {
        q = firestoreQuery(usersCollection);
      }
      const userSnapshot = await getDocs(q);
      const usersList = userSnapshot.docs.map(docSnap => mapUserProfile(docSnap.data(), docSnap.id));
      setUsers(usersList);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError("Failed to load users.");
      toast({ title: "Грешка", description: "Неуспешно зареждане на потребителите.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [firestoreInstance, toast, filter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Копирано!',
        description: `UID е копиран в клипборда.`,
      });
    }, (err) => {
      console.error('Could not copy text: ', err);
      toast({
        title: 'Грешка',
        description: 'Неуспешно копиране на UID.',
        variant: 'destructive',
      });
    });
  };
  
  const handleDeleteUser = useCallback(async (userId: string, userEmail?: string) => {
    if (!window.confirm(`Сигурни ли сте, че искате да изтриете потребителския запис на ${userEmail || userId} от базата данни? Това НЕ изтрива техния акаунт за вписване, а само данните им в платформата.`)) {
        return;
    }
    setIsSubmitting(true);
    try {
        const userDocRef = doc(firestoreInstance, 'users', userId);
        await deleteDoc(userDocRef);
        toast({ title: "Успех", description: `Записът за потребител ${userEmail || userId} беше изтрит от Firestore.` });
        await fetchUsers(); // Refresh the list
    } catch (err: any) {
        console.error(`[AdminUsersPage] Error deleting user document UID ${userId}:`, err);
        toast({
            title: "Грешка при изтриване",
            description: err.message || "Неуспешно изтриване на потребителския запис.",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  }, [fetchUsers, firestoreInstance, toast]);


  const handleUpdateUserRole = useCallback(async (userId: string, newRole: UserProfile['role']) => {
    setIsSubmitting(true);
    
    if (!auth.currentUser) {
      toast({ title: 'Грешка', description: 'Трябва да сте влезли като администратор.', variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }

    try {
      const idToken = await auth.currentUser.getIdToken();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const response = await fetch(`${appUrl}/api/admin/update-user-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ uid: userId, role: newRole }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Грешка от страна на сървъра при актуализиране на роля.');
      }

      toast({ title: "Успех", description: `Ролята на потребителя е актуализирана.` });
      setEditingUserId(null);
      await fetchUsers();
    } catch (err: any) {
      console.error('Error updating user role:', err);
      toast({ title: 'Грешка при актуализация на роля', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchUsers, toast]);

  const handleCreateUser = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newUser.password && !window.confirm("Ще създадете потребител без парола. Той ще може да влезе само чрез Google или друг oAuth доставчик, или ще трябва да нулира паролата си. Продължавате ли?")) {
      return;
    }
    setIsSubmitting(true);

    if (!auth.currentUser) {
      toast({ title: 'Грешка', description: 'Трябва да сте влезли като администратор.', variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }

    try {
      const idToken = await auth.currentUser.getIdToken();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const response = await fetch(`${appUrl}/api/admin/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(newUser),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Грешка от страна на сървъра при създаване на потребител.');
      }

      toast({
        title: "Потребителят е създаден",
        description: 'Нов потребител е създаден успешно с UID: ' + (result.uid || 'N/A'),
      });
      setNewUser({ email: '', password: '', displayName: '', phoneNumber: '', role: 'customer' });
      await fetchUsers();

    } catch (err: any) {
      console.error('Error creating user:', err);
      toast({
        title: 'Грешка при създаване на потребител',
        description: err.message,
        variant: 'destructive'
      });
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
    <TooltipProvider>
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6">Управление на потребители</h1>

      {error && !isSubmitting && <Alert variant="destructive" className="mb-4"><AlertTriangle className="h-4 w-4" /><AlertTitle>Грешка</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

      <Card className="mb-8 shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center"><UserPlus className="mr-2 h-6 w-6 text-primary"/>Създаване на нов потребител</CardTitle>
          <CardDescription>Използва API Route за създаване на потребители.</CardDescription>
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
          </CardFooter>
        </form>
      </Card>

      <Card className="shadow-md">
         <CardHeader>
            <CardTitle className="text-2xl font-semibold">Списък с потребители ({users.length})</CardTitle>
            <div className="flex items-center space-x-4 pt-2">
                <Label htmlFor="filter">Филтър:</Label>
                <Select value={filter} onValueChange={(value) => setFilter(value as 'all' | 'deactivationRequested')}>
                    <SelectTrigger id="filter" className="w-[250px]">
                        <SelectValue placeholder="Филтрирай потребители" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Всички потребители</SelectItem>
                        <SelectItem value="deactivationRequested">Със заявка за деактивация</SelectItem>
                    </SelectContent>
                </Select>
            </div>
         </CardHeader>
         <CardContent>
            {isLoading && users.length > 0 ? (
                <div className="flex justify-center items-center py-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2">Обновяване на списъка...</p>
                </div>
            ) : users.length === 0 && !error ? (
            <p className="text-muted-foreground text-center py-4">Няма намерени потребители с избрания филтър.</p>
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
                    <TableRow key={user.id} className={user.deactivationRequested ? 'bg-yellow-100/50 dark:bg-yellow-900/20' : ''}>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-mono">
                          <div className="flex items-center gap-2">
                            <span className="truncate" title={user.id}>{user.id}</span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0"
                                  onClick={() => handleCopy(user.id)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Копирай UID</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{user.email || 'N/A'}</TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            <div className="flex items-center gap-2">
                                {user.displayName || user.name || 'N/A'}
                                {user.deactivationRequested && (
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <UserX className="h-5 w-5 text-destructive" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Потребителят е подал заявка за деактивация.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                        </TableCell>
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
    </TooltipProvider>
  );
}
