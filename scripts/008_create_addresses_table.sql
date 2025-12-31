-- Create addresses table
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  type text NULL DEFAULT 'shipping'::text,
  is_default boolean NULL DEFAULT false,
  full_name text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text NULL,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL DEFAULT 'US'::text,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT addresses_pkey PRIMARY KEY (id),
  CONSTRAINT addresses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
  CONSTRAINT addresses_type_check CHECK (
    (
      type = ANY (array['shipping'::text, 'billing'::text])
    )
  )
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_addresses_customer_id ON public.addresses (customer_id);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON public.addresses (customer_id, is_default);

-- Enable Row Level Security
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own addresses" ON public.addresses
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own addresses" ON public.addresses
  FOR INSERT WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own addresses" ON public.addresses
  FOR UPDATE USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own addresses" ON public.addresses
  FOR DELETE USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );