import React from 'react';

const Select = ({ 
  label, 
  name, 
  options, 
  placeholder = "Select...", 
  required = false, 
  error,
  value,
  onChange,
  ...props 
}) => {
  const hasError = !!error;
  
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-3 py-2 border rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          hasError 
            ? 'border-red-300 bg-red-50' 
            : 'border-gray-300 focus:border-transparent'
        }`}
        required={required}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {hasError && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <span className="text-xs">⚠️</span> {error}
        </p>
      )}
    </div>
  );
};

export default Select;