import { Injectable, Inject } from '@nestjs/common';
import { IDrugTemplatesRepository } from '../domain/drug-templates.repository.interface';
import { DrugTemplate } from '../domain/drug-template.entity';

@Injectable()
export class DrugTemplatesService {
  constructor(
    @Inject('IDrugTemplatesRepository')
    private readonly drugTemplatesRepository: IDrugTemplatesRepository,
  ) {}

  async create(
    tenantId: string,
    data: {
      name: string;
      genericName?: string;
      category?: string;
      defaultDosage?: string;
      defaultFrequency?: string;
      defaultDuration?: number;
      defaultInstructions?: string;
      contraindications?: string[];
    },
  ): Promise<DrugTemplate> {
    return this.drugTemplatesRepository.create({
      tenantId,
      name: data.name,
      genericName: data.genericName || null,
      category: data.category || null,
      defaultDosage: data.defaultDosage || null,
      defaultFrequency: data.defaultFrequency || null,
      defaultDuration: data.defaultDuration !== undefined ? data.defaultDuration : null,
      defaultInstructions: data.defaultInstructions || null,
      contraindications: data.contraindications || [],
    });
  }

  async findAll(tenantId: string): Promise<DrugTemplate[]> {
    return this.drugTemplatesRepository.findAll(tenantId);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    return this.drugTemplatesRepository.delete(tenantId, id);
  }
}
