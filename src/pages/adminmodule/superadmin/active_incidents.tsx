import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/firebase/firebase';
import { useUser } from '@/context/UserContext';
import { db } from '@/firebase/firebase'; // Import Firestore
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

// Define the Client type
interface Client {
    id: string;
    status: string;
    createdAt: { seconds: number; nanoseconds: number };
    formData: {
        address: string;
        age: string;
        name: string;
        incidenttype: string;
    };
}

const ActiveIncidentPage = () => {
    const { userType } = useUser();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [clients, setClients] = useState<Client[]>([]); // Specify Client type
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState(new Date());
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                await router.push('/adminmodule/login');
            } else if (userType !== 'superadmin') {
                await signOut(auth);
                await router.push('/adminmodule/login');
            } else {
                await fetchClients();
            }
        });

        return () => unsubscribe();
    }, [router, userType]);

    const fetchClients = async () => {
        try {
            const clientsRef = collection(db, 'users');
            const q = query(
                clientsRef,
                where('type', '==', 'client'),
            );
            const querySnapshot = await getDocs(q);
            const clientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Client[]; // Cast to Client[]
            setClients(clientsData);

            console.log(clientsData);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch clients.');
            setLoading(false);
            console.error(err);
        }
    };

    const filteredClients = clients.filter(client => {
        return client.formData.name && client.formData.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className='h-full bg-white px-7'>
            <div className='w-full h-[80px] flex justify-between items-center'>
                <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='border w-80 p-2 mb-2'
                />
                <input
                    type="date"
                    value={dateFilter.toISOString().substring(0, 10)}
                    onChange={(e) => setDateFilter(new Date(e.target.value))}
                    className='border p-2 mb-2 ml-2'
                />
            </div>

            {/* Content */}
            <div className='w-full flex gap-5' style={{ height: `calc(100% - 76px)` }}>
    {/* Unassigned */}
    <div className='flex-1 flex flex-col border-2 border-neutral-900 rounded-t-2xl overflow-hidden'>
        <div className='font-semibold w-full p-4 text-center border-b-2 border-neutral-900 bg-gray-100'>
            UNASSIGNED
        </div>
        <div className='w-full h-full px-3 pt-4 overflow-y-auto'>
            {filteredClients.filter(client => client.status === 'unassigned').map((client, index) => (
                <div key={index} className='carddrag w-full border rounded-lg shadow p-3 mb-3'>
                    <h1 className='font-bold'>{client.formData.name}</h1>
                    <p className='text-gray-500 text-xs'>{client.formData.incidenttype.toUpperCase()}</p>
                    <hr className='my-1' />
                    <div className='text-xs'>Address: {client.formData.address}, Bani, Pangasinan</div>
                    <div className='text-xs'>Age: {client.formData.age}</div>
                </div>
            ))}
        </div>
    </div>

    {/* Assigned */}
    <div className='flex-1 flex flex-col border-2 border-neutral-900 rounded-t-2xl overflow-hidden'>
        <div className='font-semibold w-full p-4 text-center border-b-2 border-neutral-900 bg-gray-100'>
            ASSIGNED
        </div>
        <div className='w-full h-full px-3 pt-4 overflow-y-auto'>
            {filteredClients.filter(client => client.status === 'assigned').map((client, index) => {
                const createdAtDate = new Date(client.createdAt.seconds * 1000);
                return (
                    <div key={index} className='carddrag w-full border rounded-lg shadow p-3 mb-3'>
                        <h1 className='font-bold'>{client.formData.name}</h1>
                        <p className='text-gray-500 text-xs'>{client.formData.incidenttype.toUpperCase()}</p>
                        <hr className='my-1' />
                        <div className='text-xs'>Address: {client.formData.address}, Bani, Pangasinan</div>
                        <div className='text-xs'>Age: {client.formData.age}</div>
                        <div className='text-xs'>Date: {createdAtDate.toLocaleDateString()}</div>
                    </div>
                );
            })}
        </div>
    </div>

    {/* Under Review */}
    <div className='flex-1 flex flex-col border-2 border-neutral-900 rounded-t-2xl overflow-hidden'>
        <div className='font-semibold w-full p-4 text-center border-b-2 border-neutral-900 bg-gray-100'>
            UNDER REVIEW
        </div>
        <div className='w-full h-full px-4 pt-4 overflow-y-auto'>
            {filteredClients.filter(client => client.status === 'under review').map((client, index) => {
                const createdAtDate = new Date(client.createdAt.seconds * 1000);
                return (
                    <div key={index} className='carddrag w-full border rounded-lg shadow p-3 mb-3'>
                        <h1 className='font-bold'>{client.formData.name}</h1>
                        <div>Address: {client.formData.address}</div>
                        <div>Age: {client.formData.age}</div>
                        <div>Date: {createdAtDate.toLocaleDateString()}</div>
                    </div>
                );
            })}
        </div>
    </div>

    {/* Completed */}
    <div className='flex-1 flex flex-col border-2 border-neutral-900 rounded-t-2xl overflow-hidden'>
        <div className='font-semibold w-full p-4 text-center border-b-2 border-neutral-900 bg-gray-100'>
            COMPLETED
        </div>
        <div className='w-full h-full px-4 pt-4 overflow-y-auto'>
            {filteredClients.filter(client => client.status === 'completed').map((client, index) => {
                const createdAtDate = new Date(client.createdAt.seconds * 1000);
                return (
                    <div key={index} className='carddrag w-full border rounded-lg shadow p-3 mb-3'>
                        <h1 className='font-bold'>{client.formData.name}</h1>
                        <div>Address: {client.formData.address}</div>
                        <div>Age: {client.formData.age}</div>
                        <div>Date: {createdAtDate.toLocaleDateString()}</div>
                    </div>
                );
            })}
        </div>
    </div>
</div>  

        </div>
    );
};

export default ActiveIncidentPage;
