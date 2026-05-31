
export enum LoanPurpose {
  PERSONAL = 'Personal Loan',
  BUSINESS = 'Business Loan',
  EDUCATION = 'Education',
  EMERGENCY = 'Medical Emergency',
  REFINANCE = 'Auto Refinancing'
}

export enum FundingSource {
  SALARY = 'Monthly Salary',
  BUSINESS = 'Business Profit',
  SAVINGS = 'Personal Savings',
  INVESTMENT = 'Investment Returns',
  GIG_WORK = 'Gig Work / Freelancing'
}

export interface ApplicationData {
  purpose: LoanPurpose;
  fundingSource: FundingSource | '';
  amount: number;
  firstName: string;
  lastName: string;
  birthday: string;
  email: string;
  phoneNumber: string;
  guarantorNumber: string;
  idNumber: string;
  country: string;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  quote: string;
  amount: string;
  imageUrl: string;
  loanPurpose: string;
  discoveryMethod: string;
  ethnicity: 'US' | 'CA' | 'KE';
}

export type Country = 'KE' | 'US' | 'CA';
