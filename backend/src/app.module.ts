import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { PatientsModule } from './modules/patients/patients.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { TreatmentsModule } from './modules/treatments/treatments.module';
import { BillingModule } from './modules/billing/billing.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { PdfGenerationModule } from './modules/pdf-generation/pdf-generation.module';
import { ToothConditionsModule } from './modules/tooth-conditions/tooth-conditions.module';
import { RadiographsModule } from './modules/radiographs/radiographs.module';
import { DrugTemplatesModule } from './modules/drug-templates/drug-templates.module';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
import { TimelineModule } from './modules/timeline/timeline.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RecallsModule } from './modules/recalls/recalls.module';
import { ConsentsModule } from './modules/consents/consents.module';
import { ProceduresModule } from './modules/procedures/procedures.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { LabOrdersModule } from './modules/lab-orders/lab-orders.module';
import { ClinicSettingsModule } from './modules/clinic-settings/clinic-settings.module';
import { PatientDocumentsModule } from './modules/patient-documents/patient-documents.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    PatientsModule,
    AppointmentsModule,
    TreatmentsModule,
    BillingModule,
    DashboardModule,
    FileUploadModule,
    PdfGenerationModule,
    ToothConditionsModule,
    RadiographsModule,
    DrugTemplatesModule,
    PrescriptionsModule,
    TimelineModule,
    NotificationsModule,
    RecallsModule,
    ConsentsModule,
    ProceduresModule,
    InventoryModule,
    LabOrdersModule,
    ClinicSettingsModule,
    PatientDocumentsModule,
  ],
})
export class AppModule {}
