# Address Management System

This implementation provides complete CRUD operations for customer addresses in your e-commerce application.

## Features

- ✅ **Create** new addresses
- ✅ **Read** existing addresses
- ✅ **Update** address details
- ✅ **Delete** addresses (with protection - at least one address required)
- ✅ **Default address** management
- ✅ **Address selection** during checkout
- ✅ **User isolation** - users can only manage their own addresses

## Database Schema

The addresses table includes:

- `id` - Unique identifier
- `customer_id` - Links to customers table
- `type` - 'shipping' or 'billing'
- `is_default` - Boolean flag for default address
- `full_name` - Recipient name
- `address_line1` - Primary address
- `address_line2` - Secondary address (optional)
- `city`, `state`, `postal_code` - Location details
- `country` - Defaults to 'US'
- `created_at` - Timestamp

## API Endpoints

### GET `/api/addresses`

Retrieves all addresses for the authenticated user.

### POST `/api/addresses`

Creates a new address. First address is automatically set as default.

### PUT `/api/addresses/[id]`

Updates an existing address.

### DELETE `/api/addresses/[id]`

Deletes an address. Prevents deletion if it's the user's only address.

### PATCH `/api/addresses/[id]`

Sets an address as the default address.

## Components

### AddressManager

- Full address management UI
- Supports both selection mode (for checkout) and management mode
- Add/Edit/Delete functionality
- Default address setting

### CheckoutForm (Updated)

- Integrates address selection
- Option to use saved addresses or enter new address
- Automatic default address selection

## Hooks

### useAddresses

Custom hook providing:

- `fetchAddresses()` - Load addresses
- `createAddress()` - Add new address
- `updateAddress()` - Modify address
- `deleteAddress()` - Remove address
- `setDefaultAddress()` - Set default
- `getDefaultAddress()` - Get current default

## Usage

### In Checkout Flow

```tsx
import AddressManager from "@/components/address-manager";

<AddressManager
  showSelection={true}
  selectedAddressId={selectedAddress?.id}
  onAddressSelect={handleAddressSelect}
/>;
```

### In Profile Management

```tsx
import AddressManager from "@/components/address-manager";

<AddressManager />;
```

## Security

- Row Level Security (RLS) policies ensure users can only access their own addresses
- All operations are validated against the authenticated user
- Foreign key constraints maintain data integrity

## Database Setup

Run the SQL scripts in order:

1. `008_create_addresses_table.sql` - Creates the addresses table
2. `009_update_orders_table.sql` - Updates orders table for address integration

## Business Rules

1. **Minimum One Address**: Users cannot delete their only address
2. **Auto-Default**: First address is automatically set as default
3. **Single Default**: Only one address can be default at a time
4. **User Isolation**: Users can only manage their own addresses
