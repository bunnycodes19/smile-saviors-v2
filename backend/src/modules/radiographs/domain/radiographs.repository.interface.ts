import { Radiograph } from './radiograph.entity';

export interface IRadiographsRepository {
  create(radiographData: Omit<Radiograph, 'id' | 'createdAt'>): Promise<Radiograph>;
  findAllByPatient(tenantId: string, patientId: string, imageType?: string): Promise<Radiograph[]>;
  findByTooth(tenantId: string, patientId: string, toothNumber: string): Promise<Radiograph[]>;
  findById(tenantId: string, id: string): Promise<Radiograph | null>;
  update(
    tenantId: string,
    id: string,
    data: Partial<Omit<Radiograph, 'id' | 'tenantId' | 'createdAt'>>,
  ): Promise<Radiograph>;
  delete(tenantId: string, id: string): Promise<void>;
}
