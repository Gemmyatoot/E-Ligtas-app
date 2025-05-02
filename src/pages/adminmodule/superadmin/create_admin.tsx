import { useEffect, useState } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    type: string; // admin or barangay
    address: string;
}

const CreateAdminPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [user, setUser] = useState<Omit<User, 'id'>>({ name: '', email: '', type: 'admin', address: '' });
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalType, setModalType] = useState<'add' | 'edit'>('add');
    const [error, setError] = useState<string | null>(null);
    const [barangays, setBarangays] = useState<string[]>([]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    const fetchUsers = async () => {
        const response = await fetch('/api/users');
        const data = await response.json();
        setUsers(data);
    };

    const fetchBarangays = async () => {
        const response = await fetch('/barangay.json');
        const data = await response.json();
        setBarangays(data.barangays);
    };

    useEffect(() => {
        fetchUsers();
        fetchBarangays();
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validate input fields
        if (!user.name || !user.email || !user.address || (modalType === 'add' && !password)) {
            setError('All fields are required. Password is required when adding a user.');
            return;
        } else {
            setError(null); // Clear error if validation passes
        }

        const method = editingUserId ? 'PUT' : 'POST';
        const url = editingUserId ? `/api/users?id=${editingUserId}` : '/api/users';

        const userData = {
            email: user.email,
            password: modalType === 'add' ? password : undefined, // Only include password when adding
            fullName: user.name,
            name: user.name,
            type: user.type,
            address: user.address,
        };

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error:', errorData);
            return;
        }

        setUser({ name: '', email: '', type: 'admin', address: '' });
        setPassword('');
        setEditingUserId(null);
        fetchUsers();
        closeModal();
    };

    const handleEdit = (user: User) => {
        setUser({ name: user.name, email: user.email, type: user.type, address: user.address });
        setEditingUserId(user.id);
        setModalType('edit');
        openModal();
    };

    const handleDelete = async (id: string) => {
        await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
        fetchUsers();
    };

    const openModal = () => {
        setModalIsOpen(true);
    };

    const closeModal = () => {
        setModalIsOpen(false);
    };

    const filteredUsers = users.filter((user) =>
        user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const displayedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="container mx-auto p-10 bg-white rounded shadow">
            <h1 className="text-lg font-bold mb-4">Admin Users</h1>
            <div className="flex justify-between mb-4">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search by name"
                    className="border rounded p-2 w-80"
                />
                <button onClick={openModal} className="bg-black text-white rounded p-2 hover:bg-gray-900">
                    Add User
                </button>
            </div>

            {/* Modal */}
            {modalIsOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-96">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold mb-4">{modalType === 'edit' ? 'Edit User' : 'Add User'}</h2>
                            <button onClick={closeModal}>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z" fill="black" />
                                </svg>
                            </button>
                        </div>

                        {error && <p className="text-red-500 mb-2">{error}</p>}

                        <form onSubmit={handleSubmit} className="flex flex-col">
                            <label htmlFor="name">Name</label>
                            <input
                                name="name"
                                value={user.name}
                                onChange={(e) => setUser({ ...user, name: e.target.value })}
                                placeholder="Name"
                                required
                                className="border rounded p-2 mb-2"
                            />

                            <label htmlFor="type">Type</label>
                            <div className="flex space-x-4 mb-2">
                                <label>
                                    <input
                                        type="radio"
                                        name="type"
                                        value="admin"
                                        checked={user.type === 'admin'}
                                        onChange={() => setUser({ ...user, type: 'admin' })}
                                    />
                                    Admin
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="type"
                                        value="barangay"
                                        checked={user.type === 'barangay'}
                                        onChange={() => setUser({ ...user, type: 'barangay' })}
                                    />
                                    Barangay
                                </label>
                            </div>

                            <label htmlFor="address">Address</label>
                            <select
                                name="address"
                                value={user.address}
                                onChange={(e) => setUser({ ...user, address: e.target.value })}
                                required
                                className="border rounded p-2 mb-4"
                            >
                                <option value="">Select Address</option>
                                {barangays.map((barangay, index) => (
                                    <option key={index} value={barangay}>
                                        {barangay}
                                    </option>
                                ))}
                            </select>

                            <label htmlFor="email">Email</label>
                            <input
                                name="email"
                                value={user.email}
                                onChange={(e) => setUser({ ...user, email: e.target.value })}
                                placeholder="Email"
                                required
                                className="border rounded p-2 mb-2"
                            />

                            <label htmlFor="password">Password</label>
                            <input
                                name="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                required={modalType === 'add'}
                                className="border rounded p-2 mb-2"
                            />

                            <button
                                type="submit"
                                className="bg-black text-white rounded p-2 hover:bg-gray-900"
                            >
                                {modalType === 'edit' ? 'Update User' : 'Add User'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div className="overflow-x-auto text-sm">
                <table className="min-w-full bg-white">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-4 text-left font-semibold">Name</th>
                            <th className="p-4 text-left font-semibold">Email</th>
                            <th className="p-4 text-left font-semibold">Type</th>
                            <th className="p-4 text-left font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedUsers.map(user => (
                            <tr key={user.id} className="border-b">
                                <td className="p-4">{user.name}</td>
                                <td className="p-4">{user.email}</td>
                                <td className="p-4">{user.type}</td>
                                <td className="p-4 flex space-x-2">
                                    <button onClick={() => handleEdit(user)} className="bg-yellow-500 text-white rounded px-3 py-2 hover:bg-yellow-600">
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(user.id)} className="bg-red-500 text-white rounded px-3 py-2 hover:bg-red-600">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CreateAdminPage;
