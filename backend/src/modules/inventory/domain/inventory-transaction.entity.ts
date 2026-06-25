export class InventoryTransaction {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly itemId: string,
    public readonly type: string, // restock | usage | adjustment
    public readonly quantity: number,
    public readonly date: Date,
    public readonly relatedTreatmentId: string | null,
    public readonly recordedBy: string,
    public readonly notes: string | null,
    public readonly createdAt: Date,
    // Joined info
    public readonly itemName?: string,
    public readonly recorderName?: string,
  ) {}
}
