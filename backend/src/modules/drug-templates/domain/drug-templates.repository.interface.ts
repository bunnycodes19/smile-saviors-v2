import { DrugTemplate } from './drug-template.entity';

export interface IDrugTemplatesRepository {
  create(data: Omit<DrugTemplate, 'id' | 'createdAt'>): Promise<DrugTemplate>;
  findAll(tenantId: string): Promise<DrugTemplate[]>;
  findById(tenantId: string, id: string): Promise<DrugTemplate | null>;
  delete(tenantId: string, id: string): Promise<void>;
}
