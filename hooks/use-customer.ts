"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Customer = {
  id?: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  phone_verified: boolean;
};

type Address = {
  id?: string;
  user_id: string;
  full_name?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  type?: string;
  is_default?: boolean;
};

interface CustomerStore {
  customer: Customer | null;
  address: Address | null;
  addresses: Address[];
  lastFetched: number | null;
  isHydrated: boolean;

  // Actions
  setCustomer: (customer: Customer | null) => void;
  setAddress: (address: Address | null) => void;
  setAddresses: (addresses: Address[]) => void;
  updateCustomer: (updates: Partial<Customer>) => void;
  updateAddress: (updates: Partial<Address>) => void;
  clearCache: () => void;
  setHydrated: (state: boolean) => void;

  // Check if cache is valid (less than 5 minutes old)
  isCacheValid: () => boolean;
}

// Cache duration: 5 minutes (disabled in development so changes are always fresh)
const CACHE_DURATION =
  process.env.NODE_ENV === "development" ? 0 : 5 * 60 * 1000;

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set, get) => ({
      customer: null,
      address: null,
      addresses: [],
      lastFetched: null,
      isHydrated: false,

      setCustomer: (customer) => set({ customer, lastFetched: Date.now() }),

      setAddress: (address) => set({ address, lastFetched: Date.now() }),

      setAddresses: (addresses) => set({ addresses, lastFetched: Date.now() }),

      updateCustomer: (updates) =>
        set((state) => ({
          customer: state.customer ? { ...state.customer, ...updates } : null,
          lastFetched: Date.now(),
        })),

      updateAddress: (updates) =>
        set((state) => ({
          address: state.address ? { ...state.address, ...updates } : null,
          lastFetched: Date.now(),
        })),

      clearCache: () =>
        set({
          customer: null,
          address: null,
          addresses: [],
          lastFetched: null,
        }),

      setHydrated: (state) => set({ isHydrated: state }),

      isCacheValid: () => {
        const { lastFetched } = get();
        if (!lastFetched) return false;
        return Date.now() - lastFetched < CACHE_DURATION;
      },
    }),
    {
      name: "customer-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

// Hook to fetch and cache customer data
export function useCustomer(userId: string | undefined) {
  const {
    customer,
    address,
    addresses,
    setCustomer,
    setAddress,
    setAddresses,
    updateCustomer,
    updateAddress,
    isCacheValid,
    isHydrated,
    clearCache,
  } = useCustomerStore();

  const fetchCustomerData = async (forceRefresh = false) => {
    if (!userId)
      return { customer: null, address: null, addresses: [] as Address[] };

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid() && customer?.user_id === userId) {
      return { customer, address, addresses };
    }

    try {
      const response = await fetch(`/api/customers/${userId}`);
      if (response.ok) {
        const data = await response.json();

        if (data.customer) {
          setCustomer({ ...data.customer, user_id: userId });
        }

        if (data.address) {
          setAddress({ ...data.address, user_id: userId });
        }

        const fetchedAddresses: Address[] = (data.addresses || []).map(
          (a: Address) => ({ ...a, user_id: userId }),
        );
        setAddresses(fetchedAddresses);

        return {
          customer: data.customer,
          address: data.address,
          addresses: fetchedAddresses,
        };
      }
    } catch (error) {
      console.error("Error fetching customer data:", error);
    }

    return { customer: null, address: null, addresses: [] as Address[] };
  };

  const saveCustomer = async (customerData: Partial<Customer>) => {
    if (!userId) return null;

    try {
      const url = customer?.id
        ? `/api/customers/${customer.id}`
        : "/api/customers";
      const method = customer?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          ...customerData,
        }),
      });

      if (response.ok) {
        const updatedCustomer = await response.json();
        setCustomer({ ...updatedCustomer, user_id: userId });
        return updatedCustomer;
      }
    } catch (error) {
      console.error("Error saving customer:", error);
    }

    return null;
  };

  // Saves an address. If `addressData.id` is provided, the existing address
  // row is updated in place; otherwise a brand-new address is inserted so
  // customers can keep multiple saved addresses instead of overwriting one.
  const saveAddress = async (addressData: Partial<Address>) => {
    if (!userId) return null;

    try {
      const response = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          address: {
            ...addressData,
            type: addressData.type || "shipping",
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // API returns { success: true, address: {...} }
        if (data.address) {
          setAddress({ ...data.address, user_id: userId });
          return data.address;
        }
      }
    } catch (error) {
      console.error("Error saving address:", error);
    }

    return null;
  };

  // Deletes a saved address. Returns true on success.
  const deleteAddress = async (addressId: string) => {
    if (!userId) return false;

    try {
      const response = await fetch("/api/addresses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          address_id: addressId,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error("Error deleting address:", error);
      return false;
    }
  };

  return {
    customer,
    address,
    addresses,
    setAddresses,
    isHydrated,
    fetchCustomerData,
    saveCustomer,
    saveAddress,
    deleteAddress,
    updateCustomer,
    updateAddress,
    clearCache,
    isCacheValid,
  };
}
