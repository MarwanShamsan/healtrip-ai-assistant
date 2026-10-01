import type { Prisma } from "../../generated/prisma/client";
import prisma from "../db/prisma";
import type {
  DoctorProvider,
  FindDoctorsFilters,
  FindHospitalsFilters,
  HospitalProvider,
  HospitalRecord,
  ProviderDetailsInput,
  ProviderRecord,
} from "./types";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;

const hospitalSelect = {
  id: true,
  name: true,
  city: true,
  country: true,
  address: true,
  emergencyAvailable: true,
  languages: true,
} satisfies Prisma.HospitalSelect;

const doctorSelect = {
  id: true,
  name: true,
  specialty: true,
  city: true,
  languages: true,
  bio: true,
  hospital: {
    select: hospitalSelect,
  },
} satisfies Prisma.DoctorSelect;

type HospitalRow = Prisma.HospitalGetPayload<{
  select: typeof hospitalSelect;
}>;

type DoctorRow = Prisma.DoctorGetPayload<{
  select: typeof doctorSelect;
}>;

function normalizeLimit(limit?: number): number {
  if (limit === undefined) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.max(limit, 1), MAX_LIMIT);
}

function toHospitalRecord(hospital: HospitalRow): HospitalRecord {
  return {
    id: hospital.id,
    name: hospital.name,
    city: hospital.city,
    country: hospital.country,
    address: hospital.address,
    emergencyAvailable: hospital.emergencyAvailable,
    languages: hospital.languages,
  };
}

function toHospitalProvider(
  hospital: HospitalRow,
): HospitalProvider {
  return {
    providerType: "hospital",
    ...toHospitalRecord(hospital),
  };
}

function toDoctorProvider(
  doctor: DoctorRow,
): DoctorProvider {
  return {
    providerType: "doctor",
    id: doctor.id,
    name: doctor.name,
    specialty: doctor.specialty,
    city: doctor.city,
    languages: doctor.languages,
    bio: doctor.bio,
    hospital: toHospitalRecord(doctor.hospital),
  };
}

export async function findDoctors(
  filters: FindDoctorsFilters,
): Promise<DoctorProvider[]> {
  const doctors = await prisma.doctor.findMany({
    where: {
      ...(filters.specialty
        ? {
            specialty: {
              equals: filters.specialty,
              mode: "insensitive",
            },
          }
        : {}),

      ...(filters.city
        ? {
            city: {
              equals: filters.city,
              mode: "insensitive",
            },
          }
        : {}),

      ...(filters.language
        ? {
            languages: {
              has: filters.language,
            },
          }
        : {}),

      ...(filters.hospitalId
        ? {
            hospitalId: filters.hospitalId,
          }
        : {}),
    },

    select: doctorSelect,

    orderBy: [
      {
        city: "asc",
      },
      {
        name: "asc",
      },
    ],

    take: normalizeLimit(filters.limit),
  });

  return doctors.map(toDoctorProvider);
}

export async function findHospitals(
  filters: FindHospitalsFilters,
): Promise<HospitalProvider[]> {
  const hospitals = await prisma.hospital.findMany({
    where: {
      ...(filters.city
        ? {
            city: {
              equals: filters.city,
              mode: "insensitive",
            },
          }
        : {}),

      ...(filters.emergencyAvailable !== undefined
        ? {
            emergencyAvailable: filters.emergencyAvailable,
          }
        : {}),

      ...(filters.specialty
        ? {
            doctors: {
              some: {
                specialty: {
                  equals: filters.specialty,
                  mode: "insensitive",
                },
              },
            },
          }
        : {}),
    },

    select: hospitalSelect,

    orderBy: [
      {
        city: "asc",
      },
      {
        name: "asc",
      },
    ],

    take: normalizeLimit(filters.limit),
  });

  return hospitals.map(toHospitalProvider);
}

export async function getProviderDetails(
  input: ProviderDetailsInput,
): Promise<ProviderRecord | null> {
  if (input.providerType === "doctor") {
    const doctor = await prisma.doctor.findUnique({
      where: {
        id: input.providerId,
      },
      select: doctorSelect,
    });

    return doctor ? toDoctorProvider(doctor) : null;
  }

  const hospital = await prisma.hospital.findUnique({
    where: {
      id: input.providerId,
    },
    select: hospitalSelect,
  });

  return hospital ? toHospitalProvider(hospital) : null;
}