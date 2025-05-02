import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    limit,
} from 'firebase/firestore';
import { auth, db } from '@/firebase/firebase';
import { useUser } from '@/context/UserContext';
import CompletedModal from '@/components/CompletedModal';
import InProgressModal from '@/components/InProgressModal';
import * as XLSX from 'xlsx'; // Import the XLSX library

interface FamilyData {
    address: string;
    age: string;
    education: string;
    income: string;
    name: string;
    occupation: string;
    relationship: string;
    remarks: string;
    status: string;
}

interface FormData {
    address: string;
    age: string;
    alias: string;
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
}

interface HouseholdData {
    address: string;
    age: string;
    education: string;
    income: string;
    name: string;
    occupation: string;
    relationship: string;
    remarks: string;
    status: string;
}

interface Case {
    id: string;
    assigned: string;
    createdAt: Date;
    familyData: FamilyData[];
    fileUploads: string[];
    formData: FormData;
    householdData: HouseholdData[];
    status: string;
    type: string;
    uid: string;
}

const CaseProfilingPage: React.FC = () => {
    const { userType } = useUser();
    const [loading, setLoading] = useState(true);
    const [allCases, setAllCases] = useState<Case[]>([]);
    const [cases, setCases] = useState<Case[]>([]);
    const [search, setSearch] = useState('');
    const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
    const [modalType, setModalType] = useState<'completed' | 'inProgress' | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const casesPerPage = 5;
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                await router.push('/adminmodule/login');
            } else if (userType !== 'superadmin') {
                await signOut(auth);
                await router.push('/adminmodule/login');
            } else {
                setLoading(false);
                fetchCases();
            }
        });

        return () => unsubscribe();
    }, [router, userType]);

    const fetchCases = async () => {
        setLoading(true);
        try {
            const casesQuery = query(
                collection(db, 'users'),
                where('type', '==', 'client'),
                orderBy('createdAt', 'desc'),
                limit(100) // Fetch a maximum of 50 records
            );

            const querySnapshot = await getDocs(casesQuery);
            const casesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Case[];
            setAllCases(casesData);
            setCases(casesData);
        } catch (error) {
            console.error('Error fetching cases:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    };

    useEffect(() => {
        const filteredCases = allCases.filter(caseItem =>
            caseItem.formData.name.toLowerCase().includes(search.toLowerCase()) ||
            caseItem.formData.incidenttype.toLowerCase().includes(search.toLowerCase())
        );
        setCases(filteredCases);
        setCurrentPage(1);  // Reset to the first page on a new search
    }, [search, allCases]);

    const handlePrintReport = (caseItem: Case) => {
        setSelectedCaseId(caseItem.id);
        setModalType(caseItem.status === 'Completed' ? 'completed' : 'inProgress');
    };

    const closeModal = () => {
        setSelectedCaseId(null);
        setModalType(null);
    };

    const paginateCases = () => {
        const sortedCases = [...cases].sort((a, b) => {
            if (a.formData.incidenttype === 'Physical Abuse' && b.formData.incidenttype !== 'Physical Abuse') {
                return -1; 
            }
            if (b.formData.incidenttype === 'Physical Abuse' && a.formData.incidenttype !== 'Physical Abuse') {
                return 1;
            }
    
            if (a.formData.incidenttype === 'Neglect' && b.formData.incidenttype !== 'Neglect') {
                return 1; 
            }
            if (b.formData.incidenttype === 'Neglect' && a.formData.incidenttype !== 'Neglect') {
                return -1; 
            }
            
            if (a.formData.incidenttype === 'Physical Abuse' && b.formData.incidenttype === 'Physical Abuse') {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
    
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    
        const start = (currentPage - 1) * casesPerPage;
        const end = start + casesPerPage;
        return sortedCases.slice(start, end);
    };
    const totalPages = Math.ceil(cases.length / casesPerPage);

    // Excel Generation Function with Auto-adjusting Column Widths
    const generateExcel = () => {
        const dataForExcel = cases.map((caseItem) => ({
            'Case ID': caseItem.id,
            'Name': caseItem.formData.name,
            'Alias': caseItem.formData.alias,
            'Age': caseItem.formData.age,
            'Incident Type': caseItem.formData.incidenttype,
            'Date': new Date(caseItem.createdAt).toLocaleDateString(),
            'Assigned': caseItem.assigned,
            'Civil Status': caseItem.formData.civilStatus,
            'Contact': caseItem.formData.contact,
            'Place of Birth': caseItem.formData.pbirth,
            'Date of Birth': caseItem.formData.dbirth,
            'Religion': caseItem.formData.religion,
            'Disability': caseItem.formData.disability,
            'Marks': caseItem.formData.marks,
            'Address': caseItem.formData.address,
            'Permanent Address': caseItem.formData.paddress,
            'Educational Attainment': caseItem.formData.edattainment,
            'School Attended': caseItem.formData.sattended,
            'School Address': caseItem.formData.saddress,
            'Sex': caseItem.formData.sex,
        }));

        const ws = XLSX.utils.json_to_sheet(dataForExcel); // Converts data to sheet format

        // Auto-adjust column widths based on the longest content in each column
        const columnWidths = dataForExcel.reduce((acc: Record<string, number>, row) => {
            Object.entries(row).forEach(([key, value]) => {
                const currentLength = value ? String(value).length : 0;
                const currentMaxLength = acc[key] || 0;
                acc[key] = Math.max(currentMaxLength, currentLength);
            });
            return acc;
        }, {});

        // Format column widths
        const wscols = Object.values(columnWidths).map(length => ({ wch: length + 2 }));

        ws['!cols'] = wscols;  // Apply to sheet

        const wb = XLSX.utils.book_new(); // Create a new workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Cases'); // Add the sheet to the workbook
        XLSX.writeFile(wb, 'cases_report.xlsx'); // Download the workbook as a file
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div className="p-10  bg-white shadow-lg rounded-lg">
            <h1 className="text-lg font-bold mb-4">Case Profiling</h1>

            <div className="flex justify-between">
                <input
                    type="text"
                    placeholder="Search by name..."
                    value={search}
                    onChange={handleSearchChange}
                    className="border border-gray-300 rounded-lg p-2 w-80 mb-5 text-sm"
                />

                <button
                    onClick={generateExcel}
                    className="bg-green-500 text-white px-4 py-2 rounded-md mb-5 hover:bg-green-600"
                >
                    Generate Excel Report
                </button>
            </div>
            <table className="w-full border-collapse border-gray-300 text-sm">
                <thead className="bg-gray-200">
                    <tr>
                        <th className="border p-3 text-left">Case ID</th>
                        <th className="border p-3 text-left">Name</th>
                        <th className="border p-3 text-left">Incident Type</th>
                        <th className="border p-3 text-left">Date</th>
                        <th className="border p-3 text-left">Status</th>
                        <th className="border p-3 text-left">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {paginateCases().map(caseItem => (
                        <tr key={caseItem.id} className="hover:bg-gray-100">
                            <td className="border-b p-3">{caseItem.id}</td>
                            <td className="border-b p-3">{caseItem.formData.name}</td>
                            <td className="p-4">
                                <div
                                    className={`rounded py-2 px-3 font-medium text-white ${caseItem.formData.incidenttype === 'Neglect'
                                        ? 'bg-yellow-500'
                                        : caseItem.formData.incidenttype === 'Rape'
                                            ? 'bg-red-500'
                                            : caseItem.formData.incidenttype === 'Physical Abuse'
                                                ? 'bg-orange-500'
                                                : ''
                                        }`}
                                >
                                    {caseItem.formData.incidenttype}
                                </div>
                            </td>
                            <td className="border-b p-3">{new Date(caseItem.createdAt).toLocaleDateString()}</td>
                            <td className="border-b p-3">{caseItem.status}</td>
                            <td className="border-b p-3">
                                <button
                                    onClick={() => handlePrintReport(caseItem)}
                                    className="bg-blue-500 text-white px-4 py-2 rounded transition duration-200 hover:bg-blue-600"
                                >
                                    Print Report
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="mt-4 flex items-center justify-between">
                <span>
                    Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center space-x-2">
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

            {modalType === 'completed' && selectedCaseId && (
                <CompletedModal caseId={selectedCaseId} onClose={closeModal} />
            )}
            {modalType === 'inProgress' && selectedCaseId && (
                <InProgressModal caseId={selectedCaseId} onClose={closeModal} />
            )}
        </div>
    );
};

export default CaseProfilingPage;
