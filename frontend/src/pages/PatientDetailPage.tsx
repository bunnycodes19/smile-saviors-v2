import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import { useAuth } from '../context/AuthContext';
import { DentalChart } from '../components/DentalChart';
import { getDisplayNumber, TOOTH_MAP } from '../utils/toothNumbering';
import SignatureCanvas from 'react-signature-canvas';
import { 
  ArrowLeft, User, FileText, Activity, Image as ImageIcon, 
  Clipboard, Clock, Plus, Eye, Download, Trash, AlertTriangle, 
  Upload, X, ZoomIn, ZoomOut, CheckSquare, Layers
} from 'lucide-react';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  phone: string;
  email: string | null;
  address: string | null;
  medicalHistory: string[];
  allergies: string[];
}

interface ToothCondition {
  id: string;
  toothNumber: string;
  surface: string | null;
  conditionCode: string;
  status: string;
  notes: string | null;
  dateRecorded: string;
}

interface Treatment {
  id: string;
  toothNumber: number | null;
  procedureName: string;
  notes: string | null;
  price: string;
  status: string; // 'PROPOSED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  createdAt: string;
  chiefComplaint?: string | null;
  symptoms?: string | null;
  diagnosis?: string | null;
  followUpInstructions?: string | null;
  clinicalNotes?: string | null;
  estimatedCost?: string | null;
  acceptedAt?: string | null;
  completedAt?: string | null;
}

interface Radiograph {
  id: string;
  imageType: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  toothNumbers: string | null;
  takenDate: string | null;
  notes: string | null;
  createdAt: string;
}

interface DrugTemplate {
  id: string;
  name: string;
  genericName: string | null;
  category: string | null;
  defaultDosage: string | null;
  defaultFrequency: string | null;
  defaultDuration: number | null;
  defaultInstructions: string | null;
  contraindications: string[];
}

interface PrescriptionItem {
  id?: string;
  drugName: string;
  dosage: string | null;
  frequency: string | null;
  durationDays: number | null;
  instructions: string | null;
}

interface Prescription {
  id: string;
  date: string;
  pdfUrl: string | null;
  createdAt: string;
  items: PrescriptionItem[];
}

interface TimelineEvent {
  id: string;
  type: 'treatment' | 'appointment' | 'prescription' | 'radiograph' | 'tooth_condition' | 'invoice' | 'consent';
  date: string;
  title: string;
  description: string;
  status?: string;
  metadata: Record<string, any>;
}

interface ConsentTemplate {
  id: string;
  procedureType: string;
  title: string;
  legalText: string;
  requiresGuardian: boolean;
}

interface Consent {
  id: string;
  templateTitle: string;
  procedureType: string;
  consent: {
    id: string;
    signedImageUrl: string;
    signedAt: string;
    signerName: string;
    isGuardian: boolean;
    guardianRelation: string | null;
    witnessName: string | null;
    pdfUrl: string | null;
  };
}

interface Procedure {
  id: string;
  toothNumber: string | null;
  procedureType: string;
  status: string; // in_progress | completed | abandoned
  startDate: string;
  expectedSittings: number | null;
  totalCost: string | null;
  notes: string | null;
}

interface ProcedureStep {
  id: string;
  stepNumber: number;
  stepDescription: string;
  date: string | null;
  dentistNotes: string | null;
  costForStep: string | null;
  status: string; // pending | completed
}

type TabType = 'overview' | 'treatment-plan' | 'treatment-history' | 'xrays' | 'prescriptions' | 'timeline' | 'consents' | 'procedures' | 'documents';

