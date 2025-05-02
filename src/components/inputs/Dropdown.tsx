// components/inputs/Dropdown.tsx
import React from 'react';

interface DropdownProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({ label, options, value, onChange, required = false }) => {
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
      <select
        value={value}
        onChange={handleSelectChange}
        required={required}
        className={`mt-1 block w-full px-3 py-[8px] border rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm border-gray-300
        }`}
      >
        <option value="" disabled>Select {label}</option>
        {options.map((option, index) => (
          <option key={index} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );
};

export default Dropdown;
