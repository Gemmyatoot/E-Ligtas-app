import React from 'react';

interface DateSelectorProps {
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, setSelectedDate }) => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 50 }, (_, i) => currentYear - i); // Generate last 50 years
    const months = [
        { value: 0, label: 'January' },
        { value: 1, label: 'February' },
        { value: 2, label: 'March' },
        { value: 3, label: 'April' },
        { value: 4, label: 'May' },
        { value: 5, label: 'June' },
        { value: 6, label: 'July' },
        { value: 7, label: 'August' },
        { value: 8, label: 'September' },
        { value: 9, label: 'October' },
        { value: 10, label: 'November' },
        { value: 11, label: 'December' },
    ];

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDate = new Date(selectedDate);
        newDate.setFullYear(parseInt(e.target.value, 10));
        setSelectedDate(newDate);
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(parseInt(e.target.value, 10));
        setSelectedDate(newDate);
    };

    return (
        <div className='flex space-x-2'>
            <div>
                <label className='block text-sm font-medium text-gray-700'>Select Year</label>
                <select
                    value={selectedDate.getFullYear()}
                    onChange={handleYearChange}
                    className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                >
                    {years.map((year) => (
                        <option key={year} value={year}>
                            {year}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className='block text-sm font-medium text-gray-700'>Select Month</label>
                <select
                    value={selectedDate.getMonth()}
                    onChange={handleMonthChange}
                    className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                >
                    {months.map((month) => (
                        <option key={month.value} value={month.value}>
                            {month.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default DateSelector;