export const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  
  // Loaded profiles/details
  const [patient, setPatient] = useState<Patient | null>(null);
  const [conditions, setConditions] = useState<ToothCondition[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [radiographs, setRadiographs] = useState<Radiograph[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [drugTemplates, setDrugTemplates] = useState<DrugTemplate[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  // 7. Consents tab state
  const [consents, setConsents] = useState<Consent[]>([]);
  const [consentTemplates, setConsentTemplates] = useState<ConsentTemplate[]>([]);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [signerName, setSignerName] = useState('');
  const [isGuardian, setIsGuardian] = useState(false);
  const [guardianRelation, setGuardianRelation] = useState('');
  const [witnessName, setWitnessName] = useState('');
  const [submittingConsent, setSubmittingConsent] = useState(false);
  const sigPad = useRef<SignatureCanvas>(null);

  // 8. Active Procedures tab state
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [showProcedureModal, setShowProcedureModal] = useState(false);
  const [newProcTooth, setNewProcTooth] = useState('');
  const [newProcType, setNewProcType] = useState('RCT');
  const [newProcSittings, setNewProcSittings] = useState(3);
  const [newProcCost, setNewProcCost] = useState('800.00');
  const [newProcNotes, setNewProcNotes] = useState('');
  const [expandedProcId, setExpandedProcId] = useState<string | null>(null);
  const [procSteps, setProcSteps] = useState<Record<string, ProcedureStep[]>>({});
  
  // Sitting/Step Creation Modal
  const [showStepModal, setShowStepModal] = useState(false);
  const [activeProcedureId, setActiveProcedureId] = useState<string | null>(null);
  const [newStepDesc, setNewStepDesc] = useState('');
  const [newStepNotes, setNewStepNotes] = useState('');
  const [newStepCost, setNewStepCost] = useState('0.00');
  const [newStepStatus, setNewStepStatus] = useState('completed');
  const [submittingStep, setSubmittingStep] = useState(false);

  // Navigation / Tab state
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Odontogram / Tooth Conditions Tab state
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [selectedSurface, setSelectedSurface] = useState<string | null>(null);
  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [numberingSystem, setNumberingSystem] = useState<'fdi' | 'universal' | 'palmer'>('fdi');
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [condCode, setCondCode] = useState('caries');
  const [condStatus, setCondStatus] = useState<'planned' | 'completed'>('completed');
  const [condNotes, setCondNotes] = useState('');

  // 2. Treatment Plan state
  const [showLogPlanModal, setShowLogPlanModal] = useState(false);
  const [planToothNumber, setPlanToothNumber] = useState<string>('');
  const [planProcedure, setPlanProcedure] = useState('Routine Cleaning');
  const [planEstCost, setPlanEstCost] = useState('150.00');
  const [planNotes, setPlanNotes] = useState('');
  const [planComplaint, setPlanComplaint] = useState('');
  const [planSymptoms, setPlanSymptoms] = useState('');
  const [planDiagnosis, setPlanDiagnosis] = useState('');

  // Completion modal state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completingTreatmentId, setCompletingTreatmentId] = useState<string | null>(null);
  const [completeActualCost, setCompleteActualCost] = useState('150.00');
  const [completeClinicalNotes, setCompleteClinicalNotes] = useState('');

  // 3. X-Ray Gallery state
  const [showUploadXrayModal, setShowUploadXrayModal] = useState(false);
  const [xrayFile, setXrayFile] = useState<File | null>(null);
  const [xrayType, setXrayType] = useState('iopa');
  const [xrayToothNumbers, setXrayToothNumbers] = useState('');
  const [xrayTakenDate, setXrayTakenDate] = useState(new Date().toISOString().split('T')[0]);
  const [xrayNotes, setXrayNotes] = useState('');
  const [uploadingXray, setUploadingXray] = useState(false);
  
  // Lightbox Zoom/Pan
  const [lightboxXray, setLightboxXray] = useState<Radiograph | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // 4. Prescription Generator state
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [rxSearchQuery, setRxSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addedDrugs, setAddedDrugs] = useState<Array<{
    drugName: string;
    dosage: string;
    frequency: string;
    durationDays: number;
    instructions: string;
  }>>([]);
  const [rxAllergyWarnings, setRxAllergyWarnings] = useState<string[]>([]);

  // 5. Patient Documents Vault state
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('medical_history');
  const [docDescription, setDocDescription] = useState('');
  const [docTags, setDocTags] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Fetch core patient data
  const fetchPatientProfile = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/patients/${id}`);
      setPatient(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load patient profile');
    } finally {
      setLoading(false);
    }
  };

  // Fetch clinic settings
  const fetchClinicSettings = async () => {
    try {
      const data = await apiRequest('/clinic-settings');
      if (data && data.toothNumbering) {
        setNumberingSystem(data.toothNumbering);
      }
    } catch (err) {
      console.error('Failed to load clinic settings', err);
    }
  };

  // Fetch tooth conditions
  const fetchToothConditions = async (dateVal = asOfDate) => {
    try {
      const data = await apiRequest(`/tooth-conditions/patient/${id}?asOfDate=${dateVal}`);
      setConditions(data);
    } catch (err) {
      console.error('Failed to fetch tooth conditions', err);
    }
  };

  // Fetch treatments log
  const fetchTreatments = async () => {
    try {
      const data = await apiRequest(`/patients/${id}/treatments`);
      setTreatments(data);
    } catch (err) {
      console.error('Failed to fetch treatments', err);
    }
  };

  // Fetch radiographs
  const fetchRadiographs = async () => {
    try {
      const data = await apiRequest(`/radiographs/patient/${id}`);
      setRadiographs(data);
    } catch (err) {
      console.error('Failed to fetch radiographs', err);
    }
  };

  // Fetch prescriptions
  const fetchPrescriptions = async () => {
    try {
      const data = await apiRequest(`/prescriptions/patient/${id}`);
      setPrescriptions(data);
    } catch (err) {
      console.error('Failed to fetch prescriptions', err);
    }
  };

  // Fetch drug templates
  const fetchDrugTemplates = async () => {
    try {
      const data = await apiRequest('/drug-templates');
      setDrugTemplates(data);
    } catch (err) {
      console.error('Failed to fetch drug templates', err);
    }
  };

  // Fetch timeline
  const fetchTimeline = async () => {
    try {
      const data = await apiRequest(`/timeline/patient/${id}`);
      setTimeline(data);
    } catch (err) {
      console.error('Failed to fetch timeline', err);
    }
  };

  // Fetch patient consents
  const fetchConsents = async () => {
    try {
      const data = await apiRequest(`/consents/patient/${id}`);
      setConsents(data);
    } catch (err) {
      console.error('Failed to fetch consents', err);
    }
  };

  // Fetch consent templates
  const fetchConsentTemplates = async () => {
    try {
      const data = await apiRequest('/consents/templates');
      setConsentTemplates(data);
      if (data.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch consent templates', err);
    }
  };

  // Fetch active procedures
  const fetchProcedures = async () => {
    try {
      const data = await apiRequest(`/procedures/patient/${id}`);
      setProcedures(data);
      // Auto fetch steps for each procedure
      data.forEach((p: any) => fetchSteps(p.id));
    } catch (err) {
      console.error('Failed to fetch procedures', err);
    }
  };

  // Fetch procedure steps
  const fetchSteps = async (procId: string) => {
    try {
      const data = await apiRequest(`/procedures/${procId}/steps`);
      setProcSteps(prev => ({ ...prev, [procId]: data }));
    } catch (err) {
      console.error(`Failed to fetch steps for procedure ${procId}`, err);
    }
  };

  // Fetch patient documents
  const fetchDocuments = async () => {
    try {
      setLoadingDocs(true);
      const data = await apiRequest(`/patient-documents/patient/${id}`);
      setDocuments(data);
    } catch (err) {
      console.error('Failed to fetch patient documents', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleUploadDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) return;

    try {
      setUploadingDoc(true);
      const formData = new FormData();
      formData.append('file', docFile);
      formData.append('patientId', id!);
      formData.append('documentType', docType);
      if (docDescription) formData.append('description', docDescription);
      if (docTags) formData.append('tags', docTags);

      await apiRequest('/patient-documents/upload', {
        method: 'POST',
        body: formData,
      });

      setShowUploadDocModal(false);
      setDocFile(null);
      setDocDescription('');
      setDocTags('');
      fetchDocuments();
    } catch (err: any) {
      alert(err.message || 'Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await apiRequest(`/patient-documents/${docId}`, { method: 'DELETE' });
      fetchDocuments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete document');
    }
  };

  useEffect(() => {
    if (id) {
      fetchPatientProfile();
      fetchClinicSettings();
      fetchToothConditions();
      fetchTreatments();
      fetchRadiographs();
      fetchPrescriptions();
      fetchDrugTemplates();
      fetchTimeline();
      fetchConsents();
      fetchConsentTemplates();
      fetchProcedures();
      fetchDocuments();
    }
  }, [id]);

  // Handle Tab Switch
  const handleTabSwitch = (tab: TabType) => {
    setActiveTab(tab);
    // Reload active tab details
    if (tab === 'overview') fetchToothConditions();
    if (tab === 'treatment-plan' || tab === 'treatment-history') fetchTreatments();
    if (tab === 'xrays') fetchRadiographs();
    if (tab === 'prescriptions') fetchPrescriptions();
    if (tab === 'timeline') fetchTimeline();
    if (tab === 'consents') {
      fetchConsents();
      fetchConsentTemplates();
    }
    if (tab === 'procedures') {
      fetchProcedures();
    }
    if (tab === 'documents') {
      fetchDocuments();
    }
  };

  // 1. Odontogram handlers
  const handleSurfaceClick = (toothNumber: string, surface: string | null) => {
    setSelectedTooth(toothNumber);
    setSelectedSurface(surface);
    
    // Look up if a condition already exists on this tooth/surface
    const existing = conditions.find(c => c.toothNumber === toothNumber && c.surface === surface);
    if (existing) {
      setCondCode(existing.conditionCode);
      setCondStatus(existing.status as any);
      setCondNotes(existing.notes || '');
    } else {
      setCondCode('caries');
      setCondStatus('completed');
      setCondNotes('');
    }
    setShowConditionModal(true);
  };

  const handleSaveCondition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTooth) return;

    try {
      const existing = conditions.find(c => c.toothNumber === selectedTooth && c.surface === selectedSurface);
      
      if (condCode === 'healthy') {
        // If code is "healthy", delete existing condition record
        if (existing) {
          await apiRequest(`/tooth-conditions/${existing.id}`, { method: 'DELETE' });
        }
      } else {
        const payload = {
          patientId: id!,
          toothNumber: selectedTooth,
          surface: selectedSurface || undefined,
          conditionCode: condCode,
          status: condStatus,
          notes: condNotes || undefined,
          dateRecorded: asOfDate,
        };

        if (existing) {
          await apiRequest(`/tooth-conditions/${existing.id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          });
        } else {
          await apiRequest('/tooth-conditions', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
        }
      }
      
      setShowConditionModal(false);
      setSelectedTooth(null);
      setSelectedSurface(null);
      fetchToothConditions();
    } catch (err) {
      console.error('Failed to save tooth condition', err);
    }
  };

  // 2. Treatment Plan handlers
  const handleProposeProcedure = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/treatments', {
        method: 'POST',
        body: JSON.stringify({
          patientId: id!,
          toothNumber: planToothNumber ? parseInt(planToothNumber) : undefined,
          procedureName: planProcedure,
          price: planEstCost,
          status: 'PROPOSED',
          notes: planNotes || undefined,
          chiefComplaint: planComplaint || undefined,
          symptoms: planSymptoms || undefined,
          diagnosis: planDiagnosis || undefined,
          estimatedCost: planEstCost,
        }),
      });

      setShowLogPlanModal(false);
      setPlanToothNumber('');
      setPlanProcedure('Routine Cleaning');
      setPlanEstCost('150.00');
      setPlanNotes('');
      setPlanComplaint('');
      setPlanSymptoms('');
      setPlanDiagnosis('');
      fetchTreatments();
    } catch (err) {
      console.error('Failed to log planned treatment', err);
    }
  };

  const handleAcceptPlan = async (treatmentId: string) => {
    try {
      await apiRequest(`/treatments/${treatmentId}/accept`, { method: 'PATCH' });
      fetchTreatments();
    } catch (err) {
      console.error('Failed to accept treatment', err);
    }
  };

  const handleCancelPlan = async (treatmentId: string) => {
    try {
      await apiRequest(`/treatments/${treatmentId}/cancel`, { method: 'PATCH' });
      fetchTreatments();
    } catch (err) {
      console.error('Failed to cancel treatment', err);
    }
  };

  const handleOpenCompleteModal = (item: Treatment) => {
    setCompletingTreatmentId(item.id);
    setCompleteActualCost(item.estimatedCost || item.price);
    setCompleteClinicalNotes(item.notes || '');
    setShowCompleteModal(true);
  };

  const handleCompleteTreatmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTreatmentId) return;

    try {
      await apiRequest(`/treatments/${completingTreatmentId}/complete`, {
        method: 'PATCH',
        body: JSON.stringify({
          price: completeActualCost,
          clinicalNotes: completeClinicalNotes,
        }),
      });

      setShowCompleteModal(false);
      setCompletingTreatmentId(null);
      fetchTreatments();
    } catch (err) {
      console.error('Failed to complete treatment', err);
    }
  };

  // 3. X-Ray Handlers
  const handleXrayUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!xrayFile) return;

    try {
      setUploadingXray(true);
      const formData = new FormData();
      formData.append('file', xrayFile);
      formData.append('patientId', id!);
      formData.append('imageType', xrayType);
      formData.append('toothNumbers', xrayToothNumbers);
      formData.append('takenDate', xrayTakenDate);
      formData.append('notes', xrayNotes);

      await apiRequest('/radiographs/upload', {
        method: 'POST',
        body: formData,
      });

      setShowUploadXrayModal(false);
      setXrayFile(null);
      setXrayToothNumbers('');
      setXrayNotes('');
      fetchRadiographs();
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploadingXray(false);
    }
  };

  // Lightbox Zoom/Pan Handlers
  const openLightbox = (x: Radiograph) => {
    setLightboxXray(x);
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoomScale(prev => {
      const next = direction === 'in' ? prev + 0.25 : prev - 0.25;
      return Math.max(0.5, Math.min(next, 3));
    });
  };

  // Pan Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPanOffset({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y
    });
  };

  // 4. Prescription Handlers
  const handleAddDrug = (template: DrugTemplate) => {
    const newDrug = {
      drugName: template.name,
      dosage: template.defaultDosage || '1 tab',
      frequency: template.defaultFrequency || '1-0-1',
      durationDays: template.defaultDuration || 5,
      instructions: template.defaultInstructions || 'After food',
    };

    const nextDrugs = [...addedDrugs, newDrug];
    setAddedDrugs(nextDrugs);
    setRxSearchQuery('');
    setShowSuggestions(false);
    
    // Check allergy warnings
    checkAllergyWarnings(nextDrugs);
  };

  const checkAllergyWarnings = (drugs: typeof addedDrugs) => {
    if (!patient) return;
    const warnings: string[] = [];

    drugs.forEach(d => {
      // Find template to get contraindications
      const tmpl = drugTemplates.find(t => t.name === d.drugName);
      if (tmpl && tmpl.contraindications) {
        tmpl.contraindications.forEach(ci => {
          // Compare patient allergies
          const matchedAllergy = patient.allergies.find(
            a => a.toLowerCase() === ci.toLowerCase()
          );
          if (matchedAllergy) {
            warnings.push(
              `Warning: Patient is allergic to ${matchedAllergy} — ${d.drugName} is contraindicated!`
            );
          }
        });
      }
    });
    setRxAllergyWarnings(warnings);
  };

  const handleRemoveAddedDrug = (idx: number) => {
    const nextDrugs = addedDrugs.filter((_, i) => i !== idx);
    setAddedDrugs(nextDrugs);
    checkAllergyWarnings(nextDrugs);
  };

  const handlePrescriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addedDrugs.length === 0) return;

    try {
      await apiRequest('/prescriptions', {
        method: 'POST',
        body: JSON.stringify({
          patientId: id!,
          items: addedDrugs,
        }),
      });

      setShowPrescriptionModal(false);
      setAddedDrugs([]);
      setRxAllergyWarnings([]);
      fetchPrescriptions();
    } catch (err) {
      console.error('Failed to create prescription', err);
    }
  };

  // Filter drug templates by query
  const filteredSuggestions = drugTemplates.filter(t => 
    t.name.toLowerCase().includes(rxSearchQuery.toLowerCase()) ||
    (t.genericName && t.genericName.toLowerCase().includes(rxSearchQuery.toLowerCase()))
  );

  // 7. Consents Handlers
  const handleConsentFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateId || !sigPad.current || sigPad.current.isEmpty()) {
      alert('Please select a template and sign in the canvas box.');
      return;
    }

    try {
      setSubmittingConsent(true);
      const signatureData = sigPad.current.getTrimmedCanvas().toDataURL('image/png');
      
      await apiRequest('/consents', {
        method: 'POST',
        body: JSON.stringify({
          patientId: id!,
          templateId: selectedTemplateId,
          signatureData,
          signerName,
          isGuardian,
          guardianRelation: isGuardian ? guardianRelation : undefined,
          witnessName: witnessName || undefined,
        }),
      });

      setShowConsentModal(false);
      setSignerName('');
      setIsGuardian(false);
      setGuardianRelation('');
      setWitnessName('');
      fetchConsents();
      fetchTimeline();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to submit signed consent form.');
    } finally {
      setSubmittingConsent(false);
    }
  };

  // 8. Active Procedures Handlers
  const handleCreateProcedure = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/procedures', {
        method: 'POST',
        body: JSON.stringify({
          patientId: id!,
          toothNumber: newProcTooth || undefined,
          procedureType: newProcType,
          startDate: new Date().toISOString().split('T')[0],
          expectedSittings: Number(newProcSittings),
          totalCost: newProcCost,
          notes: newProcNotes || undefined,
        }),
      });
      setShowProcedureModal(false);
      setNewProcTooth('');
      setNewProcNotes('');
      fetchProcedures();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to start new procedure.');
    }
  };

  const handleOpenStepModal = (procId: string) => {
    const nextStepNum = (procSteps[procId]?.length || 0) + 1;
    setActiveProcedureId(procId);
    setNewStepDesc(`Sitting #${nextStepNum}`);
    setNewStepNotes('');
    setNewStepCost('0.00');
    setNewStepStatus('completed');
    setShowStepModal(true);
  };

  const handleCreateStepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProcedureId) return;

    try {
      setSubmittingStep(true);
      const nextStepNum = (procSteps[activeProcedureId]?.length || 0) + 1;
      await apiRequest(`/procedures/${activeProcedureId}/steps`, {
        method: 'POST',
        body: JSON.stringify({
          stepNumber: nextStepNum,
          stepDescription: newStepDesc,
          notes: newStepNotes || undefined,
          costForStep: newStepCost,
          status: newStepStatus,
        }),
      });
      setShowStepModal(false);
      fetchSteps(activeProcedureId);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to add sitting details.');
    } finally {
      setSubmittingStep(false);
    }
  };

  const handleCompleteProcedure = async (procId: string) => {
    if (!window.confirm('Mark this multi-visit procedure as fully completed?')) return;
    try {
      await apiRequest(`/procedures/${procId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'completed' }),
      });
      fetchProcedures();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update procedure status.');
    }
  };

  const toggleProcedureExpanded = (procId: string) => {
    if (expandedProcId === procId) {
      setExpandedProcId(null);
    } else {
      setExpandedProcId(procId);
      fetchSteps(procId);
    }
  };

  // Common procedure mapping defaults for cost auto-fill
  const handlePlanProcedureChange = (val: string) => {
    setPlanProcedure(val);
    if (val === 'Routine Cleaning') setPlanEstCost('150.00');
    else if (val === 'Composite Filling') setPlanEstCost('200.00');
    else if (val === 'Root Canal treatment') setPlanEstCost('800.00');
    else if (val === 'Tooth Extraction') setPlanEstCost('250.00');
    else if (val === 'Dental Crown') setPlanEstCost('1200.00');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading patient profile...</p>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="card" style={{ maxWidth: '500px', margin: '40px auto', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-danger)', marginBottom: '16px' }}>Error</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error || 'Patient not found'}</p>
        <button onClick={() => navigate('/patients')} className="btn btn-primary">
          <ArrowLeft size={18} /> Back to Patients
        </button>
      </div>
    );
  }

  const age = new Date().getFullYear() - new Date(patient.dob).getFullYear();

  return (
    <div>
      {/* Header Summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button onClick={() => navigate('/patients')} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {patient.firstName} {patient.lastName}
            <span style={{ fontSize: '14px', fontWeight: 'normal', color: 'var(--text-muted)' }}>
              ({patient.gender}, {age} years)
            </span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            ID: {patient.id} | Phone: {patient.phone}
          </p>
        </div>
      </div>

      {/* Grid: Sidebar Navigation + Tab Contents */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '16px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '15px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Clinical Hub
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>
                <button 
                  onClick={() => handleTabSwitch('overview')} 
                  className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: '100%', justifyContent: 'flex-start', gap: '10px', padding: '10px 16px' }}
                >
                  <User size={18} /> Odontogram & Info
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabSwitch('treatment-plan')} 
                  className={`btn ${activeTab === 'treatment-plan' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: '100%', justifyContent: 'flex-start', gap: '10px', padding: '10px 16px' }}
                >
                  <FileText size={18} /> Treatment Plan
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabSwitch('treatment-history')} 
                  className={`btn ${activeTab === 'treatment-history' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: '100%', justifyContent: 'flex-start', gap: '10px', padding: '10px 16px' }}
                >
                  <Activity size={18} /> Treatment History
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabSwitch('xrays')} 
                  className={`btn ${activeTab === 'xrays' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: '100%', justifyContent: 'flex-start', gap: '10px', padding: '10px 16px' }}
                >
                  <ImageIcon size={18} /> X-Ray Manager
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabSwitch('prescriptions')} 
                  className={`btn ${activeTab === 'prescriptions' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: '100%', justifyContent: 'flex-start', gap: '10px', padding: '10px 16px' }}
                >
                  <Clipboard size={18} /> Prescription PDF
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabSwitch('timeline')} 
                  className={`btn ${activeTab === 'timeline' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: '100%', justifyContent: 'flex-start', gap: '10px', padding: '10px 16px' }}
                >
                  <Clock size={18} /> Patient Timeline
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabSwitch('consents')} 
                  className={`btn ${activeTab === 'consents' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: '100%', justifyContent: 'flex-start', gap: '10px', padding: '10px 16px' }}
                >
                  <CheckSquare size={18} /> Digital Consents
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabSwitch('procedures')} 
                  className={`btn ${activeTab === 'procedures' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: '100%', justifyContent: 'flex-start', gap: '10px', padding: '10px 16px' }}
                >
                  <Layers size={18} /> Active Procedures
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabSwitch('documents')} 
                  className={`btn ${activeTab === 'documents' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: '100%', justifyContent: 'flex-start', gap: '10px', padding: '10px 16px' }}
                >
                  <FileText size={18} /> Documents Vault
                </button>
              </li>
            </ul>
          </div>

          <div className="card" style={{ padding: '16px' }}>
            <h4 style={{ marginBottom: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>Medical Profile</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Allergies</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                  {patient.allergies.length === 0 ? (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No known allergies</span>
                  ) : (
                    patient.allergies.map((a, i) => (
                      <span key={i} className="badge badge-danger" style={{ textTransform: 'none', fontSize: '11px' }}>{a}</span>
                    ))
                  )}
                </div>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Medical History</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                  {patient.medicalHistory.length === 0 ? (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>None recorded</span>
                  ) : (
                    patient.medicalHistory.map((h, i) => (
                      <span key={i} className="badge badge-info" style={{ textTransform: 'none', fontSize: '11px' }}>{h}</span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Tab Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* TAB 1: OVERVIEW & ODONTOGRAM */}
          {activeTab === 'overview' && (
            <div>
              <div className="card" style={{ marginBottom: '24px' }}>
                <h2 className="card-title">Patient Overview</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', fontSize: '14px' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Full Name</span>
                    <p style={{ fontWeight: 600, marginTop: '2px' }}>{patient.firstName} {patient.lastName}</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Date of Birth</span>
                    <p style={{ fontWeight: 600, marginTop: '2px' }}>{patient.dob}</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Gender</span>
                    <p style={{ fontWeight: 600, marginTop: '2px' }}>{patient.gender}</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Contact Phone</span>
                    <p style={{ fontWeight: 600, marginTop: '2px' }}>{patient.phone}</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Email Address</span>
                    <p style={{ fontWeight: 600, marginTop: '2px' }}>{patient.email || 'N/A'}</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Residential Address</span>
                    <p style={{ fontWeight: 600, marginTop: '2px' }}>{patient.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Dental Odontogram */}
              <div className="card">
                <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Odontogram (Interactive Tooth Chart)</span>
                  
                  {/* Time Travel Slider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>View Chart As Of:</span>
                    <input 
                      type="date" 
                      className="form-input" 
                      style={{ width: '150px', padding: '6px 12px' }} 
                      value={asOfDate}
                      onChange={(e) => {
                        setAsOfDate(e.target.value);
                        fetchToothConditions(e.target.value);
                      }}
                    />
                  </div>
                </div>
                
                {/* Visual Chart Component */}
                <DentalChart
                  conditions={conditions}
                  selectedTooth={selectedTooth}
                  selectedSurface={selectedSurface}
                  onSurfaceClick={handleSurfaceClick}
                  numberingSystem={numberingSystem}
                />

                <p style={{ fontStyle: 'italic', fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px' }}>
                  * Click any specific tooth surface (Buccal/Lingual/Mesial/Distal/Occlusal) or outer tooth zone to log clinical caries, crowns, fillings, or extractions.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: TREATMENT PLAN */}
          {activeTab === 'treatment-plan' && (
            <div className="card">
              <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Proposed Treatment Plans</span>
                {(user?.role === 'ADMIN' || user?.role === 'DENTIST') && (
                  <button onClick={() => setShowLogPlanModal(true)} className="btn btn-primary" style={{ padding: '8px 16px' }}>
                    <Plus size={16} /> Propose Procedure
                  </button>
                )}
              </div>

              {treatments.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No active proposed treatments for this patient.</p>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date Proposed</th>
                        <th>Tooth #</th>
                        <th>Procedure</th>
                        <th>Est. Price</th>
                        <th>Status</th>
                        <th>Clinical Details</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {treatments
                        .filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED')
                        .map(t => (
                          <tr key={t.id}>
                            <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                            <td>{t.toothNumber ? `Tooth #${getDisplayNumber(String(t.toothNumber), numberingSystem)}` : 'General'}</td>
                            <td style={{ fontWeight: 600 }}>{t.procedureName}</td>
                            <td>${t.estimatedCost || t.price}</td>
                            <td>
                              <span className={`badge ${t.status === 'ACCEPTED' ? 'badge-info' : 'badge-warning'}`}>
                                {t.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {t.diagnosis && <div><strong>Dx:</strong> {t.diagnosis}</div>}
                                {t.notes && <div><strong>Notes:</strong> {t.notes}</div>}
                              </div>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                {t.status === 'PROPOSED' && (
                                  <button onClick={() => handleAcceptPlan(t.id)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                                    Accept
                                  </button>
                                )}
                                {(user?.role === 'ADMIN' || user?.role === 'DENTIST') && (
                                  <button onClick={() => handleOpenCompleteModal(t)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                                    Execute
                                  </button>
                                )}
                                <button onClick={() => handleCancelPlan(t.id)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }}>
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TREATMENT HISTORY */}
          {activeTab === 'treatment-history' && (
            <div className="card">
              <h2 className="card-title">Completed Treatment Records</h2>
              {treatments.filter(t => t.status === 'COMPLETED' || t.status === 'CANCELLED').length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No completed treatment records found.</p>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date Completed</th>
                        <th>Tooth #</th>
                        <th>Procedure Completed</th>
                        <th>Final Price</th>
                        <th>Status</th>
                        <th>Dentist Notes & Summary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {treatments
                        .filter(t => t.status === 'COMPLETED' || t.status === 'CANCELLED')
                        .map(t => (
                          <tr key={t.id}>
                            <td>{t.completedAt ? new Date(t.completedAt).toLocaleDateString() : new Date(t.createdAt).toLocaleDateString()}</td>
                            <td>{t.toothNumber ? `Tooth #${getDisplayNumber(String(t.toothNumber), numberingSystem)}` : 'General'}</td>
                            <td style={{ fontWeight: 600 }}>{t.procedureName}</td>
                            <td>${t.price}</td>
                            <td>
                              <span className={`badge ${t.status === 'COMPLETED' ? 'badge-success' : 'badge-danger'}`}>
                                {t.status}
                              </span>
                            </td>
                            <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                              {t.clinicalNotes || t.notes || '-'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: X-RAY GALLERY */}
          {activeTab === 'xrays' && (
            <div className="card">
              <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Radiographs & Dental Scans</span>
                {(user?.role === 'ADMIN' || user?.role === 'DENTIST') && (
                  <button onClick={() => setShowUploadXrayModal(true)} className="btn btn-primary" style={{ padding: '8px 16px' }}>
                    <Upload size={16} /> Upload New Scan
                  </button>
                )}
              </div>

              {radiographs.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No X-ray files uploaded yet.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginTop: '10px' }}>
                  {radiographs.map((x) => (
                    <div 
                      key={x.id} 
                      className="card" 
                      onClick={() => openLightbox(x)}
                      style={{ 
                        padding: '8px', 
                        cursor: 'pointer', 
                        border: '1px solid var(--panel-border)',
                        background: 'rgba(255,255,255,0.02)',
                        transition: 'transform 0.2s',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                    >
                      <img 
                        src={x.thumbnailUrl || x.imageUrl} 
                        alt={x.imageType} 
                        style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                      />
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontWeight: 600, fontSize: '13px', textTransform: 'uppercase' }}>
                          {x.imageType}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Taken: {x.takenDate ? new Date(x.takenDate).toLocaleDateString() : 'N/A'}
                        </div>
                        {x.toothNumbers && (
                          <div className="badge badge-info" style={{ fontSize: '10px', textTransform: 'none', marginTop: '4px' }}>
                            Teeth: {x.toothNumbers}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PRESCRIPTION GENERATOR */}
          {activeTab === 'prescriptions' && (
            <div className="card">
              <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Issued Prescriptions & Rx Logs</span>
                {(user?.role === 'ADMIN' || user?.role === 'DENTIST') && (
                  <button onClick={() => setShowPrescriptionModal(true)} className="btn btn-primary" style={{ padding: '8px 16px' }}>
                    <Plus size={16} /> New Prescription
                  </button>
                )}
              </div>

              {prescriptions.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No prescriptions written yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {prescriptions.map(p => (
                    <div key={p.id} className="card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--panel-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '15px' }}>Prescription Issued</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Date: {new Date(p.date).toLocaleDateString()}</div>
                        </div>
                        {p.pdfUrl && (
                          <a href={p.pdfUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
                            <Download size={14} /> Download PDF
                          </a>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {p.items.map((itm, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
                            <div>
                              <strong>{itm.drugName}</strong> ({itm.dosage})
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{itm.instructions}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div>{itm.frequency}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{itm.durationDays} Days</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="card">
              <h2 className="card-title">Patient Journey Timeline</h2>
              {timeline.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No timeline interactions recorded.</p>
              ) : (
                <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px solid rgba(255,255,255,0.05)', marginLeft: '12px' }}>
                  {timeline.map((evt) => (
                    <div key={evt.id} style={{ position: 'relative', marginBottom: '24px' }}>
                      
                      {/* Node point */}
                      <div style={{
                        position: 'absolute',
                        left: '-31px',
                        top: '4px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: 
                          evt.type === 'treatment' ? '#10b981' :
                          evt.type === 'appointment' ? '#3b82f6' :
                          evt.type === 'prescription' ? '#8b5cf6' :
                          evt.type === 'radiograph' ? '#f59e0b' : '#06b6d4',
                        boxShadow: '0 0 8px rgba(255,255,255,0.2)'
                      }} />
                      
                      <div className="card" style={{ padding: '16px', margin: 0, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--panel-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 600, fontSize: '14px' }}>{evt.title}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(evt.date).toLocaleString()}</span>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                          {evt.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: CONSENTS */}
          {activeTab === 'consents' && (
            <div className="card">
              <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Signed Consent Forms</span>
                {(user?.role === 'ADMIN' || user?.role === 'DENTIST') && (
                  <button onClick={() => setShowConsentModal(true)} className="btn btn-primary" style={{ padding: '8px 16px' }}>
                    <Plus size={16} /> Sign Consent Document
                  </button>
                )}
              </div>

              {consents.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No signed consent documents found for this patient.</p>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date Signed</th>
                        <th>Template</th>
                        <th>Procedure</th>
                        <th>Signer</th>
                        <th>Witness</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consents.map((c) => (
                        <tr key={c.id}>
                          <td>{new Date(c.consent.signedAt).toLocaleDateString()}</td>
                          <td style={{ fontWeight: 600 }}>{c.templateTitle}</td>
                          <td>{c.procedureType}</td>
                          <td>{c.consent.signerName} {c.consent.isGuardian && `(Guardian: ${c.consent.guardianRelation})`}</td>
                          <td>{c.consent.witnessName || '-'}</td>
                          <td style={{ textAlign: 'right' }}>
                            {c.consent.pdfUrl && (
                              <a href={c.consent.pdfUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
                                <Download size={12} /> View PDF
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: PROCEDURES */}
          {activeTab === 'procedures' && (
            <div className="card">
              <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Multi-Visit Procedure Tracking</span>
                {(user?.role === 'ADMIN' || user?.role === 'DENTIST') && (
                  <button onClick={() => setShowProcedureModal(true)} className="btn btn-primary" style={{ padding: '8px 16px' }}>
                    <Plus size={16} /> Start New Procedure
                  </button>
                )}
              </div>

              {procedures.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No active multi-visit procedures tracked.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {procedures.map((p) => {
                    const steps = procSteps[p.id] || [];
                    const completedSteps = steps.filter(s => s.status === 'completed').length;
                    const totalSteps = p.expectedSittings || 1;
                    const progressPercent = Math.min(100, Math.round((completedSteps / totalSteps) * 100));
                    const isExpanded = expandedProcId === p.id;

                    return (
                      <div key={p.id} className="card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--panel-border)', margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {p.procedureType}
                              {p.toothNumber && <span className="badge badge-info">Tooth #{getDisplayNumber(String(p.toothNumber), numberingSystem)}</span>}
                              <span className={`badge ${p.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                                {p.status === 'in_progress' ? 'In Progress' : p.status}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                              Started: {new Date(p.startDate).toLocaleDateString()} | Total Cost: ${p.totalCost || '0.00'}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => toggleProcedureExpanded(p.id)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                              {isExpanded ? 'Hide Sittings' : `View Sittings (${steps.length})`}
                            </button>
                            {p.status === 'in_progress' && (user?.role === 'ADMIN' || user?.role === 'DENTIST') && (
                              <>
                                <button onClick={() => handleOpenStepModal(p.id)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                                  Log Sitting
                                </button>
                                <button onClick={() => handleCompleteProcedure(p.id)} className="btn btn-success" style={{ padding: '6px 12px', fontSize: '12px' }}>
                                  Complete
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ margin: '12px 0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            <span>Progress</span>
                            <span>{completedSteps} of {totalSteps} Sittings ({progressPercent}%)</span>
                          </div>
                          <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.3s' }} />
                          </div>
                        </div>

                        {p.notes && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic', margin: '8px 0 0 0' }}>Notes: {p.notes}</p>}

                        {/* Expanded steps list */}
                        {isExpanded && (
                          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)' }}>
                            <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>Sitting Logs</h4>
                            {steps.length === 0 ? (
                              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No sittings logged yet.</p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {steps.map((step) => (
                                  <div key={step.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
                                    <div>
                                      <strong>{step.stepDescription}</strong>
                                      {step.dentistNotes && <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{step.dentistNotes}</div>}
                                    </div>
                                    <div style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                                      <div>{step.date ? new Date(step.date).toLocaleDateString() : 'N/A'}</div>
                                      {step.costForStep && <div>Cost: ${step.costForStep}</div>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 9: DOCUMENTS VAULT */}
          {activeTab === 'documents' && (
            <div className="card">
              <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Patient Documents Vault</span>
                <button onClick={() => setShowUploadDocModal(true)} className="btn btn-primary" style={{ padding: '8px 16px' }}>
                  <Plus size={16} /> Upload General Document
                </button>
              </div>

              {loadingDocs ? (
                <p style={{ color: 'var(--text-secondary)' }}>Loading vault documents...</p>
              ) : documents.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No documents found in the patient vault.</p>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date Uploaded</th>
                        <th>Document Name</th>
                        <th>Type</th>
                        <th>Description / Tags</th>
                        <th>Size</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => {
                        const dateLabel = new Date(doc.createdAt).toLocaleDateString();
                        const fileSizeLabel = doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : '—';
                        return (
                          <tr key={doc.id}>
                            <td>{dateLabel}</td>
                            <td>
                              <a href={doc.fileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={16} /> {doc.fileName || 'document.pdf'}
                              </a>
                            </td>
                            <td style={{ textTransform: 'capitalize' }}>
                              <span className="badge badge-info">{doc.documentType.replace(/_/g, ' ')}</span>
                            </td>
                            <td>
                              <div>{doc.description || '—'}</div>
                              {doc.tags && doc.tags.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                                  {doc.tags.map((t: string) => (
                                    <span key={t} className="badge badge-secondary" style={{ fontSize: '10px', textTransform: 'lowercase' }}>{t}</span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td>{fileSizeLabel}</td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Eye size={12} /> View
                                </a>
                                {isAdmin && (
                                  <button onClick={() => handleDeleteDocument(doc.id)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }}>
                                    <Trash size={12} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. Tooth Condition Popup Modal */}
      {showConditionModal && selectedTooth && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <h2 style={{ marginBottom: '20px' }}>
              Tooth #{getDisplayNumber(selectedTooth, numberingSystem)} {selectedSurface ? `(${selectedSurface.toUpperCase()})` : 'Whole Tooth'}
            </h2>
            <form onSubmit={handleSaveCondition}>
              <div className="form-group">
                <label className="form-label">Clinical Condition</label>
                <select className="form-input" value={condCode} onChange={(e) => setCondCode(e.target.value)}>
                  <option value="healthy">Healthy / Normal (Clear Status)</option>
                  <option value="caries">Caries / Cavity</option>
                  <option value="filling">Filling / Restoration</option>
                  <option value="crown">Crown Placement</option>
                  <option value="rct">Root Canal (RCT)</option>
                  <option value="missing">Missing Tooth</option>
                  <option value="fracture">Fractured / Broken Tooth</option>
                  <option value="extraction">Extracted Tooth</option>
                  <option value="implant">Dental Implant</option>
                  <option value="sealant">Sealant Application</option>
                  <option value="veneer">Veneer Placement</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={condStatus} onChange={(e) => setCondStatus(e.target.value as any)}>
                    <option value="completed">Completed (Executed)</option>
                    <option value="planned">Planned (Recommended)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Recorded Date</label>
                  <input type="date" className="form-input" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Clinical Notes</label>
                <textarea 
                  className="form-input" 
                  value={condNotes} 
                  onChange={(e) => setCondNotes(e.target.value)} 
                  style={{ height: '80px', resize: 'none' }}
                  placeholder="Record diagnostics or patient comments..."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => { setShowConditionModal(false); setSelectedTooth(null); setSelectedSurface(null); }} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Propose Treatment Plan Modal */}
      {showLogPlanModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <h2 style={{ marginBottom: '20px' }}>Propose Clinical Treatment</h2>
            <form onSubmit={handleProposeProcedure}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Tooth Number (FDI)</label>
                  <select className="form-input" value={planToothNumber} onChange={(e) => setPlanToothNumber(e.target.value)}>
                    <option value="">General / Whole Mouth</option>
                    {TOOTH_MAP.map(t => (
                      <option key={t.fdi} value={t.fdi}>Tooth #{getDisplayNumber(t.fdi, numberingSystem)} ({t.name})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Procedure Type</label>
                  <select className="form-input" value={planProcedure} onChange={(e) => handlePlanProcedureChange(e.target.value)}>
                    <option value="Routine Cleaning">Routine Cleaning</option>
                    <option value="Composite Filling">Composite Filling</option>
                    <option value="Root Canal treatment">Root Canal treatment</option>
                    <option value="Tooth Extraction">Tooth Extraction</option>
                    <option value="Dental Crown">Dental Crown</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Estimated Cost ($)</label>
                  <input type="text" className="form-input" value={planEstCost} onChange={(e) => setPlanEstCost(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Chief Complaint</label>
                  <input type="text" className="form-input" value={planComplaint} onChange={(e) => setPlanComplaint(e.target.value)} placeholder="e.g. Pain in tooth" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Symptoms</label>
                  <input type="text" className="form-input" value={planSymptoms} onChange={(e) => setPlanSymptoms(e.target.value)} placeholder="e.g. Hot/cold sensitivity" />
                </div>
                <div className="form-group">
                  <label className="form-label">Clinical Diagnosis</label>
                  <input type="text" className="form-input" value={planDiagnosis} onChange={(e) => setPlanDiagnosis(e.target.value)} placeholder="e.g. Deep caries" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Instructions / Advice</label>
                <textarea 
                  className="form-input" 
                  value={planNotes} 
                  onChange={(e) => setPlanNotes(e.target.value)} 
                  style={{ height: '80px', resize: 'none' }}
                  placeholder="Record planned details or pre-procedure directions..."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowLogPlanModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Propose Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Execute Treatment Completion Modal */}
      {showCompleteModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <h2 style={{ marginBottom: '20px' }}>Complete Dental Procedure</h2>
            <form onSubmit={handleCompleteTreatmentSubmit}>
              <div className="form-group">
                <label className="form-label">Final Actual Cost ($)</label>
                <input type="text" className="form-input" value={completeActualCost} onChange={(e) => setCompleteActualCost(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Execution Clinical Notes</label>
                <textarea 
                  className="form-input" 
                  value={completeClinicalNotes} 
                  onChange={(e) => setCompleteClinicalNotes(e.target.value)} 
                  style={{ height: '100px', resize: 'none' }}
                  placeholder="Details of anesthesia used, canal sizes, restorations placed, and post-op instructions..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => { setShowCompleteModal(false); setCompletingTreatmentId(null); }} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Log Completion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Upload X-Ray Modal */}
      {showUploadXrayModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <h2 style={{ marginBottom: '20px' }}>Upload Dental Radiograph</h2>
            <form onSubmit={handleXrayUpload}>
              <div className="form-group">
                <label className="form-label">Scan File</label>
                <input 
                  type="file" 
                  className="form-input" 
                  accept="image/*" 
                  onChange={(e) => setXrayFile(e.target.files ? e.target.files[0] : null)} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Scan Type</label>
                  <select className="form-input" value={xrayType} onChange={(e) => setXrayType(e.target.value)}>
                    <option value="iopa">IOPA (Intraoral)</option>
                    <option value="opg">OPG (Panoramic)</option>
                    <option value="bitewing">Bitewing</option>
                    <option value="cbct">CBCT 3D Scan</option>
                    <option value="intraoral_photo">Intraoral Photo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date Taken</label>
                  <input type="date" className="form-input" value={xrayTakenDate} onChange={(e) => setXrayTakenDate(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tagged Teeth Numbers (e.g. "14, 15")</label>
                <input type="text" className="form-input" value={xrayToothNumbers} onChange={(e) => setXrayToothNumbers(e.target.value)} placeholder="Leave blank if general" />
              </div>

              <div className="form-group">
                <label className="form-label">Radiograph Notes</label>
                <textarea 
                  className="form-input" 
                  value={xrayNotes} 
                  onChange={(e) => setXrayNotes(e.target.value)} 
                  style={{ height: '80px', resize: 'none' }}
                  placeholder="Record clinical analysis details..."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowUploadXrayModal(false)} className="btn btn-secondary" disabled={uploadingXray}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploadingXray}>
                  {uploadingXray ? 'Uploading...' : 'Save Radiograph'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. X-Ray Lightbox Viewer */}
      {lightboxXray && (
        <div 
          className="modal-overlay" 
          style={{ background: 'rgba(0, 0, 0, 0.95)', display: 'grid', gridTemplateColumns: '1fr 340px', padding: 0 }}
        >
          {/* Left Canvas view */}
          <div 
            style={{ 
              position: 'relative', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100vh',
              overflow: 'hidden',
              cursor: isPanning ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={() => setIsPanning(false)}
            onMouseLeave={() => setIsPanning(false)}
          >
            {/* Header control buttons */}
            <div style={{ position: 'absolute', top: '20px', left: '20px', display: 'flex', gap: '10px', zIndex: 10 }}>
              <button onClick={() => handleZoom('in')} className="btn btn-secondary" style={{ padding: '8px' }}>
                <ZoomIn size={18} />
              </button>
              <button onClick={() => handleZoom('out')} className="btn btn-secondary" style={{ padding: '8px' }}>
                <ZoomOut size={18} />
              </button>
              <button onClick={() => { setZoomScale(1); setPanOffset({ x: 0, y: 0 }); }} className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '13px' }}>
                Reset View
              </button>
            </div>
            
            <img 
              src={lightboxXray.imageUrl} 
              alt="Scan Detail" 
              draggable="false"
              style={{ 
                transform: `scale(${zoomScale}) translate(${panOffset.x / zoomScale}px, ${panOffset.y / zoomScale}px)`,
                transition: isPanning ? 'none' : 'transform 0.15s ease-out',
                maxHeight: '85vh',
                maxWidth: '90%',
                objectFit: 'contain',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
              }}
            />
          </div>

          {/* Right Information Sidebar */}
          <div 
            style={{ 
              background: 'var(--bg-primary)', 
              borderLeft: '1px solid var(--panel-border)', 
              padding: '24px', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              height: '100vh',
              boxSizing: 'border-box'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ textTransform: 'uppercase', color: 'var(--color-primary)', letterSpacing: '0.05em' }}>
                  {lightboxXray.imageType} Scan
                </h3>
                <button onClick={() => setLightboxXray(null)} className="btn btn-secondary" style={{ padding: '8px' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Date Captured</span>
                  <p style={{ fontWeight: 600, marginTop: '4px' }}>
                    {lightboxXray.takenDate ? new Date(lightboxXray.takenDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Tagged Teeth</span>
                  <p style={{ fontWeight: 600, marginTop: '4px' }}>
                    {lightboxXray.toothNumbers ? `Tooth #${lightboxXray.toothNumbers.split(',').map(tn => getDisplayNumber(tn.trim(), numberingSystem)).join(', ')}` : 'General / Whole Mouth'}
                  </p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Radiologist Notes</span>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                    {lightboxXray.notes || 'No annotations recorded.'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <a 
                href={lightboxXray.imageUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="btn btn-primary" 
                style={{ width: '100%', textDecoration: 'none', display: 'flex', justifyContent: 'center', gap: '8px' }}
              >
                <Eye size={16} /> Open In New Tab
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 6. Prescription Creator Modal */}
      {showPrescriptionModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Create Prescription (Rx)</h2>
              <button onClick={() => { setShowPrescriptionModal(false); setAddedDrugs([]); setRxAllergyWarnings([]); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handlePrescriptionSubmit} style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              
              {/* Allergy alert banner */}
              {rxAllergyWarnings.length > 0 && (
                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ color: '#ef4444', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {rxAllergyWarnings.map((w, idx) => (
                      <span key={idx}>{w}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Autocomplete drug lookup */}
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Search Drug Template</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Type name (e.g. Amoxicillin, Augmentin, Paracetamol...)"
                  value={rxSearchQuery} 
                  onChange={(e) => {
                    setRxSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                />
                
                {showSuggestions && rxSearchQuery.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: '180px',
                    overflowY: 'auto',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: 'var(--radius-md)',
                    zIndex: 20,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
                  }}>
                    {filteredSuggestions.length === 0 ? (
                      <div style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '13px' }}>No matches found</div>
                    ) : (
                      filteredSuggestions.map((t) => (
                        <div 
                          key={t.id} 
                          onClick={() => handleAddDrug(t)}
                          style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '13px' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ fontWeight: 600 }}>{t.name}</div>
                          {t.genericName && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Generic: {t.genericName}</div>}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Added drugs section */}
              <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Prescribed Items ({addedDrugs.length})</span>
                {addedDrugs.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--panel-border)', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
                    No drugs added yet. Use the lookup bar above to search and add templates.
                  </div>
                ) : (
                  addedDrugs.map((d, idx) => (
                    <div key={idx} className="card" style={{ padding: '12px', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--panel-border)', background: 'rgba(255,255,255,0.01)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1.2fr', gap: '10px', flexGrow: 1, marginRight: '16px' }}>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Drug Name</label>
                          <input type="text" className="form-input" style={{ padding: '6px', fontSize: '12px' }} value={d.drugName} readOnly />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Dosage</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ padding: '6px', fontSize: '12px' }} 
                            value={d.dosage} 
                            onChange={(e) => {
                              const next = [...addedDrugs];
                              next[idx].dosage = e.target.value;
                              setAddedDrugs(next);
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Frequency</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ padding: '6px', fontSize: '12px' }} 
                            value={d.frequency} 
                            onChange={(e) => {
                              const next = [...addedDrugs];
                              next[idx].frequency = e.target.value;
                              setAddedDrugs(next);
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Duration (Days)</label>
                          <input 
                            type="number" 
                            className="form-input" 
                            style={{ padding: '6px', fontSize: '12px' }} 
                            value={d.durationDays} 
                            onChange={(e) => {
                              const next = [...addedDrugs];
                              next[idx].durationDays = parseInt(e.target.value) || 0;
                              setAddedDrugs(next);
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Instructions</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ padding: '6px', fontSize: '12px' }} 
                            value={d.instructions} 
                            onChange={(e) => {
                              const next = [...addedDrugs];
                              next[idx].instructions = e.target.value;
                              setAddedDrugs(next);
                            }}
                          />
                        </div>
                      </div>
                      
                      <button type="button" onClick={() => handleRemoveAddedDrug(idx)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}>
                        <Trash size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--panel-border)', paddingTop: '16px', flexShrink: 0 }}>
                <button type="button" onClick={() => { setShowPrescriptionModal(false); setAddedDrugs([]); setRxAllergyWarnings([]); }} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={addedDrugs.length === 0}>
                  Generate Prescription PDF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 7. Sign Consent Modal */}
      {showConsentModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Sign Informed Consent</h2>
              <button onClick={() => { setShowConsentModal(false); setSignerName(''); setIsGuardian(false); setGuardianRelation(''); setWitnessName(''); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleConsentFormSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
              <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '6px', marginBottom: '16px' }}>
                
                <div className="form-group">
                  <label className="form-label">Procedure / Template</label>
                  <select 
                    className="form-input" 
                    value={selectedTemplateId} 
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                  >
                    <option value="">-- Select Template --</option>
                    {consentTemplates.map(t => (
                      <option key={t.id} value={t.id}>{t.title} ({t.procedureType})</option>
                    ))}
                  </select>
                </div>

                {selectedTemplateId && (
                  <div style={{ 
                    background: 'rgba(0,0,0,0.2)', 
                    border: '1px solid var(--panel-border)',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    marginBottom: '16px',
                    lineHeight: '1.5'
                  }}>
                    <strong>Legal Agreement:</strong><br/>
                    {consentTemplates.find(t => t.id === selectedTemplateId)?.legalText}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Signer Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={signerName} 
                      onChange={(e) => setSignerName(e.target.value)} 
                      placeholder="Full legal name"
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Witness Name (Optional)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={witnessName} 
                      onChange={(e) => setWitnessName(e.target.value)} 
                      placeholder="Witness legal name"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={isGuardian} 
                      onChange={(e) => setIsGuardian(e.target.checked)} 
                    />
                    Signing as Parent / Legal Guardian
                  </label>
                </div>

                {isGuardian && (
                  <div className="form-group">
                    <label className="form-label">Guardian Relationship (e.g. Father, Mother)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={guardianRelation} 
                      onChange={(e) => setGuardianRelation(e.target.value)} 
                      placeholder="Relation to patient"
                      required={isGuardian}
                    />
                  </div>
                )}

                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label className="form-label">Patient/Guardian Signature (Draw below)</label>
                  <div style={{ 
                    border: '1px solid var(--panel-border)', 
                    background: '#111', 
                    borderRadius: 'var(--radius-md)', 
                    height: '150px',
                    width: '100%',
                    position: 'relative'
                  }}>
                    <SignatureCanvas
                      ref={sigPad}
                      penColor="white"
                      canvasProps={{ 
                        style: { width: '100%', height: '100%' }
                      }}
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => sigPad.current?.clear()} 
                    className="btn btn-secondary" 
                    style={{ padding: '4px 10px', fontSize: '11px', marginTop: '8px' }}
                  >
                    Clear Canvas
                  </button>
                </div>

              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--panel-border)', paddingTop: '16px', flexShrink: 0 }}>
                <button 
                  type="button" 
                  onClick={() => { setShowConsentModal(false); setSignerName(''); setIsGuardian(false); setGuardianRelation(''); setWitnessName(''); }} 
                  className="btn btn-secondary" 
                  disabled={submittingConsent}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingConsent}>
                  {submittingConsent ? 'Generating PDF...' : 'Sign and Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8a. Start Procedure Modal */}
      {showProcedureModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <h2 style={{ marginBottom: '20px' }}>Start Multi-Visit Procedure</h2>
            <form onSubmit={handleCreateProcedure}>
              <div className="form-group">
                <label className="form-label">Procedure Type</label>
                <select 
                  className="form-input" 
                  value={newProcType} 
                  onChange={(e) => {
                    setNewProcType(e.target.value);
                    if (e.target.value === 'RCT') {
                      setNewProcSittings(3);
                      setNewProcCost('800.00');
                    } else if (e.target.value === 'Implant') {
                      setNewProcSittings(4);
                      setNewProcCost('2500.00');
                    } else {
                      setNewProcSittings(12);
                      setNewProcCost('4000.00');
                    }
                  }}
                >
                  <option value="RCT">Root Canal (RCT)</option>
                  <option value="Implant">Dental Implant</option>
                  <option value="Orthodontics">Orthodontics treatment</option>
                  <option value="Full Mouth Rehab">Full Mouth Rehab</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Tooth Number (Optional)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={newProcTooth} 
                    onChange={(e) => setNewProcTooth(e.target.value)} 
                    placeholder="e.g. 14"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Expected Sittings</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={newProcSittings} 
                    onChange={(e) => setNewProcSittings(Number(e.target.value))} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Total Estimated Cost ($)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newProcCost} 
                  onChange={(e) => setNewProcCost(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Treatment Notes / Plan details</label>
                <textarea 
                  className="form-input" 
                  value={newProcNotes} 
                  onChange={(e) => setNewProcNotes(e.target.value)} 
                  style={{ height: '80px', resize: 'none' }}
                  placeholder="Record staging plan details..."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowProcedureModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Initialize Tracker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8b. Log Sitting Modal */}
      {showStepModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <h2 style={{ marginBottom: '20px' }}>Log Procedure Sitting</h2>
            <form onSubmit={handleCreateStepSubmit}>
              <div className="form-group">
                <label className="form-label">Sitting Description</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newStepDesc} 
                  onChange={(e) => setNewStepDesc(e.target.value)} 
                  placeholder="e.g. Access cavity and BMP"
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Cost split for this step ($)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={newStepCost} 
                    onChange={(e) => setNewStepCost(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sitting Status</label>
                  <select className="form-input" value={newStepStatus} onChange={(e) => setNewStepStatus(e.target.value)}>
                    <option value="completed">Completed</option>
                    <option value="pending">Scheduled / Pending</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Dentist clinical notes for session</label>
                <textarea 
                  className="form-input" 
                  value={newStepNotes} 
                  onChange={(e) => setNewStepNotes(e.target.value)} 
                  style={{ height: '100px', resize: 'none' }}
                  placeholder="Details of what was done (irrigation, obturation, temporary cement, etc.)"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowStepModal(false)} className="btn btn-secondary" disabled={submittingStep}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingStep}>
                  {submittingStep ? 'Saving...' : 'Log Sitting Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Upload Document Modal */}
      {showUploadDocModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <h2 style={{ marginBottom: '20px' }}>Upload Vault Document</h2>
            <form onSubmit={handleUploadDocumentSubmit}>
              <div className="form-group">
                <label className="form-label">Select File *</label>
                <input 
                  type="file" 
                  className="form-input" 
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Document Type *</label>
                <select 
                  className="form-input" 
                  value={docType} 
                  onChange={(e) => setDocType(e.target.value)}
                >
                  <option value="medical_history">Medical History</option>
                  <option value="referral">Referral Letter</option>
                  <option value="lab_report">Lab Report</option>
                  <option value="insurance">Insurance Claim</option>
                  <option value="other">Other / Miscellaneous</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description / Summary</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={docDescription} 
                  onChange={(e) => setDocDescription(e.target.value)} 
                  placeholder="e.g. Patient referral from City General Clinic"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tags (comma-separated)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={docTags} 
                  onChange={(e) => setDocTags(e.target.value)} 
                  placeholder="e.g. referral, orthograde, upper"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowUploadDocModal(false)} className="btn btn-secondary" disabled={uploadingDoc}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploadingDoc}>
                  {uploadingDoc ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
