import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '@/firebase/firebase';
import { useUser } from '@/context/UserContext';
import ReactECharts from 'echarts-for-react';
import DateSelector from '@/components/inputs/DateSelectpr';

interface User {
    id: string;
    createdAt: number;
    formData: {
        incidenttype: string;
        address: string;
        name: string;
    };
}

interface IncidentCounts {
    rape: number;
    abuse: number;
    neglect: number;
}

interface AddressCounts {
    addressCounts: { [key: string]: number };
}

interface ChartData {
    addresses: string[];
    counts: number[];
}

const AdminPage = () => {
    const { userType } = useUser();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [chartData, setChartData] = useState<ChartData>({
        addresses: [],
        counts: [],
    });
    const [users, setUsers] = useState<User[]>([]);
    const [incidentCounts, setIncidentCounts] = useState<IncidentCounts>({
        rape: 0,
        abuse: 0,
        neglect: 0,
    });

    const [addressCounts, setAddressCounts] = useState<AddressCounts>({
        addressCounts: {},
    })
    const [recentUsers, setRecentUsers] = useState<User[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                await router.push('/adminmodule/login');
            } else if (userType !== 'admin') {
                await signOut(auth);
                await router.push('/adminmodule/login');
            } else {
                await fetchUsersAndIncidents(selectedDate);
                await fetchMonthlyIncidents(selectedDate);
                await fetchRecentClients();
            }
        });

        return () => unsubscribe();
    }, [router, userType, selectedDate]);

    const formatDate = (timestamp: number): string => {
        const date = new Date(timestamp);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(date);
    };

    const fetchRecentClients = async () => {
        setLoading(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser || !currentUser.email) {
                throw new Error('User not authenticated');
            }
    
            const usersQuery = query(
                collection(db, 'users'),
                where('type', '==', 'client'),
                where('assigned', '==', currentUser.email), // Filter by assigned email
                orderBy('createdAt', 'desc'),
                limit(5)
            );
    
            const usersSnapshot = await getDocs(usersQuery);
            const usersData = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as User[];
    
            setRecentUsers(usersData);
        } catch (err) {
            console.error('Error fetching recent clients:', err);
            setError('Failed to fetch recent incidents');
        } finally {
            setLoading(false);
        }
    };

    const fetchMonthlyIncidents = async (date: Date) => {
        setLoading(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser || !currentUser.email) {
                throw new Error('User not authenticated');
            }
    
            const currentYear = date.getFullYear();
            const currentMonth = date.getMonth();
    
            const monthStart = new Date(currentYear, currentMonth, 1).getTime();
            const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999).getTime();
    
            const usersQuery = query(
                collection(db, 'users'),
                where('createdAt', '>=', monthStart),
                where('createdAt', '<=', monthEnd),
                where('assigned', '==', currentUser.email) // Filter by assigned email
            );
    
            const usersSnapshot = await getDocs(usersQuery);
            const usersData = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as User[];
    
            setUsers(usersData);
    
            let rapeCount = 0;
            let abuseCount = 0;
            let neglectCount = 0;
    
            usersData.forEach(user => {
                const formData = user.formData;
                if (formData && formData.incidenttype) {
                    if (formData.incidenttype === 'Rape') {
                        rapeCount++;
                    } else if (formData.incidenttype === 'Physical Abuse') {
                        abuseCount++;
                    } else if (formData.incidenttype === 'Neglect') {
                        neglectCount++;
                    }
                }
            });
    
            setIncidentCounts({ rape: rapeCount, abuse: abuseCount, neglect: neglectCount });
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const [year, month] = event.target.value.split('-').map(Number);
        setSelectedDate(new Date(year, month - 1)); // Update selected month/year
    };

    const fetchUsersAndIncidents = async (date: Date) => {
        setLoading(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser || !currentUser.email) {
                throw new Error('User not authenticated');
            }
    
            const currentYear = date.getFullYear();
            const currentMonth = date.getMonth();
    
            const monthStart = new Date(currentYear, currentMonth, 1).getTime();
            const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999).getTime();
    
            const usersQuery = query(
                collection(db, 'users'),
                where('createdAt', '>=', monthStart),
                where('createdAt', '<=', monthEnd),
                where('assigned', '==', currentUser.email) // Filter by assigned email
            );
    
            const usersSnapshot = await getDocs(usersQuery);
            const usersData = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as User[];
    
            setUsers(usersData);
            const addressCounts: { [key: string]: number } = {};
    
            usersData.forEach(user => {
                const formData = user.formData;
    
                const address = formData.address;
                if (address) {
                    addressCounts[address] = (addressCounts[address] || 0) + 1;
                }
            });
    
            setAddressCounts({
                addressCounts,
            });
    
            setChartData({
                addresses: Object.keys(addressCounts),
                counts: Object.values(addressCounts),
            });
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const getOption = () => ({
        tooltip: {},
        xAxis: {
            type: 'category',
            data: chartData.addresses,
            axisLabel: {
                interval: 0,
                rotate: 45,
                fontSize: 10,
            },
        },
        yAxis: {
            type: 'value',
        },
        series: [{
            name: 'Number of Reports',
            type: 'line',
            data: chartData.counts,
        }],
    });

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className='p-5'>
            <div className='w-full flex content-center items-center justify-between mb-5'>
                <h1 className="text-lg font-semibold mb-4">Admin Dashboard</h1>
                <DateSelector selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
            </div>
            <div className='flex flex-wrap gap-5'>
                <div className='bg-red-600 rounded-xl shadow pl-2 flex-1'>
                    <div className='bg-white rounded-xl p-6'>
                        <h1 className='font-semibold text-red-600'>Monthly Incidents</h1>
                        <p className='font-medium text-[60px]'>{incidentCounts.rape + incidentCounts.abuse + incidentCounts.neglect}</p>
                    </div>
                </div>

                <div className='bg-green-600 rounded-xl shadow pl-2 flex-1'>
                    <div className='bg-white rounded-xl p-6'>
                        <h1 className='font-semibold text-green-600'>Case of Rape</h1>
                        <p className='font-medium text-[60px]'>{incidentCounts.rape}</p>
                    </div>
                </div>

                <div className='bg-blue-600 rounded-xl shadow pl-2 flex-1'>
                    <div className='bg-white rounded-xl p-6'>
                        <h1 className='font-semibold text-blue-600'>Case of Abuse</h1>
                        <p className='font-medium text-[60px]'>{incidentCounts.abuse}</p>
                    </div>
                </div>

                <div className='bg-purple-600 rounded-xl shadow pl-2 flex-1'>
                    <div className='bg-white rounded-xl p-6'>
                        <h1 className='font-semibold text-purple-600'>Case of Neglect</h1>
                        <p className='font-medium text-[60px]'>{incidentCounts.neglect}</p>
                    </div>
                </div>
            </div>

            <div className='flex flex-wrap gap-5 mt-5'>
                <div id='incidentrep' className='rounded-xl bg-white shadow pr-5'>
                    <div className='flex justify-between'>
                        <div className='p-5'>
                            <h1 className='font-medium text-[14px]'>Incident Summary</h1>
                            <p className='font-medium text-xs text-gray-500'>Number of Incidents</p>
                        </div>

                    </div>
                    <div id='incidentrep' className='pr-5'>
                        {users.length > 0 ? (
                            <ReactECharts option={getOption()} style={{ height: '400px', width: '100%' }} />
                        ) : (
                            <p className='p-5 text-center font-medium h-full'>No Records Found.</p>
                        )}
                    </div>
                </div>

                <div id='recentassigned' className='p-5 rounded-xl bg-white shadow'>
                    <h1 className='font-medium text-[14px] mb-2'>Recent Incidents</h1>
                    <hr className='mb-3' />
                    <div>
                        {recentUsers.map(user => (
                            <div key={user.id} className='mb-5 rounded-lg bg-slate-100 px-4 py-3'>
                                <h1 className='font-semibold'>{user.formData.name}</h1>
                                <div className='flex justify-between'>
                                    <div
                                        className={` rounded py-2 px-3 font-medium mt-2 text-xs text-white ${user.formData.incidenttype === 'Neglect'
                                            ? 'bg-yellow-500'
                                            : user.formData.incidenttype === 'Rape'
                                                ? 'bg-red-500'
                                                : user.formData.incidenttype === 'Physical Abuse'
                                                    ? 'bg-orange-500'
                                                    : ''
                                            }`}
                                    >
                                        {user.formData.incidenttype}
                                    </div>
                                    <p className='font-medium text-xs text-gray-700'>{formatDate(user.createdAt)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
