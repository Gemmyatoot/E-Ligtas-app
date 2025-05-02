import React, { useEffect, useState } from 'react';
import { db } from '@/firebase/firebase'; // Adjust the path based on your project structure
import { doc, getDoc } from 'firebase/firestore';
import dynamic from 'next/dynamic';

// Dynamically import 'html2pdf.js' only on the client side
const html2pdf = dynamic(() => import('html2pdf.js').then(mod => mod.default), { ssr: false });

interface InProgressModalProps {
    caseId: string;
    onClose: () => void;
}

const CompletedModal: React.FC<InProgressModalProps> = ({ caseId, onClose }) => {
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
        // Grab content from all three pages
        const firstPageContent = document.getElementById('firstpage')?.innerHTML || '';
        const secondPageContent = document.getElementById('secondpage')?.innerHTML || '';
        const thirdPageContent = document.getElementById('thirdpage')?.innerHTML || '';

        const allContent = `
            <div class="page">${firstPageContent}</div>
            <div class="page">${secondPageContent}</div>
            <div class="page">${thirdPageContent}</div>
        `;

        if (allContent) {
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
    
                                /* Ensure each .page is treated as a full page */
                                .page {
                                    page-break-after: always;
                                    margin-bottom: 40px;
                                }
    
                                /* Disable page-break within elements */
                                .page * {
                                    page-break-inside: avoid;
                                }
    
                                @media print {
                                    /* Ensure page-breaks are only after full sections */
                                    .page { page-break-after: always; }
                                    .page:last-child { page-break-after: auto; }
                                }
                            </style>
                        </head>
                        <body onload="window.print(); window.close();">
                            ${allContent}
                        </body>
                    </html>
                `);
                printWindow.document.close();
            }
        }
    };

    const handleExportPDF = async () => {
        if (typeof window !== 'undefined') {
            try {
                // Dynamically import html2pdf only when needed
                const html2pdf = (await import('html2pdf.js')).default;
                
                const firstPage = document.getElementById('firstpage');
                const secondPage = document.getElementById('secondpage');
                const thirdPage = document.getElementById('thirdpage');
                
                const opt = {
                    margin: 1,
                    filename: `report_${caseId}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
                };

                const content = document.createElement('div');
                if (firstPage) content.appendChild(firstPage.cloneNode(true));
                if (secondPage) content.appendChild(secondPage.cloneNode(true));
                if (thirdPage) content.appendChild(thirdPage.cloneNode(true));

                if (content.hasChildNodes()) {
                    html2pdf().set(opt).from(content).save();
                }
            } catch (error) {
                console.error('Error generating PDF:', error);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded shadow-lg max-h-[95vh] overflow-x-auto">
                <div className='flex justify-between w-full items-center'>
                    <h2 className="text-xl font-semibold">Report Completed</h2>
                    <div className='flex gap-4'>
                        <button onClick={handlePrint} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Print Report</button>

                        <button onClick={handleExportPDF} className="mt-4 px-4 py-2 bg-green-500 text-white rounded">Export as PDF</button>
                        <button onClick={onClose}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z" fill="black" />
                            </svg>
                        </button>
                    </div>
                </div>
                <hr className='my-3' />
                <div id='firstpage' className='w-[637px] h-[800px] p-14'>
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
                            <p className='mb-2'> &ensp; &ensp; &ensp; A. &ensp; Immediate Family</p>
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
                            <p className='mt-3 mb-2' >&ensp; &ensp; &ensp; B. &ensp; Extended Family</p>
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
                                    {userData?.householdData && userData.householdData.length > 0 ? (
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

                <hr className='my-3' />
                <div id='secondpage' className='w-[637px] h-[870px] p-14 !text-xs'>
                    {/* header */}
                    <div className='flex justify-between items-center'>
                        <div>
                            <p className='text-xs '>Republic of the Philippines</p>
                            <p className='text-xs '>Province of Pangasinan</p>
                            <p>MUNICIPALITY OF BANI</p>
                        </div>
                        <img className='h-10' src="/images/bani.png" alt="logo" />
                    </div>

                    <div className='mt-3'>
                        <div className='text-xs'>
                            <p>&ensp; III. &ensp; Circumstances of Referral</p>
                            <p>&ensp; (Information could be obtained from the law enforcement officer or accompanying party)</p>

                            <div className="flex ml-6">
                                <p className="mr-3">Name of the Referring Party:</p>
                                <p className="underline">{userData?.firstForm?.userName || 'N/A'}</p>
                            </div>

                            {/* Address */}
                            <div className="flex ml-6">
                                <p className="mr-3">Address:</p>
                                <p className="underline">{userData?.firstForm?.userAddress || 'N/A'}</p>
                            </div>

                            {/* Contact Number */}
                            <div className="flex ml-6">
                                <p className="mr-3">Contact Number:</p>
                                <p className="underline">{userData?.firstForm?.contactNumber || 'N/A'}</p>
                            </div>

                            {/* Reason for Referral */}
                            <div className="flex ml-6">
                                <p className="mr-3">Reason's for Referral:</p>
                                <p className="underline">{userData?.firstForm?.referralReason || 'N/A'}</p>
                            </div>

                            {/* Date of Referral */}
                            <div className="flex ml-6">
                                <p className="mr-3">Date of Referral:</p>
                                <p className="underline">{userData?.firstForm?.referralDate || 'N/A'}</p>
                            </div>

                            {/* Client Category */}
                            <div className="flex ml-6">
                                <p className="mr-3">Client Category:</p>
                                <p className="underline">{userData?.firstForm?.clientCategory || 'N/A'}</p>
                            </div>

                            {/* Offense Date and Place */}
                            <div className="flex ml-6">
                                <p className="mr-3">Date of Offense:</p>
                                <p className="underline">{userData?.firstForm?.offenseDate || 'N/A'}</p>
                                <p className="mr-3 ml-6">Place of Offense:</p>
                                <p className="underline">{userData?.firstForm?.offensePlace || 'N/A'}</p>
                            </div>

                            {/* Apprehension Date */}
                            <div className="flex ml-6">
                                <p className="mr-3">Date of Apprehension:</p>
                                <p className="underline">{userData?.firstForm?.apprehensionDate || 'N/A'}</p>
                            </div>

                            {/* Apprehension Place */}
                            <div className="flex ml-6">
                                <p className="mr-3">Place of Apprehension:</p>
                                <p className="underline">{userData?.firstForm?.apprehensionPlace || 'N/A'}</p>
                            </div>

                            {/* Apprehended by */}
                            <div className="flex ml-6">
                                <p className="mr-3">Apprehended by:</p>
                                <p className="underline">{userData?.firstForm?.apprehendedBy || 'N/A'}</p>
                            </div>

                            {/* Agency Address */}
                            <div className="flex ml-6">
                                <p className="mr-3">Agency/Address:</p>
                                <p className="underline">{userData?.firstForm?.agencyAddress || 'N/A'}</p>
                            </div>

                            {/* Agency Contact Number */}
                            <div className="flex ml-6">
                                <p className="mr-3">Agency Contact Number:</p>
                                <p className="underline">{userData?.firstForm?.agencyContact || 'N/A'}</p>
                            </div>

                            {/* Problem Presented Section */}

                            <p className="font-semibold">IV. Problem Presented</p>

                            {/* Law Enforcement Report */}
                            <div className="ml-6">
                                <p>A. Law Enforcement Report</p>
                                <p className="underline mb-4">{userData?.firstForm?.officerReport || 'N/A'}</p>
                            </div>

                            {/* Child's Version */}
                            <div className="ml-6">
                                <p>B. Child's Version</p>
                                <p className="underline mb-4">{userData?.firstForm?.childVersion || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <hr className='my-3' />
                <div id='thirdpage' className='w-[637px] h-[800px] p-14 text-xs'>
                    {/* header */}
                    <div className='flex justify-between items-center'>
                        <div>
                            <p className='text-xs '>Republic of the Philippines</p>
                            <p className='text-xs '>Province of Pangasinan</p>
                            <p>MUNICIPALITY OF BANI</p>
                        </div>
                        <img className='h-10' src="/images/bani.png" alt="logo" />
                    </div>

                    <div className='mt-3'>
                        <p>&ensp; &ensp;  &ensp; C. &ensp; Circumstances of the Case</p>
                        <p className='my-3'><u>{userData?.secondForm?.caseCircumstances || 'N/A'} </u></p>
                        <p>&ensp; V. &ensp; Initial Assessment and Recommendation</p>
                        <p className='my-3'><u>{userData?.completeForm?.initialAssessment || 'N/A'} </u></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompletedModal;
