import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IPatientsRepository } from '../domain/patients.repository.interface';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Patient } from '../domain/patient.entity';

@Injectable()
export class PatientsService {
  constructor(
    @Inject('IPatientsRepository')
    private readonly patientsRepository: IPatientsRepository,
  ) {}

  async create(tenantId: string, createPatientDto: CreatePatientDto): Promise<Patient> {
    return this.patientsRepository.create({
      tenantId,
      firstName: createPatientDto.firstName,
      lastName: createPatientDto.lastName,
      dob: createPatientDto.dob,
      gender: createPatientDto.gender,
      phone: createPatientDto.phone,
      email: createPatientDto.email || null,
      address: createPatientDto.address || null,
      medicalHistory: createPatientDto.medicalHistory || [],
      allergies: createPatientDto.allergies || [],
    });
  }

  async findAll(tenantId: string, search?: string): Promise<Patient[]> {
    return this.patientsRepository.findAll(tenantId, search);
  }

  async findById(tenantId: string, id: string): Promise<Patient> {
    const patient = await this.patientsRepository.findById(tenantId, id);
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }
    return patient;
  }

  async update(tenantId: string, id: string, updatePatientDto: UpdatePatientDto): Promise<Patient> {
    await this.findById(tenantId, id);
    return this.patientsRepository.update(tenantId, id, updatePatientDto);
  }
}
