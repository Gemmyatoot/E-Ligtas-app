import React, { useState, useEffect, useRef } from 'react';
import Modal from "@/components/Modal";
import InputField from "@/components/inputs/InputField";
import Dropdown from '@/components/inputs/Dropdown';
import DateInputField from './inputs/Date';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/router';
import { useUser } from '@/context/UserContext';

interface ReportIncidentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ReportIncidentModal({ isOpen, onClose }: ReportIncidentModalProps) {
    const [formData, setFormData] = useState({
        reportee: "",
        reporteeaddress: "",
        name: "",
        alias: "",
        age: "",
        contact: "",
        incidenttype: "",
        pbirth: "",
        dbirth: "",
        religion: "",
        disability: "",
        marks: "",
        address: "",
        paddress: "",
        edattainment: "",
        sattended: "",
        saddress: "",
        sex: "",
        civilStatus: "",
        is_firstLogin: ""
    });

    const [errors, setErrors] = useState<any>({});
    const router = useRouter();
    const { setUserType } = useUser();
    const [familyData, setFamilyData] = useState([{ name: '', age: '', relationship: '', status: '', address: '', education: '', occupation: '', income: '', remarks: '' }]);
    const [householdData, setHouseholdData] = useState([{ name: '', age: '', relationship: '', status: '', address: '', education: '', occupation: '', income: '', remarks: '' }]);
    const [files, setFiles] = useState<File[]>([]);
    const [barangayOptions, setBarangayOptions] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        fetch('/barangay.json')
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data.barangays)) {
                    setBarangayOptions(data.barangays);
                } else {
                    console.error("Data loaded is not an array:", data.barangays);
                }
            })
            .catch(error => console.error('Error loading barangays:', error));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleDropdownChange = (name: string, value: string) => {
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleTableChange = (index: number, e: React.ChangeEvent<HTMLInputElement>, dataSetter: React.Dispatch<React.SetStateAction<typeof familyData>>, currentData: typeof familyData) => {
        const { name, value } = e.target;
        const updatedData = [...currentData];
        updatedData[index] = { ...updatedData[index], [name]: value };
        dataSetter(updatedData);
    };

    const addRow = (dataSetter: React.Dispatch<React.SetStateAction<typeof familyData>>) => {
        dataSetter((prevData) => [...prevData, { name: '', age: '', relationship: '', status: '', address: '', education: '', occupation: '', income: '', remarks: '' }]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
    };

    const removeFile = (index: number) => {
        setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    };

    const validateForm = () => {
        const errors: any = {};
        const { reportee, contact, name, incidenttype, sex, age, civilStatus, sattended, address } = formData;

        if (!reportee) errors.reportee = "Reportee Name is required";
        if (!contact || contact.length !== 11) errors.contact = "Mobile Number is required and must be 10 digits";
        if (!name) errors.name = "Child's Name is required";
        if (!incidenttype) errors.incidenttype = "Incident Type is required";
        if (!sex) errors.sex = "Sex is required";
        if (!age || Number(age) < 1 || Number(age) > 18) {
            errors.age = "Age is required and victim must be 18 years old below";
        }
        if (!address) errors.address = "Address is required";


        return errors;
    };

    const handleSubmit = async () => {
        setLoading(true);
        const errors = validateForm();
        setErrors(errors);

        if (Object.keys(errors).length > 0) {
            setLoading(false);
            return;
        }

        try {
            const auth = getAuth();
            const firestore = getFirestore();
            const storage = getStorage();
            const { user } = await signInAnonymously(auth);
        
            const fileUploads = await Promise.all(files.map(async (file) => {
                const storageRef = ref(storage, `users/${user.uid}/${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
            
                // Get the file's public URL
                const fileUrl = await getDownloadURL(snapshot.ref);
            
                return fileUrl;  // Return the URL instead of the file path
            }));            
        
            setUserType('client');
        
            // Save user data to Firestore
            await setDoc(doc(firestore, "users", user.uid), {
                uid: user.uid,
                status: 'review',
                assigned: '',
                type: 'client',
                createdAt: Date.now(),
                formData,
                familyData,
                householdData,
                fileUploads,
                is_firstLogin: true,
            });
        
            // Extract the first and last 3 characters from user.uid
            const start = user.uid.slice(0, 3); // First 3 characters
            const end = user.uid.slice(-3);     // Last 3 characters
            const transactionId = start + end;  // Combine them to form the transaction ID
        
            // Set session data with the transactionId as the ID
            const sessionData = { uuid: user.uid, type: 'client', id: transactionId };
            sessionStorage.setItem('userSession', JSON.stringify(sessionData));
        
            // Redirect to the user's report page
            router.push("/client/myreport");
        
            // Close the modal
            onClose();
        } catch (error) {
            console.error("Error reporting incident:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} >
            <h2 className="text-lg font-semibold">Report New Incident</h2>
            <p className="mb-4 text-xs">Fill all the input below to report an Incident.</p>

            <h1 className="mb-2 text-[14px] font-medium">Reportee Information</h1>

            <div className="mb-4 flex space-x-4">  { }
                <div className="flex-1">  { }
                    <InputField
                        label="Name of Reportee"
                        type="text"
                        name="reportee"
                        value={formData.reportee}
                        onChange={handleChange}
                        required
                    />
                    {errors.reportee && <div className="text-red-500 text-[10px] mt-[-10px] ml-[2px]">{errors.reportee}</div>}
                </div>

                <div className="flex-1">  { }
                    <InputField
                        label="Mobile Number"
                        type="number"
                        name="contact"
                        value={formData.contact}
                        onChange={handleChange}
                        required
                    />
                    {errors.contact && <div className="text-red-500 text-[10px] mt-[-10px] ml-[2px]">{errors.contact}</div>}
                </div>

                <div className="flex-1 ">
                    <Dropdown
                        label="Address of Reportee"
                        options={barangayOptions}
                        value={formData.reporteeaddress}
                        onChange={(value) => handleDropdownChange("reporteeaddress", value)}
                        required
                    />
                    {errors.reporteeaddress && <div className="text-red-500 text-[10px] mt-[-10px] ml-[2px]">{errors.reporteeaddress}</div>}
                </div>
            </div>

            <h1 className="mb-2 text-[14px] font-medium">I. Identifying Data of the Child</h1>

            <div className="mb-4 flex space-x-4">  { }
                <div className="flex-1">  { }
                    <InputField label="Name" type="text" name="name" value={formData.name} onChange={handleChange} required />
                    {errors.name && <div className="text-red-500 text-[10px] mt-[-10px] ml-[2px]">{errors.name}</div>}
                </div>

                <div className="flex-1 ">
                    <InputField label="Alias, if any" type="text" name="alias" value={formData.alias} onChange={handleChange} />
                    {errors.alias && <div className="text-red-500 text-[10px] mt-[-10px] ml-[2px]">{errors.alias}</div>}
                </div>
            </div>


            <div className="mb-4 flex space-x-4">  { }
                <div className="flex-1">  { }
                    <Dropdown
                        label="Incident Type"
                        options={["Neglect", "Physical Abuse", "Rape"]}
                        value={formData.incidenttype}
                        onChange={(value) => handleDropdownChange("incidenttype", value)}
                        required
                    />
                    {errors.incidenttype && <div className="text-red-500 text-[10px] mt-[-10px] ml-[2px]">{errors.incidenttype}</div>}
                </div>

                <div className="flex-1">  { }
                    <Dropdown
                        label="Sex"
                        options={["Male", "Female"]}
                        value={formData.sex}
                        onChange={(value) => handleDropdownChange("sex", value)}
                        required
                    />
                    {errors.sex && <div className="text-red-500 text-[10px] mt-[-10px] ml-[2px]">{errors.sex}</div>}
                </div>
            </div>

            <div className="mb-4 flex space-x-4">  { }
                <div className="flex-1">  { }

                    <InputField label="Age" type="number" name="age" value={formData.age} onChange={handleChange} required />
                    {errors.age && <div className="text-red-500 text-[10px] mt-[-10px] ml-[2px]">{errors.age}</div>}
                </div>

                <div className="flex-1">  { }
                    <Dropdown
                        label="Civil Status"
                        options={["Single"]}
                        value={formData.civilStatus}
                        onChange={(value) => handleDropdownChange("civilStatus", value)}
                        
                    />
                    {errors.civilStatus && <div className="text-red-500 text-[10px] mt-[-10px] ml-[2px]">{errors.civilStatus}</div>}
                </div>
            </div>

            <div className="mb-4 flex space-x-4">  { }
                <div className="flex-1">  { }
                    <InputField label="Place of Birth" type="text" name="pbirth" value={formData.pbirth} onChange={handleChange} />
                    {errors.pbirth && <div className="text-red-500 text-[10px] mt-[-10px] ml-[2px]">{errors.pbirth}</div>}
                </div>

                <div className="flex-1 mt-[-1px]">  { }
                    <DateInputField label="Date of Birth" name="dbirth" value={formData.dbirth} onChange={handleChange} />
                    {errors.dbirth && <div className="text-red-500 text-[10px] mt-[-10px] ml-[2px]">{errors.dbirth}</div>}
                </div>
            </div>

            <div className="mb-4 flex space-x-4">  { }
                <div className="flex-1">  { }
                    <InputField label="Religious Affiliation" type="text" name="religion" value={formData.religion} onChange={handleChange} />
                    {errors.religion && <div className="text-red-500 text-[10px] mt-[-10px] ml-[2px]">{errors.religion}</div>}
                </div>

                <div className="flex-1">  { }
                    <InputField label="Physical Disability, if any" type="text" name="disability" value={formData.disability} onChange={handleChange} />
                    {errors.disability && <div className="text-red-500 text-[10px] mt-[-10px] ml-[2px]">{errors.disability}</div>}
                </div>
            </div>

            <div className="mb-4 flex space-x-4">  { }
                <div className="flex-1">  { }
                    <InputField label="Identifying Marks, if any" type="text" name="marks" value={formData.marks} onChange={handleChange} />
                    {errors.marks && <div className="text-red-500 text-[10px] mt-[-10px] ml-[2px]">{errors.marks}</div>}
                </div>

                <div className="flex-1">  { }
                    <Dropdown
                        label="Present Address (Barangay)"
                        options={barangayOptions}
                        value={formData.address}
                        onChange={(value) => handleDropdownChange("address", value)}
                        required
                    />
                    {errors.address && <div className="text-red-500 text-[10px] mt-[-10px] ml-[2px]">{errors.address}</div>}
                </div>
            </div>

            <div className="mb-4 flex space-x-4">  { }
                <div className="flex-1">  { }
                    <InputField label="Provincial Address" type="text" name="paddress" value={formData.paddress} onChange={handleChange} />
                    {errors.paddress && <div className="text-red-500 text-[10px] mt-[-10px] ml-[2px]">{errors.paddress}</div>}
                </div>

                <div className="flex-1">  { }
                    <InputField label="Highest Educational Attainment" type="text" name="edattainment" value={formData.edattainment} onChange={handleChange} />
                </div>
            </div>

            <div className="mb-4 flex space-x-4">  { }
                <div className="flex-1">  { }
                    <InputField label="Last school attended" type="text" name="sattended" value={formData.sattended} onChange={handleChange} />
                    {errors.sattended && <div className="text-red-500 text-[10px] mt-[-10px] ml-[2px]">{errors.sattended}</div>}
                </div>

                <div className="flex-1">  { }

                    <InputField label="Address of School" type="text" name="saddress" value={formData.saddress} onChange={handleChange} />
                    {errors.saddress && <div className="text-red-500 text-[10px] mt-[-10px] ml-[2px]">{errors.saddress}</div>}
                </div>
            </div>


            <h1 className="mb-2 text-[14px] font-medium">II. Family Composition</h1>
            <h1 className="mb-2 text-[14px] font-medium">A. Immediate Family</h1>

            <table className="w-full mb-5 border">
                <thead>
                    <tr className="bg-slate-200">
                        {['Name', 'Age', 'Relationship', 'Status', 'Address', 'Education', 'Occupation', 'Income', 'Remarks'].map((header) => (
                            <th key={header} className="px-4 py-2">{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {familyData.map((row, index) => (
                        <tr key={index}>
                            {Object.keys(row).map((key) => (
                                <td key={key} className="border">
                                    <input
                                        type="text"
                                        name={key}
                                        value={row[key as keyof typeof row]}
                                        onChange={(e) => handleTableChange(index, e, setFamilyData, familyData)}
                                        className="border-none p-1"
                                        required={key === 'name'}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            <button onClick={() => addRow(setFamilyData)} className="bg-blue-500 text-sm mb-3 text-white rounded px-2 py-1 w-21 mt-2">Add Family Member</button>

            <h1 className='mb-2 text-[14px] font-medium'>B. Household Composition</h1>
            <table className="w-full mb-5 border">
                <thead>
                    <tr className="bg-slate-200">
                        {['Name', 'Age', 'Relationship', 'Status', 'Address', 'Education', 'Occupation', 'Income', 'Remarks'].map((header) => (
                            <th key={header} className="px-4 py-2">{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {householdData.map((row, index) => (
                        <tr key={index}>
                            {Object.keys(row).map((key) => (
                                <td key={key}>
                                    <input
                                        type="text"
                                        name={key}
                                        value={row[key as keyof typeof row]}
                                        onChange={(e) => handleTableChange(index, e, setHouseholdData, householdData)}
                                        className="border p-1"
                                        required={key === 'name'}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            <button onClick={() => addRow(setHouseholdData)} className="bg-blue-500 text-sm text-white rounded px-2 py-1 mt-2">Add Household Member</button>
            
            <div>
                { }
                <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    ref={fileInputRef}
                />
                { }
                <button
                    onClick={handleButtonClick}
                    className="bg-blue-500 my-5 text-sm  flex items-center text-white py-1 px-2 rounded hover:bg-blue-600 transition duration-200"
                >
                    <svg className='mr-3' width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.404 5.10997L9.38901 4.09597L4.31401 9.16997C4.11413 9.36991 3.9556 9.60725 3.84746 9.86846C3.73931 10.1297 3.68367 10.4096 3.68372 10.6923C3.68377 10.975 3.7395 11.255 3.84773 11.5161C3.95596 11.7773 4.11457 12.0146 4.31451 12.2145C4.51444 12.4143 4.75179 12.5729 5.013 12.681C5.2742 12.7892 5.55415 12.8448 5.83686 12.8448C6.11957 12.8447 6.3995 12.789 6.66067 12.6807C6.92184 12.5725 7.15913 12.4139 7.35901 12.214L13.449 6.12497C14.1219 5.45198 14.4998 4.53927 14.4997 3.58762C14.4996 2.63596 14.1215 1.72332 13.4485 1.05047C12.7755 0.377615 11.8628 -0.000337891 10.9112 -0.000244123C9.9595 -0.000150355 9.04686 0.377982 8.37401 1.05097L1.98001 7.44397L1.96601 7.45697C0.0110059 9.41197 0.0110059 12.58 1.96601 14.534C3.92101 16.488 7.08901 16.488 9.04401 14.534L9.05701 14.52L9.05801 14.521L13.423 10.157L12.408 9.14297L8.04301 13.506L8.03001 13.519C7.36014 14.1875 6.4524 14.563 5.50601 14.563C4.55961 14.563 3.65187 14.1875 2.98201 13.519C2.64973 13.1863 2.38643 12.7913 2.20722 12.3567C2.02801 11.922 1.93643 11.4562 1.93773 10.9861C1.93903 10.5159 2.03319 10.0506 2.2148 9.61696C2.39641 9.18328 2.66189 8.78976 2.99601 8.45897L2.99501 8.45797L9.39001 2.06497C10.229 1.22497 11.595 1.22497 12.435 2.06497C13.275 2.90497 13.274 4.26997 12.435 5.10897L6.34501 11.198C6.20872 11.3233 6.02926 11.3912 5.84412 11.3874C5.65899 11.3836 5.48248 11.3084 5.35148 11.1775C5.22047 11.0466 5.1451 10.8702 5.1411 10.685C5.13709 10.4999 5.20478 10.3204 5.33001 10.184L10.405 5.10897L10.404 5.10997Z" fill="white" />
                    </svg>
                    Upload Attachments
                </button>

                <ul className='flex flex-wrap gap-3 mb-5'>
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className='relative h-[100px] w-[100px] p-3 rounded-lg bg-slate-100'
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            <div className='flex justify-end w-full'>
                                <button onClick={() => removeFile(index)}>
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z" fill="black" />
                                    </svg>
                                </button>
                            </div>

                            <div className='w-full flex justify-center mb-2'>
                                <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path opacity="0.5" fillRule="evenodd" clipRule="evenodd" d="M30 50H20C10.5725 50 5.8575 50 2.93 47.07C0.00249982 44.14 0 39.4275 0 30V20C0 10.5725 -2.98023e-07 5.8575 2.93 2.93C5.86 0.00249982 10.5975 0 20.075 0C21.59 0 22.8025 -1.02445e-07 23.825 0.0424999C23.7917 0.2425 23.775 0.445833 23.775 0.6525L23.75 7.7375C23.75 10.48 23.75 12.905 24.0125 14.8575C24.2975 16.975 24.95 19.0925 26.68 20.8225C28.405 22.5475 30.525 23.2025 32.6425 23.4875C34.595 23.75 37.02 23.75 39.7625 23.75H49.8925C50 25.085 50 26.725 50 28.9075V30C50 39.4275 50 44.1425 47.07 47.07C44.14 49.9975 39.4275 50 30 50Z" fill="#A2A2FF" />
                                    <path d="M23.775 0.649951L23.75 7.73745C23.75 10.48 23.75 12.9025 24.0125 14.8575C24.2975 16.975 24.95 19.0925 26.68 20.82C28.405 22.5475 30.525 23.2025 32.6425 23.4875C34.595 23.75 37.02 23.75 39.7625 23.75H49.8925C49.9258 24.1366 49.9492 24.5533 49.9625 25H50C50 24.33 50 23.9949 49.975 23.5999C49.7851 21.2237 48.9577 18.9428 47.58 16.9975C47.345 16.6775 47.185 16.4875 46.8675 16.105C44.885 13.735 42.275 10.78 40 8.74995C37.975 6.93995 35.1975 4.96245 32.775 3.34745C30.695 1.95745 29.655 1.26245 28.2275 0.747451C27.8117 0.600585 27.3896 0.472127 26.9625 0.362451C26.0025 0.124951 25.0675 0.0424512 23.75 0.0124512L23.775 0.649951Z" fill="#A2A2FF" />
                                </svg>
                            </div>

                            <div
                                className='absolute bottom-3 left-1/2 transform -translate-x-1/2 flex justify-center items-center bg-white py-1 px-2 rounded-lg font-semibold cursor-pointer'
                            >
                                {`.${file.name.split('.').pop()?.toUpperCase()}`}
                            </div>

                            {hoveredIndex === index && (
                                <div className='absolute left-1/2 transform -translate-x-1/2 bottom-[70px] bg-black text-white text-xs py-1 px-2 rounded'>
                                    {file.name} { }
                                </div>
                            )}
                        </div>
                    ))}
                </ul>
            </div>

            <button onClick={handleSubmit} className="flex bg-[#272727] justify-center text-white font-bold py-2 rounded w-full hover:bg-[#272727]">
                {loading ? (
                    <svg className='animate-spin mr-2' width="31" height="31" viewBox="0 0 31 31" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M29.3413 11.1792C29.8684 11.0146 30.1655 10.4523 29.9673 9.93683C29.0317 7.50371 27.4952 5.34041 25.4945 3.6526C23.2384 1.74938 20.4858 0.529898 17.5604 0.137549C14.6349 -0.254801 11.6583 0.196297 8.98046 1.4378C6.30263 2.6793 4.03495 4.65958 2.44408 7.14579C0.853204 9.632 0.00528502 12.5208 2.4616e-05 15.4724C-0.00523579 18.424 0.832381 21.3158 2.41438 23.8076C3.99638 26.2995 6.25699 28.2878 8.93037 29.5389C11.3012 30.6483 13.9092 31.137 16.5105 30.967C17.0616 30.931 17.4477 30.4257 17.3762 29.8781L16.9632 26.713C16.8917 26.1654 16.3894 25.7845 15.8374 25.8025C14.2191 25.8555 12.606 25.5266 11.131 24.8364C9.35307 24.0044 7.84968 22.682 6.7976 21.0249C5.74551 19.3677 5.18846 17.4446 5.19196 15.4816C5.19546 13.5187 5.75936 11.5976 6.81734 9.94415C7.87533 8.29074 9.38342 6.97378 11.1643 6.14813C12.9451 5.32249 14.9247 5.0225 16.8702 5.28342C18.8157 5.54435 20.6463 6.35535 22.1467 7.62106C23.3915 8.67116 24.366 9.99802 24.996 11.4897C25.2108 11.9984 25.7671 12.2949 26.2943 12.1303L29.3413 11.1792Z" fill="white" />
                    </svg>
                ) : (
                    'Submit Report'
                )}
            </button>

        </Modal>
    );
}
