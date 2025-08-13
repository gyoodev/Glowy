
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2, Megaphone } from 'lucide-react';
import type { SiteAlert, SiteAlertType } from '@/types';
import { Badge } from '@/components/ui/badge';

export default function AdminSiteAlertsPage() {
  const [alerts, setAlerts] = useState<SiteAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [newAlertType, setNewAlertType] = useState<SiteAlertType>('info');
  const { toast } = useToast();

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const alertsCollection = collection(firestore, 'siteAlerts');
      const q = query(alertsCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedAlerts = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          message: data.message,
          type: data.type,
          isActive: data.isActive,
          createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        } as SiteAlert;
      });
      setAlerts(fetchedAlerts);
    } catch (error) {
      console.error("Error fetching site alerts:", error);
      toast({ title: "Грешка", description: "Неуспешно зареждане на системните съобщения.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

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
      await addDoc(collection(firestore, 'siteAlerts'), {
        message: newMessage,
        type: newAlertType,
        isActive: true,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Успех!", description: "Новото съобщение е създадено." });
      setNewMessage('');
      setNewAlertType('info');
      fetchAlerts();
    } catch (error) {
      console.error("Error creating alert:", error);
      toast({ title: "Грешка", description: "Неуспешно създаване на съобщение.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const alertRef = doc(firestore, 'siteAlerts', id);
    try {
      await updateDoc(alertRef, { isActive: !currentStatus });
      toast({ title: "Статусът е променен", description: `Съобщението е ${!currentStatus ? 'активирано' : 'деактивирано'}.` });
      fetchAlerts();
    } catch (error) {
      console.error("Error toggling alert status:", error);
      toast({ title: "Грешка", description: "Неуспешна промяна на статуса.", variant: "destructive" });
    }
  };

  const handleDeleteAlert = async (id: string) => {
    if (!window.confirm("Сигурни ли сте, че искате да изтриете това съобщение?")) return;
    const alertRef = doc(firestore, 'siteAlerts', id);
    try {
      await deleteDoc(alertRef);
      toast({ title: "Изтрито", description: "Съобщението беше изтрито успешно." });
      fetchAlerts();
    } catch (error) {
      console.error("Error deleting alert:", error);
      toast({ title: "Грешка", description: "Неуспешно изтриване на съобщение.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl"><PlusCircle />Създай ново съобщение</CardTitle>
          <CardDescription>Това съобщение ще се показва на всички потребители на началната страница, ако е активно.</CardDescription>
        </CardHeader>
        <form onSubmit={handleCreateAlert}>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="message">Текст на съобщението</Label>
              <Textarea id="message" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Въведете вашето съобщение тук..." required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Тип на съобщението</Label>
              <Select value={newAlertType} onValueChange={(value: SiteAlertType) => setNewAlertType(value)}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Изберете тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Информация (Синьо)</SelectItem>
                  <SelectItem value="success">Успех (Зелено)</SelectItem>
                  <SelectItem value="important">Важно (Червено)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
              {isSubmitting ? 'Създаване...' : 'Създай'}
            </Button>
          </CardContent>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl"><Megaphone />Списък със системни съобщения</CardTitle>
          <CardDescription>Управлявайте видимостта и съдържанието на всички системни съобщения.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Зареждане...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Съобщение</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Активно</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>{alert.message}</TableCell>
                    <TableCell><Badge variant={alert.type === 'important' ? 'destructive' : alert.type === 'success' ? 'default' : 'secondary'} className={alert.type === 'info' ? 'bg-blue-500' : ''}>{alert.type}</Badge></TableCell>
                    <TableCell>
                      <Switch
                        checked={alert.isActive}
                        onCheckedChange={() => handleToggleActive(alert.id, alert.isActive)}
                      />
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
