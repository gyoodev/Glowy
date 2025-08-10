
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getFirestore, collection, query, orderBy, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import type { SiteAlert } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, PlusCircle, Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<SiteAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [newType, setNewType] = useState<'info' | 'message' | 'important'>('info');
  const { toast } = useToast();
  const firestore = getFirestore(auth.app);

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const alertsCollectionRef = collection(firestore, 'site_alerts');
      const q = query(alertsCollectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const alertsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SiteAlert));
      setAlerts(alertsList);
    } catch (error) {
      console.error("Error fetching site alerts:", error);
      toast({ title: "Грешка", description: "Неуспешно зареждане на съобщенията.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, firestore]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) {
      toast({ title: "Грешка", description: "Съобщението не може да бъде празно.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'site_alerts'), {
        message: newMessage,
        type: newType,
        isActive: true,
        createdAt: serverTimestamp(),
        expiresAt: null,
      });
      toast({ title: "Успех!", description: "Ново съобщение е създадено." });
      setNewMessage('');
      setNewType('info');
      fetchAlerts();
    } catch (error) {
      console.error("Error creating alert:", error);
      toast({ title: "Грешка", description: "Неуспешно създаване на съобщение.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (alertId: string, currentStatus: boolean) => {
    try {
      const alertRef = doc(firestore, 'site_alerts', alertId);
      await updateDoc(alertRef, { isActive: !currentStatus });
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, isActive: !currentStatus } : a));
      toast({ title: "Статусът е променен", description: `Съобщението е ${!currentStatus ? 'активирано' : 'деактивирано'}.` });
    } catch (error) {
      console.error("Error toggling alert status:", error);
      toast({ title: "Грешка", description: "Неуспешна промяна на статуса.", variant: "destructive" });
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!window.confirm("Сигурни ли сте, че искате да изтриете това съобщение?")) return;
    try {
      await deleteDoc(doc(firestore, 'site_alerts', alertId));
      setAlerts(alerts.filter(a => a.id !== alertId));
      toast({ title: "Изтрито", description: "Съобщението беше успешно изтрито." });
    } catch (error) {
      console.error("Error deleting alert:", error);
      toast({ title: "Грешка", description: "Неуспешно изтриване на съобщение.", variant: "destructive" });
    }
  };

  const typeTranslations = {
    important: 'Важно (червено)',
    message: 'Съобщение (лилаво)',
    info: 'Информация (синьо)',
  };

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <AlertCircle className="mr-3 h-8 w-8 text-primary" />
          Управление на Системни Съобщения
        </h1>
        <p className="text-lg text-muted-foreground">
          Създавайте и управлявайте съобщения, които се показват на всички потребители на началната страница.
        </p>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle>Създай ново съобщение</CardTitle>
        </CardHeader>
        <form onSubmit={handleCreateAlert}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="message">Текст на съобщението</Label>
              <Textarea
                id="message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Напишете вашето съобщение тук..."
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="type">Тип на съобщението</Label>
              <Select value={newType} onValueChange={(value: 'info' | 'message' | 'important') => setNewType(value)} disabled={isSubmitting}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Избери тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Информация (синьо)</SelectItem>
                  <SelectItem value="message">Съобщение (лилаво)</SelectItem>
                  <SelectItem value="important">Важно (червено)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Създаване...' : 'Създай'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Съществуващи съобщения</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Зареждане...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Съобщение</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Активно</TableHead>
                  <TableHead>Създадено на</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map(alert => (
                  <TableRow key={alert.id}>
                    <TableCell className="max-w-sm truncate">{alert.message}</TableCell>
                    <TableCell>{typeTranslations[alert.type]}</TableCell>
                    <TableCell>
                      <Switch
                        checked={alert.isActive}
                        onCheckedChange={() => handleToggleActive(alert.id, alert.isActive)}
                      />
                    </TableCell>
                    <TableCell>
                      {alert.createdAt ? format(alert.createdAt.toDate(), 'dd.MM.yyyy HH:mm', { locale: bg }) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteAlert(alert.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
