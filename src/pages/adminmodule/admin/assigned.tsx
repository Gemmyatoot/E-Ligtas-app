import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/firebase/firebase';
import { useUser } from '@/context/UserContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';

interface Client {
    id: string;
    assigned: string;
    formData: {
        address: string;
        age: string;
        name: string;
        incidenttype: string;
    };
}

const AssignedPage = () => {
    const { userType } = useUser();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [clients, setClients] = useState<Client[]>([]);
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [incidentFilter, setIncidentFilter] = useState(''); // New state for incident filter
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [userEmail, setUserEmail] = useState("");
    const router = useRouter();

    useEffect(() => {
        const sessionData = sessionStorage.getItem('userSession');

        if (sessionData) { // Ensure sessionData is not null
            const { email } = JSON.parse(sessionData); // Assuming uuid is a string
            setUserEmail(email); // Store the user name
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                await router.push('/adminmodule/login');
            } else if (userType !== 'superadmin') {
                await signOut(auth);
                await router.push('/adminmodule/login');
            } else {
                await fetchAssignedClients();
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [router, userType]);

    const fetchAssignedClients = async () => {
        try {
            const clientsRef = collection(db, 'users');
            const q = query(
                clientsRef,
                where('type', '==', 'client'),
                where('type', '==', userEmail),
                where('status', '==', 'assigned'),
                orderBy('assignedAt')
            );
            const querySnapshot = await getDocs(q);
            const clientsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Client[];
            setClients(clientsData);
            setFilteredClients(clientsData);
        } catch (err) {
            setError('Failed to fetch assigned clients.');
            console.error(err);
        }
    };  

    useEffect(() => {
        // Filter based on search query and incident type
        const result = clients.filter(client =>
            client.formData.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            (incidentFilter === '' || client.formData.incidenttype === incidentFilter)
        );
        setFilteredClients(result);
        setCurrentPage(1); // Reset to first page on search or filter
    }, [searchQuery, incidentFilter, clients]);

    const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
    const displayedClients = filteredClients.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="p-8 rounded bg-white">
            <h1 className="text-lg font-bold mb-4">Assigned Incidents</h1>

            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

            <div className='flex justify-between items-center text-sm'>
                <div className='flex gap-5'>
                    {/* Search Input */}
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg w-80"
                        />
                    </div>

                    {/* Incident Filter Dropdown */}
                    <div className="mb-4">
                        <select
                            value={incidentFilter}
                            onChange={(e) => setIncidentFilter(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg"
                        >
                            <option value="">All Incidents</option>
                            <option value="Neglect">Neglect</option>
                            <option value="Rape">Rape</option>
                            <option value="Physical Abuse">Physical Abuse</option>
                        </select>
                    </div>
                </div>

                {/* Back Link */}
                <Link href={'./assign_incident'} className="px-3 py-2 rounded border-2 border-slate-950">
                    Back
                </Link>
            </div>

            {/* Clients Table */}
            <div className="overflow-x-auto text-sm">
                <table className="min-w-full bg-white">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-4 text-left font-semibold">Name</th>
                            <th className="p-4 text-left font-semibold">Assigned To</th>
                            <th className="p-4 text-left font-semibold">Incident</th>
                            <th className="p-4 text-left font-semibold">Age</th>
                            <th className="p-4 text-left font-semibold">Address</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedClients.map(client => (
                            <tr key={client.id} className="border-b">
                                <td className="p-4">{client.formData.name}</td>
                                <td className="p-4">{client.assigned}</td>
                                <td className='p-4'>
                                    <div
                                        className={`rounded py-2 px-3 font-medium text-white ${client.formData.incidenttype === 'Neglect'
                                            ? 'bg-yellow-500'
                                            : client.formData.incidenttype === 'Rape'
                                                ? 'bg-red-500'
                                                : client.formData.incidenttype === 'Physical Abuse'
                                                    ? 'bg-orange-500'
                                                    : ''
                                            }`}
                                    >
                                        {client.formData.incidenttype}
                                    </div>
                                </td>
                                <td className="p-4">{client.formData.age}</td>
                                <td className="p-4">{client.formData.address}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4 text-sm">
                <div>
                    <span className="mr-2">Items per page:</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="p-2 border border-gray-300 rounded-lg"
                    >
                        {[5, 10, 15, 20].map(num => (
                            <option key={num} value={num}>{num}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center space-x-2">
                    <span>
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        className="p-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                        disabled={currentPage === 1}
                    >
                        Prev
                    </button>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        className="p-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignedPage;
