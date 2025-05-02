// components/InputField.tsx
import { useState } from "react";

type InputFieldProps = {
    label: string;
    type: "text" | "email" | "password" | "number";
    required?: boolean;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const InputField: React.FC<InputFieldProps> = ({
    label,
    type,
    required = false,
    name,
    value,
    onChange,
}) => {
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);

    // Validate the input based on its type
    const validate = (value: string) => {
        let error = null;

        // Required field validation
        if (required && !value) {
            error = `${label} is required`;
        }

        // Email validation
        if (type === "email" && value && !/\S+@\S+\.\S+/.test(value)) {
            error = "Invalid email address";
        }

        // Password validation (optional: 6+ characters)
        if (type === "password" && value.length < 6) {
            error = "Password must be at least 6 characters";
        }

        // Number validation
        if (type === "number" && value && isNaN(Number(value))) {
            error = "Please enter a valid number";
        }

        setErrorMessage(error); // Update error state
    };

    const handleBlur = () => {
        setTouched(true);
        validate(value); // Trigger validation when the field loses focus
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e); // Handle input change (controlled component)
        if (touched) {
            validate(e.target.value); // Revalidate after blur
        }
    };

    return (
        <div className="mb-4">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                id={name}
                type={type}
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

export default InputField;
