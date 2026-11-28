/**
 * Shared hospital scoping, partitioning, and matching utilities so NO two hospitals
 * can ever share, overwrite, or leak operational data or patient requests.
 */

export const OPD_REQUESTS_STORAGE_KEY = 'medisync_hospital_opd_requests';
export const OPD_UPDATE_EVENT = 'medisync_opd_update';
export const ACTIVE_HOSPITAL_SCOPE_KEY = 'medisync_active_hospital_scope_id';

export const setActiveHospitalScopeId = (hospitalId?: string | null) => {
  if (typeof window === 'undefined') return;
  try {
    const clean = String(hospitalId || '').trim();
    if (clean) {
      sessionStorage.setItem(ACTIVE_HOSPITAL_SCOPE_KEY, clean);
      localStorage.setItem(ACTIVE_HOSPITAL_SCOPE_KEY, clean);
    } else {
      sessionStorage.removeItem(ACTIVE_HOSPITAL_SCOPE_KEY);
      localStorage.removeItem(ACTIVE_HOSPITAL_SCOPE_KEY);
    }
  } catch {}
};

export const getActiveHospitalScopeId = (explicitHospitalId?: string): string => {
  if (explicitHospitalId && explicitHospitalId.trim()) {
    return explicitHospitalId.trim();
  }
  if (typeof window !== 'undefined') {
    try {
      const fromSession = sessionStorage.getItem(ACTIVE_HOSPITAL_SCOPE_KEY);
      if (fromSession && fromSession.trim()) return fromSession.trim();

      const fromLocal = localStorage.getItem(ACTIVE_HOSPITAL_SCOPE_KEY);
      if (fromLocal && fromLocal.trim()) return fromLocal.trim();

      const userRaw = localStorage.getItem('medisync_authenticated_account_v2');
      if (userRaw) {
        const parsed = JSON.parse(userRaw);
        if (parsed?.hospitalId) return String(parsed.hospitalId).trim();
      }
    } catch {}
  }
  return 'Hos_Id-101';
};

/**
 * Generates an isolated per-hospital localStorage key (e.g. `medisync_bed_registry_data__Hos_Id-345`)
 * so each hospital maintains strictly separate beds, wards, departments, staff, equipment,
 * settings, reports, patients, tasks, alerts, and emergency incidents.
 */
export const hospitalScopedKey = (baseKey: string, explicitHospitalId?: string): string => {
  const hId = getActiveHospitalScopeId(explicitHospitalId).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${baseKey}__${hId}`;
};

export const getPatientTokenStorageKey = (hospitalId: string) =>
  `medisync_patient_token_${(hospitalId || 'default').trim()}`;

export const resolveCanonicalHospitalId = (record: any): string => {
  if (!record) return '';
  return String(
    record.hospitalId ||
      record.id ||
      (record.registrationNumber ? `reg-${record.registrationNumber}` : '')
  ).trim();
};

/**
 * Strictly checks whether a booking/triage/appointment record belongs
 * exclusively to the target hospital (by canonical Hospital ID or exact name).
 * Never matches records with missing hospital identity.
 */
export const isMatchingHospital = (
  record: { hospitalId?: string; hospitalName?: string } | null | undefined,
  targetHospitalId?: string,
  targetHospitalName?: string
): boolean => {
  if (!record) return false;

  const rId = String(record.hospitalId || '').trim().toLowerCase();
  const tId = String(targetHospitalId || '').trim().toLowerCase();
  const rName = String(record.hospitalName || '').trim().toLowerCase();
  const tName = String(targetHospitalName || '').trim().toLowerCase();

  if (rId && tId && rId === tId) {
    return true;
  }

  // If both records carry canonical Hos_Id-XXX IDs and they differ,
  // they are strictly distinct registered hospitals.
  if (rId.startsWith('hos_id-') && tId.startsWith('hos_id-') && rId !== tId) {
    return false;
  }

  if (rName && tName && rName === tName) {
    return true;
  }

  return false;
};

/**
 * Extracts uppercase initials from a registered hospital name.
 * Examples:
 * - "Madurai Medical College & Government Rajaji Hospital" -> "MMC"
 * - "Kesav" -> "K"
 * - "Rajiv Gandhi Hospital" -> "RGH"
 */
export const getHospitalInitials = (hospitalName?: string): string => {
  const cleaned = String(hospitalName || '')
    .replace(/\([^)]*\)/g, ' ')
    .split(/[&,\-\/]/)[0]
    .trim();

  const stopWords = new Set(['of', 'the', 'and', 'for', 'in', 'at']);
  const words = cleaned
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z]/g, ''))
    .filter((w) => w.length > 0 && !stopWords.has(w.toLowerCase()));

  if (words.length === 0) return 'HOS';

  return words
    .slice(0, 3)
    .map((w) => w[0].toUpperCase())
    .join('');
};

/**
 * Generates sequential hospital-branded patient token ONLY upon hospital approval:
 * e.g. MMC_PAT_01, K_PAT_01, RGH_PAT_01
 */
export const generateHospitalPatientToken = (
  hospitalName: string,
  existingRequests: Array<{ tokenNumber?: string }> = [],
  hospitalId?: string
): string => {
  const prefix = `${getHospitalInitials(hospitalName)}_PAT_`;
  let maxSeq = 0;

  for (const r of existingRequests) {
    const tok = String(r?.tokenNumber || '');
    if (tok.toUpperCase().startsWith(prefix.toUpperCase())) {
      const numPart = parseInt(tok.slice(prefix.length), 10);
      if (!Number.isNaN(numPart) && numPart > maxSeq) {
        maxSeq = numPart;
      }
    }
  }

  try {
    const seqKey = `medisync_pat_token_seq__${(hospitalId || hospitalName || 'default').replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const storedSeq = parseInt(localStorage.getItem(seqKey) || '0', 10);
    if (!Number.isNaN(storedSeq) && storedSeq > maxSeq) {
      maxSeq = storedSeq;
    }
    const nextSeq = maxSeq + 1;
    localStorage.setItem(seqKey, String(nextSeq));
    return `${prefix}${String(nextSeq).padStart(2, '0')}`;
  } catch {
    const nextSeq = maxSeq + 1;
    return `${prefix}${String(nextSeq).padStart(2, '0')}`;
  }
};
