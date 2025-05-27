
'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Briefcase,
  CalendarCheck,
  DollarSign,
  Activity,
  BarChart3,
  UserPlus,
  Building,
  CreditCard,
  PieChart as PieChartIcon,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { getFirestore, collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import type { UserProfile, Salon } from '@/types'; // Make sure Salon type is imported
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';
import { auth } from '@/lib/firebase'; // Assuming auth is needed for db initialization context

// Define the structure for promotion payments if not already in types
interface PromotionPayment {
  id: string;
  businessId: string;
  businessName?: string;
  promotionId: string;
  promotionDetails?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Timestamp;
}

const placeholderStats = [
  { title: 'Общо Потребители', value: '0', icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-500/10', trendInfo: '', dataKey: 'totalUsers' },
  { title: 'Общо Салони', value: '0', icon: Briefcase, color: 'text-green-500', bgColor: 'bg-green-500/10', trendInfo: '', dataKey: 'totalSalons' },
  { title: 'Активни Резервации', value: '0', icon: CalendarCheck, color: 'text-purple-500', bgColor: 'bg-purple-500/10', trendInfo: '', dataKey: 'activeBookings' },
  { title: 'Приходи (Промоции)', value: '0.00 лв.', icon: DollarSign, color: 'text-orange-500', bgColor: 'bg-orange-500/10', trendInfo: '', dataKey: 'totalRevenue' },
];

const monthlyUserRegistrationsDataPlaceholder = [
  { month: 'Яну', users: 0 }, { month: 'Фев', users: 0 }, { month: 'Мар', users: 0 },
  { month: 'Апр', users: 0 }, { month: 'Май', users: 0 }, { month: 'Юни', users: 0 },
  { month: 'Юли', users: 0 }, { month: 'Авг', users: 0 }, { month: 'Сеп', users: 0 },
  { month: 'Окт', users: 0 }, { month: 'Ное', users: 0 }, { month: 'Дек', users: 0 },
];

const recentActivityDataPlaceholder = [
  { id: 1, icon: UserPlus, text: 'Все още няма скорошна активност.', time: '', type: 'placeholder' },
];

export default function AdminIndexPage() {
  const [stats, setStats] = useState(placeholderStats);
  const [userRegData, setUserRegData] = useState(monthlyUserRegistrationsDataPlaceholder);
  const [activityFeed, setActivityFeed] = useState(recentActivityDataPlaceholder);

  const [latestUsers, setLatestUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [latestSalons, setLatestSalons] = useState<Salon[]>([]);
  const [loadingSalons, setLoadingSalons] = useState(true);
  const [latestPayments, setLatestPayments] = useState<PromotionPayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  const firestore = getFirestore(auth.app);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Users
        const usersRef = collection(firestore, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
        setLatestUsers(usersList.sort((a, b) => (b.createdAt as any) - (a.createdAt as any)).slice(0, 3));
        
        // Aggregate user registrations per month
        const monthlyUsers: { [key: string]: number } = {};
        usersList.forEach(user => {
          if (user.createdAt) {
            const month = format(new Date(user.createdAt), 'MMM', { locale: bg });
            monthlyUsers[month] = (monthlyUsers[month] || 0) + 1;
          }
        });
        const populatedUserRegData = monthlyUserRegistrationsDataPlaceholder.map(item => ({
          ...item,
          users: monthlyUsers[item.month.normalize("NFD").replace(/[\u0300-\u036f]/g, "").slice(0,3).toLowerCase()] || 0, // Normalize month for matching
        }));
        setUserRegData(populatedUserRegData);
        setLoadingUsers(false);

        // Fetch Salons
        const salonsRef = collection(firestore, 'salons');
        const salonsSnapshot = await getDocs(salonsRef);
        const salonsList = salonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Salon));
        setLatestSalons(salonsList.sort((a, b) => (b.createdAt as any) - (a.createdAt as any)).slice(0, 3));
        setLoadingSalons(false);

        // Fetch Payments
        const paymentsRef = collection(firestore, 'promotionsPayments');
        const paymentsQuery = query(paymentsRef, orderBy('createdAt', 'desc'), limit(10));
        const paymentsSnapshot = await getDocs(paymentsQuery);
        const paymentsList = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromotionPayment));
        setLatestPayments(paymentsList);
        setLoadingPayments(false);

        // Update stats
        const totalRevenue = paymentsList
          .filter(p => p.status === 'completed')
          .reduce((sum, p) => sum + p.amount, 0);

        setStats(prevStats => prevStats.map(stat => {
          if (stat.dataKey === 'totalUsers') return { ...stat, value: usersList.length.toString() };
          if (stat.dataKey === 'totalSalons') return { ...stat, value: salonsList.length.toString() };
          // TODO: Fetch active bookings count
          if (stat.dataKey === 'totalRevenue') return { ...stat, value: `${totalRevenue.toFixed(2)} лв.` };
          return stat;
        }));

        // Update activity feed (simplified example)
        if (usersList.length > 0 || salonsList.length > 0 || paymentsList.length > 0) {
            const newActivityFeed = [];
            if (usersList.length > 0 && usersList[0].createdAt) {
                const latestUser = usersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                 newActivityFeed.push({ id: Date.now() + 1, icon: UserPlus, text: `Нов потребител: ${latestUser.name || latestUser.displayName}`, time: format(new Date(latestUser.createdAt), 'dd.MM.yyyy HH:mm', { locale: bg }), type: 'user' });
            }
            if (salonsList.length > 0 && salonsList[0].createdAt) {
                 const latestSalon = salonsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                newActivityFeed.push({ id: Date.now() + 2, icon: Building, text: `Нов салон: ${latestSalon.name}`, time: format(new Date(latestSalon.createdAt), 'dd.MM.yyyy HH:mm', { locale: bg }), type: 'salon' });
            }
             if (paymentsList.length > 0 && paymentsList[0].createdAt) {
                newActivityFeed.push({ id: Date.now() + 3, icon: CreditCard, text: `Плащане: ${paymentsList[0].amount.toFixed(2)} ${paymentsList[0].currency}`, time: format(paymentsList[0].createdAt.toDate(), 'dd.MM.yyyy HH:mm', { locale: bg }), type: 'payment' });
            }
            setActivityFeed(newActivityFeed.slice(0, 5));
        }


      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
        setLoadingUsers(false);
        setLoadingSalons(false);
        setLoadingPayments(false);
      }
    };

    fetchData();
  }, [firestore]);

  const getRoleDisplayName = (role?: UserProfile['role']) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'business': return 'Бизнес';
      case 'customer': return 'Клиент';
      default: return 'Неопределена';
    }
  };
  
  const getPaymentStatusDisplayName = (status?: PromotionPayment['status']) => {
    switch (status) {
      case 'completed': return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Завършено</Badge>;
      case 'pending': return <Badge variant="outline">Чакащо</Badge>;
      case 'failed': return <Badge variant="destructive">Неуспешно</Badge>;
      default: return <Badge variant="secondary">Неизвестен</Badge>;
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Административно Табло
          </h1>
          <p className="text-muted-foreground">
            Общ преглед и управление на Glowy платформата.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className={`shadow-lg hover:shadow-xl transition-shadow duration-300 ${stat.bgColor}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${stat.color}`}>{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              {stat.trendInfo && (
                <p className={`text-xs mt-1 ${stat.trendInfo.startsWith('+') ? 'text-green-600' : stat.trendInfo.startsWith('-') ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {stat.trendInfo.startsWith('+') && <TrendingUp className="inline h-3 w-3 mr-1" />}
                  {stat.trendInfo.startsWith('-') && <TrendingDown className="inline h-3 w-3 mr-1" />}
                  {stat.trendInfo}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-primary" />
              Регистрации на потребители (Месечно)
            </CardTitle>
            <CardDescription>Данни за регистрираните потребители по месеци.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] p-2 md:p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userRegData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                />
                <Legend iconSize={10} wrapperStyle={{fontSize: "12px", paddingTop: "10px"}} />
                <Bar dataKey="users" fill="hsl(var(--primary))" name="Нови потребители" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5 text-primary" />
              Скорошна Активност
            </CardTitle>
            <CardDescription>Последни събития в платформата.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityFeed.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-muted/50 rounded-md transition-colors">
                  <div className={`p-2 rounded-full ${activity.type === 'user' ? 'bg-blue-500/10' : activity.type === 'salon' ? 'bg-green-500/10' : activity.type === 'booking' ? 'bg-purple-500/10' : activity.type === 'payment' ? 'bg-orange-500/10' : 'bg-gray-500/10'}`}>
                    <activity.icon className={`h-5 w-5 ${activity.type === 'user' ? 'text-blue-500' : activity.type === 'salon' ? 'text-green-500' : activity.type === 'booking' ? 'text-purple-500' :  activity.type === 'payment' ? 'text-orange-500' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground leading-tight">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
               {activityFeed.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Няма скорошна активност.</p>}
               {activityFeed.length > 0 && activityFeed[0].type !== 'placeholder' && (
                 <div className="text-center mt-4">
                    <a href="#" className="text-sm text-primary hover:underline">
                    Виж всички активности
                    </a>
                </div>
               )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><UserPlus className="mr-2 h-5 w-5 text-primary" />Последни регистрирани потребители</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUsers ? <p>Зареждане...</p> : latestUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Име</TableHead>
                    <TableHead>Имейл</TableHead>
                    <TableHead>Роля</TableHead>
                    <TableHead>Дата</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latestUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>{user.displayName || user.name || 'N/A'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell><Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'business' ? 'secondary' : 'outline'}>{getRoleDisplayName(user.role)}</Badge></TableCell>
                      <TableCell>{user.createdAt ? format(new Date(user.createdAt), 'dd.MM.yyyy', { locale: bg }) : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <p className="text-muted-foreground">Няма наскоро регистрирани потребители.</p>}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><Building className="mr-2 h-5 w-5 text-primary" />Последни създадени бизнеси</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSalons ? <p>Зареждане...</p> : latestSalons.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Име на салон</TableHead>
                    <TableHead>Град</TableHead>
                    <TableHead>Собственик ID</TableHead>
                    <TableHead>Дата</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latestSalons.map(salon => (
                    <TableRow key={salon.id}>
                      <TableCell>{salon.name}</TableCell>
                      <TableCell>{salon.city || 'N/A'}</TableCell>
                      <TableCell className="text-xs">{salon.ownerId || 'N/A'}</TableCell>
                      <TableCell>{salon.createdAt ? format(new Date(salon.createdAt), 'dd.MM.yyyy', { locale: bg }) : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <p className="text-muted-foreground">Няма наскоро създадени бизнеси.</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg mt-6">
        <CardHeader>
          <CardTitle className="flex items-center"><CreditCard className="mr-2 h-5 w-5 text-primary" />Последни плащания за промоции</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg border border-dashed">
            <PieChartIcon className="h-16 w-16 text-primary/70 mb-4" />
            <p className="text-center text-muted-foreground text-sm">
              Място за кръгова диаграма на плащанията (напр. по тип пакет или по месеци).
            </p>
            <p className="text-xs text-muted-foreground mt-1">(Ще бъде добавено по-късно)</p>
          </div>
          <div className="md:col-span-2">
            {loadingPayments ? <p>Зареждане...</p> : latestPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Плащане ID</TableHead>
                    <TableHead>Име на бизнес</TableHead>
                    <TableHead>Сума</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latestPayments.map(payment => (
                    <TableRow key={payment.id}>
                      <TableCell className="text-xs">{payment.id}</TableCell>
                      <TableCell>{payment.businessName || payment.businessId || 'N/A'}</TableCell>
                      <TableCell>{payment.amount.toFixed(2)} {payment.currency}</TableCell>
                      <TableCell>{getPaymentStatusDisplayName(payment.status)}</TableCell>
                      <TableCell>{payment.createdAt ? format(payment.createdAt.toDate(), 'dd.MM.yyyy HH:mm', { locale: bg }) : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <p className="text-muted-foreground">Няма скорошни плащания.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    