// MediSync AI - Interoperability & Health Data Exchange Data
import { 
  InteroperabilityConnection, 
  ExchangeTransaction, 
  InboundPatientImport, 
  ABDMConsentArtefact,
  FHIRPatient,
  FHIRPractitioner,
  FHIROrganization,
  FHIREncounter,
  FHIRObservation,
  FHIRCondition,
  FHIRMedicationRequest,
  FHIRServiceRequest,
  FHIRDiagnosticReport,
  FHIRCarePlan,
  FHIRAppointment
} from '../types/interoperability';

export const INITIAL_INTEROPERABILITY_CONNECTIONS: InteroperabilityConnection[] = [
  {
    id: 'conn-abdm-01',
    hospitalId: 'hosp-chn-01',
    name: 'National Health Exchange (ABDM Gateway)',
    identifier: 'IN-ABDM-SBX-CHN-91',
    systemType: 'ABDM_M1_M2',
    connectionStatus: 'Configured_Sandbox',
    isSimulated: true, // Transparent indicator
    endpointUrl: 'https://dev.abdm.gov.in/gateway/v0.5',
    authType: 'ABDM_Gateway_Token',
    authCredentialsMasked: 'sbx_abdm_••••••••••••••••3a9f',
    lastSyncTime: '2 mins ago',
    totalRecords: 1428,
    successRate: 98.7,
    errorStatus: null,
    activeSyncs: 1,
    supportedResources: ['Patient', 'Encounter', 'DiagnosticReport', 'CarePlan', 'Prescription'],
    notes: 'National Digital Health Mission sandbox profile. Milestone 1 (ABHA creation & verification) and Milestone 2 (HIP/HIU consent-driven health data exchange).'
  },
  {
    id: 'conn-apollo-02',
    hospitalId: 'hosp-chn-01',
    name: 'Apollo Integrated Health Network',
    identifier: 'HL7-FHIR-APOLLO-CHN',
    systemType: 'FHIR_R4',
    connectionStatus: 'Connected',
    isSimulated: true,
    endpointUrl: 'https://fhir.apollohealth-sandbox.in/r4',
    authType: 'OAuth2',
    authCredentialsMasked: 'oauth2_token_••••••••••••••••7b12',
    lastSyncTime: '14 mins ago',
    totalRecords: 3290,
    successRate: 99.2,
    errorStatus: null,
    activeSyncs: 0,
    supportedResources: ['Patient', 'Practitioner', 'Condition', 'Observation', 'MedicationRequest', 'ServiceRequest'],
    notes: 'Inter-hospital emergency clinical transfers and specialist tele-consultation data pipe.'
  },
  {
    id: 'conn-mmc-lis-03',
    hospitalId: 'hosp-chn-01',
    name: 'State Central Diagnostic & LIS Exchange',
    identifier: 'LIS-HL7-MMC-402',
    systemType: 'HL7_V2',
    connectionStatus: 'Degraded',
    isSimulated: true,
    endpointUrl: 'mllp://lis.tamilnaduhealth.gov.in:2575',
    authType: 'Mutual_TLS',
    authCredentialsMasked: 'mtls_cert_••••••••••••••••09ef',
    lastSyncTime: '38 mins ago',
    totalRecords: 894,
    successRate: 91.5,
    errorStatus: 'Intermittent MLLP ACK timeout on batch Troponin reports',
    activeSyncs: 0,
    supportedResources: ['Observation', 'DiagnosticReport'],
    notes: 'Automated bi-directional state reference laboratory sync for critical pathology & microbiology cultures.'
  },
  {
    id: 'conn-pacs-dicom-04',
    hospitalId: 'hosp-chn-01',
    name: 'Regional PACS & Diagnostic Imaging Hub',
    identifier: 'DICOM-WADO-CHN-12',
    systemType: 'DICOM_WEB',
    connectionStatus: 'Connected',
    isSimulated: true,
    endpointUrl: 'https://pacs.medisync-sandbox.org/dicom-web',
    authType: 'API_Key',
    authCredentialsMasked: 'pacs_key_••••••••••••••••4d88',
    lastSyncTime: '1 hour ago',
    totalRecords: 450,
    successRate: 99.8,
    errorStatus: null,
    activeSyncs: 0,
    supportedResources: ['DiagnosticReport', 'ServiceRequest'],
    notes: 'DICOMweb (WADO-RS / QIDO-RS) tele-radiology stream for CT Angiography and 12-lead ECG telemetry.'
  }
];

