import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, setDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'next/router';

export interface Incident {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    formData?: {
        reportee?: string,
        address?: string;
        age?: string;
        alias?: string;
        civilStatus: string;
        contact: string;
        dbirth: string;
        disability: string;
        edattainment: string;
        incidenttype: string;
        marks: string;
        name: string;
        paddress: string;
        pbirth: string;
        religion: string;
        saddress: string;
        sattended: string;
        sex: string;
    };
}

const AssignedIncidentPage = () => {
    const [toDo, setToDo] = useState<Incident[]>([]);
    const [underInvestigation, setUnderInvestigation] = useState<Incident[]>([]);
    const [inProgress, setInProgress] = useState<Incident[]>([]);
    const [completed, setCompleted] = useState<Incident[]>([]);
    const router = useRouter();
    const [draggingSource, setDraggingSource] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFirstModalOpen, setIsFirstModalOpen] = useState(false);
    const [isSecondModalOpen, setIsSecondModalOpen] = useState(false);
    const [currentIncident, setCurrentIncident] = useState<Incident | null>(null);

    const [completeForm, setCompleteForm] = useState({
        initialAssessment: ''
    });

    const [firstForm, setFirstForm] = useState({
        userName: '',
        userAddress: '',
        contactNumber:  '',
        referralReason: '',
        referralDate: '',
        clientCategory: 'Minor',
        offenseDate: '',
        offensePlace: '',
        apprehensionDate: '',
        apprehensionPlace: '',
        apprehendedBy: '',
        agencyAddress: '',
        agencyContact: '',
    });


    const [secondForm, setSecondForm] = useState({
        officerReport: '',
        childVersion: '',
        caseCircumstances: '',
    });

    const defaultFormData = {
        address: "",
        age: "",
        alias: "",
        civilStatus: "",
        contact: "",
        dbirth: "",
        disability: "",
        edattainment: "",
        incidenttype: "",
        marks: "",
        name: "",
        paddress: "",
        pbirth: "",
        religion: "",
        saddress: "",
        sattended: "",
        sex: "",
    };

    const db = getFirestore();
    const auth = getAuth();

    // Fetch incidents on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    console.error('User not logged in');
                    return;
                }
    
                const email = user.email;
                const q = query(collection(db, 'users'), where('assigned', '==', email));
                const querySnapshot = await getDocs(q);
    
                const toDoList: Incident[] = [];
                const underInvestigationList: Incident[] = [];
                const inProgressList: Incident[] = [];
                const completedList: Incident[] = [];
    
                querySnapshot.forEach((doc) => {
                    const data = doc.data() as Omit<Incident, 'id'>;
                    const incident: Incident = {
                        id: doc.id,
                        ...data,
                        formData: { ...defaultFormData, ...data.formData },
                    };
    
                    // Assign incidents to the appropriate list based on their status
                    switch (incident.status) {
                        case 'assigned':
                            toDoList.push(incident);
                            break;
                        case 'Under Investigation':
                            underInvestigationList.push(incident);
                            break;
                        case 'In Progress':
                            inProgressList.push(incident);
                            break;
                        case 'Completed':
                            completedList.push(incident);
                            break;
                        default:
                            console.warn('Unknown status:', incident.status);
                    }
                });
    
                // Sort each list by date (newest first)
                const sortByEpochDesc = (a: Incident, b: Incident) => {
                    // Replace 'timestamp' with the correct field containing the epoch time
                    const timeA = a.timestamp;
                    const timeB = b.timestamp;
                
                    return timeB - timeA; // Newest first
                };
                
                setToDo([...toDoList].sort(sortByEpochDesc));
                setUnderInvestigation([...underInvestigationList].sort(sortByEpochDesc));
                setInProgress([...inProgressList].sort(sortByEpochDesc));
                setCompleted([...completedList].sort(sortByEpochDesc));
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
    
        fetchData();
    }, [auth, db]);
    

    const handleDragStart = (e: React.DragEvent, item: Incident, source: string) => {
        e.dataTransfer.setData('incident', JSON.stringify({ item, source }));
        setDraggingSource(source);
        setCurrentIncident(item); // Add this line to track the current incident
    };

    const handleDrop = async (
        e: React.DragEvent,
        destination: string,
        setDestination: React.Dispatch<React.SetStateAction<Incident[]>>
    ) => {
        e.preventDefault();

        const data = e.dataTransfer.getData('incident');
        const { item, source } = JSON.parse(data);

        if (source === destination) return; // Prevent moving within the same div

        if (
            (source === 'assigned' && destination !== 'Under Investigation') ||
            (source === 'Under Investigation' && !['assigned', 'In Progress'].includes(destination)) ||
            (source === 'In Progress' && !['Under Investigation', 'Completed'].includes(destination)) ||
            (source === 'Completed' && destination !== 'In Progress') // Allow moving back to In Progress
        ) {
            return;
        }

        if (source === 'assigned' && destination === 'Under Investigation') {
            const formattedDate = new Date(item.createdAt).toISOString().split('T')[0];
            setFirstForm((prevState) => ({
                ...prevState,
                userName: item.formData.name,
                userAddress: item.formData.address,
                contactNumber: item.formData.contact,
                referralDate: formattedDate,
            }));
            setIsFirstModalOpen(true);
            return;
        }

        if (source === 'Under Investigation' && destination === 'In Progress') {
            setIsSecondModalOpen(true);
            return;
        }

        // Handle the Completed case and show the modal
        if (destination === 'Completed') {
            setCurrentIncident(item);
            setIsModalOpen(true);
            return;
        }

        // Define a helper to update the source state
        const updateSourceState = () => {
            switch (source) {
                case 'assigned':
                    setToDo((prev) => prev.filter((i) => i.id !== item.id));
                    break;
                case 'Under Investigation':
                    setUnderInvestigation((prev) => prev.filter((i) => i.id !== item.id));
                    break;
                case 'In Progress':
                    setInProgress((prev) => prev.filter((i) => i.id !== item.id));
                    break;
                case 'Completed':
                    setCompleted((prev) => prev.filter((i) => i.id !== item.id));
                    break;
                default:
                    console.warn(`Unknown source: ${source}`);
            }
        };

        // Remove the item from the source
        updateSourceState();

        // Add the item to the destination list
        setDestination((prev) => [...prev, { ...item, status: destination }]);

        // Update Firestore
        try {
            const docRef = doc(db, 'users', item.id); // Reference to the specific document
            await updateDoc(docRef, { status: destination });
            console.log(`Updated status of ${item.title} to ${destination}`);
        } catch (error) {
            console.error('Error updating status in Firestore:', error);
        }

        setDraggingSource(null); // Clear dragging state
    };

    const handleSave = async () => {
        if (currentIncident) {
            try {
                const docRef = doc(db, 'users', currentIncident.id);
                await updateDoc(docRef, {
                    completeForm,
                    status: 'Completed',
                });

                // Remove the incident from its previous list
                switch (currentIncident.status) {
                    case 'assigned':
                        setToDo((prev) => prev.filter((i) => i.id !== currentIncident.id));
                        break;
                    case 'Under Investigation':
                        setUnderInvestigation((prev) => prev.filter((i) => i.id !== currentIncident.id));
                        break;
                    case 'In Progress':
                        setInProgress((prev) => prev.filter((i) => i.id !== currentIncident.id));
                        break;
                }

                // Add the incident to the completed list
                setCompleted((prev) => [...prev, { ...currentIncident, status: 'Completed', completeForm }]);

                setIsModalOpen(false);
            } catch (error) {
                console.error('Error saving data:', error);
            }
        }
    };

    const handleDragEnd = () => setDraggingSource(null);

    const handleDragOver = (e: React.DragEvent) => e.preventDefault();

    const isValidTarget = (source: string | null, target: string) => {
        if (!source) return false;
        if (source === 'assigned' && target === 'Under Investigation') return true;
        if (source === 'Under Investigation' && ['assigned', 'In Progress'].includes(target)) return true;
        if (source === 'In Progress' && ['Under Investigation', 'Completed'].includes(target)) return true;
        if (source === 'Completed' && target === 'In Progress') return true; // Allow moving back to In Progress
        return false;
    };


    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        // Check if the current modal is the first modal
        if (isFirstModalOpen) {
            setFirstForm((prevForm) => ({
                ...prevForm,
                [name]: value
            }));
        }
        // Check if the current modal is the second modal
        else if (isSecondModalOpen) {
            setSecondForm((prevForm) => ({
                ...prevForm,
                [name]: value
            }));
        }
        // Check if the current modal is the completion modal
        else if (isModalOpen) {
            setCompleteForm((prevForm) => ({
                ...prevForm,
                [name]: value
            }));
        }
    };

    const handleChat = (chatID: string) => {
        router.push(`/adminmodule/admin/${chatID}`);
    };

    const handleFirstModalCancel = () => {
        setIsFirstModalOpen(false);
    };

    const handleFirstModalSave = async () => {
        if (currentIncident) {
            try {
                const docRef = doc(db, 'users', currentIncident.id);
                await updateDoc(docRef, {
                    firstForm,
                    status: 'Under Investigation',
                });

                // Remove the incident from the 'assigned' list
                setToDo((prev) => prev.filter((i) => i.id !== currentIncident.id));

                // Add the incident to the 'Under Investigation' list
                setUnderInvestigation((prev) => [...prev, { ...currentIncident, status: 'Under Investigation', firstForm }]);

                setIsFirstModalOpen(false);
            } catch (error) {
                console.error('Error saving first modal data:', error);
            }
        }
    };

    const handleSecondModalCancel = () => {
        setIsSecondModalOpen(false);
    };

    const handleSecondModalSave = async () => {
        if (currentIncident) {
            try {
                const docRef = doc(db, 'users', currentIncident.id);
                await updateDoc(docRef, {
                    secondForm,
                    status: 'In Progress',
                });

                // Remove the incident from the 'Under Investigation' list
                setUnderInvestigation((prev) => prev.filter((i) => i.id !== currentIncident.id));

                // Add the incident to the 'In Progress' list
                setInProgress((prev) => [...prev, { ...currentIncident, status: 'In Progress', secondForm }]);

                setIsSecondModalOpen(false);
            } catch (error) {
                console.error('Error saving second modal data:', error);
            }
        }
    };

    type IncidentType = 'Rape' | 'Neglect' | 'Physical Abuse' | 'other';

    const getIncidentColor = (incidentType: IncidentType) => {
        switch (incidentType) {
            case 'Rape':
                return 'bg-red-100 border-red-400';
            case 'Neglect':
                return 'bg-yellow-100 border-yellow-400';
            case 'Physical Abuse':
                return 'bg-orange-100 border-orange-400';
            default:
                return 'bg-white border-gray-400'; // Default style
        }
    };


    const renderIncidentList = (
    title: string,
    incidents: Incident[],
    destination: string,
    setDestination: React.Dispatch<React.SetStateAction<Incident[]>>
) => (
    <div
        className={`max-h-[85vh] border overflow-auto rounded p-4 flex-1 min-h-[150px] transition-all ${isValidTarget(draggingSource, destination) ? 'bg-blue-100 border-blue-400' : 'bg-white border-red-400'}`}
        onDrop={(e) => handleDrop(e, destination, setDestination)}
        onDragOver={handleDragOver}
    >
        <h2 className='font-semibold mb-2'>{title}</h2>
        {incidents.length > 0 ? (
            incidents.slice().reverse().map((incident) => ( // Use slice() to avoid mutating the original array
                <div
                    key={incident.id}
                    className={`my-2 rounded cursor-pointer ${getIncidentColor(incident.formData?.incidenttype as IncidentType)}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, incident, destination)}
                    onDragEnd={handleDragEnd}
                >
                    <h3 className="font-semibold">{incident.title}</h3>
                    <div className={`text-xs text-gray-600 p-3 bg-white rounded border shadow ${getIncidentColor(incident.formData?.incidenttype as IncidentType)}`}>
                        {incident.formData && (
                            <div >
                                <div className='flex justify-between font-medium items-center'>
                                <p>INCIDENT ID: {incident.id.slice(0, 3)}{incident.id.slice(-3)}</p>
                                    <div className='flex items-center gap-5'>
                                        <button onClick={() => handleChat(incident.id)}>
                                            chat
                                        </button>
                                    </div>
                                </div>
                                <hr className='my-2' />
                                <p className="text-xs">Date: {new Date(incident.createdAt).toLocaleDateString()}</p>

                                <p className="text-xs">Reportee: {incident.formData?.reportee}</p>
                                <p className="text-xs">Contact: {incident.formData?.contact}</p>
                                <p className="text-xs">Child Name: {incident.formData?.name}</p>
                                <p className="text-xs">Address: {incident.formData?.address}</p>
                                <p className="text-xs">Incident Type: {incident.formData?.incidenttype}</p>
                                <p className="text-xs">Age: {incident.formData?.age}</p>
                            </div>
                        )}
                    </div>
                </div>
            ))
        ) : (
            <p>No incidents in this status</p>
        )}
    </div>
);

    return (
        <div className="flex">
            <div className="flex flex-1 space-x-4">
                {renderIncidentList('To Do', toDo, 'assigned', setToDo)}
                {renderIncidentList('Under Investigation', underInvestigation, 'Under Investigation', setUnderInvestigation)}
                {renderIncidentList('In Progress', inProgress, 'In Progress', setInProgress)}
                {renderIncidentList('Completed', completed, 'Completed', setCompleted)}
            </div>

            {isFirstModalOpen && (
                <div className="fixed inset-0 bg-gray-700 bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 overflow-auto max-h-[90vh]">
                        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
                            Incident Details
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Name of the Referring Party
                                </label>
                                <input
                                    type="text"
                                    name="userName"
                                    value={firstForm.userName}
                                    onChange={handleChange}
                                    placeholder="Enter name"
                                    className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    name="userAddress"
                                    value={firstForm.userAddress}
                                    onChange={handleChange}
                                    placeholder="Enter address"
                                    className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Contact Number
                                </label>
                                <input
                                    type="text"
                                    name="contactNumber"
                                    value={firstForm.contactNumber}
                                    onChange={handleChange}
                                    placeholder="Enter contact number"
                                    className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Referral Reason
                                </label>
                                <textarea
                                    name="referralReason"
                                    value={firstForm.referralReason}
                                    onChange={handleChange}
                                    placeholder="Enter reason for referral"
                                    className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Referral Date
                                </label>
                                <input
                                    type="date"
                                    name="referralDate"
                                    value={firstForm.referralDate}
                                    onChange={handleChange}
                                    className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Client Category
                                </label>
                                <select
                                    name="clientCategory"
                                    value={firstForm.clientCategory}
                                    onChange={handleChange}
                                    className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="Minor">Minor</option>
                                    
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Offense Date
                                </label>
                                <input
                                    type="date"
                                    name="offenseDate"
                                    value={firstForm.offenseDate}
                                    onChange={handleChange}
                                    className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Offense Place
                                </label>
                                <input
                                    type="text"
                                    name="offensePlace"
                                    value={firstForm.offensePlace}
                                    onChange={handleChange}
                                    placeholder="Enter offense place"
                                    className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Apprehension Date
                                </label>
                                <input
                                    type="date"
                                    name="apprehensionDate"
                                    value={firstForm.apprehensionDate}
                                    onChange={handleChange}
                                    className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Apprehension Place
                                </label>
                                <input
                                    type="text"
                                    name="apprehensionPlace"
                                    value={firstForm.apprehensionPlace}
                                    onChange={handleChange}
                                    placeholder="Enter apprehension place"
                                    className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Apprehended By
                                </label>
                                <input
                                    type="text"
                                    name="apprehendedBy"
                                    value={firstForm.apprehendedBy}
                                    onChange={handleChange}
                                    placeholder="Enter name of apprehender"
                                    className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Agency Address
                                </label>
                                <input
                                    type="text"
                                    name="agencyAddress"
                                    value={firstForm.agencyAddress}
                                    onChange={handleChange}
                                    placeholder="Enter agency address"
                                    className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Agency Contact
                                </label>
                                <input
                                    type="text"
                                    name="agencyContact"
                                    value={firstForm.agencyContact}
                                    onChange={handleChange}
                                    placeholder="Enter agency contact"
                                    className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 mt-8">
                            <button
                                onClick={handleFirstModalCancel}
                                className="py-2 px-6 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleFirstModalSave}
                                className="py-2 px-6 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {isSecondModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
                    <div className="max-h-[95vh] bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl overflow-auto">
                        {/* Initial Assessment and Recommendation Section */}
                        <div className="mb-8">
                            <h3 className="text-xl font-semibold mb-3 text-gray-700">IV. Problem Presented</h3>
                            <textarea
                                name="officerReport"
                                value={secondForm.officerReport}
                                onChange={handleChange}
                                className="w-full p-3 mb-4 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Law Enforcement Officer's Report"
                            />

                            <textarea
                                name="childVersion"
                                value={secondForm.childVersion}
                                onChange={handleChange}
                                className="w-full p-3 mb-4 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Child's Version"
                            />

                            <textarea
                                name="caseCircumstances"
                                value={secondForm.caseCircumstances}
                                onChange={handleChange}
                                className="w-full p-3 mb-4 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Circumstances of the Case"
                            />
                        </div>

                        {/* Modal Actions */}
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={handleSecondModalCancel}
                                className="py-2 px-4 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSecondModalSave()}
                                className="py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
                    <div className="max-h-[95vh] bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl overflow-auto">
                        {/* Initial Assessment and Recommendation Section */}
                        <div className="mb-8">
                            <h3 className="text-xl font-semibold mb-3 text-gray-700">V. Initial Assessment and Recommendation</h3>
                            <textarea
                                name="initialAssessment"
                                value={completeForm.initialAssessment}
                                onChange={handleChange}
                                className="w-full p-3 mb-4 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Enter initial assessment"
                            />
                        </div>

                        {/* Modal Actions */}
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={handleCancel}
                                className="py-2 px-4 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSave()}
                                className="py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignedIncidentPage;
