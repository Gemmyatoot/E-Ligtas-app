// components/DateInputField.tsx
import { useState } from "react";

type DateInputFieldProps = {
    label: string;
    required?: boolean;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const DateInputField: React.FC<DateInputFieldProps> = ({
    label,
    required = false,
    name,
    value,
    onChange,
}) => {
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);

    const validate = (value: string) => {
        let error = null;

        // Required validation
        if (required && !value) {
            error = `${label} is required`;
        }

        // Additional validations for date can be added here if needed

        setErrorMessage(error);
    };

    const handleBlur = () => {
        setTouched(true);
        validate(value);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e);
        if (touched) {
            validate(e.target.value);
        }
    };

    return (
        <div className="mb-4">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                id={name}
                type="date"
                name={name}
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                required={required}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm ${errorMessage && touched ? "border-red-500" : "border-gray-300"
                    }`}
            />
            {touched && errorMessage && (
                <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
            )}
        </div>
    );
};

export default DateInputField;
