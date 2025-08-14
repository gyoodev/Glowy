
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { getFirestore, collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebase'; // Assuming firebase auth is needed for context/initialization
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, DollarSign, Loader2, Search, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Define the structure for a payment document
interface PromotionPayment {
  id: string;
  businessId: string;
  businessName: string; // Assuming business name is stored on the payment doc or can be fetched
  promotionId: string;
  promotionDetails: string; // e.g., "Featured Listing for 1 month"
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Timestamp;
  transactionId?: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PromotionPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof PromotionPayment; direction: 'ascending' | 'descending' } | null>({ key: 'createdAt', direction: 'descending' });
  const firestoreInstance = getFirestore(auth.app); // Use firestoreInstance

  useEffect(() => {
    const fetchPayments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const paymentsCollectionRef = collection(firestoreInstance, 'promotionsPayments');
        const q = query(paymentsCollectionRef, orderBy('createdAt', 'desc'));
        const paymentsSnapshot = await getDocs(q);

        const paymentsList = paymentsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            businessId: data.businessId || 'N/A',
            businessName: data.businessName || 'Неизвестен Бизнес',
            promotionId: data.promotionId || 'N/A',
            promotionDetails: data.promotionDetails || 'Без Детайли',
            amount: data.amount || 0,
            currency: data.currency || 'BGN', // Default to BGN if not specified
            status: data.status || 'pending',
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromDate(new Date()), // Handle potential non-Timestamp dates
            transactionId: data.transactionId,
          } as PromotionPayment;
        });
        setPayments(paymentsList);
      } catch (err: any) {
        console.error('Error fetching payments:', err);
        setError('Неуспешно зареждане на плащанията. Моля, проверете правилата на Firestore и името на колекцията.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, [firestoreInstance]);

  const requestSort = (key: keyof PromotionPayment) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const sortedAndFilteredPayments = useMemo(() => {
      let sortablePayments = [...payments];
      if (searchTerm) {
          sortablePayments = sortablePayments.filter(p => 
              p.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
          );
      }
      if (sortConfig !== null) {
          sortablePayments.sort((a, b) => {
              const aValue = a[sortConfig.key];
              const bValue = b[sortConfig.key];

              if (aValue === undefined || aValue === null) return 1;
              if (bValue === undefined || bValue === null) return -1;

              if (sortConfig.key === 'createdAt') {
                return (aValue.toMillis() - bValue.toMillis()) * (sortConfig.direction === 'ascending' ? 1 : -1);
              }
              
              if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
              if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
              return 0;
          });
      }
      return sortablePayments;
  }, [payments, searchTerm, sortConfig]);


  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-6" />
        <Card>
          <CardContent className="pt-6">
             <Table>
              <TableHeader>
                <TableRow>
                  {[...Array(6)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Грешка при зареждане на плащания</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => window.location.reload()}>Опитай отново</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <DollarSign className="mr-3 h-8 w-8 text-primary"/>
        Управление на плащания от промоции
      </h1>

      {payments.length === 0 ? (
        <Card className="text-center py-12">
           <CardHeader>
            <DollarSign className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="text-2xl font-semibold">Няма намерени плащания</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-muted-foreground">
             Все още няма записани плащания за промоции.
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
              <CardTitle>Всички плащания ({sortedAndFilteredPayments.length})</CardTitle>
              <div className="relative pt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input 
                    placeholder="Търсене по име на бизнес, ID на плащане/трансакция..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto bg-card p-4 rounded-lg shadow">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead> <Button variant="ghost" onClick={() => requestSort('id')}>Плащане ID <ArrowUpDown className="ml-2 h-4 w-4 inline-block" /></Button></TableHead>
                    <TableHead> <Button variant="ghost" onClick={() => requestSort('businessName')}>Бизнес (Салон) <ArrowUpDown className="ml-2 h-4 w-4 inline-block" /></Button></TableHead>
                    <TableHead>Детайли</TableHead>
                    <TableHead> <Button variant="ghost" onClick={() => requestSort('amount')}>Сума <ArrowUpDown className="ml-2 h-4 w-4 inline-block" /></Button></TableHead>
                    <TableHead> <Button variant="ghost" onClick={() => requestSort('createdAt')}>Дата <ArrowUpDown className="ml-2 h-4 w-4 inline-block" /></Button></TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-card divide-y divide-border">
                  {sortedAndFilteredPayments.map(payment => (
                    <TableRow key={payment.id}>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{payment.id}</TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{payment.businessName}</TableCell>
                       <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{payment.promotionDetails}</TableCell>
                       <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{payment.amount.toFixed(2)} {payment.currency}</TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {payment.createdAt ? format(payment.createdAt.toDate(), 'dd.MM.yyyy HH:mm', { locale: bg }) : 'N/A'}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground capitalize">
                        {payment.status === 'completed' && <span className="text-green-600 font-semibold">Завършено</span>}
                        {payment.status === 'failed' && <span className="text-red-600 font-semibold">Неуспешно</span>}
                        {payment.status === 'pending' && <span className="text-yellow-600 font-semibold">Чакащо</span>}
                         {!['completed', 'pending', 'failed'].includes(payment.status) && <span>{payment.status}</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
