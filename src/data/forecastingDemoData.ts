import { 
  PredictiveForecastingData, 
  PredictiveShortageAlert, 
  ForecastingHorizon 
} from '../types';

export const DEMO_FORECAST_DISCLAIMER = 
  'Demo Forecast: Statistical Trend Projection based on Moving Average Extrapolation. Fictional demo dataset for demonstration and simulation.';

export const INITIAL_PREDICTIVE_ALERTS: PredictiveShortageAlert[] = [
  {
    id: 'alt-01',
    alert_id: 'ALT-PRED-101',
    hospital_id: 'hosp-chn-01',
    resource_type: 'ICU Beds',
    resource_category: 'Beds',
    ward_or_department: 'ICU Block A / Critical Care',
    current_available: 2,
    forecasted_demand: 5,
    expected_shortage: 3,
    time_horizon: '24 Hours',
    confidence_score: 92.4,
    status: 'Active',
    severity: 'Critical',
    recommended_actions: [
      'Expedite step-down discharge of 2 stable patients in ICU-05 and ICU-06 to HDU',
      'Prepare PACU recovery ward as temporary overflow ICU buffer',
      'Pre-alert on-call intensivist for 22:00 trauma surge'
    ],
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  },
  {
    id: 'alt-02',
    alert_id: 'ALT-PRED-102',
    hospital_id: 'hosp-chn-01',
    resource_type: 'Mechanical Ventilators',
    resource_category: 'Equipment',
    ward_or_department: 'Emergency & Pulmonary Medicine',
    current_available: 1,
    forecasted_demand: 3,
    expected_shortage: 2,
    time_horizon: '3 Days',
    confidence_score: 88.0,
    status: 'Active',
    severity: 'Warning',
    recommended_actions: [
      'Recall 2 standby Hamilton-C6 ventilators from biomedical calibration',
      'Verify high-flow nasal cannula (HFNC) units as initial non-invasive bridge',
      'Audit oxygen manifold bank pressures'
    ],
    created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 90 * 60 * 1000).toISOString()
  },
  {
    id: 'alt-03',
    alert_id: 'ALT-PRED-103',
    hospital_id: 'hosp-chn-01',
    resource_type: 'O-Negative PRBC Blood Units',
    resource_category: 'Blood Reserve',
    ward_or_department: 'Apex Blood Bank & Trauma Resuscitation',
    current_available: 4,
    forecasted_demand: 10,
    expected_shortage: 6,
    time_horizon: '7 Days',
    confidence_score: 86.5,
    status: 'Active',
    severity: 'Warning',
    recommended_actions: [
      'Issue scheduled blood donation drive alert to regional network',
      'Confirm reserve holding at State Blood Transfusion Council',
      'Restrict elective surgical blood cross-match hold times'
    ],
    created_at: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 150 * 60 * 1000).toISOString()
  }
];

