
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
  ListFilter, // Added for consistency with example image
  Search, // Added for consistency with example image
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
import type { UserProfile, Salon } from '@/types';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';
import { auth } from '@/lib/firebase';

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
  { title: 'Активни Резервации', value: '0', icon: CalendarCheck, color: 'text-purple-500', bgColor: 'bg-purple-500/10', trendInfo: '', dataKey: 'activeBookings' }, // Placeholder, needs real data
  { title: 'Приходи (Промоции)', value: '0.00 лв.', icon: DollarSign, color: 'text-orange-500', bgColor: 'bg-orange-500/10', trendInfo: '', dataKey: 'totalRevenue' },
];

const monthlyDataPlaceholder = Array(12).fill(null).map((_, i) => {
  const monthDate = new Date(new Date().getFullYear(), i, 1);
  return {
    month: format(monthDate, 'LLL yy', { locale: bg }), // e.g., "Яну 24"
    users: 0,
    salons: 0,
    payments: 0,
  };
});

const recentActivityDataPlaceholder = [
  { id: 'placeholder-1', icon: Activity, text: 'Все още няма скорошна активност.', time: '', type: 'placeholder' },
];


export default function AdminIndexPage() {
  const [stats, setStats] = useState(placeholderStats);
  const [monthlyUserData, setMonthlyUserData] = useState(monthlyDataPlaceholder.map(d => ({ month: d.month, users: d.users })));
  const [monthlySalonData, setMonthlySalonData] = useState(monthlyDataPlaceholder.map(d => ({ month: d.month, salons: d.salons })));
  const [monthlyPaymentData, setMonthlyPaymentData] = useState(monthlyDataPlaceholder.map(d => ({ month: d.month, payments: d.payments })));

  const [activityFeed, setActivityFeed] = useState(recentActivityDataPlaceholder);

  const [latestUsers, setLatestUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [latestSalons, setLatestSalons] = useState<Salon[]>([]);
  const [loadingSalons, setLoadingSalons] = useState(true);
  const [latestPayments, setLatestPayments] = useState<PromotionPayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  const [loadingCharts, setLoadingCharts] = useState(true);

  const firestore = getFirestore(auth.app);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingUsers(true);
      setLoadingSalons(true);
      setLoadingPayments(true);
      setLoadingCharts(true);

      try {
        // Fetch Users
        const usersRef = collection(firestore, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
        
        const validUsersWithDate = usersList.filter(user => user.createdAt && typeof user.createdAt === 'string');
        setLatestUsers(validUsersWithDate.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()).slice(0, 3));
        
        const aggregatedMonthlyUsers: { [key: string]: number } = {};
        validUsersWithDate.forEach(user => {
          try {
            const date = new Date(user.createdAt!);
            if (!isNaN(date.getTime())) { // Check if date is valid
              const monthKey = format(date, 'LLL yy', { locale: bg });
              aggregatedMonthlyUsers[monthKey] = (aggregatedMonthlyUsers[monthKey] || 0) + 1;
            } else {
              console.warn(`Invalid createdAt date for user ${user.id}: ${user.createdAt}`);
            }
          } catch (e) {
            console.warn(`Error parsing date for user ${user.id}: ${user.createdAt}`, e);
          }
        });
        setMonthlyUserData(monthlyDataPlaceholder.map(item => ({
          ...item,
          users: aggregatedMonthlyUsers[item.month] || 0,
        })));

        // Fetch Salons
        const salonsRef = collection(firestore, 'salons');
        const salonsSnapshot = await getDocs(salonsRef);
        const salonsList = salonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Salon));
        
        const validSalonsWithDate = salonsList.filter(salon => salon.createdAt && typeof salon.createdAt === 'string');
        setLatestSalons(validSalonsWithDate.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()).slice(0, 3));

        const aggregatedMonthlySalons: { [key: string]: number } = {};
         validSalonsWithDate.forEach(salon => {
          try {
            const date = new Date(salon.createdAt!);
             if (!isNaN(date.getTime())) {
              const monthKey = format(date, 'LLL yy', { locale: bg });
              aggregatedMonthlySalons[monthKey] = (aggregatedMonthlySalons[monthKey] || 0) + 1;
            } else {
              console.warn(`Invalid createdAt date for salon ${salon.id}: ${salon.createdAt}`);
            }
          } catch (e) {
            console.warn(`Error parsing date for salon ${salon.id}: ${salon.createdAt}`, e);
          }
        });
        setMonthlySalonData(monthlyDataPlaceholder.map(item => ({
          ...item,
          salons: aggregatedMonthlySalons[item.month] || 0,
        })));

        // Fetch Payments
        const paymentsRef = collection(firestore, 'promotionsPayments');
        const paymentsQuery = query(paymentsRef, orderBy('createdAt', 'desc')); // Fetch all for aggregation, limit for table
        const paymentsSnapshot = await getDocs(paymentsQuery);
        const paymentsList = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromotionPayment));
        
        const validPaymentsWithDate = paymentsList.filter(p => p.createdAt && p.createdAt.toDate);
        setLatestPayments(validPaymentsWithDate.slice(0, 10));

        const aggregatedMonthlyPayments: { [key: string]: number } = {};
        validPaymentsWithDate.forEach(payment => {
          try {
            const date = payment.createdAt.toDate(); // Firestore Timestamp to JS Date
            if (!isNaN(date.getTime())) {
              const monthKey = format(date, 'LLL yy', { locale: bg });
              aggregatedMonthlyPayments[monthKey] = (aggregatedMonthlyPayments[monthKey] || 0) + (payment.amount || 0);
            } else {
               console.warn(`Invalid createdAt date for payment ${payment.id}`);
            }
          } catch (e) {
            console.warn(`Error processing date for payment ${payment.id}`, e);
          }
        });
        setMonthlyPaymentData(monthlyDataPlaceholder.map(item => ({
          ...item,
          payments: aggregatedMonthlyPayments[item.month] || 0,
        })));
        
        // Update stats
        const totalRevenue = validPaymentsWithDate
          .filter(p => p.status === 'completed')
          .reduce((sum, p) => sum + (p.amount || 0), 0);

        setStats(prevStats => prevStats.map(stat => {
          if (stat.dataKey === 'totalUsers') return { ...stat, value: usersList.length.toString() };
          if (stat.dataKey === 'totalSalons') return { ...stat, value: salonsList.length.toString() };
          if (stat.dataKey === 'totalRevenue') return { ...stat, value: `${totalRevenue.toFixed(2)} лв.` };
          // TODO: Add active bookings count fetching if needed for "Активни Резервации"
          return stat;
        }));

        // Update activity feed (simplified example)
        const newActivityFeed = [];
        if (usersList.length > 0 && latestUsers[0]?.createdAt) {
            try {
                newActivityFeed.push({ id: 'activity-user', icon: UserPlus, text: `Нов потребител: ${latestUsers[0].name || latestUsers[0].displayName || 'N/A'}`, time: format(new Date(latestUsers[0].createdAt), 'dd.MM.yyyy HH:mm', { locale: bg }), type: 'user' });
            } catch (e) { console.warn("Error formatting user activity time", e); }
        }
        if (salonsList.length > 0 && latestSalons[0]?.createdAt) {
            try {
                 newActivityFeed.push({ id: 'activity-salon', icon: Building, text: `Нов салон: ${latestSalons[0].name || 'N/A'}`, time: format(new Date(latestSalons[0].createdAt), 'dd.MM.yyyy HH:mm', { locale: bg }), type: 'salon' });
            } catch (e) { console.warn("Error formatting salon activity time", e); }
        }
        if (paymentsList.length > 0 && latestPayments[0]?.createdAt) {
            try {
                newActivityFeed.push({ id: 'activity-payment', icon: CreditCard, text: `Плащане: ${(latestPayments[0].amount || 0).toFixed(2)} ${latestPayments[0].currency || ''}`, time: format(latestPayments[0].createdAt.toDate(), 'dd.MM.yyyy HH:mm', { locale: bg }), type: 'payment' });
            } catch (e) { console.warn("Error formatting payment activity time", e); }
        }
        setActivityFeed(newActivityFeed.length > 0 ? newActivityFeed.slice(0, 5) : recentActivityDataPlaceholder);

      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
        // Optionally set an error state here to display to the user
      } finally {
        setLoadingUsers(false);
        setLoadingSalons(false);
        setLoadingPayments(false);
        setLoadingCharts(false);
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

  const chartConfig = {
    users: { label: "Потребители", color: "hsl(var(--chart-1))" },
    salons: { label: "Салони", color: "hsl(var(--chart-2))" },
    payments: { label: "Плащания (лв.)", color: "hsl(var(--chart-3))" },
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
              Месечни Нови Потребители
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] p-2 md:p-4">
            {loadingCharts ? <p>Зареждане на диаграма...</p> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyUserData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                />
                <Legend iconSize={10} wrapperStyle={{fontSize: "12px", paddingTop: "10px"}} />
                <Bar dataKey="users" fill={chartConfig.users.color} name="Нови потребители" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
            )}
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
                    {/* <Button variant="link" size="sm" asChild> <Link href="/admin/activity">Виж всички активности</Link> </Button> */}
                    <a href="#" className="text-sm text-primary hover:underline">Виж всички активности</a>
                </div>
               )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Charts for Salons and Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="mr-2 h-5 w-5 text-primary" />
              Месечни Нови Салони
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] p-2 md:p-4">
            {loadingCharts ? <p>Зареждане на диаграма...</p> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySalonData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem' }}
                  labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                />
                <Legend iconSize={10} wrapperStyle={{fontSize: "12px", paddingTop: "10px"}} />
                <Bar dataKey="salons" fill={chartConfig.salons.color} name="Нови салони" radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5 text-primary" />
              Месечни Плащания (Промоции)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] p-2 md:p-4">
            {loadingCharts ? <p>Зареждане на диаграма...</p> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyPaymentData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value.toFixed(0)} лв.`} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem' }}
                  labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                  formatter={(value: number) => [`${value.toFixed(2)} лв.`, "Плащания"]}
                />
                <Legend iconSize={10} wrapperStyle={{fontSize: "12px", paddingTop: "10px"}} />
                <Bar dataKey="payments" fill={chartConfig.payments.color} name="Плащания" radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
            )}
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
                      <TableCell>{(payment.amount || 0).toFixed(2)} {payment.currency}</TableCell>
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

    