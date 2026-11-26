import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { app, prisma } from '../src/server.js';
import * as seedModule from '../prisma/seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXPECTED_PHARMACY_SERVICES = [
  'Vaccinare antigripală în farmacie',
  'Eliberare rețete compensate CAS',
  'Preparare rețete magistrale',
  'Măsurare tensiune arterială',
  'Testare rapidă gripă / COVID-19',
  'Consiliere dermocosmetică'
];

const EXPECTED_HUMAN_MEDICATIONS = [
  'Parasinus',
  'Parasinus Penta',
  'Nurofen Forte',
  'Nurofen Express',
  'Paracetamol Sinus',
  'Algocalmin',
  'Theraflu Extra',
  'Coldrex MaxGrip',
  'Strepsils Intensiv',
  'Tantum Verde',
  'ACC 600',
  'Mucosolvan',
  'Ventolin',
  'Symbicort',
  'Aerius',
  'Claritine',
  'Xyzal',
  'Nasonex',
  'Augmentin 1g',
  'Amoksiklav',
  'Zinnat',
  'Sumamed',
  'Euthyrox 50/100',
  'Insulina Lantus',
  'Vaccin antigripal'
];

const EXPECTED_VET_SERVICES = [
  'Urgențe veterinare 24/7',
  'Ecografie veterinară',
  'Chirurgie țesuturi moi',
  'Microcipare și pașaport animale',
  'Analize biochimie și hematologie',
  'Detartraj cu ultrasunete',
  'Consult cardiologie veterinară'
];

const EXPECTED_VET_MEDICATIONS = [
  'Bravecto (antiparazitar câini)',
  'NexGard Spectra (câini)',
  'Simparica Trio (câini)',
  'ForestO zgardă antiparazitară',
  'Advantix spot-on câini',
  'Broadline (pisici)',
  'Milbemax (deparazitare câini/pisici)',
  'Drontal Plus (câini)',
  'Vaccin polivalent câini (DHPPiL)',
  'Vaccin antirabic',
  'Vaccin trivalent pisici (Nobivac Tricat)',
  'Apoquel (dermatologie câini)',
  'Vetmedin (cardiologie câini)',
  'Synulox (antibiotic veterinar)',
  'Caninsulin'
];

describe('Official Services & Medications Catalog (Seed & Search API)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. seed provides all official pharmacy services and clean human medications without stock wording', () => {
    const facilitiesPath = path.resolve(__dirname, '../../sibiu-facilities.json');
    const rawFacilities = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));

    const allPharmacyItems = new Set();
    for (const fac of rawFacilities.filter((f) => f.type === 'PHARMACY')) {
      for (const item of seedModule.enrichFacilityServices(fac)) {
        allPharmacyItems.add(item);
        expect(item.toLowerCase()).not.toContain('stoc');
        expect(item.toLowerCase()).not.toContain('orientativ');
      }
    }

    for (const srv of EXPECTED_PHARMACY_SERVICES) {
      expect(allPharmacyItems.has(srv)).toBe(true);
    }
    for (const med of EXPECTED_HUMAN_MEDICATIONS) {
      expect(allPharmacyItems.has(med)).toBe(true);
    }
  });

  it('2. seed provides all official vet services and clean veterinary medications without stock wording', () => {
    const facilitiesPath = path.resolve(__dirname, '../../sibiu-facilities.json');
    const rawFacilities = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));

    const allVetItems = new Set();
    for (const fac of rawFacilities.filter((f) => f.type === 'EMERGENCY_VET')) {
      for (const item of seedModule.enrichFacilityServices(fac)) {
        allVetItems.add(item);
        expect(item.toLowerCase()).not.toContain('stoc');
        expect(item.toLowerCase()).not.toContain('orientativ');
      }
    }

    for (const srv of EXPECTED_VET_SERVICES) {
      expect(allVetItems.has(srv)).toBe(true);
    }
    for (const med of EXPECTED_VET_MEDICATIONS) {
      expect(allVetItems.has(med)).toBe(true);
    }
  });

  it('3. resolveFacilitySource embeds official source metadata including "Catalog oficial & site-uri unități Sibiu"', () => {
    expect(typeof seedModule.resolveFacilitySource).toBe('function');

    const withSite = seedModule.resolveFacilitySource({
      source: 'Site oficial Dr. Max & Colegiul Farmaciștilor Sibiu'
    });
    expect(withSite).toContain('Catalog oficial & site-uri unități Sibiu');
    expect(withSite).toContain('Dr. Max');

    const fallback = seedModule.resolveFacilitySource({});
    expect(fallback).toBe('Catalog oficial & site-uri unități Sibiu');
  });

  it('4. GET /api/facilities?q=Parasinus and ?q=Bravecto query serviceName with clean medication labels', async () => {
    vi.spyOn(prisma.facility, 'findMany').mockResolvedValue([
      {
        id: 'FAC-PHARM-005',
        name: 'DR.MAX Sibiu 24',
        type: 'PHARMACY',
        address: 'Str. Semaforului',
        city: 'Sibiu',
        latitude: 45.789,
        longitude: 24.162,
        phone: '0269211000',
        services: [{ serviceName: 'Parasinus' }, { serviceName: 'Vaccinare antigripală în farmacie' }],
        regularSchedules: [],
        holidaySchedules: [],
        onCallRotations: [],
        corrections: []
      }
    ]);

    const pharmRes = await request(app).get('/api/facilities?q=Parasinus');
    expect(pharmRes.status).toBe(200);
    expect(pharmRes.body.facilities[0].services.some((s) => s.serviceName === 'Parasinus')).toBe(true);

    const vetSpy = vi.spyOn(prisma.facility, 'findMany').mockResolvedValue([
      {
        id: 'FAC-VET-001',
        name: 'Spitalul Veterinar Transilvania',
        type: 'EMERGENCY_VET',
        address: 'Str. Vasile Cârlova 19',
        city: 'Sibiu',
        latitude: 45.781,
        longitude: 24.142,
        phone: '0369991',
        services: [{ serviceName: 'Bravecto (antiparazitar câini)' }],
        regularSchedules: [],
        holidaySchedules: [],
        onCallRotations: [],
        corrections: []
      }
    ]);

    const vetRes = await request(app).get('/api/facilities?q=Bravecto');
    expect(vetRes.status).toBe(200);
    expect(vetSpy).toHaveBeenCalled();
    expect(vetRes.body.facilities[0].services[0].serviceName).toBe('Bravecto (antiparazitar câini)');
  });
});
