// Utility Functions for Booking Components

export const formatCardNumber = (value) => {
  return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
};

export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePhone = (phone) => {
  return /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
};

export const validateForm = (form) => {
  const newErrors = {};
  
  // Required fields
  const requiredFields = ['firstName', 'lastName', 'phoneNumber', 'emailAddress', 'creditCardNumber', 'expirationMonth', 'expirationYear', 'cvv'];
  requiredFields.forEach(field => {
    if (!form[field]?.trim()) {
      newErrors[field] = 'This field is required';
    }
  });
  
  // Email validation
  if (form.emailAddress && !validateEmail(form.emailAddress)) {
    newErrors.emailAddress = 'Please enter a valid email';
  }
  
  // Phone validation
  if (form.phoneNumber && !validatePhone(form.phoneNumber)) {
    newErrors.phoneNumber = 'Please enter a valid phone number';
  }
  
  // Credit card validation
  if (form.creditCardNumber) {
    const cardNumber = form.creditCardNumber.replace(/\s/g, '');
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      newErrors.creditCardNumber = 'Please enter a valid card number';
    }
  }
  
  // CVV validation
  if (form.cvv && (form.cvv.length < 3 || form.cvv.length > 4)) {
    newErrors.cvv = 'Please enter a valid CVV';
  }
  
  return newErrors;
};