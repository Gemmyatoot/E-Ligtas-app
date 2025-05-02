import React, { useEffect, useState, useCallback, useRef } from "react";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    updateDoc,
    deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/firebase/firebase";
import { Search, X } from "lucide-react";

type Client = {
    id: string;
    name: string;
    address: string;
    age: string;
    sex: string;
    incidenttype: string;
    createdAt: number;
    fileUploads?: string[];
};

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title: string;
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            modalRef.current?.focus();
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                ref={modalRef}
                className="bg-white p-6 rounded-lg shadow-lg w-96 relative"
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Close modal"
                >
                    <X className="w-5 h-5" />
                </button>
                <h2 id="modal-title" className="text-xl font-semibold mb-4">{title}</h2>
                {children}
            </div>
        </div>
    );
};

const BarangayModule: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [operationLoading, setOperationLoading] = useState<boolean>(false);
    const [currentUserAddress, setCurrentUserAddress] = useState<string | null>(null);
    const [search, setSearch] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
    const [clientToView, setClientToView] = useState<Client | null>(null);

    const fetchCurrentUserAddress = useCallback(async (uid: string) => {
        try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                setCurrentUserAddress(userDoc.data().address || "N/A");
            }
        } catch (error) {
            setError("Failed to fetch user address");
            console.error("Error fetching user address:", error);
        }
    }, []);

    const fetchClients = useCallback(async (address: string) => {
        try {
            const q = query(
                collection(db, "users"),
                where("status", "==", "review"),
                where("formData.address", "==", address)
            );

            const querySnapshot = await getDocs(q);
            const fetchedClients = querySnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.formData?.name || "N/A",
                    address: data.formData?.address || "N/A",
                    age: data.formData?.age || "N/A",
                    sex: data.formData?.sex || "N/A",
                    incidenttype: data.formData?.incidenttype || "N/A",
                    createdAt: data.createdAt || 0,
                    fileUploads: data.fileUploads || [],
                };
            });

            const sortedClients = fetchedClients.sort((a, b) => {
                const incidentOrder = ["Physical Abuse", "Rape", "Neglect"];
                return incidentOrder.indexOf(a.incidenttype) - incidentOrder.indexOf(b.incidenttype);
            });

            setClients(sortedClients);
            setFilteredClients(sortedClients);
            setError(null);
        } catch (error) {
            setError("Failed to fetch clients");
            console.error("Error fetching clients:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const authListener = onAuthStateChanged(auth, async (user) => {
            if (user) {
                await fetchCurrentUserAddress(user.uid);
            }
        });

        return () => authListener();
    }, [fetchCurrentUserAddress]);

    useEffect(() => {
        if (currentUserAddress) {
            fetchClients(currentUserAddress);
        }
    }, [currentUserAddress, fetchClients]);

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value.toLowerCase();
        setSearch(value);
        setFilteredClients(
            clients.filter(
                (client) =>
                    client.name.toLowerCase().includes(value) ||
                    client.address.toLowerCase().includes(value) ||
                    client.incidenttype.toLowerCase().includes(value)
            )
        );
    };

    const handleDelete = async () => {
        if (!clientToDelete) return;

        setOperationLoading(true);
        try {
            await deleteDoc(doc(db, "users", clientToDelete.id));
            setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
            setFilteredClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
            setShowDeleteModal(false);
        } catch (error) {
            setError("Failed to delete client");
            console.error("Error deleting client:", error);
        } finally {
            setOperationLoading(false);
        }
    };

    const handleValidated = async () => {
        if (!clientToView) return;

        setOperationLoading(true);
        try {
            await updateDoc(doc(db, "users", clientToView.id), { status: "unassigned" });
            setClients((prev) => prev.filter((c) => c.id !== clientToView.id));
            setFilteredClients((prev) => prev.filter((c) => c.id !== clientToView.id));
            setShowViewModal(false);
        } catch (error) {
            setError("Failed to validate client");
            console.error("Error updating client status:", error);
        } finally {
            setOperationLoading(false);
        }
    };

    const formatDate = (epoch: number) => new Date(epoch).toLocaleString();

    return (
        <div className="w-full max-w-6xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
                {currentUserAddress && (
                    <div className="mb-6">
                        <p className="text-gray-700">
                            <strong>Your Address:</strong> {currentUserAddress}
                        </p>
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        value={search}
                        onChange={handleSearch}
                        placeholder="Search by name, address, or incident type..."
                        className="pl-10 w-full max-w-md rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-2.5"
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-500"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incident Type</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredClients.map((client) => (
                                    <tr key={client.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">{client.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{client.address}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{client.age}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{client.incidenttype}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{formatDate(client.createdAt)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                            <button
                                                onClick={() => {
                                                    setClientToView(client);
                                                    setShowViewModal(true);
                                                }}
                                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setClientToDelete(client);
                                                    setShowDeleteModal(true);
                                                }}
                                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Confirm Delete"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">Are you sure you want to delete this case?</p>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            disabled={operationLoading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            disabled={operationLoading}
                        >
                            {operationLoading ? "Deleting..." : "Delete"}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
                title="Client Details"
            >
                <div className="space-y-4">
                    {clientToView ? (
                        <>
                            <div>
                                <p><strong>Name:</strong> {clientToView.name}</p>
                                <p><strong>Address:</strong> {clientToView.address}</p>
                                <p><strong>Age:</strong> {clientToView.age}</p>
                                <p><strong>Sex:</strong> {clientToView.sex}</p>
                                <p><strong>Incident Type:</strong> {clientToView.incidenttype}</p>
                                <p><strong>Created At:</strong> {formatDate(clientToView.createdAt)}</p>
                            </div>
                            {/* Files Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Attached Files</h3>
            {clientToView.fileUploads && clientToView.fileUploads.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                {clientToView.fileUploads.map((file, index) => (
                  <div 
                    key={index}
                    className="group flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Image {index + 1}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">
                          {file.split('/').pop()}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                                                    href={file}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    View image
                                                </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg border-gray-200">
                <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">No files attached</p>
              </div>
            )}
          </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={handleValidated}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    disabled={operationLoading}
                                >
                                    {operationLoading ? "Validating..." : "Validate"}
                                </button>
                            </div>
                        </>
                    ) : (
                        <p className="text-gray-600">No client selected.</p>
                    )}
                </div>
            </Modal>

        </div>
    );
};

export default BarangayModule;
