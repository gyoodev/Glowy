
'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { firestore as db } from '@/lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Send, ArrowLeft } from 'lucide-react';

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
    } catch (err) {
      console.error("Error updating contact status:", err);
      toast({
        title: "Грешка",
        description: "Неуспешно актуализиране на статуса.",
        variant: "destructive"
      });
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
      message: `\n\n\n--- Оригинално съобщение ---\nОт: ${selectedContact.name} <${selectedContact.email}>\nТема: ${selectedContact.subject}\n\n${selectedContact.message}`
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
      setIsDialogOpen(false); // Close dialog on success
    } catch (err: any) {
      toast({ title: "Грешка при изпращане", description: err.message, variant: "destructive" });
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (isLoading) {
    return <div className="container mx-auto py-10">Зареждане на запитвания...</div>;
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
        <div className="space-y-6">
          {contacts.map(contact => (
            <div 
              key={contact.id} 
              onClick={() => handleOpenContact(contact)}
              className={`p-4 border rounded-md shadow-sm cursor-pointer hover:shadow-lg transition-shadow ${contact.isAnswered ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' : 'bg-card'}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">{contact.subject || 'Без тема'}</h3>
                  <p className="text-sm text-muted-foreground">От: {contact.name} ({contact.email})</p>
                  <p className="mt-2 text-foreground truncate max-w-2xl">{contact.message}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Получено: {contact.createdAt.toDate().toLocaleString()}</p>
                </div>
                <Button
                  onClick={(e) => handleToggleAnswered(e, contact.id, contact.isAnswered)}
                  variant={contact.isAnswered ? "secondary" : "default"}
                  size="sm"
                  className="flex-shrink-0"
                >
                  {contact.isAnswered ? 'Маркирай като неотговорено' : 'Маркирай като отговорено'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          {selectedContact && (
            <>
              {dialogView === 'view' && (
                <>
                  <DialogHeader>
                    <DialogTitle>{selectedContact.subject || 'Без тема'}</DialogTitle>
                    <DialogDescription>
                      От: {selectedContact.name} &lt;{selectedContact.email}&gt; на {selectedContact.createdAt.toDate().toLocaleString()}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div className="text-sm text-foreground bg-muted p-4 rounded-md whitespace-pre-wrap">
                      {selectedContact.message}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSwitchToReply}>
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