export const INITIAL_EXCHANGE_TRANSACTIONS: ExchangeTransaction[] = [
  {
    id: 'tx-8001',
    transactionId: 'TX-FHIR-20261127-01',
    timestamp: '2026-11-27 10:48:12',
    hospitalId: 'hosp-chn-01',
    connectionId: 'conn-abdm-01',
    systemName: 'National Health Exchange (ABDM)',
    resourceType: 'DiagnosticReport',
    direction: 'OUTBOUND',
    recordCount: 1,
    status: 'SUCCESS',
    patientRef: 'PT-8941',
    patientName: 'Murugesan K.',
    abhaId: '91-4428-1902-8814',
    payloadSummary: 'STAT Cardiac Panel (Troponin-I, CPK-MB) shared under Consent Artefact #CNS-ABDM-204',
    retryCount: 0,
    authorizedBy: 'Dr. Sundaramoorthy M. (Attending Cardiologist)',
    consentId: 'CNS-ABDM-204'
  },
  {
    id: 'tx-8002',
    transactionId: 'TX-FHIR-20261127-02',
    timestamp: '2026-11-27 10:35:40',
    hospitalId: 'hosp-chn-01',
    connectionId: 'conn-apollo-02',
    systemName: 'Apollo Integrated Health Network',
    resourceType: 'Patient',
    direction: 'INBOUND',
    recordCount: 1,
    status: 'SUCCESS',
    patientRef: 'PT-ADM-91',
    patientName: 'Kavitha R.',
    abhaId: '91-3819-5501-4412',
    payloadSummary: 'Demographics and allergy profile intake for emergency coronary transfer candidate',
    retryCount: 0,
    authorizedBy: 'Triage Desk Nurse Deepa R.'
  },
  {
    id: 'tx-8003',
    transactionId: 'TX-FHIR-20261127-03',
    timestamp: '2026-11-27 10:12:15',
    hospitalId: 'hosp-chn-01',
    connectionId: 'conn-mmc-lis-03',
    systemName: 'State Central Diagnostic & LIS Exchange',
    resourceType: 'Observation',
    direction: 'INBOUND',
    recordCount: 4,
    status: 'VALIDATION_ERROR',
    patientRef: 'PT-8945',
    patientName: 'Anand Kumar',
    payloadSummary: 'ABG Panel blood gas results schema check failed: missing required coding system OID',
    errorDetails: 'HL7 OBX-3 Identifier missing LOINC code (got local code "TN-ABG-01" without universal translation).',
    retryCount: 1,
    authorizedBy: 'System Auto-Ingest'
  },
  {
    id: 'tx-8004',
    transactionId: 'TX-FHIR-20261127-04',
    timestamp: '2026-11-27 09:55:00',
    hospitalId: 'hosp-chn-01',
    connectionId: 'conn-abdm-01',
    systemName: 'National Health Exchange (ABDM)',
    resourceType: 'CarePlan',
    direction: 'OUTBOUND',
    recordCount: 1,
    status: 'SUCCESS',
    patientRef: 'PT-8941',
    patientName: 'Murugesan K.',
    abhaId: '91-4428-1902-8814',
    payloadSummary: 'Acute Coronary Protocol & Post-PCI Monitoring Plan exported to ABHA Personal Health Record (PHR)',
    retryCount: 0,
    authorizedBy: 'Dr. Sundaramoorthy M.',
    consentId: 'CNS-ABDM-204'
  },
  {
    id: 'tx-8005',
    transactionId: 'TX-FHIR-20261127-05',
    timestamp: '2026-11-27 09:30:22',
    hospitalId: 'hosp-chn-01',
    connectionId: 'conn-apollo-02',
    systemName: 'Apollo Integrated Health Network',
    resourceType: 'MedicationRequest',
    direction: 'OUTBOUND',
    recordCount: 3,
    status: 'SUCCESS',
    patientRef: 'PT-8942',
    patientName: 'Dr. V. Natarajan',
    payloadSummary: 'Verified active anticoagulant and anti-arrhythmic regimen shared for cardiology consult',
    retryCount: 0,
    authorizedBy: 'Dr. Sundaramoorthy M.'
  },
  {
    id: 'tx-8006',
    transactionId: 'TX-FHIR-20261127-06',
    timestamp: '2026-11-27 09:14:18',
    hospitalId: 'hosp-chn-01',
    connectionId: 'conn-mmc-lis-03',
    systemName: 'State Central Diagnostic & LIS Exchange',
    resourceType: 'Observation',
    direction: 'INBOUND',
    recordCount: 2,
    status: 'RETRYING',
    patientRef: 'PT-8946',
    patientName: 'Jayanthi S.',
    payloadSummary: 'Blood culture antibiotic sensitivity panel awaiting re-transmission ACK',
    errorDetails: 'Socket read timeout after 15000ms. Queued for scheduled exponential backoff retry #2.',
    retryCount: 2,
    authorizedBy: 'System Auto-Ingest'
  }
];

export const INITIAL_ABDM_CONSENTS: ABDMConsentArtefact[] = [
  {
    id: 'cns-01',
    consentId: 'CNS-ABDM-204',
    patientAbha: '91-4428-1902-8814',
    patientName: 'Murugesan K.',
    hipId: 'IN-TN-CHN-001',
    hipName: 'MediSync Chennai Medical Center',
    hiuId: 'IN-APOLLO-04',
    hiuName: 'Apollo Institute of Cardiac Sciences',
    purpose: 'Care Management',
    purposeCode: 'CAREMGT',
    hiTypes: ['DiagnosticReport', 'Prescription', 'DischargeSummary'],
    dateRange: {
      from: '2026-11-01',
      to: '2026-12-31'
    },
    consentStatus: 'GRANTED',
    grantedAt: '2026-11-20 14:30:00',
    expiresAt: '2026-12-31 23:59:59',
    signatureStatus: 'Cryptographically Verified (JWS)'
  },
  {
    id: 'cns-02',
    consentId: 'CNS-ABDM-205',
    patientAbha: '91-3819-5501-4412',
    patientName: 'Kavitha R.',
    hipId: 'IN-TN-CHN-001',
    hipName: 'MediSync Chennai Medical Center',
    hiuId: 'IN-MMC-01',
    hiuName: 'Madras Medical College Health Network',
    purpose: 'Emergency Care',
    purposeCode: 'EMERGENCY',
    hiTypes: ['OPConsultation', 'DiagnosticReport', 'Prescription'],
    dateRange: {
      from: '2026-11-26',
      to: '2026-11-30'
    },
    consentStatus: 'GRANTED',
    grantedAt: '2026-11-26 19:15:00',
    expiresAt: '2026-11-30 23:59:59',
    signatureStatus: 'Cryptographically Verified (JWS)'
  },
  {
    id: 'cns-03',
    consentId: 'CNS-ABDM-206',
    patientAbha: '91-7712-9943-1280',
    patientName: 'Suresh Babu M.',
    hipId: 'IN-TN-CHN-001',
    hipName: 'MediSync Chennai Medical Center',
    hiuId: 'IN-TN-GOV-09',
    hiuName: 'Tamil Nadu Chief Minister Comprehensive Health Insurance',
    purpose: 'Diagnostic Consultation',
    purposeCode: 'DIAGNOSTIC',
    hiTypes: ['DischargeSummary', 'DiagnosticReport'],
    dateRange: {
      from: '2026-11-15',
      to: '2026-11-22'
    },
    consentStatus: 'EXPIRED',
    grantedAt: '2026-11-15 09:00:00',
    expiresAt: '2026-11-22 23:59:59',
    signatureStatus: 'Cryptographically Verified (JWS)'
  }
];

