export interface IPdfGenerationService {
  generatePrescription(data: any): Promise<Buffer>;
  generateConsent(data: any): Promise<Buffer>;
}
