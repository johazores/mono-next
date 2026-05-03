import { productPriceRepository } from "@/repositories/product-price-repository";
import type {
  ProductPriceRecord,
  CreateProductPriceInput,
  UpdateProductPriceInput,
} from "@/types";

export const productPriceService = {
  async listByProduct(productId: string): Promise<ProductPriceRecord[]> {
    const prices = await productPriceRepository.findByProduct(productId);
    return prices as ProductPriceRecord[];
  },

  async getActivePrice(
    productId: string,
    mode: "test" | "live",
  ): Promise<ProductPriceRecord | null> {
    const price = await productPriceRepository.findActivePrice(productId, mode);
    return price as ProductPriceRecord | null;
  },

  async create(input: CreateProductPriceInput): Promise<ProductPriceRecord> {
    const price = await productPriceRepository.create({
      product: { connect: { id: input.productId } },
      label: input.label,
      stripePriceId: input.stripePriceId,
      mode: input.mode,
      amount: input.amount,
      currency: input.currency ?? "USD",
      interval: input.interval ?? null,
      startDate: input.startDate ? new Date(input.startDate) : new Date(),
      endDate: input.endDate ? new Date(input.endDate) : null,
      isDefault: input.isDefault ?? false,
      metadata: (input.metadata ?? null) as never,
    });
    return price as ProductPriceRecord;
  },

  async update(
    id: string,
    input: UpdateProductPriceInput,
  ): Promise<ProductPriceRecord> {
    const data: Record<string, unknown> = {};
    if (input.label !== undefined) data.label = input.label;
    if (input.stripePriceId !== undefined)
      data.stripePriceId = input.stripePriceId;
    if (input.mode !== undefined) data.mode = input.mode;
    if (input.amount !== undefined) data.amount = input.amount;
    if (input.currency !== undefined) data.currency = input.currency;
    if (input.interval !== undefined) data.interval = input.interval || null;
    if (input.startDate !== undefined)
      data.startDate = new Date(input.startDate);
    if (input.endDate !== undefined)
      data.endDate = input.endDate ? new Date(input.endDate) : null;
    if (input.isDefault !== undefined) data.isDefault = input.isDefault;
    if (input.metadata !== undefined) data.metadata = input.metadata ?? null;

    const price = await productPriceRepository.update(id, data);
    return price as ProductPriceRecord;
  },

  async delete(id: string): Promise<void> {
    await productPriceRepository.delete(id);
  },
};
