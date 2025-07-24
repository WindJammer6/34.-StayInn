import React from 'react';
import { CreditCard } from 'lucide-react';
import FormSection from './FormSection';
import Input from './Input';
import Select from './Select';

// Constants
const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1).padStart(2, '0'),
  label: new Date(0, i).toLocaleString('en', { month: 'long' })
}));

const YEARS = Array.from({ length: 15 }, (_, i) => ({
  value: String(2024 + i),
  label: String(2024 + i)
}));

const CARD_TYPES = {
  visa: /^4/,
  mastercard: /^5[1-5]/,
  amex: /^3[47]/,
  discover: /^6(?:011|5)/
};

const getCardType = (number) => {
  const num = number.replace(/\s/g, '');
  for (const [type, regex] of Object.entries(CARD_TYPES)) {
    if (regex.test(num)) return type;
  }
  return null;
};

const PaymentForm = ({ form, errors, onChange }) => {
  const cardType = getCardType(form.creditCardNumber);

  return (
    <FormSection 
      title="Payment Details" 
      subtitle="Secure payment processing"
      icon={<CreditCard className="h-5 w-5" />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Input 
          label="Cardholder Name" 
          name="nameOnCard" 
          value={form.nameOnCard} 
          onChange={onChange}
          placeholder="Name as shown on card"
          error={errors.creditCardNumber}
          required
        />
        <Input 
          label="Card Number" 
          name="creditCardNumber" 
          value={form.creditCardNumber} 
          onChange={onChange} 
          error={errors.creditCardNumber}
          placeholder="1234 5678 9012 3456"
          maxLength="23"
          icon={cardType ? <CreditCard className="h-4 w-4 text-gray-400" /> : null}
          required 
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Select 
          label="Expiry Month" 
          name="expirationMonth" 
          options={MONTHS} 
          value={form.expirationMonth} 
          onChange={onChange} 
          error={errors.expirationMonth}
          required 
        />
        <Select 
          label="Expiry Year" 
          name="expirationYear" 
          options={YEARS} 
          value={form.expirationYear} 
          onChange={onChange} 
          error={errors.expirationYear}
          required 
        />
        <Input 
          label="CVV" 
          name="cvv" 
          placeholder="123" 
          maxLength="4" 
          value={form.cvv} 
          onChange={onChange} 
          error={errors.cvv}
          required 
        />
      </div>
    </FormSection>
  );
};

export default PaymentForm;