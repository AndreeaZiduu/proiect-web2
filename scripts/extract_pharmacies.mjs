import fs from 'node:fs';
import path from 'node:path';

// 1. Probe official chain locators to test availability of public pages
async function probeChainWebsites() {
  const targets = [
    { name: 'Dr. Max', url: 'https://www.drmax.ro/farmacii' },
    { name: 'Catena', url: 'https://www.catena.ro/farmacii' },
    { name: 'Help Net', url: 'https://www.helpnet.ro/farmacii' },
    { name: 'Dona', url: 'https://farmaciiledona.ro/farmacii' }
  ];

  console.log('--- Verificare acces pagini publice lanțuri de farmacii ---');
  for (const t of targets) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(t.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PharmacyVerifier/1.0)' },
        signal: controller.signal
      });
      clearTimeout(timeout);
      console.log(`[${t.name}] ${t.url} -> HTTP ${res.status} (${res.statusText || 'OK'})`);
    } catch (err) {
      console.log(`[${t.name}] ${t.url} -> ${err.name}: ${err.message}`);
    }
  }
}

// 2. Extract verified supplementary pharmacies from official Sibiu county registry
function extractSupplementaryPharmacies() {
  console.log('\n--- Extragere farmacii suplimentare reale din județul Sibiu ---');

  const existingFile = path.resolve('farmacii-filtrate.json');
  const sourceFile = path.resolve('farmacii_listainitiala.txt');
  const outputFile = path.resolve('farmacii_suplimentare.txt');

  const existing = JSON.parse(fs.readFileSync(existingFile, 'utf-8'));
  const existingSet = new Set(
    existing.map(e => `${e.name.trim().toLowerCase()}|${e.address.trim().toLowerCase()}`)
  );
  console.log(`Farmacii existente în farmacii-filtrate.json: ${existing.length}`);

  const rawText = fs.readFileSync(sourceFile, 'utf-8').replace(/\r\n/g, '\n').replace(/\t\n\n/g, '\t\n');
  const lines = rawText.split('\n').map(l => l.replace(/^\ufeff/, '').trim());

  // First 7 lines are the table header
  const rows = lines.slice(7);
  const units = [];

  for (let i = 0; i < rows.length; i += 7) {
    const chunk = rows.slice(i, i + 7);
    if (chunk.length < 7) continue;

    const [name, city, address, phone, tip, regular, holiday] = chunk;
    if (name && city && address && phone && regular && holiday) {
      const key = `${name.toLowerCase()}|${address.toLowerCase()}`;
      if (!existingSet.has(key)) {
        units.push({
          name,
          city,
          address,
          phone,
          typeLabel: tip || 'circuit deschis',
          regularScheduleRaw: regular,
          holidayScheduleRaw: holiday
        });
      }
    }
  }

  console.log(`Unități candidate găsite (fără duplicate, cu toate câmpurile complete): ${units.length}`);

  // Select 20 pharmacies across all requested chains: Dr. Max, Catena, Dona, Help Net
  const drMaxUnits = units.filter(u => u.name.toLowerCase().includes('dr.max'));
  const catenaUnits = units.filter(u => u.name.toLowerCase().includes('catena'));
  const donaUnits = units.filter(u => u.name.toLowerCase().includes('dona'));
  const helpNetUnits = units.filter(u => u.name.toLowerCase().includes('help net'));

  console.log(`Disponibile per lanț: Dr.Max (${drMaxUnits.length}), Catena (${catenaUnits.length}), Dona (${donaUnits.length}), Help Net (${helpNetUnits.length})`);

  // Distribute 20 across all 4 chains: 7 Dr.Max + 7 Catena + 4 Dona + 2 Help Net = 20
  const selected = [
    ...drMaxUnits.slice(0, 7),
    ...catenaUnits.slice(0, 7),
    ...donaUnits.slice(0, 4),
    ...helpNetUnits.slice(0, 2)
  ];
  console.log(`Selectat exact ${selected.length} farmacii suplimentare.`);

  // Write in clean 7-line format compatible with official CFS format
  let outputText = 'Denumire\n\tLocalitate\n\tAdresă\n\tTelefon\n\tTip\n\tProgram\n\tProgram sărbători\n';

  for (const p of selected) {
    outputText += `\t${p.name}\n`;
    outputText += `\t${p.city}\n`;
    outputText += `\t${p.address}\n`;
    outputText += `\t${p.phone}\n`;
    outputText += `\t${p.typeLabel}\n`;
    outputText += `\t${p.regularScheduleRaw}\n`;
    outputText += `\t${p.holidayScheduleRaw}\n`;
  }

  fs.writeFileSync(outputFile, outputText, 'utf-8');
  console.log(`Fișierul ${outputFile} a fost salvat cu succes.`);
  return selected;
}

await probeChainWebsites();
const added = extractSupplementaryPharmacies();
console.log(`\nFinalizat: ${added.length} farmacii noi salvate.`);
process.exit(0);
