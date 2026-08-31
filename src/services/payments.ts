export type PaymentMethodType = 'bkash' | 'nagad' | 'rocket' | 'card' | 'bank';

export interface SavedPaymentMethod {
  id: string;
  type: PaymentMethodType;
  title: string;
  identifier: string; // e.g. "017******89" or "•••• 4242"
  accountHolder: string;
  isDefault: boolean;
  expiry?: string;
  cardBrand?: 'visa' | 'mastercard' | 'amex';
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  campaignTitle: string;
  amount: number;
  currency: string;
  date: string;
  status: 'COMPLETED' | 'PENDING' | 'REFUNDED';
  methodTitle: string;
  transactionRef: string;
}

import { getCachedData, setCachedData } from '../utils/storage';

const DEFAULT_METHODS: SavedPaymentMethod[] = [
  {
    id: 'pm-1',
    type: 'bkash',
    title: 'bKash Personal',
    identifier: '+880 17••••5413',
    accountHolder: 'Shopnil K.',
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pm-2',
    type: 'card',
    title: 'Visa Debit Card',
    identifier: '•••• •••• •••• 4242',
    accountHolder: 'Shopnil K.',
    isDefault: false,
    expiry: '08/28',
    cardBrand: 'visa',
    createdAt: new Date().toISOString(),
  }
];

export const getSavedPaymentMethods = (): SavedPaymentMethod[] => {
  const cached = getCachedData<SavedPaymentMethod[]>('straycare_payment_methods');
  if (cached) return cached;
  return import.meta.env.DEV ? DEFAULT_METHODS : [];
};

export const savePaymentMethod = (method: Omit<SavedPaymentMethod, 'id' | 'createdAt'>): SavedPaymentMethod[] => {
  const current = getSavedPaymentMethods();
  const newMethod: SavedPaymentMethod = {
    ...method,
    id: `pm-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  let updated = current;
  if (newMethod.isDefault) {
    updated = updated.map((m) => ({ ...m, isDefault: false }));
  }
  updated = [newMethod, ...updated];

  setCachedData('straycare_payment_methods', updated);
  window.dispatchEvent(new CustomEvent('straycare:payment-methods-updated', { detail: updated }));
  return updated;
};

export const deletePaymentMethod = (id: string): SavedPaymentMethod[] => {
  const current = getSavedPaymentMethods();
  let updated = current.filter((m) => m.id !== id);
  if (updated.length > 0 && !updated.some((m) => m.isDefault)) {
    updated[0].isDefault = true;
  }
  setCachedData('straycare_payment_methods', updated);
  window.dispatchEvent(new CustomEvent('straycare:payment-methods-updated', { detail: updated }));
  return updated;
};

export const setDefaultPaymentMethod = (id: string): SavedPaymentMethod[] => {
  const current = getSavedPaymentMethods();
  const updated = current.map((m) => ({
    ...m,
    isDefault: m.id === id,
  }));
  setCachedData('straycare_payment_methods', updated);
  window.dispatchEvent(new CustomEvent('straycare:payment-methods-updated', { detail: updated }));
  return updated;
};

export const getPaymentHistory = (): PaymentTransaction[] => {
  if (!import.meta.env.DEV) return [];
  
  return [
    {
      id: 'tx-101',
      campaignTitle: 'Emergency Surgery for Injured Stray Pup (Dhanmondi)',
      amount: 1500,
      currency: '৳',
      date: 'Aug 18, 2026',
      status: 'COMPLETED',
      methodTitle: 'bKash Personal (+880 17••••5413)',
      transactionRef: 'TRX-BK-99218274',
    },
    {
      id: 'tx-102',
      campaignTitle: 'Vaccination & Deworming Drive for 25 Community Cats',
      amount: 500,
      currency: '৳',
      date: 'Aug 10, 2026',
      status: 'COMPLETED',
      methodTitle: 'Visa Debit Card (•••• 4242)',
      transactionRef: 'TRX-VS-33829104',
    }
  ];
};
