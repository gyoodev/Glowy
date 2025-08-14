
'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { firestore as db } from '@/lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Send, ArrowLeft, Eye, MessageSquare, Clock, CheckCircle } from 'lucide-react';

interface ContactEntry {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  createdAt: Timestamp;
  isAnswered: boolean;
}

interface DirectEmailState {
  to: string;
  subject: string;
  message: string;
}

type DialogView = 'view' | 'reply';

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactEntry | null>(null);
  const [dialogView, setDialogView] = useState<DialogView>('view');

  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [currentReply, setCurrentReply] = useState<DirectEmailState>({ to: '', subject: '', message: '' });

  useEffect(() => {
    const fetchContacts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const contactsCollection = collection(db, 'contacts');
        const contactsQuery = query(contactsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(contactsQuery);

        const fetchedContacts: ContactEntry[] = [];
        querySnapshot.forEach((docSnap) => {
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
  }, []);

  const handleToggleAnswered = async (e: React.MouseEvent, contactId: string, currentStatus: boolean) => {
    e.stopPropagation(); 
    setIsUpdatingStatus(true);
    try {
      const contactRef = doc(db, 'contacts', contactId);
      await updateDoc(contactRef, {
        isAnswered: !currentStatus
      });
      setContacts(prevContacts =>
        prevContacts.map(contact =>
          contact.id === contactId ? { ...contact, isAnswered: !currentStatus } : contact
        )
      );
      toast({
        title: "Статусът е променен",
        description: `Запитването е маркирано като ${!currentStatus ? 'отговорено' : 'неотговорено'}.`
      });
    } catch (err) {
      console.error("Error updating contact status:", err);
      toast({
        title: "Грешка",
        description: "Неуспешно актуализиране на статуса.",
        variant: "destructive"
      });
    } finally {
        setIsUpdatingStatus(false);
    }
  };

  const handleOpenContact = (contact: ContactEntry) => {
    setSelectedContact(contact);
    setDialogView('view');
    setIsDialogOpen(true);
  };
  
  const handleSwitchToReply = () => {
    if (!selectedContact) return;
    setCurrentReply({
      to: selectedContact.email,
      subject: `Re: ${selectedContact.subject || 'Без тема'}`,
      message: `\n\n\n--- Оригинално съобщение ---\nОт: ${selectedContact.name} <${selectedContact.email}>\nТема: ${selectedContact.subject || 'Без тема'}\n\n${selectedContact.message}`
    });
    setDialogView('reply');
  };

  const handleSendDirectEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSendingEmail(true);
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const response = await fetch(`${appUrl}/api/send-email/direct-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentReply),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Неуспешно изпращане на имейла.');
      
      toast({ title: "Имейлът е изпратен успешно!", description: `Съобщението до ${currentReply.to} беше изпратено.` });
      // Mark as answered if not already
      if (selectedContact && !selectedContact.isAnswered) {
          const contactRef = doc(db, 'contacts', selectedContact.id);
          await updateDoc(contactRef, { isAnswered: true });
          setContacts(prev => prev.map(c => c.id === selectedContact.id ? { ...c, isAnswered: true } : c));
      }
      setIsDialogOpen(false); // Close dialog on success
    } catch (err: any) {
      toast({ title: "Грешка при изпращане", description: err.message, variant: "destructive" });
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (isLoading) {
    return <div className="container mx-auto py-10"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>;
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
        <div className="space-y-4">
          {contacts.map(contact => (
            <div 
              key={contact.id} 
              onClick={() => handleOpenContact(contact)}
              className="relative p-4 border-l-4 rounded-lg bg-card text-card-foreground shadow-sm cursor-pointer hover:shadow-lg hover:border-primary/80 transition-all duration-200"
              style={{ borderLeftColor: contact.isAnswered ? 'hsl(var(--primary) / 0.5)' : 'hsl(var(--destructive))' }}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>От: {contact.name} ({contact.email})</span>
                  </p>
                  <h3 className="text-lg font-semibold truncate mt-1" title={contact.subject || 'Без тема'}>{contact.subject || 'Без тема'}</h3>
                  <p className="mt-2 text-sm text-foreground line-clamp-2">{contact.message}</p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                   <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {contact.createdAt.toDate().toLocaleString('bg-BG')}
                  </p>
                  <div className="flex items-center gap-2">
                     <Button
                        onClick={(e) => handleToggleAnswered(e, contact.id, contact.isAnswered)}
                        variant="outline"
                        size="sm"
                        disabled={isUpdatingStatus}
                        className="h-8 px-2"
                        title={contact.isAnswered ? 'Маркирай като неотговорено' : 'Маркирай като отговорено'}
                      >
                       <CheckCircle className={`h-4 w-4 ${contact.isAnswered ? 'text-green-500' : 'text-muted-foreground'}`}/>
                      </Button>
                      <Button
                        onClick={(e) => { e.stopPropagation(); handleOpenContact(contact); handleSwitchToReply(); }}
                        variant="default"
                        size="sm"
                        className="h-8 px-3"
                      >
                         <Send className="mr-2 h-4 w-4" /> Отговори
                      </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
        setIsDialogOpen(isOpen);
        if (!isOpen) {
            setSelectedContact(null);
        }
      }}>
        <DialogContent className="sm:max-w-2xl">
          {selectedContact && (
            <>
              {dialogView === 'view' && (
                <>
                  <DialogHeader>
                    <DialogTitle className="truncate">{selectedContact.subject || 'Без тема'}</DialogTitle>
                    <DialogDescription>
                      От: {selectedContact.name} &lt;{selectedContact.email}&gt; на {selectedContact.createdAt.toDate().toLocaleString('bg-BG')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div className="text-sm text-foreground bg-muted p-4 rounded-md whitespace-pre-wrap max-h-60 overflow-y-auto">
                      {selectedContact.message}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSwitchToReply} className="w-full sm:w-auto">
                      <Mail className="mr-2 h-4 w-4" /> Отговори по Имейл
                    </Button>
                  </DialogFooter>
                </>
              )}
              {dialogView === 'reply' && (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-2">
                       <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDialogView('view')}>
                         <ArrowLeft className="h-5 w-5" />
                       </Button>
                       <div>
                        <DialogTitle>Отговор на запитване</DialogTitle>
                        <DialogDescription>Изпращане на имейл до {currentReply.to}.</DialogDescription>
                       </div>
                    </div>
                  </DialogHeader>
                  <form onSubmit={handleSendDirectEmail} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email-to" className="text-right">До</Label>
                      <Input id="email-to" value={currentReply.to} readOnly className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email-subject" className="text-right">Тема</Label>
                      <Input id="email-subject" value={currentReply.subject} onChange={(e) => setCurrentReply({...currentReply, subject: e.target.value})} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="email-message" className="text-right pt-2">Съобщение</Label>
                      <Textarea id="email-message" placeholder="Въведете Вашия отговор тук..." value={currentReply.message} onChange={(e) => setCurrentReply({...currentReply, message: e.target.value})} className="col-span-3 min-h-[150px]" required />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isSendingEmail}>
                        {isSendingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4"/>}
                        {isSendingEmail ? 'Изпращане...' : 'Изпрати отговор'}
                      </Button>
                    </DialogFooter>
                  </form>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