export function getMockForecastingData(
  horizon: ForecastingHorizon = '24h',
  wardFilter: string = 'all'
): PredictiveForecastingData {
  const horizonFactor = horizon === '7d' ? 3.8 : horizon === '3d' ? 2.1 : 1.0;
  const horizonLabel = horizon === '7d' ? 'Next 7 Days' : horizon === '3d' ? 'Next 3 Days' : 'Next 24 Hours';

  const wardBreakdown = [
    {
      wardName: 'ICU Block A',
      type: 'ICU',
      totalBeds: 12,
      currentOccupied: 10,
      currentAvailable: 2,
      expectedAdmissions: Math.round(4 * horizonFactor),
      expectedDischarges: Math.round(2 * horizonFactor),
      predictedOccupancyPercent: Math.min(100, Math.round(((10 + 4 * horizonFactor - 2 * horizonFactor) / 12) * 100)),
      possibleShortage: Math.max(0, (10 + Math.round(4 * horizonFactor) - Math.round(2 * horizonFactor)) - 12),
      riskLevel: 'Critical' as const
    },
    {
      wardName: 'Emergency Resuscitation Bay',
      type: 'Emergency',
      totalBeds: 8,
      currentOccupied: 6,
      currentAvailable: 2,
      expectedAdmissions: Math.round(6 * horizonFactor),
      expectedDischarges: Math.round(5 * horizonFactor),
      predictedOccupancyPercent: Math.min(100, Math.round(((6 + 6 * horizonFactor - 5 * horizonFactor) / 8) * 100)),
      possibleShortage: Math.max(0, (6 + Math.round(6 * horizonFactor) - Math.round(5 * horizonFactor)) - 8),
      riskLevel: 'High' as const
    },
    {
      wardName: 'High Dependency Ward (HDU)',
      type: 'HDU',
      totalBeds: 16,
      currentOccupied: 12,
      currentAvailable: 4,
      expectedAdmissions: Math.round(5 * horizonFactor),
      expectedDischarges: Math.round(4 * horizonFactor),
      predictedOccupancyPercent: Math.min(100, Math.round(((12 + 5 * horizonFactor - 4 * horizonFactor) / 16) * 100)),
      possibleShortage: 0,
      riskLevel: 'Moderate' as const
    },
    {
      wardName: 'General Medical Ward',
      type: 'General',
      totalBeds: 40,
      currentOccupied: 31,
      currentAvailable: 9,
      expectedAdmissions: Math.round(10 * horizonFactor),
      expectedDischarges: Math.round(9 * horizonFactor),
      predictedOccupancyPercent: Math.min(100, Math.round(((31 + 10 * horizonFactor - 9 * horizonFactor) / 40) * 100)),
      possibleShortage: 0,
      riskLevel: 'Low' as const
    },
    {
      wardName: 'Surgical Stepdown Ward',
      type: 'General',
      totalBeds: 24,
      currentOccupied: 18,
      currentAvailable: 6,
      expectedAdmissions: Math.round(7 * horizonFactor),
      expectedDischarges: Math.round(6 * horizonFactor),
      predictedOccupancyPercent: Math.min(100, Math.round(((18 + 7 * horizonFactor - 6 * horizonFactor) / 24) * 100)),
      possibleShortage: 0,
      riskLevel: 'Low' as const
    }
  ];

  const filteredWards = wardFilter !== 'all'
    ? wardBreakdown.filter(w => w.wardName.toLowerCase().includes(wardFilter.toLowerCase()))
    : wardBreakdown;

  const timelineLabels = horizon === '24h' 
    ? ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
    : horizon === '3d'
    ? ['Day 1 AM', 'Day 1 PM', 'Day 2 AM', 'Day 2 PM', 'Day 3 AM', 'Day 3 PM', 'EOD']
    : ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];

  const timelineData = timelineLabels.map((lbl, idx) => {
    const baseDemand = 68 + Math.round(Math.sin(idx) * 14) + (idx > 3 ? 12 : 0);
    const capacity = 100;
    return {
      timestamp: lbl,
      historicalDemand: idx <= 3 ? baseDemand : null,
      forecastedDemand: idx >= 3 ? baseDemand + 6 : null,
      availableCapacity: capacity,
      expectedShortage: Math.max(0, (baseDemand + 6) - capacity)
    };
  });

  return {
    hospitalId: 'hosp-chn-01',
    timeHorizon: horizonLabel,
    horizonCode: horizon,
    modelType: 'Statistical Moving Average Trend Extrapolation (ARIMA-ready Pipeline)',
    isDemoForecast: true,
    dataConfidenceScore: 91.2,
    summary: {
      totalHospitalBeds: 100,
      currentOccupiedBeds: 77,
      availableBeds: 23,
      expectedAdmissionsTotal: Math.round(28 * horizonFactor),
      expectedDischargesTotal: Math.round(23 * horizonFactor),
      projectedOccupancyPercent: Math.min(100, Math.round(((77 + (5 * horizonFactor)) / 100) * 100)),
      criticalShortagesIdentified: 2
    },
    resourceDemandForecast: [
      {
        resourceType: 'ICU Beds',
        category: 'Critical Care',
        currentAvailable: 2,
        currentUtilizationPercent: 83,
        historicalDemandAvg: Math.round(3.2 * horizonFactor),
        forecastedDemand: Math.round(5 * (horizon === '24h' ? 1 : horizon === '3d' ? 1.8 : 3.2)),
        expectedShortage: 3,
        forecastConfidencePercent: 92.4,
        recommendedPreparation: 'Expedite step-down transfer of stable ICU patients to HDU and ready overflow PACU beds.'
      },
      {
        resourceType: 'General Inpatient Beds',
        category: 'Inpatient Wards',
        currentAvailable: 15,
        currentUtilizationPercent: 72,
        historicalDemandAvg: Math.round(7.5 * horizonFactor),
        forecastedDemand: Math.round(8 * horizonFactor),
        expectedShortage: 0,
        forecastConfidencePercent: 94.0,
        recommendedPreparation: 'Prioritize morning discharge rounds and mobilize rapid bed turnaround cleaning.'
      },
      {
        resourceType: 'Emergency Triage Beds',
        category: 'Emergency Department',
        currentAvailable: 2,
        currentUtilizationPercent: 75,
        historicalDemandAvg: Math.round(4.8 * horizonFactor),
        forecastedDemand: Math.round(5 * horizonFactor),
        expectedShortage: 2,
        forecastConfidencePercent: 89.5,
        recommendedPreparation: 'Clear observation hold bays and expedite admission orders to ward telemetry.'
      },
      {
        resourceType: 'Mechanical Ventilators',
        category: 'Life Support Equipment',
        currentAvailable: 1,
        currentUtilizationPercent: 67,
        historicalDemandAvg: Math.round(2.2 * horizonFactor),
        forecastedDemand: Math.round(3 * horizonFactor),
        expectedShortage: 2,
        forecastConfidencePercent: 88.0,
        recommendedPreparation: 'Recall standby ventilators from biomedical maintenance and check circuit supplies.'
      },
      {
        resourceType: 'High-Flow Oxygen Apparatus',
        category: 'Respiratory Therapy',
        currentAvailable: 42,
        currentUtilizationPercent: 68,
        historicalDemandAvg: Math.round(24 * horizonFactor),
        forecastedDemand: Math.round(28 * horizonFactor),
        expectedShortage: 0,
        forecastConfidencePercent: 91.0,
        recommendedPreparation: 'Audit central manifold cryogenic line pressures and verify flow meter calibrators.'
      },
      {
        resourceType: 'Blood Reserves (PRBC)',
        category: 'Transfusion Medicine',
        currentAvailable: 98,
        currentUtilizationPercent: 55,
        historicalDemandAvg: Math.round(22 * horizonFactor),
        forecastedDemand: Math.round(25 * horizonFactor),
        expectedShortage: 6,
        forecastConfidencePercent: 86.5,
        recommendedPreparation: 'Pre-screen O-negative donor registry and enforce emergency release crossmatch hold limits.'
      },
      {
        resourceType: 'Emergency Specialists',
        category: 'Clinical Workforce',
        currentAvailable: 6,
        currentUtilizationPercent: 80,
        historicalDemandAvg: 5,
        forecastedDemand: Math.min(8, Math.round(5 * (horizon === '24h' ? 1 : 1.4))),
        expectedShortage: 1,
        forecastConfidencePercent: 87.0,
        recommendedPreparation: 'Activate second-tier on-call trauma and cardiology rosters for anticipated evening peak.'
      }
    ],
    bedOccupancyForecast: {
      currentOccupiedBeds: 77,
      availableBeds: 23,
      expectedAdmissions: Math.round(28 * horizonFactor),
      expectedDischarges: Math.round(23 * horizonFactor),
      predictedOccupancyPercent: Math.min(100, Math.round(((77 + (5 * horizonFactor)) / 100) * 100)),
      possibleShortage: 3,
      wardBreakdown: filteredWards
    },
    equipmentForecast: [
      {
        equipmentName: 'Mechanical Ventilators (Servo-U / Hamilton-C6)',
        category: 'Ventilator',
        currentAvailable: 1,
        historicalUsageAvg: 4,
        expectedDemand: Math.round(3 * horizonFactor),
        possibleShortage: 2,
        riskLevel: 'High',
        recommendedReadiness: 'Recall units from inspection and verify expiratory cassette cleanliness.'
      },
      {
        equipmentName: 'Cardiac Monitors & Defibrillators',
        category: 'Cardiac Telemetry',
        currentAvailable: 8,
        historicalUsageAvg: 6,
        expectedDemand: Math.round(7 * (horizon === '24h' ? 1 : 1.3)),
        possibleShortage: 0,
        riskLevel: 'Low',
        recommendedReadiness: 'Verify battery charge cycles on transport defibrillator units.'
      },
      {
        equipmentName: 'Infusion Pumps & Syringe Drivers',
        category: 'Infusion Technology',
        currentAvailable: 15,
        historicalUsageAvg: 18,
        expectedDemand: Math.round(14 * horizonFactor),
        possibleShortage: Math.max(0, Math.round(14 * horizonFactor) - 15),
        riskLevel: 'Moderate',
        recommendedReadiness: 'Request pool reallocation from central clinical engineering warehouse.'
      },
      {
        equipmentName: 'High-Flow Nasal Cannula (HFNC)',
        category: 'Oxygen Therapy',
        currentAvailable: 6,
        historicalUsageAvg: 5,
        expectedDemand: Math.round(4 * horizonFactor),
        possibleShortage: 0,
        riskLevel: 'Low',
        recommendedReadiness: 'Check sterile water humidification chamber inventory.'
      }
    ],
    emergencyPatterns: {
      frequencyToday: 3,
      historicalDailyAverage: 8.4,
      peakSurgePeriod: '18:00 - 23:00 IST (Evening Trauma & Cardiac Surge)',
      commonCategories: [
        { category: 'Polytrauma & Road Traffic Accidents', percentage: 42, resourceSurge: 'Trauma ICU, Blood O-, Ortho Surgeon' },
        { category: 'Acute Coronary Syndromes (STEMI / NSTEMI)', percentage: 28, resourceSurge: 'CCU Bed, Heparin, Interventional Cardiologist' },
        { category: 'Severe Acute Respiratory Distress (ARDS)', percentage: 18, resourceSurge: 'Invasive Ventilator, Pulmonologist' },
        { category: 'Acute Stroke & Neurological Emergencies', percentage: 12, resourceSurge: 'CT Angiography, Neuro-ICU, Thrombolytics' }
      ],
      wardDemandPatterns: [
        { ward: 'ICU Block A', demandTrend: 'Surging (+24%)', expectedLoad: 'Critical' },
        { ward: 'Emergency Bay', demandTrend: 'High Volatility (±35%)', expectedLoad: 'High' },
        { ward: 'High Dependency Ward', demandTrend: 'Steady Inflow', expectedLoad: 'Moderate' },
        { ward: 'General Medical Ward', demandTrend: 'Predictable Turnover', expectedLoad: 'Stable' }
      ]
    },
    timelineData
  };
}
