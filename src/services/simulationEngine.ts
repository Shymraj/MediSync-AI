import { 
  SimulationScenarioParameters, 
  DepartmentDigitalTwin, 
  SimulationRunResult, 
  SimulationResourceImpact, 
  SimulationReallocationStrategy, 
  SimulationPreparationPlan,
  HospitalBed,
  Equipment
} from '../types';

export class SimulationEngine {
  /**
   * Runs an isolated in-memory simulation against the hospital digital twin baseline.
   * Pure calculation: Never modifies live hospital beds, equipment, or patient records.
   */
  public static runSimulation(
    scenario: SimulationScenarioParameters,
    departments: DepartmentDigitalTwin[],
    liveBeds: HospitalBed[] = [],
    liveEquipment: Equipment[] = []
  ): SimulationRunResult {
    // 1. Calculate live baseline availabilities
    const readyIcuBeds = liveBeds.filter(b => b.type === 'ICU' && b.status === 'ready').length || 
      departments.filter(d => d.type === 'ICU').reduce((acc, d) => acc + d.readyBeds, 0) || 2;

    const readyEmergencyBeds = liveBeds.filter(b => (b.type === 'Emergency' || b.ward.toLowerCase().includes('emergency')) && b.status === 'ready').length ||
      departments.filter(d => d.type === 'Emergency').reduce((acc, d) => acc + d.readyBeds, 0) || 2;

    const readyGeneralBeds = liveBeds.filter(b => b.type === 'General' && b.status === 'ready').length ||
      departments.filter(d => d.type === 'Inpatient' || d.type === 'Stepdown').reduce((acc, d) => acc + d.readyBeds, 0) || 15;

    const availableVentilators = liveEquipment.filter(e => e.category === 'Ventilator' && e.status === 'Available').length || 1;
    const availableOxygenUnits = 42;
    const availableBloodUnits = 98;
    const availableSpecialists = 6;

    // 2. Resource Requirements from scenario
    const req = scenario.resourceRequirements;

    // 3. Calculate impacts
    const icuShortage = Math.max(0, req.icuBeds - readyIcuBeds);
    const emergShortage = Math.max(0, req.emergencyBeds - readyEmergencyBeds);
    const genShortage = Math.max(0, req.generalBeds - readyGeneralBeds);
    const ventShortage = Math.max(0, req.ventilators - availableVentilators);
    const o2Shortage = Math.max(0, req.oxygenUnits - availableOxygenUnits);
    const bloodShortage = Math.max(0, req.bloodUnits - availableBloodUnits);
    const specShortage = Math.max(0, req.specialists - availableSpecialists);

    const totalBedDemand = req.icuBeds + req.emergencyBeds + req.generalBeds;
    const totalBedAvailable = readyIcuBeds + readyEmergencyBeds + readyGeneralBeds;
    const totalBedShortage = Math.max(0, totalBedDemand - totalBedAvailable);

    // Bed capacity before vs. simulated after
    const totalHospitalBeds = departments.reduce((acc, d) => acc + d.totalBeds, 0) || 106;
    const baselineOccupied = departments.reduce((acc, d) => acc + d.occupiedBeds, 0) || 81;
    const baselineOccupancyPercent = Math.round((baselineOccupied / totalHospitalBeds) * 100);
    const simulatedOccupancyPercent = Math.min(100, Math.round(((baselineOccupied + totalBedDemand) / totalHospitalBeds) * 100));

    // Resource impacts list
    const resourceImpacts: SimulationResourceImpact[] = [
      {
        resourceName: 'ICU Beds (Critical Care)',
        category: 'Critical Care Beds',
        initialAvailable: readyIcuBeds,
        additionalDemand: req.icuBeds,
        expectedShortage: icuShortage,
        simulatedOccupancyPercent: Math.min(100, Math.round(((10 + req.icuBeds) / 12) * 100)),
        severity: icuShortage > 0 ? 'Critical' : 'Manageable',
        mitigationRecommendation: icuShortage > 0 
          ? 'Expedite step-down transfer of 2 stable patients in ICU Block A and activate PACU recovery overflow.'
          : 'Maintain nurse telemetry checks.'
      },
      {
        resourceName: 'Emergency Resuscitation Bays',
        category: 'Emergency Department',
        initialAvailable: readyEmergencyBeds,
        additionalDemand: req.emergencyBeds,
        expectedShortage: emergShortage,
        simulatedOccupancyPercent: Math.min(100, Math.round(((6 + req.emergencyBeds) / 8) * 100)),
        severity: emergShortage > 0 ? 'Critical' : 'Manageable',
        mitigationRecommendation: emergShortage > 0
          ? 'Mobilize rapid triage turnover and convert HDU Stepdown bays 1-4 into emergency receiving bays.'
          : 'Maintain triage queue flow.'
      },
      {
        resourceName: 'Mechanical Ventilators',
        category: 'Life Support Equipment',
        initialAvailable: availableVentilators,
        additionalDemand: req.ventilators,
        expectedShortage: ventShortage,
        simulatedOccupancyPercent: Math.min(100, Math.round(((6 - availableVentilators + req.ventilators) / 6) * 100)),
        severity: ventShortage > 0 ? 'Critical' : 'Manageable',
        mitigationRecommendation: ventShortage > 0
          ? 'Recall standby ventilators from biomedical calibration and verify transport ventilator oxygen cylinders.'
          : 'Calibrate circuits on standby.'
      },
      {
        resourceName: 'General Inpatient Beds',
        category: 'Inpatient Wards',
        initialAvailable: readyGeneralBeds,
        additionalDemand: req.generalBeds,
        expectedShortage: genShortage,
        simulatedOccupancyPercent: Math.min(100, Math.round(((49 + req.generalBeds) / 64) * 100)),
        severity: genShortage > 0 ? 'Warning' : 'Manageable',
        mitigationRecommendation: genShortage > 0
          ? 'Accelerate planned afternoon discharge clearance rounds and mobilize ward housekeeping.'
          : 'Sufficient general ward capacity.'
      },
      {
        resourceName: 'Liquid Oxygen & Apparatus',
        category: 'Respiratory Therapy',
        initialAvailable: availableOxygenUnits,
        additionalDemand: req.oxygenUnits,
        expectedShortage: o2Shortage,
        simulatedOccupancyPercent: Math.min(100, Math.round((req.oxygenUnits / availableOxygenUnits) * 100)),
        severity: o2Shortage > 0 ? 'Warning' : 'Manageable',
        mitigationRecommendation: 'Audit central cryogenic manifold pressure and check secondary bank.'
      },
      {
        resourceName: 'Emergency Blood Reserves (PRBC)',
        category: 'Transfusion Medicine',
        initialAvailable: availableBloodUnits,
        additionalDemand: req.bloodUnits,
        expectedShortage: bloodShortage,
        simulatedOccupancyPercent: Math.min(100, Math.round((req.bloodUnits / availableBloodUnits) * 100)),
        severity: bloodShortage > 0 ? 'Warning' : 'Manageable',
        mitigationRecommendation: 'Quarantine O-negative PRBC units and alert Regional Blood Transfusion Council.'
      },
      {
        resourceName: 'Specialist Physicians (Trauma/Cardio)',
        category: 'Clinical Workforce',
        initialAvailable: availableSpecialists,
        additionalDemand: req.specialists,
        expectedShortage: specShortage,
        simulatedOccupancyPercent: Math.min(100, Math.round((req.specialists / availableSpecialists) * 100)),
        severity: specShortage > 0 ? 'Critical' : 'Manageable',
        mitigationRecommendation: specShortage > 0
          ? 'Activate emergency second-tier on-call roster and page trauma surgical leads.'
          : 'Adequate specialist on-duty coverage.'
      }
    ];

    // 4. Calculate Operational Readiness Score (0-100%)
    const bedCoverageRate = totalBedDemand > 0 ? Math.min(1, totalBedAvailable / totalBedDemand) : 1;
    const ventCoverageRate = req.ventilators > 0 ? Math.min(1, availableVentilators / req.ventilators) : 1;
    const bloodO2Rate = Math.min(1, (availableBloodUnits + availableOxygenUnits) / (req.bloodUnits + req.oxygenUnits));
    const specialistRate = req.specialists > 0 ? Math.min(1, availableSpecialists / req.specialists) : 1;

    const rawReadiness = (bedCoverageRate * 35) + (ventCoverageRate * 30) + (specialistRate * 20) + (bloodO2Rate * 15);
    const readinessScore = Math.max(25, Math.min(98, Math.round(rawReadiness)));

    // Response Difficulty
    let responseDifficulty: 'Low' | 'Moderate' | 'High' | 'Critical Surge' = 'Moderate';
    if (icuShortage >= 4 || ventShortage >= 3 || readinessScore < 50) {
      responseDifficulty = 'Critical Surge';
    } else if (icuShortage > 0 || ventShortage > 0 || readinessScore < 75) {
      responseDifficulty = 'High';
    } else if (readinessScore >= 85) {
      responseDifficulty = 'Low';
    }

    // 5. Department Impacts
    const departmentImpacts: Array<{
      departmentName: string;
      impactLevel: 'Critical' | 'Severe' | 'Moderate' | 'Low';
      notes: string;
    }> = [
      {
        departmentName: 'Emergency Department & Triage Resuscitation',
        impactLevel: emergShortage > 0 ? 'Critical' : 'Severe',
        notes: `Simulated influx of ${scenario.patientCount} patients. Triage bays exceed design capacity by ${emergShortage > 0 ? emergShortage : 0} beds.`
      },
      {
        departmentName: 'Intensive Care Unit (ICU Block A)',
        impactLevel: icuShortage > 0 ? 'Critical' : 'Moderate',
        notes: `Requirement of ${req.icuBeds} critical care beds against ${readyIcuBeds} ready. Deficit of ${icuShortage} ICU beds.`
      },
      {
        departmentName: 'Post-Anesthesia Care Unit (PACU)',
        impactLevel: 'Moderate',
        notes: 'Recommended as primary surge overflow buffer for 4 ventilator-ready post-operative beds.'
      },
      {
        departmentName: 'High Dependency Ward (HDU)',
        impactLevel: 'Moderate',
        notes: 'Can absorb stable step-down transfers to relieve critical ICU occupancy.'
      },
      {
        departmentName: 'Apex Central Blood Bank',
        impactLevel: bloodShortage > 0 ? 'Severe' : 'Low',
        notes: `Simulated draw of ${req.bloodUnits} units PRBC. Adequate reserve remaining in cryogenic blood bank.`
      }
    ];

    // 6. Strategy Comparisons (Comparing 3 distinct operational strategies)
    const strategies: SimulationReallocationStrategy[] = [
      {
        strategyId: 'STRAT-A',
        name: 'Strategy A: Standard Hospital Protocol (No Reallocation)',
        description: 'Maintains strict departmental boundaries without internal ward conversion. Hospital locks when primary ICU and ER reach 100% capacity.',
        reallocations: [
          'No internal bed repurposing.',
          'Rely solely on currently ready beds (2 ICU, 2 ER).',
          'Reject/Divert overflow admissions when capacity is exhausted.'
        ],
        bedCoveragePercent: Math.round((totalBedAvailable / totalBedDemand) * 100),
        ventilatorCoveragePercent: Math.round((availableVentilators / req.ventilators) * 100),
        overallCoverageScore: Math.round(readinessScore * 0.75),
        unmetDemandCount: totalBedShortage + ventShortage,
        feasibilityRating: totalBedShortage > 4 ? 'Overloaded' : 'Viable with Risk'
      },
      {
        strategyId: 'STRAT-B',
        name: 'Strategy B: Internal Buffer Reallocation (PACU & HDU Flex)',
        description: 'Reallocates 4 PACU beds as emergency ICU overflow, converts 6 HDU stepdown beds into acute receiving bays, and recalls 2 standby ventilators.',
        reallocations: [
          'Mobilize 4 PACU recovery beds as ICU Level-1 overflow.',
          'Repurpose 6 HDU step-down beds for emergency intake.',
          'Recall 2 standby Hamilton-C6 ventilators from biomedical calibration.',
          'Deploy secondary trauma nurse team from day-care surgery.'
        ],
        bedCoveragePercent: Math.min(100, Math.round(((totalBedAvailable + 10) / totalBedDemand) * 100)),
        ventilatorCoveragePercent: Math.min(100, Math.round(((availableVentilators + 2) / req.ventilators) * 100)),
        overallCoverageScore: Math.min(95, Math.round(readinessScore * 1.25)),
        unmetDemandCount: Math.max(0, totalBedShortage - 6),
        feasibilityRating: 'Optimal'
      },
      {
        strategyId: 'STRAT-C',
        name: 'Strategy C: Regional Network Diversion & Accelerated Discharge',
        description: 'Combines internal buffer expansion with regional ambulance diversion for 30% of non-critical cases and expedites morning discharges.',
        reallocations: [
          'Divert non-critical ambulatory arrivals (Level 3 Yellow) to district partner hospital.',
          'Expedite same-day discharge of 4 stable medical inpatients to free telemetry beds.',
          'Request 4 emergency O-negative PRBC units from State Blood Bank reserve.',
          'Pre-alert Apex air-ambulance team for inter-facility transfers.'
        ],
        bedCoveragePercent: 98,
        ventilatorCoveragePercent: 95,
        overallCoverageScore: 96,
        unmetDemandCount: 0,
        feasibilityRating: 'Optimal'
      }
    ];

    // Recommended strategy
    const recommendedStrategyId = icuShortage > 2 ? 'STRAT-C' : 'STRAT-B';

    // 7. Emergency Preparation Plan
    const preparationPlan: SimulationPreparationPlan = {
      resourcesToPrepare: [
        `Prepare ${icuShortage} additional critical care beds via PACU/HDU conversion.`,
        `Dock and calibrate ${ventShortage > 0 ? ventShortage : 2} mechanical ventilators in triage bays.`,
        `Thaw and cross-match ${req.bloodUnits} units of type O-negative and positive PRBC.`,
        `Verify manifold oxygen pipeline pressure at 4.2 bar.`
      ],
      departmentsAttention: [
        'Emergency Resuscitation Bay (100% capacity expected within 45 min)',
        'ICU Block A (Depleted buffer; initiate early stepdown review)',
        'Post-Anesthesia Care Unit (Prep as secondary trauma surge ICU)'
      ],
      equipmentVerification: [
        'Test battery cycle on 4 transport defibrillators in crash carts',
        'Verify high-flow nasal cannula humidification chambers',
        'Inspect arterial blood gas cartridge levels'
      ],
      suggestedTransfers: [
        'Transfer stable patient in ICU-05 to HDU-08 to free critical monitor',
        'Transfer stable patient in ICU-06 to HDU-09',
        'Relocate 2 standby Hamilton-C6 ventilators from biomedical eng to ER Bay 1'
      ],
      adminTasks: [
        'Authorize temporary emergency activation of PACU recovery as ICU surge ward.',
        'Issue regional hospital diversion notice for walk-in Level 3 non-emergencies.',
        'Alert Hospital Medical Director and Chief Nursing Officer of simulated scenario.'
      ],
      doctorTasks: [
        'Conduct rapid step-down round in ICU Block A to identify discharge-ready patients.',
        'Establish dual trauma surgical leads at Triage Bay 1 and Resuscitation Bay 2.',
        'Review mass casualty rapid triage protocols with emergency medicine registrars.'
      ],
      nurseTasks: [
        'Equip PACU beds with ICU telemetry sets and IV infusion pumps.',
        'Prepare 12 rapid-intake trauma admission packs at triage station.',
        'Set up continuous SpO2 and non-invasive blood pressure monitors in HDU receiving buffer.'
      ]
    };

    // Major Weaknesses
    const majorWeaknesses: string[] = [];
    if (icuShortage > 0) majorWeaknesses.push(`Acute ICU Bed Deficit: Demand exceeds ready capacity by ${icuShortage} beds.`);
    if (ventShortage > 0) majorWeaknesses.push(`Mechanical Life Support Bottleneck: ${ventShortage} additional ventilators required.`);
    if (specShortage > 0) majorWeaknesses.push('Specialist Surge Deficit: Second-tier on-call physician roster activation required.');
    if (simulatedOccupancyPercent >= 95) majorWeaknesses.push(`Total Hospital Occupancy exceeds 95% threshold (${simulatedOccupancyPercent}% projected).`);

    return {
      id: `SIM-RUN-${Date.now()}`,
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      simulatedBy: 'Hospital Administrator (Simulation Lab)',
      readinessScore,
      responseDifficulty,
      overallBedCapacityImpact: {
        baselineOccupancyPercent,
        simulatedOccupancyPercent,
        deficitCount: totalBedShortage
      },
      resourceImpacts,
      departmentImpacts,
      strategies,
      recommendedStrategyId,
      preparationPlan,
      majorWeaknesses: majorWeaknesses.length > 0 ? majorWeaknesses : ['No critical capacity deficits detected under current parameters.'],
      isSimulation: true
    };
  }

