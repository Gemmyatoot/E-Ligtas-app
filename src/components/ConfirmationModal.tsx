// ConfirmationModal.tsx
import React from 'react';

interface ConfirmationModalProps {
  isVisible: boolean;
  onSave: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isVisible, onSave, onCancel }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Confirm Move to Completed</h2>
        <p>Are you sure you want to move this incident to "Completed"?</p>
        <div className="flex gap-4 mt-4">
          <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={onSave}>
            Save
          </button>
          <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
