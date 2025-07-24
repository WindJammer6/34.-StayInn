import React from 'react';

const Input = ({ 
  label, 
  name, 
  type = 'text', 
  required = false, 
  rows, 
  placeholder, 
  error,
  icon,
  maxLength,
  value,
  onChange,
  ...props 
}) => {
  const isTextarea = !!rows;
  const hasError = !!error;
  
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        {isTextarea ? (
          <textarea
            name={name}
            rows={rows}
            value={value}
            onChange={onChange}
            className={`w-full ${icon ? 'pl-10' : 'pl-3'} pr-3 py-2 border rounded-lg shadow-sm transition-colors duration-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              hasError 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300 focus:border-transparent'
            }`}
            placeholder={placeholder}
            maxLength={maxLength}
            {...props}
          />
        ) : (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className={`w-full ${icon ? 'pl-10' : 'pl-3'} pr-3 py-2 border rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              hasError 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300 focus:border-transparent'
            }`}
            placeholder={placeholder}
            required={required}
            maxLength={maxLength}
            {...props}
          />
        )}
      </div>
      {hasError && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <span className="text-xs">⚠️</span> {error}
        </p>
      )}
    </div>
  );
};

export default Input;