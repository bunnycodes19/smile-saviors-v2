export class InventoryItem {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly category: string, // consumable | material | instrument
    public readonly unit: string, // pieces | ml | grams | boxes
    public readonly currentStock: number,
    public readonly reorderThreshold: number,
    public readonly unitCost: number | null,
    public readonly supplierName: string | null,
    public readonly supplierContact: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
