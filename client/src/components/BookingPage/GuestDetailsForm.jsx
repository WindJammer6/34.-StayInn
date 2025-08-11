import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import FormSection from './FormSection';
import Input from './Input';

const GuestDetailsForm = ({ form, errors, onChange }) => {
  return (
    <FormSection 
      title="Guest Information" 
      subtitle="Primary guest details for the reservation"
      icon={<CheckCircle2 className="h-5 w-5" />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Input 
          label="First Name" 
          name="firstName" 
          value={form.firstName} 
          onChange={onChange} 
          error={errors.firstName}
          required 
        />
        <Input 
          label="Last Name" 
          name="lastName" 
          value={form.lastName} 
          onChange={onChange} 
          error={errors.lastName}
          required 
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Input 
          label="Phone Number" 
          name="phoneNumber" 
          type="tel" 
          value={form.phoneNumber} 
          onChange={onChange} 
          error={errors.phoneNumber}
          placeholder="+65 9123 4567"
          required 
        />
        <Input 
          label="Email Address" 
          name="emailAddress" 
          type="email" 
          value={form.emailAddress} 
          onChange={onChange} 
          error={errors.emailAddress}
          placeholder="your@email.com"
          required 
        />
      </div>
      {/* <div className="mb-6">
        <Input 
          label="Title/Salutation" 
          name="salutation" 
          value={form.salutation} 
          onChange={onChange}
          placeholder="Mr. / Ms. / Dr."
        />
      </div> */}

      <div className="mb-6">
        <label htmlFor="salutation" className="block font-medium text-gray-700 mb-1">Title/Salutation</label>
        <select
          id="salutation"
          name="salutation"
          value={form.salutation}
          onChange={onChange}
          className="border border-gray-300 rounded p-2 w-full"
        >
          <option value="">Select</option>
          <option value="Mr">Mr</option>
          <option value="Ms">Ms</option>
          <option value="Mrs">Mrs</option>
          <option value="Dr">Dr</option>
          <option value="Prof">Prof</option>
        </select>
      </div>

      <Input 
        label="Special Requests" 
        name="specialRequests" 
        rows="3" 
        placeholder="Any special requests, dietary requirements, or preferences..."
        value={form.specialRequests} 
        onChange={onChange}
        maxLength="500"
      />
    </FormSection>
  );
};

export default GuestDetailsForm;