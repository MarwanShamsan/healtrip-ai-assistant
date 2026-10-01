import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

config({
  path: ".env.local",
  override: true,
});

const connectionString = process.env["DATABASE_URL"];

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const hospitals = [
  {
    id: "hosp_demo_riyadh_central",
    name: "HealTrip Demo Central Hospital",
    city: "Riyadh",
    country: "Saudi Arabia",
    address: "Demo Central District, Riyadh",
    emergencyAvailable: true,
    languages: ["ar", "en"],
  },
  {
    id: "hosp_demo_riyadh_north",
    name: "HealTrip Demo North Hospital",
    city: "Riyadh",
    country: "Saudi Arabia",
    address: "Demo North District, Riyadh",
    emergencyAvailable: false,
    languages: ["ar", "en"],
  },
  {
    id: "hosp_demo_jeddah_coastal",
    name: "HealTrip Demo Coastal Hospital",
    city: "Jeddah",
    country: "Saudi Arabia",
    address: "Demo Coastal District, Jeddah",
    emergencyAvailable: true,
    languages: ["ar", "en"],
  },
  {
    id: "hosp_demo_dammam_east",
    name: "HealTrip Demo East Hospital",
    city: "Dammam",
    country: "Saudi Arabia",
    address: "Demo East District, Dammam",
    emergencyAvailable: true,
    languages: ["ar", "en"],
  },
  {
    id: "hosp_demo_jeddah_community",
    name: "HealTrip Demo Community Hospital",
    city: "Jeddah",
    country: "Saudi Arabia",
    address: "Demo Community District, Jeddah",
    emergencyAvailable: false,
    languages: ["ar"],
  },
];

const doctors = [
  {
    id: "doc_demo_riyadh_card_01",
    name: "Dr. Amal Kareem (Demo)",
    specialty: "Cardiology",
    city: "Riyadh",
    languages: ["ar", "en"],
    bio: "Fictional demo profile for provider-search testing.",
    hospitalId: "hosp_demo_riyadh_central",
  },
  {
    id: "doc_demo_riyadh_general_01",
    name: "Dr. Sami Noor (Demo)",
    specialty: "General Medicine",
    city: "Riyadh",
    languages: ["ar"],
    bio: "Fictional demo profile for provider-search testing.",
    hospitalId: "hosp_demo_riyadh_central",
  },
  {
    id: "doc_demo_riyadh_neuro_01",
    name: "Dr. Leen Faris (Demo)",
    specialty: "Neurology",
    city: "Riyadh",
    languages: ["ar", "en"],
    bio: "Fictional demo profile for provider-search testing.",
    hospitalId: "hosp_demo_riyadh_central",
  },
  {
    id: "doc_demo_riyadh_ortho_01",
    name: "Dr. Yazan Saleh (Demo)",
    specialty: "Orthopedics",
    city: "Riyadh",
    languages: ["ar", "en"],
    bio: "Fictional demo profile for provider-search testing.",
    hospitalId: "hosp_demo_riyadh_north",
  },
  {
    id: "doc_demo_riyadh_derm_01",
    name: "Dr. Dana Harith (Demo)",
    specialty: "Dermatology",
    city: "Riyadh",
    languages: ["en"],
    bio: "Fictional demo profile for provider-search testing.",
    hospitalId: "hosp_demo_riyadh_north",
  },
  {
    id: "doc_demo_riyadh_ent_01",
    name: "Dr. Rami Nabil (Demo)",
    specialty: "ENT",
    city: "Riyadh",
    languages: ["ar"],
    bio: "Fictional demo profile for provider-search testing.",
    hospitalId: "hosp_demo_riyadh_north",
  },
  {
    id: "doc_demo_jeddah_card_01",
    name: "Dr. Hala Mazen (Demo)",
    specialty: "Cardiology",
    city: "Jeddah",
    languages: ["ar", "en"],
    bio: "Fictional demo profile for provider-search testing.",
    hospitalId: "hosp_demo_jeddah_coastal",
  },
  {
    id: "doc_demo_jeddah_neuro_01",
    name: "Dr. Omar Rayan (Demo)",
    specialty: "Neurology",
    city: "Jeddah",
    languages: ["ar", "en"],
    bio: "Fictional demo profile for provider-search testing.",
    hospitalId: "hosp_demo_jeddah_coastal",
  },
  {
    id: "doc_demo_jeddah_general_01",
    name: "Dr. Mira Adnan (Demo)",
    specialty: "General Medicine",
    city: "Jeddah",
    languages: ["en"],
    bio: "Fictional demo profile for provider-search testing.",
    hospitalId: "hosp_demo_jeddah_coastal",
  },
  {
    id: "doc_demo_dammam_card_01",
    name: "Dr. Nour Tarek (Demo)",
    specialty: "Cardiology",
    city: "Dammam",
    languages: ["ar", "en"],
    bio: "Fictional demo profile for provider-search testing.",
    hospitalId: "hosp_demo_dammam_east",
  },
  {
    id: "doc_demo_dammam_ortho_01",
    name: "Dr. Faisal Jad (Demo)",
    specialty: "Orthopedics",
    city: "Dammam",
    languages: ["ar"],
    bio: "Fictional demo profile for provider-search testing.",
    hospitalId: "hosp_demo_dammam_east",
  },
  {
    id: "doc_demo_dammam_ent_01",
    name: "Dr. Sara Malik (Demo)",
    specialty: "ENT",
    city: "Dammam",
    languages: ["ar", "en"],
    bio: "Fictional demo profile for provider-search testing.",
    hospitalId: "hosp_demo_dammam_east",
  },
  {
    id: "doc_demo_jeddah_derm_01",
    name: "Dr. Lama Zaid (Demo)",
    specialty: "Dermatology",
    city: "Jeddah",
    languages: ["ar"],
    bio: "Fictional demo profile for provider-search testing.",
    hospitalId: "hosp_demo_jeddah_community",
  },
  {
    id: "doc_demo_jeddah_general_02",
    name: "Dr. Kareem Sami (Demo)",
    specialty: "General Medicine",
    city: "Jeddah",
    languages: ["ar", "en"],
    bio: "Fictional demo profile for provider-search testing.",
    hospitalId: "hosp_demo_jeddah_community",
  },
  {
    id: "doc_demo_jeddah_ent_01",
    name: "Dr. Rana Fadi (Demo)",
    specialty: "ENT",
    city: "Jeddah",
    languages: ["ar"],
    bio: "Fictional demo profile for provider-search testing.",
    hospitalId: "hosp_demo_jeddah_community",
  },
];

async function main() {
  await prisma.$transaction([
    prisma.doctor.deleteMany(),
    prisma.hospital.deleteMany(),
  ]);

  await prisma.hospital.createMany({
    data: hospitals,
  });

  await prisma.doctor.createMany({
    data: doctors,
  });

  const hospitalCount = await prisma.hospital.count();
  const doctorCount = await prisma.doctor.count();

  console.log(
    `Seed complete: ${hospitalCount} demo hospitals, ${doctorCount} demo doctors.`,
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });