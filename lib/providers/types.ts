export type SupportedLanguage = "ar" | "en";

export type HospitalRecord = {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string | null;
  emergencyAvailable: boolean;
  languages: string[];
};

export type HospitalProvider = HospitalRecord & {
  providerType: "hospital";
};

export type DoctorProvider = {
  providerType: "doctor";
  id: string;
  name: string;
  specialty: string;
  city: string;
  languages: string[];
  bio: string | null;
  hospital: HospitalRecord;
};

export type ProviderRecord = DoctorProvider | HospitalProvider;

export type FindDoctorsFilters = {
  specialty?: string;
  city?: string;
  language?: SupportedLanguage;
  hospitalId?: string;
  limit?: number;
};

export type FindHospitalsFilters = {
  city?: string;
  specialty?: string;
  emergencyAvailable?: boolean;
  limit?: number;
};

export type ProviderDetailsInput = {
  providerType: "doctor" | "hospital";
  providerId: string;
};