  /**
   * Formats a simulated scenario result into an exportable professional text report.
   */
  public static generateExportReport(result: SimulationRunResult, scenario: SimulationScenarioParameters): string {
    return `# MEDISYNC AI — HOSPITAL DIGITAL TWIN & SIMULATION REPORT
Generated: ${new Date().toLocaleString()}
Mode: ISOLATED SIMULATION LAB (NON-OPERATIONAL DRILL)
Hospital: Chennai Apex Central Hospital (Digital Twin Model)

========================================================================
1. SCENARIO CONFIGURATION
========================================================================
Title: ${scenario.title}
Emergency Type: ${scenario.emergencyType}
Simulated Influx: ${scenario.patientCount} Patients over ${scenario.durationHours} Hours
Severity Breakdown:
  - Level 1 (Code Red Resuscitation): ${scenario.severityDistribution.level1Percent}%
  - Level 2 (Code Orange Emergent): ${scenario.severityDistribution.level2Percent}%
  - Level 3 (Code Yellow Urgent): ${scenario.severityDistribution.level3Percent}%

Resource Demand Profile:
  - ICU Beds: ${scenario.resourceRequirements.icuBeds}
  - Emergency Beds: ${scenario.resourceRequirements.emergencyBeds}
  - General Beds: ${scenario.resourceRequirements.generalBeds}
  - Mechanical Ventilators: ${scenario.resourceRequirements.ventilators}
  - Blood PRBC Units: ${scenario.resourceRequirements.bloodUnits}
  - Specialist Physicians: ${scenario.resourceRequirements.specialists}

========================================================================
2. SIMULATION RESULTS & READINESS SCORE
========================================================================
Operational Readiness Score: ${result.readinessScore}% / 100%
Estimated Response Difficulty: ${result.responseDifficulty}
Bed Occupancy Shift: ${result.overallBedCapacityImpact.baselineOccupancyPercent}% -> ${result.overallBedCapacityImpact.simulatedOccupancyPercent}%
Total Bed Deficit: ${result.overallBedCapacityImpact.deficitCount} Beds

Major Identified Weaknesses:
${result.majorWeaknesses.map(w => `  * ${w}`).join('\n')}

========================================================================
3. RESOURCE IMPACT & DEFICIT ANALYSIS
========================================================================
${result.resourceImpacts.map(r => `[${r.resourceName}]
  Available: ${r.initialAvailable} | Demand: ${r.additionalDemand} | Deficit: -${r.expectedShortage} (${r.severity})
  Recommendation: ${r.mitigationRecommendation}`).join('\n\n')}

========================================================================
4. STRATEGY COMPARISON
========================================================================
${result.strategies.map(s => `[${s.name}]
  Coverage Score: ${s.overallCoverageScore}% | Feasibility: ${s.feasibilityRating}
  Unmet Demand: ${s.unmetDemandCount} Units
  Key Reallocations:
${s.reallocations.map(re => `    - ${re}`).join('\n')}`).join('\n\n')}

Recommended Protocol: ${result.recommendedStrategyId} (${result.strategies.find(s => s.strategyId === result.recommendedStrategyId)?.name})

========================================================================
5. ACTIONABLE EMERGENCY PREPARATION PLAN
========================================================================
[Hospital Administration]:
${result.preparationPlan.adminTasks.map(t => `  - [ ] ${t}`).join('\n')}

[Physicians & Clinical Specialists]:
${result.preparationPlan.doctorTasks.map(t => `  - [ ] ${t}`).join('\n')}

[Nursing Staff & Station Leads]:
${result.preparationPlan.nurseTasks.map(t => `  - [ ] ${t}`).join('\n')}

========================================================================
DISCLAIMER: This document was produced inside the MediSync AI Digital Twin Simulation Lab. All resource reallocations are hypothetical and for emergency preparedness planning. Real hospital state has not been modified.
========================================================================`;
  }
}
