import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/firebase/firebase';
import { useUser } from '@/context/UserContext';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Client {
    id: string;
    createdAt: string;
    status: string;
    formData: {
        address: string;
        age: string;
        name: string;
        incidenttype: string;
    };
}

// Helper function to format date


const AssignIncidentPage = () => {
    const { userType } = useUser();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [clients, setClients] = useState<Client[]>([]);
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [assigningClient, setAssigningClient] = useState<string | null>(null);
    const [selectedTeamMember, setSelectedTeamMember] = useState<string>('');
    const [teamMembers, setTeamMembers] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
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
                await fetchTeamMembers();
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [router, userType]);


    // const handleSortToggle = () => {
    //     const newSortOrder = sortOrder === 'newest' ? 'oldest' : 'newest';
    //     setSortOrder(newSortOrder);

    //     const sortedClients = sortClientsByDate(filteredClients);
    //     setFilteredClients(sortedClients);
    // };

    const fetchClients = async () => {
        try {
            const clientsRef = collection(db, 'users');
            const q = query(clientsRef, where('type', '==', 'client'), where('status', '==', 'unassigned'));
            const querySnapshot = await getDocs(q);
            const clientsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                createdAt: doc.data().createdAt,
                ...doc.data()
            })) as Client[];
    
            // Add this line to console log incident types
            clientsData.forEach(client => console.log('Incident Type:', client.formData.incidenttype));
    
            const initialSortedClients = sortClientsByDate(clientsData);
            setClients(initialSortedClients);
            setFilteredClients(initialSortedClients);
        } catch (err) {
            setError('Failed to fetch clients.');
            console.error(err);
        }
    };
    const formatDate = (timestamp: string) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (err) {
            console.error(err);
            return 'N/A';
        }
    };
    const sortClientsByDate = (clientList: Client[]) => {
        return [...clientList].sort((a, b) => {
            if (a.formData.incidenttype === 'Physical Abuse' && b.formData.incidenttype !== 'Physical Abuse') return -1;
            if (b.formData.incidenttype === 'Physical Abuse' && a.formData.incidenttype !== 'Physical Abuse') return 1;
            
            if (a.formData.incidenttype === 'Neglect' && b.formData.incidenttype !== 'Neglect') return 1;
            if (b.formData.incidenttype === 'Neglect' && a.formData.incidenttype !== 'Neglect') return -1;
            
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
        });
    };
    const fetchTeamMembers = async () => {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('type', '==', 'admin'));
            const querySnapshot = await getDocs(q);
            const teamMembersData = querySnapshot.docs.map(doc => doc.data().email);
            setTeamMembers(teamMembersData);
        } catch (err) {
            setError('Failed to fetch team members.');
            console.error(err);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        setFilteredClients(
            clients
                .filter(client =>
                    client.formData.name.toLowerCase().includes(term.toLowerCase())
                )
        );
    };

    const handleAssignClick = (clientId: string) => {
        setAssigningClient(clientId);
        setSelectedTeamMember('');
    };

    const handleSaveAssign = async (clientId: string) => {
        console.log(selectedTeamMember);
        if (!selectedTeamMember) {
            toast.error('Please select a team member before assigning.');
            return;
        }

        try {
            const clientDocRef = doc(db, 'users', clientId);
            await updateDoc(clientDocRef, { assigned: selectedTeamMember, status: 'assigned' });
            setClients(clients.filter(client => client.id !== clientId));
            setFilteredClients(filteredClients.filter(client => client.id !== clientId));
            setAssigningClient(null);
        } catch (err) {
            toast.error('Failed to assign client.');
            console.error(err);
        }
    };

    const handleCancelAssign = () => {
        setAssigningClient(null);
        setSelectedTeamMember('');
    };

    const handleRemove = async (clientId: string) => {
        try {
            const clientDocRef = doc(db, 'users', clientId);
            await updateDoc(clientDocRef, { status: 'removed' });
            setClients(clients.filter(client => client.id !== clientId));
            setFilteredClients(filteredClients.filter(client => client.id !== clientId));
        } catch (err) {
            setError('Failed to remove client.');
            console.error(err);
        }
    };

    const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
    const displayedClients = filteredClients.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const navigateRemoved = () => {
        router.replace('/adminmodule/superadmin/removed');
    }

    const navigateAssigned = () => {
        router.replace('/adminmodule/superadmin/assigned');
    }

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="p-8 rounded bg-white">
            <h1 className="text-lg font-bold mb-4">Assign Incidents</h1>

            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

            {/* Search Bar */}
            <div className="flex justify-between mb-6">
                <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="border border-gray-300 rounded-lg p-2 w-80"
                />
                <div className='flex gap-3'>
                    <button onClick={navigateAssigned} className='px-3 py-2 bg-black border border-black rounded text-white'>
                        Assigned
                    </button>
                    <button onClick={navigateRemoved} className='px-3 py-2 border border-black rounded'>Removed</button>
                </div>
            </div>

            {/* Clients Table */}
            <div className="overflow-x-auto text-sm">
                <table className="min-w-full bg-white">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-4 text-left font-semibold">Name</th>
                            <th className="p-4 text-left font-semibold">Status</th>
                            <th className="p-4 text-left font-semibold">Age</th>
                            <th className="p-4 text-left font-semibold">Address</th>
                            <th className="p-4 text-left font-semibold">Created</th>
                            <th className="p-4 text-left font-semibold">Assign To</th>
                            <th className="p-4 text-left font-semibold">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {displayedClients.map(client => (
                            <tr key={client.id} className="border-b">
                                <td className="p-4">{client.formData.name}</td>
                                <td className="p-4">{client.formData.incidenttype}</td>
                                <td className="p-4">{client.formData.age}</td>
                                <td className="p-4">{client.formData.address}</td>
                                <td className="p-4">{formatDate(client.createdAt) || 'N/A'}</td>
                                <td className="p-4">
                                    {assigningClient === client.id ? (
                                        <select
                                            value={selectedTeamMember}
                                            onChange={(e) => setSelectedTeamMember(e.target.value)}
                                            className="p-2 border border-gray-300 rounded-lg w-full"
                                        >
                                            <option value="">Select Team Member</option>
                                            {teamMembers.map(member => (
                                                <option key={member} value={member}>{member}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span>—</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    {assigningClient === client.id ? (
                                        <>
                                            <button
                                                onClick={() => handleSaveAssign(client.id)}
                                                className="mr-2 p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                                disabled={!selectedTeamMember}
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={handleCancelAssign}
                                                className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handleAssignClick(client.id)}
                                                className="mr-2 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                            >
                                                Assign
                                            </button>
                                            <button
                                                onClick={() => handleRemove(client.id)}
                                                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                            >
                                                Remove
                                            </button>
                                        </>
                                    )}
                                </td>
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

export default AssignIncidentPage;
