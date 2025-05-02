import React, { useEffect, useState } from 'react';
import { db } from '@/firebase/firebase'; // Adjust the path based on your project structure
import { doc, getDoc } from 'firebase/firestore';

interface InProgressModalProps {
    caseId: string;
    onClose: () => void;
}

const InProgressModal: React.FC<InProgressModalProps> = ({ caseId, onClose }) => {
    const [userData, setUserData] = useState<any>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userRef = doc(db, 'users', caseId);
                const docSnap = await getDoc(userRef);

                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        fetchUserData();
    }, [caseId]);

    const handlePrint = () => {
        const content = document.getElementById('firstpage');
        if (content) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Print Report</title>
                            <style>
                                @font-face {
                                    font-family: 'Helixa';
                                    src: url('/fonts/Helixa-Regular.ttf') format('truetype');
                                    font-weight: normal;
                                    font-style: normal;
                                }
                                body { font-family: 'Helixa'; margin: 20px; }
                                img { height: 50px; }
                                .text-xs { font-size: 12px; }
                                .text-md { font-size: 16px; font-weight: bold; }
                                .p-1 { padding: 4px; }
                                .p-5 { padding: 20px; }
                                .mr-3 { margin-right: 15px; }
                                .p-14 { padding: 56px; }
                                .w-full { width: 100%; }
                                .text-center { text-align: center; }
                                .flex { display: flex !important; }
                                .justify-between { justify-content: space-between !important; }
                                .items-center { align-items: center !important; }
                                table { width: 100%; border-collapse: collapse; }
                                th, td { border: 1px solid black; padding: 4px; text-align: left; }
                                th { font-weight: bold; }
                            </style>
                        </head>
                        <body onload="window.print(); window.close();">
                            ${content.innerHTML}
                        </body>
                    </html>
                `);
                
                printWindow.document.close();
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded shadow-lg max-h-[95vh] overflow-x-auto">
                <div className='flex justify-between w-full items-center'>
                    <h2 className="text-xl font-semibold">Report In Progress</h2>
                    <div className='flex gap-4'>
                        <button onClick={handlePrint} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Print Report</button>
                        <button onClick={onClose}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z" fill="black" />
                            </svg>
                        </button>
                    </div>
                </div>
                <hr className='my-3' />
                <div id='firstpage' className='w-[637px] h-[975px] border rounded-md p-14'>
                    {/* header */}
                    <div className='flex justify-between items-center'>
                        <div>
                            <p className='text-xs '>Republic of the Philippines</p>
                            <p className='text-xs '>Province of Pangasinan</p>
                            <p>MUNICIPALITY OF BANI</p>
                        </div>
                        <img className='h-10' src="/images/bani.png" alt="logo" />
                    </div>

                    <div className='w-full text-center text-md mt-2'>MUNICIPAL SOCIAL WELFARE AND DEVELOPMENT OFFICE</div>
                    <div className='w-full text-center text-xs font-medium'>INTAKE SHEET</div>
                    <div className='w-full text-center text-xs font-medium'>(Child At Risk)</div>

                    <div className='mt-3'>
                        <div className='text-xs'>
                            <p>&ensp; I. &ensp; Identifying Data of the Child</p>
                            <div className='flex'>
                                <p className='mr-3'>&ensp; &ensp; &ensp;Name: <u>{userData?.formData?.name || 'N/A'}</u></p>
                                <p>Alias, if any: <u>{userData?.formData?.alias || 'N/A'}</u></p>
                            </div>
                            <div className='flex'>
                                <p className='mr-3'>&ensp; &ensp; &ensp;Sex: <u>{userData?.formData?.sex || 'N/A'}</u></p>
                                <p className='mr-3'>Age: <u>{userData?.formData?.age || 'N/A'}</u></p>
                                <p className='mr-3'>Civil Status: <u>{userData?.formData?.civilStatus || 'N/A'}</u></p>
                                <p className='mr-3'>Date of Birth: <u>{userData?.formData?.dbirth || 'N/A'}</u></p>
                            </div>
                            <div className='flex'>
                                <p className='mr-3'>&ensp; &ensp; &ensp;Physical Disability (If any): <u>{userData?.formData?.disability || 'N/A'}</u></p>
                            </div>
                            <div className='flex'>
                                <p className='mr-3'>&ensp; &ensp; &ensp;Identifying marks (If any): <u>{userData?.formData?.marks || 'N/A'}</u></p>
                            </div>
                            <div className='flex'>
                                <p className='mr-3'>&ensp; &ensp; &ensp;Present Address: <u>{userData?.formData?.paddress || 'N/A'}</u></p>
                            </div>
                            <div className='flex'>
                                <p className='mr-3'>&ensp; &ensp; &ensp;Highest Educational Attainment: <u>{userData?.formData?.edattainment || 'N/A'}</u></p>
                            </div>
                            <div className='flex'>
                                <p className='mr-3'>&ensp; &ensp; &ensp;Last School attended: <u>{userData?.formData?.sattended || 'N/A'}</u></p>
                            </div>
                            <div className='flex'>
                                <p className='mr-3'>&ensp; &ensp; &ensp;Date/Year: <u>{userData?.formData?.dbirth ? userData.formData.dbirth.split('-')[0] : 'N/A'}</u></p>
                                <p className='mr-3'>Status: <u>{userData?.formData?.status || 'N/A'}</u></p>
                                <p className='mr-3'>In School: <u>{userData?.formData?.status === 'In School' ? 'Yes' : 'No'}</u></p>
                                <p className='mr-3'>Out of School: <u>{userData?.formData?.status === 'Out of School' ? 'Yes' : 'No'}</u></p>
                            </div>
                            <p className='mt-3'>&ensp; II. &ensp; Family Composition</p>
                        </div>
                        <div className='text-xs'>
                            <p> &ensp; &ensp; &ensp; A. &ensp; Immediate Family</p>
                            <table>
                                <thead>
                                    <tr>
                                        <th className='border border-black p-1'>Name</th>
                                        <th className='border border-black p-1'>Age</th>
                                        <th className='border border-black p-1'>Relationship to the Child</th>
                                        <th className='border border-black p-1'>Civil Status</th>
                                        <th className='border border-black p-1'>Address</th>
                                        <th className='border border-black p-1'>Educational Attainment</th>
                                        <th className='border border-black p-1'>Occupation</th>
                                        <th className='border border-black p-1'>Monthly Income</th>
                                        <th className='border border-black p-1'>Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userData?.familyData && userData.familyData.length > 0 ? (
                                        userData.familyData.map((member: any, index: number) => (
                                            <tr key={index}>
                                                <td className='border border-black p-1'>{member.name || 'N/A'}</td>
                                                <td className='border border-black p-1'>{member.age || 'N/A'}</td>
                                                <td className='border border-black p-1'>{member.relationship || 'N/A'}</td>
                                                <td className='border border-black p-1'>{member.status || 'N/A'}</td>
                                                <td className='border border-black p-1'>{member.address || 'N/A'}</td>
                                                <td className='border border-black p-1'>{member.education || 'N/A'}</td>
                                                <td className='border border-black p-1'>{member.occupation || 'N/A'}</td>
                                                <td className='border border-black p-1'>{member.income || 'N/A'}</td>
                                                <td className='border border-black p-1'>{member.remarks || 'N/A'}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td className='border border-black p-1 text-center' colSpan={5}>No immediate family members found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            <p className='mt-3'>&ensp; &ensp; &ensp; B. &ensp; Extended Family</p>
                            <table>
                                <thead>
                                    <tr>
                                    <th className='border border-black p-1'>Name</th>
                                        <th className='border border-black p-1'>Age</th>
                                        <th className='border border-black p-1'>Relationship to the Child</th>
                                        <th className='border border-black p-1'>Civil Status</th>
                                        <th className='border border-black p-1'>Address</th>
                                        <th className='border border-black p-1'>Educational Attainment</th>
                                        <th className='border border-black p-1'>Occupation</th>
                                        <th className='border border-black p-1'>Monthly Income</th>
                                        <th className='border border-black p-1'>Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userData?.householdData&& userData.householdData.length > 0 ? (
                                        userData.householdData.map((member: any, index: number) => (
                                            <tr key={index}>
                                                <td className='border border-black p-1'>{member.name || 'N/A'}</td>
                                                <td className='border border-black p-1'>{member.age || 'N/A'}</td>
                                                <td className='border border-black p-1'>{member.relationship || 'N/A'}</td>
                                                <td className='border border-black p-1'>{member.status || 'N/A'}</td>
                                                <td className='border border-black p-1'>{member.address || 'N/A'}</td>
                                                <td className='border border-black p-1'>{member.education || 'N/A'}</td>
                                                <td className='border border-black p-1'>{member.occupation || 'N/A'}</td>
                                                <td className='border border-black p-1'>{member.income || 'N/A'}</td>
                                                <td className='border border-black p-1'>{member.remarks || 'N/A'}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td className='border border-black p-1 text-center' colSpan={5}>No extended family members found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InProgressModal;
