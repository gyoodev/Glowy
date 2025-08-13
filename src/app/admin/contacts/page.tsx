
'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { firestore as db } from '@/lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Send } from 'lucide-react';

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

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [currentReplyTarget, setCurrentReplyTarget] = useState<DirectEmailState>({ to: '', subject: '', message: '' });

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
    e.stopPropagation(); // Prevent dialog from opening
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
  
  const handleOpenReplyDialog = (contact: ContactEntry) => {
    setCurrentReplyTarget({
      to: contact.email,
      subject: `Re: ${contact.subject || 'Без тема'}`,
      message: `\n\n\n--- Оригинално съобщение ---\nОт: ${contact.name} <${contact.email}>\nТема: ${contact.subject}\n\n${contact.message}`
    });
    setIsReplyDialogOpen(true);
  };
  
  const handleSendDirectEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSendingEmail(true);
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const response = await fetch(`${appUrl}/api/send-email/direct-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentReplyTarget),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Неуспешно изпращане на имейла.');
      
      toast({ title: "Имейлът е изпратен успешно!", description: `Съобщението до ${currentReplyTarget.to} беше изпратено.` });
      setIsReplyDialogOpen(false);
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
            <Dialog key={contact.id}>
              <DialogTrigger asChild>
                <div className={`p-4 border rounded-md shadow-sm cursor-pointer hover:shadow-lg transition-shadow ${contact.isAnswered ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' : 'bg-card'}`}>
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
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>{contact.subject || 'Без тема'}</DialogTitle>
                  <DialogDescription>
                    От: {contact.name} &lt;{contact.email}&gt; на {contact.createdAt.toDate().toLocaleString()}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="text-sm text-foreground bg-muted p-4 rounded-md whitespace-pre-wrap">
                    {contact.message}
                  </div>
                   <div className="flex justify-end pt-2">
                     <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
                        <DialogTrigger asChild>
                           <Button onClick={() => handleOpenReplyDialog(contact)}>
                              <Mail className="mr-2 h-4 w-4" /> Отговори по Имейл
                           </Button>
                        </DialogTrigger>
                        {/* Inner Dialog for reply */}
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Отговор на запитване</DialogTitle>
                            <DialogDescription>
                              Изпращане на имейл до {currentReplyTarget.to}.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleSendDirectEmail} className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="email-to" className="text-right">
                                До
                              </Label>
                              <Input id="email-to" value={currentReplyTarget.to} readOnly className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="email-subject" className="text-right">
                                Тема
                              </Label>
                              <Input 
                                id="email-subject" 
                                value={currentReplyTarget.subject}
                                onChange={(e) => setCurrentReplyTarget({...currentReplyTarget, subject: e.target.value})}
                                className="col-span-3"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                              <Label htmlFor="email-message" className="text-right pt-2">
                                Съобщение
                              </Label>
                              <Textarea 
                                id="email-message"
                                placeholder="Въведете Вашия отговор тук..."
                                value={currentReplyTarget.message}
                                onChange={(e) => setCurrentReplyTarget({...currentReplyTarget, message: e.target.value})}
                                className="col-span-3 min-h-[150px]"
                                required
                              />
                            </div>
                            <div className="flex justify-end pt-2">
                               <DialogClose asChild>
                                <Button type="button" variant="secondary" className="mr-2">Отказ</Button>
                              </DialogClose>
                              <Button type="submit" disabled={isSendingEmail}>
                                {isSendingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4"/>}
                                {isSendingEmail ? 'Изпращане...' : 'Изпрати отговор'}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      )}
    </div>
  );
}
