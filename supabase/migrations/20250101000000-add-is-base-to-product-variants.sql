-- Add is_base column to product_variants table
-- This column indicates if a variant is the base color variant for the product

ALTER TABLE product_variants 
ADD COLUMN is_base BOOLEAN DEFAULT FALSE;

-- Add index for better performance when querying base variants
CREATE INDEX idx_product_variants_is_base ON product_variants(is_base);

-- Add comment to explain the column purpose
COMMENT ON COLUMN product_variants.is_base IS 'Indicates if this variant is the base color variant for the product. Base variants are created from the product''s base color and are shown first.'; 