import React from 'react';
import FormSection from './FormSection';
import Input from './Input';
import Select from './Select';

//Hardcoded countries for the bookingpage
//can try other method like api call(to be improved)
const COUNTRIES = [
  { value: 'AF', label: 'Afghanistan' },
  { value: 'AU', label: 'Australia' },
  { value: 'BD', label: 'Bangladesh' },
  { value: 'BR', label: 'Brazil' },
  { value: 'CA', label: 'Canada' },
  { value: 'CN', label: 'China' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'IN', label: 'India' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'IT', label: 'Italy' },
  { value: 'JP', label: 'Japan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'MY', label: 'Malaysia' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'PH', label: 'Philippines' },
  { value: 'RU', label: 'Russia' },
  { value: 'SG', label: 'Singapore' },
  { value: 'TH', label: 'Thailand' },
  { value: 'US', label: 'United States' },
  { value: 'VN', label: 'Vietnam' }
];

const BillingAddressForm = ({ form, errors, onChange }) => {
  return (
    <FormSection 
      title="Billing Address" 
      subtitle="Address associated with your payment method"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Input 
          label="First Name" 
          name="billingFirstName" 
          value={form.billingFirstName} 
          onChange={onChange} 
        />
        <Input 
          label="Last Name" 
          name="billingLastName" 
          value={form.billingLastName} 
          onChange={onChange} 
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Input 
          label="Phone Number" 
          name="billingPhoneNumber" 
          type="tel" 
          value={form.billingPhoneNumber} 
          onChange={onChange} 
        />
        <Input 
          label="Email Address" 
          name="billingEmailAddress" 
          type="email" 
          value={form.billingEmailAddress} 
          onChange={onChange} 
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select 
          label="Country" 
          name="country" 
          options={COUNTRIES} 
          value={form.country} 
          onChange={onChange} 
        />
        <Input 
          label="State/Province" 
          name="stateProvince" 
          value={form.stateProvince} 
          onChange={onChange} 
        />
        <Input 
          label="Postal Code" 
          name="postalCode" 
          value={form.postalCode} 
          onChange={onChange} 
        />
      </div>
    </FormSection>
  );
};

export default BillingAddressForm;