export const INITIAL_INBOUND_PATIENT_IMPORTS: InboundPatientImport[] = [
  {
    importId: 'IMP-20261127-01',
    sourceSystem: 'Apollo Integrated Health Network (HL7-FHIR-APOLLO-CHN)',
    importedAt: '2026-11-27 10:20:00',
    incomingPatient: {
      name: 'Murugesan K.',
      mrn: 'AP-MRN-99412',
      abhaNumber: '91-4428-1902-8814',
      abhaAddress: 'murugesan62@abdm',
      gender: 'male',
      birthDate: '1964-05-12',
      phone: '+91 98401 23456',
      bloodGroup: 'B+',
      address: 'No. 45, Anna Nagar West, Chennai, Tamil Nadu 600040',
      diagnosisSummary: 'Acute Anterior Wall STEMI s/p Primary PTCA to LAD with drug eluting stent',
      allergies: ['Penicillin (Anaphylactoid urticaria)', 'Aspirin (Mild dyspepsia)'],
      medications: ['Ticagrelor 90mg BID', 'Atorvastatin 80mg QHS', 'Ramipril 2.5mg OD'],
      vitals: {
        bloodPressure: '124/82 mmHg',
        heartRate: 78,
        spo2: 98,
        temperature: 36.9
      }
    },
    validationStatus: 'VALID',
    validationErrors: [],
    duplicateCheckStatus: 'POTENTIAL_DUPLICATE',
    duplicateCandidates: [
      {
        existingPatientId: 'PT-8941',
        existingName: 'Murugesan K.',
        existingDob: '1964-05-12',
        existingGender: 'male',
        existingPhone: '+91 98401 23456',
        existingMrn: 'MRN-CHN-008941',
        matchScore: 96,
        matchReasons: [
          'Exact ABHA number match (91-4428-1902-8814)',
          'Exact phone match (+91 98401 23456)',
          'Exact Date of Birth match (1964-05-12)',
          'Identical full name spelling'
        ]
      }
    ],
    stagedStatus: 'PENDING_REVIEW'
  },
  {
    importId: 'IMP-20261127-02',
    sourceSystem: 'National Health Exchange (ABDM Gateway)',
    importedAt: '2026-11-27 10:35:00',
    incomingPatient: {
      name: 'Devaki Subramanian',
      mrn: 'NDHM-ABHA-5519',
      abhaNumber: '91-5582-7711-3094',
      abhaAddress: 'devaki_s@abdm',
      gender: 'female',
      birthDate: '1978-08-22',
      phone: '+91 94440 98712',
      bloodGroup: 'O+',
      address: 'Flat 3B, Temple View Apartments, Mylapore, Chennai 600004',
      diagnosisSummary: 'Type 2 Diabetes Mellitus with Diabetic Nephropathy Stage III',
      allergies: ['Sulfonamides'],
      medications: ['Metformin 500mg SR BID', 'Empagliflozin 10mg OD', 'Telmisartan 40mg OD'],
      vitals: {
        bloodPressure: '138/88 mmHg',
        heartRate: 74,
        spo2: 99,
        temperature: 36.7
      }
    },
    validationStatus: 'VALID',
    validationErrors: [],
    duplicateCheckStatus: 'CLEAN',
    duplicateCandidates: [],
    stagedStatus: 'PENDING_REVIEW'
  },
  {
    importId: 'IMP-20261127-03',
    sourceSystem: 'State Central Diagnostic & LIS Exchange',
    importedAt: '2026-11-27 09:40:00',
    incomingPatient: {
      name: 'Unknown Male (Trauma Triage)',
      mrn: 'ER-TMP-004',
      gender: 'male',
      birthDate: '1990-01-01',
      phone: '',
      address: 'Brought in by 108 Ambulance from Guindy Flyover accident',
      diagnosisSummary: 'Polytrauma, blunt chest injury, pelvic fracture',
      allergies: [],
      medications: [],
      vitals: {
        bloodPressure: '88/54 mmHg',
        heartRate: 122,
        spo2: 92,
        temperature: 36.2
      }
    },
    validationStatus: 'WARNING',
    validationErrors: [
      'Missing phone number',
      'Missing ABHA identifier (unverified emergency intake)',
      'Estimated birth date used'
    ],
    duplicateCheckStatus: 'CLEAN',
    duplicateCandidates: [],
    stagedStatus: 'PENDING_REVIEW'
  }
];

