import React, { useState } from 'react';

interface ProblemPresentedProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onSave: (updatedIncident: any) => void;
  onCancel: () => void;
  incident: any;
}

const ProblemPresented: React.FC<ProblemPresentedProps> = ({
  isOpen,
  setIsOpen,
  onSave,
  onCancel,
  incident,
}) => {
  // State to store the problem details
  const [problemDetails, setProblemDetails] = useState<string>(incident.formData?.problem || '');

  // Handle the change event for the textarea
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProblemDetails(e.target.value);
  };

  // Handle form submission
  const handleSubmit = () => {
    const updatedIncident = {
      ...incident,
      formData: {
        ...incident.formData,
        problem: problemDetails,
      },
    };
    onSave(updatedIncident);  // Save the updated incident
  };

  // Close the modal if it is not open
  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Problem Presented</h2>
        {/* Textarea to input the problem details */}
        <textarea
          value={problemDetails}
          onChange={handleChange}
          placeholder="Describe the problem presented..."
          rows={5}
          cols={50}
        />
        <div className="modal-actions">
          <button onClick={handleSubmit}>Save</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ProblemPresented;
