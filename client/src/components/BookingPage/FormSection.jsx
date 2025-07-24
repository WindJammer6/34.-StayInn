import React from 'react';

const FormSection = ({ title, subtitle, icon, children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
    <div className="flex items-center gap-3 mb-6">
      {icon && <div className="text-blue-600">{icon}</div>}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

export default FormSection;