// Sample Canonical FHIR R4 Resources for live testing & export preview
export const SAMPLE_FHIR_RESOURCES: {
  Patient: FHIRPatient;
  Practitioner: FHIRPractitioner;
  Organization: FHIROrganization;
  Encounter: FHIREncounter;
  Observation: FHIRObservation;
  Condition: FHIRCondition;
  MedicationRequest: FHIRMedicationRequest;
  ServiceRequest: FHIRServiceRequest;
  DiagnosticReport: FHIRDiagnosticReport;
  CarePlan: FHIRCarePlan;
  Appointment: FHIRAppointment;
} = {
  Patient: {
    resourceType: 'Patient',
    id: 'PT-8941',
    identifier: [
      {
        use: 'official',
        system: 'https://medisync.ai/mrn',
        value: 'MRN-CHN-008941'
      },
      {
        use: 'secondary',
        system: 'https://healthid.ndhm.gov.in',
        value: '91-4428-1902-8814'
      }
    ],
    active: true,
    name: [
      {
        use: 'official',
        family: 'Murugesan',
        given: ['K.'],
        prefix: ['Mr.']
      }
    ],
    telecom: [
      {
        system: 'phone',
        value: '+91 98401 23456',
        use: 'mobile'
      }
    ],
    gender: 'male',
    birthDate: '1964-05-12',
    address: [
      {
        use: 'home',
        line: ['No. 45, Anna Nagar West'],
        city: 'Chennai',
        district: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600040',
        country: 'IND'
      }
    ],
    managingOrganization: {
      reference: 'Organization/hosp-chn-01',
      display: 'MediSync Chennai Medical Center'
    }
  },

  Practitioner: {
    resourceType: 'Practitioner',
    id: 'doc-01',
    identifier: [
      {
        system: 'https://nmc.org.in/registration',
        value: 'TMC-REG-44910'
      }
    ],
    active: true,
    name: [
      {
        family: 'Sundaramoorthy',
        given: ['M.'],
        prefix: ['Dr.']
      }
    ],
    qualification: [
      {
        code: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0360',
              code: 'MD',
              display: 'Doctor of Medicine - Cardiology'
            }
          ]
        }
      }
    ],
    telecom: [
      {
        system: 'email',
        value: 'dr.sundaramoorthy@medisync.ai'
      }
    ]
  },

  Organization: {
    resourceType: 'Organization',
    id: 'hosp-chn-01',
    identifier: [
      {
        system: 'https://rohini.iib.gov.in',
        value: 'ROHINI-890214'
      }
    ],
    active: true,
    type: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/organization-type',
            code: 'prov',
            display: 'Healthcare Provider'
          }
        ]
      }
    ],
    name: 'MediSync Chennai Medical Center',
    telecom: [
      {
        system: 'phone',
        value: '+91 44 2836 1000'
      }
    ],
    address: [
      {
        line: ['12 Rajiv Gandhi Salai, Taramani'],
        city: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600113'
      }
    ]
  },

  Encounter: {
    resourceType: 'Encounter',
    id: 'enc-20261127-01',
    status: 'in-progress',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'IMP',
      display: 'inpatient encounter'
    },
    type: [
      {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: '4525004',
            display: 'Emergency admission'
          }
        ]
      }
    ],
    subject: {
      reference: 'Patient/PT-8941',
      display: 'Murugesan K.'
    },
    participant: [
      {
        individual: {
          reference: 'Practitioner/doc-01',
          display: 'Dr. Sundaramoorthy M.'
        }
      }
    ],
    period: {
      start: '2026-11-26T08:30:00+05:30'
    },
    serviceProvider: {
      reference: 'Organization/hosp-chn-01'
    }
  },

  Observation: {
    resourceType: 'Observation',
    id: 'obs-trop-8941',
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'laboratory',
            display: 'Laboratory'
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '6598-7',
          display: 'Troponin I.cardiac [Mass/volume] in Serum or Plasma'
        }
      ],
      text: 'Cardiac Troponin I STAT'
    },
    subject: {
      reference: 'Patient/PT-8941',
      display: 'Murugesan K.'
    },
    effectiveDateTime: '2026-11-27T10:15:00+05:30',
    valueQuantity: {
      value: 1.84,
      unit: 'ng/mL',
      system: 'http://unitsofmeasure.org',
      code: 'ng/mL'
    },
    interpretation: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
            code: 'CR',
            display: 'Critical High'
          }
        ]
      }
    ],
    referenceRange: [
      {
        high: {
          value: 0.04,
          unit: 'ng/mL'
        },
        text: 'Normal: < 0.04 ng/mL'
      }
    ]
  },

  Condition: {
    resourceType: 'Condition',
    id: 'cond-stemi-8941',
    clinicalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: 'active',
          display: 'Active'
        }
      ]
    },
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-category',
            code: 'encounter-diagnosis',
            display: 'Encounter Diagnosis'
          }
        ]
      }
    ],
    severity: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '24484000',
          display: 'Severe'
        }
      ]
    },
    code: {
      coding: [
        {
          system: 'http://hl7.org/fhir/sid/icd-10',
          code: 'I21.0',
          display: 'Acute transmural myocardial infarction of anterior wall'
        }
      ],
      text: 'Acute Anterior STEMI s/p Primary Angioplasty'
    },
    subject: {
      reference: 'Patient/PT-8941',
      display: 'Murugesan K.'
    },
    onsetDateTime: '2026-11-26T07:15:00+05:30',
    recordedDate: '2026-11-26T08:45:00+05:30'
  },

  MedicationRequest: {
    resourceType: 'MedicationRequest',
    id: 'medreq-ticagrelor-8941',
    status: 'active',
    intent: 'order',
    medicationCodeableConcept: {
      coding: [
        {
          system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
          code: '1116632',
          display: 'Ticagrelor 90 MG Oral Tablet'
        }
      ],
      text: 'Ticagrelor 90mg Tablet'
    },
    subject: {
      reference: 'Patient/PT-8941',
      display: 'Murugesan K.'
    },
    authoredOn: '2026-11-26T09:30:00+05:30',
    requester: {
      reference: 'Practitioner/doc-01',
      display: 'Dr. Sundaramoorthy M.'
    },
    dosageInstruction: [
      {
        text: '90 mg oral twice daily for 12 months with aspirin',
        route: {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '260548002',
              display: 'Oral'
            }
          ]
        },
        doseAndRate: [
          {
            doseQuantity: {
              value: 90,
              unit: 'mg'
            }
          }
        ]
      }
    ]
  },

  ServiceRequest: {
    resourceType: 'ServiceRequest',
    id: 'srv-echo-8941',
    status: 'active',
    intent: 'order',
    priority: 'urgent',
    code: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '40701008',
          display: 'Echocardiography (procedure)'
        }
      ],
      text: 'STAT Transthoracic 2D Echocardiogram with Doppler'
    },
    subject: {
      reference: 'Patient/PT-8941',
      display: 'Murugesan K.'
    },
    occurrenceDateTime: '2026-11-27T11:00:00+05:30',
    requester: {
      reference: 'Practitioner/doc-01',
      display: 'Dr. Sundaramoorthy M.'
    }
  },

  DiagnosticReport: {
    resourceType: 'DiagnosticReport',
    id: 'diag-cardiac-8941',
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
            code: 'CH',
            display: 'Chemistry'
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '49563-0',
          display: 'Cardiac panel'
        }
      ],
      text: 'Acute Coronary Syndrome Biomarker Evaluation'
    },
    subject: {
      reference: 'Patient/PT-8941',
      display: 'Murugesan K.'
    },
    effectiveDateTime: '2026-11-27T10:15:00+05:30',
    issued: '2026-11-27T10:40:00+05:30',
    performer: [
      {
        reference: 'Organization/hosp-chn-01',
        display: 'Central Diagnostic Laboratory'
      }
    ],
    conclusion: 'Significant myocardial necrosis with Troponin-I elevation to 1.84 ng/mL, consistent with evolving anterior myocardial injury.'
  },

  CarePlan: {
    resourceType: 'CarePlan',
    id: 'cp-acs-8941',
    status: 'active',
    intent: 'plan',
    title: 'Acute Coronary Syndrome Inpatient Care Pathway',
    description: 'Hemodynamic monitoring, dual antiplatelet therapy, and serial cardiac marker surveillance post-stenting.',
    subject: {
      reference: 'Patient/PT-8941',
      display: 'Murugesan K.'
    },
    period: {
      start: '2026-11-26'
    },
    activity: [
      {
        detail: {
          code: {
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: '711020003',
                display: 'Bedside Continuous Multi-Lead Telemetry'
              }
            ],
            text: 'Bedside Continuous Multi-Lead Telemetry'
          },
          status: 'in-progress',
          description: 'Surveillance for ventricular ectopy and ST-segment resolution'
        }
      },
      {
        detail: {
          code: {
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: '271442007',
                display: 'Arterial blood gas test'
              }
            ],
            text: 'Arterial Blood Gas Analysis Q6H'
          },
          status: 'in-progress',
          description: 'Maintain PaO2 > 80 mmHg and pH 7.35 - 7.45'
        }
      }
    ]
  },

  Appointment: {
    resourceType: 'Appointment',
    id: 'apt-followup-8941',
    status: 'booked',
    serviceCategory: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/service-category',
            code: 'cardio',
            display: 'Cardiology'
          }
        ]
      }
    ],
    description: 'Post-PCI 14-Day Interventional Cardiology Review',
    start: '2026-12-11T10:30:00+05:30',
    end: '2026-12-11T11:00:00+05:30',
    participant: [
      {
        actor: {
          reference: 'Patient/PT-8941',
          display: 'Murugesan K.'
        },
        status: 'accepted'
      },
      {
        actor: {
          reference: 'Practitioner/doc-01',
          display: 'Dr. Sundaramoorthy M.'
        },
        status: 'accepted'
      }
    ]
  }
};
