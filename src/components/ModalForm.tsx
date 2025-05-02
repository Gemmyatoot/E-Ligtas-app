import React from 'react';

// Define the formData type
interface FormData {
    userName: string;
    userAddress: string;
    contactNumber: string;
    referralReason: string;
    referralDate: string;
    clientCategory: string;
    offenseDate: string;
    offensePlace: string;
    apprehensionDate: string;
    apprehensionPlace: string;
    apprehendedBy: string;
}

interface ModalFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    formData: FormData;  // Use the defined FormData type here
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;  // Define the type for setFormData
}

const ModalForm: React.FC<ModalFormProps> = ({ isOpen, onClose, onSave, formData, setFormData }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-xl font-semibold mb-4">Enter your details</h2>

                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">II. Circumstances of Referral</h3>
                    <p className="text-sm text-gray-500 mb-4">(Information could be obtained from the law enforcement officer or accompanying party)</p>

                    <label className="block mb-2">Name of the Referring Party:</label>
                    <input
                        type="text"
                        value={formData.userName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, userName: e.target.value }))}
                        className="w-full p-2 mb-4 border rounded"
                        placeholder="Enter name"
                    />

                    <label className="block mb-2">Address:</label>
                    <input
                        type="text"
                        value={formData.userAddress}
                        onChange={(e) => setFormData((prev) => ({ ...prev, userAddress: e.target.value }))}
                        className="w-full p-2 mb-4 border rounded"
                        placeholder="Enter address"
                    />

                    <label className="block mb-2">Contact Number:</label>
                    <input
                        type="text"
                        value={formData.contactNumber}
                        onChange={(e) => setFormData((prev) => ({ ...prev, contactNumber: e.target.value }))}
                        className="w-full p-2 mb-4 border rounded"
                        placeholder="Enter contact number"
                    />

                    <label className="block mb-2">Reason's for Referral:</label>
                    <input
                        type="text"
                        value={formData.referralReason}
                        onChange={(e) => setFormData((prev) => ({ ...prev, referralReason: e.target.value }))}
                        className="w-full p-2 mb-4 border rounded"
                        placeholder="Enter reason"
                    />

                    <label className="block mb-2">Date of Referral:</label>
                    <input
                        type="date"
                        value={formData.referralDate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, referralDate: e.target.value }))}
                        className="w-full p-2 mb-4 border rounded"
                    />

                    <label className="block mb-2">Client Category:</label>
                    <select
                        value={formData.clientCategory}
                        onChange={(e) => setFormData((prev) => ({ ...prev, clientCategory: e.target.value }))}
                        className="w-full p-2 mb-4 border rounded"
                    >
                        <option value="Minor">Minor</option>
                        <option value="Adult">Adult</option>
                        <option value="Other">Other</option>
                    </select>

                    <label className="block mb-2">Date and Place Where the Offense was allegedly committed:</label>
                    <input
                        type="date"
                        value={formData.offenseDate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, offenseDate: e.target.value }))}
                        className="w-full p-2 mb-4 border rounded"
                    />
                    <input
                        type="text"
                        value={formData.offensePlace}
                        onChange={(e) => setFormData((prev) => ({ ...prev, offensePlace: e.target.value }))}
                        className="w-full p-2 mb-4 border rounded"
                        placeholder="Enter place of offense"
                    />

                    <label className="block mb-2">Date of Apprehension:</label>
                    <input
                        type="date"
                        value={formData.apprehensionDate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, apprehensionDate: e.target.value }))}
                        className="w-full p-2 mb-4 border rounded"
                    />

                    <label className="block mb-2">Place:</label>
                    <input
                        type="text"
                        value={formData.apprehensionPlace}
                        onChange={(e) => setFormData((prev) => ({ ...prev, apprehensionPlace: e.target.value }))}
                        className="w-full p-2 mb-4 border rounded"
                        placeholder="Enter place"
                    />

                    <label className="block mb-2">Apprehended by:</label>
                    <input
                        type="text"
                        value={formData.apprehendedBy}
                        onChange={(e) => setFormData((prev) => ({ ...prev, apprehendedBy: e.target.value }))}
                        className="w-full p-2 mb-4 border rounded"
                        placeholder="Enter apprehending officer"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onSave}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Save
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalForm;
