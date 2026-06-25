import { Injectable } from '@nestjs/common';
import { IPdfGenerationService } from '../domain/pdf-generation.interface';
import PDFDocument from 'pdfkit';

@Injectable()
export class PdfGenerationService implements IPdfGenerationService {
  
  async generatePrescription(data: {
    clinicName: string;
    dentistName: string;
    dentistRole: string;
    patientName: string;
    patientAge: number;
    patientGender: string;
    date: string;
    items: Array<{
      drugName: string;
      dosage?: string;
      frequency?: string;
      durationDays?: number;
      instructions?: string;
    }>;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err: Error) => reject(err));

      // 1. Header (Letterhead)
      doc.fillColor('#06b6d4').fontSize(24).text(data.clinicName || 'Smile Saviours Dental Clinic', { align: 'center' });
      doc.fillColor('#6366f1').fontSize(10).text('Premium Multi-Specialty Dental Care & Oral Rehabilitation', { align: 'center', paragraphGap: 10 });
      doc.fillColor('#4b5563').text('Phone: +91 98765 43210 | Email: support@smilesaviours.com', { align: 'center' });
      
      // Decorative line
      doc.moveTo(50, 110).lineTo(545, 110).strokeColor('#e5e7eb').lineWidth(2).stroke();

      // 2. Doctor Info
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#1f2937');
      doc.text(`Dr. ${data.dentistName}`, 50, 130);
      doc.font('Helvetica').fontSize(10).fillColor('#4b5563');
      doc.text(data.dentistRole || 'Dental Surgeon');
      
      // 3. Patient Info box
      doc.rect(50, 165, 495, 60).fillAndStroke('#f9fafb', '#e5e7eb');
      doc.fillColor('#1f2937').fontSize(10);
      doc.text(`Patient Name: ${data.patientName}`, 65, 175);
      doc.text(`Age/Gender: ${data.patientAge} Yrs / ${data.patientGender}`, 65, 190);
      doc.text(`Date: ${data.date}`, 380, 175);
      doc.text(`Prescription ID: Rx-${Math.floor(100000 + Math.random() * 900000)}`, 380, 190);

      // Rx Symbol
      doc.font('Helvetica-Bold').fontSize(22).fillColor('#06b6d4').text('Rx', 50, 245);
      doc.font('Helvetica');

      // 4. Prescription items table
      let y = 280;
      
      // Table Header
      doc.rect(50, y, 495, 25).fill('#e5e7eb');
      doc.fillColor('#1f2937').fontSize(10);
      doc.text('Drug Name', 65, y + 8, { width: 180 });
      doc.text('Dosage', 250, y + 8);
      doc.text('Frequency', 320, y + 8);
      doc.text('Duration', 400, y + 8);
      doc.text('Instructions', 460, y + 8);

      y += 32;

      // Table Rows
      data.items.forEach((item) => {
        // Prevent overflow to next page for simpler layouts, or pdfkit handles natively
        doc.fillColor('#374151').fontSize(9);
        doc.text(item.drugName, 65, y);
        doc.text(item.dosage || '-', 250, y);
        doc.text(item.frequency || '-', 320, y);
        doc.text(item.durationDays ? `${item.durationDays} Days` : '-', 400, y);
        doc.text(item.instructions || '-', 460, y, { width: 80 });
        
        y += 24;
        
        // Draw dividing line
        doc.moveTo(50, y - 6).lineTo(545, y - 6).strokeColor('#f3f4f6').lineWidth(1).stroke();
      });

      // 5. Footer / Signature
      doc.fontSize(10).fillColor('#4b5563');
      doc.text('Signature / Stamp', 420, 700, { align: 'center' });
      doc.moveTo(400, 690).lineTo(530, 690).strokeColor('#9ca3af').lineWidth(1).stroke();

      doc.fontSize(8).fillColor('#9ca3af');
      doc.text('This prescription is generated electronically inside Smile Saviours practice management platform.', 50, 750, { align: 'center' });

      doc.end();
    });
  }

  async generateConsent(data: {
    clinicName: string;
    patientName: string;
    patientAge: number;
    patientGender: string;
    procedureType: string;
    title: string;
    legalText: string;
    date: string;
    signerName: string;
    isGuardian: boolean;
    guardianRelation?: string;
    signedImageUrl?: string; // Signature image URL if loaded locally/remotely
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err: Error) => reject(err));

      // Header
      doc.fillColor('#06b6d4').fontSize(20).text(data.clinicName || 'Smile Saviours Dental Clinic', { align: 'center' });
      doc.fillColor('#4b5563').fontSize(14).text(`Informed Consent for ${data.procedureType}`, { align: 'center', paragraphGap: 15 });

      // Patient Details Table
      doc.fontSize(10).fillColor('#1f2937');
      doc.rect(50, 110, 495, 45).fillAndStroke('#f9fafb', '#e5e7eb');
      doc.text(`Patient Name: ${data.patientName}`, 65, 120);
      doc.text(`Age/Gender: ${data.patientAge} / ${data.patientGender}`, 65, 135);
      doc.text(`Date Signed: ${data.date}`, 380, 120);

      // Title & Body
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text(data.title, 50, 180);
      doc.font('Helvetica').fontSize(9).fillColor('#374151').text(data.legalText, 50, 205, {
        align: 'justify',
        lineGap: 4,
        paragraphGap: 10,
      });

      // Signature area
      const signatureY = 560;
      doc.fontSize(10).fillColor('#1f2937');
      doc.text(`Signer Name: ${data.signerName}`, 50, signatureY);
      if (data.isGuardian) {
        doc.text(`Relation: Guardian (${data.guardianRelation || 'Other'})`, 50, signatureY + 15);
      }
      
      doc.text('Signature Verification', 350, signatureY);
      doc.rect(350, signatureY + 15, 180, 70).strokeColor('#d1d5db').lineWidth(1).stroke();
      doc.fontSize(8).fillColor('#9ca3af').text('[Digitally signed canvas record]', 360, signatureY + 45);

      // Terms acknowledgment
      doc.fontSize(8).fillColor('#6b7280').text(
        'By signing this, I acknowledge that the procedure has been explained, including risks and alternatives, and I consent to the treatment.',
        50,
        710,
        { width: 495 }
      );

      doc.end();
    });
  }
}
