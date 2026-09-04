import { writeFileSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run, soffice } from "../lib/sh.js";

/** mulberry32: seeded PRNG so `gen:invoice:3` is the same document on every machine. */
export function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const pick = <T>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]!;
/** n distinct items: one invoice must not list the same service twice, one CV the same bullet. */
const sample = <T>(r: () => number, xs: readonly T[], n: number): T[] => [...xs].sort(() => r() - 0.5).slice(0, n);
const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const COMPANIES = ["Northwind Traders", "Blue Harbor Analytics", "Cedar Ridge Logistics", "Lantern Bay Media", "Ironwood Manufacturing", "Silverpine Consulting", "Redstone Partners", "Kestrel Data Works", "Halcyon Freight", "Meridian Print House", "Willow Creek Foods", "Copperline Energy", "Granite Peak Legal", "Sunfield Robotics", "Amberline Textiles", "Foxglove Studios", "Quarry Lane Builders", "Tidewater Instruments", "Brightfork Software", "Elmwood Dental Group", "Nightjar Security", "Pinebrook Ceramics", "Harborview Insurance", "Larkspur Biotech", "Stonebridge Rail", "Verdant Fields Agro", "Oakhaven Interiors", "Clearwater Optics", "Marbled Fern Press", "Ashcroft Metals"] as const;
const FIRST = ["Alice", "Marcus", "Priya", "Tomas", "Nadia", "Owen", "Beatrix", "Hugo", "Leila", "Grant", "Simone", "Dmitri", "Farrah", "Elias", "Ingrid", "Nolan", "Camille", "Rashid", "Yara", "Peter", "Delphine", "Joaquin", "Rosalind", "Emeka", "Anouk", "Victor", "Mina", "Hector", "Sylvie", "Bram"] as const;
const LAST = ["Whitfield", "Okonkwo", "Halvorsen", "Marchetti", "Dubois", "Kowalski", "Ferreira", "Lindqvist", "Ashworth", "Ramanathan", "Beaumont", "Nakashima", "Vasquez", "Thornbury", "Oyelaran", "Petrova", "Callahan", "Strand", "Bhattacharya", "Delacroix", "Ingram", "Moreau", "Fitzgerald", "Sandoval", "Ekberg", "Novak", "Cartwright", "Adeyemi", "Rosenthal", "Villalobos"] as const;
const STREETS = ["114 Larkspur Way", "8 Foundry Street", "2200 Kingsway Avenue", "51 Beaumont Row", "760 Alder Court", "17 Quarry Lane", "409 Selby Road", "3 Marlowe Place", "1180 Harbour Drive", "62 Ashgrove Terrace", "925 Fenwick Boulevard", "44 Ridgemont Close"] as const;
const CITIES = ["Portland, OR 97209", "Austin, TX 78702", "Providence, RI 02903", "Boulder, CO 80302", "Savannah, GA 31401", "Madison, WI 53703", "Tacoma, WA 98402", "Burlington, VT 05401", "Asheville, NC 28801", "Ann Arbor, MI 48104", "Santa Fe, NM 87501", "Rochester, NY 14604"] as const;
const ITEMS = ["Discovery workshop, half day", "Requirements analysis", "Interface design revision", "Front-end implementation sprint", "Database migration and backfill", "Load testing and tuning", "Security review, external", "On-site installation", "Operator training session", "Quarterly maintenance retainer", "Custom report development", "Data cleansing, per 10k records", "API integration, third party", "Legacy system decommissioning", "Documentation package", "Incident response, out of hours", "Accessibility audit", "Hosting, per month", "Backup verification service", "Hardware provisioning and imaging", "Content migration", "Statistical model calibration", "Field survey and measurement", "Prototype fabrication", "Freight and handling", "Warranty extension, 24 months", "Licence renewal, per seat", "Change management advisory", "Print run, 500 units", "Photography, per day"] as const;
const TITLES = ["Senior Software Engineer", "Data Analyst", "Product Manager", "Operations Lead", "Mechanical Engineer", "Financial Controller", "UX Designer", "Site Reliability Engineer", "Marketing Manager", "Research Scientist", "Logistics Coordinator", "Quality Assurance Lead"] as const;
const SKILLS = ["TypeScript", "Python", "Go", "SQL", "PostgreSQL", "Kubernetes", "Terraform", "AWS", "Azure", "Docker", "React", "Node.js", "Rust", "Kafka", "Airflow", "dbt", "Tableau", "Figma", "Jira", "Git", "CI/CD", "GraphQL", "Redis", "Elasticsearch", "Pandas", "PyTorch", "Linux", "Bash", "Grafana", "Ansible"] as const;
const DUTIES = ["Rebuilt the billing pipeline, cutting month-end close from four days to six hours.", "Led a team of five through a migration of 40 services to a managed platform.", "Introduced contract tests that removed the weekly integration freeze.", "Cut median API latency by 62% by replacing an N+1 query layer with batched reads.", "Owned the on-call rotation and drove incident count down by half over two quarters.", "Designed the reporting schema now used by every downstream analytics team.", "Automated the release process; deployments went from fortnightly to daily.", "Ran discovery with 30 customers and reframed the roadmap around two of the findings.", "Negotiated vendor terms that saved the department $180k annually.", "Wrote the onboarding handbook that halved ramp-up time for new engineers.", "Instrumented the checkout funnel and raised completion by 11 points.", "Consolidated three overlapping internal tools into one supported service."] as const;
const DEGREES = ["B.Sc. Computer Science", "M.Sc. Applied Statistics", "B.Eng. Mechanical Engineering", "B.A. Economics", "M.B.A.", "B.Sc. Information Systems", "M.Sc. Human-Computer Interaction", "B.Sc. Physics"] as const;
const SCHOOLS = ["University of Leeds", "Delft University of Technology", "Michigan State University", "University of Otago", "Trinity College Dublin", "Universidad de Salamanca", "McGill University", "Uppsala University"] as const;

const FONTS = ["Helvetica, Arial, sans-serif", "Georgia, 'Times New Roman', serif", "'Courier New', monospace"] as const;
const ACCENTS = ["#1f4e79", "#7a2e2e", "#2f5d3a"] as const;

/** Shared page chrome: A4 with margins, one accent colour and font family per template. */
function page(t: number, extra: string, body: string): string {
  return `<html><head><meta charset="utf-8"><style>
@page { size: A4; margin: 18mm 16mm; }
body { font-family: ${FONTS[t]}; font-size: 10.5pt; color: #111; line-height: 1.45; }
h1 { font-size: 20pt; margin: 0 0 2mm 0; color: ${ACCENTS[t]}; }
h2 { font-size: 12pt; margin: 6mm 0 2mm 0; color: ${ACCENTS[t]}; border-bottom: 1px solid ${ACCENTS[t]}; }
table { border-collapse: collapse; width: 100%; }
td, th { padding: 1.6mm 2.4mm; vertical-align: top; }
.num { text-align: right; white-space: nowrap; }
${extra}</style></head><body>
${body}
</body></html>`;
}

export function invoiceHtml(seed: number): string {
  const r = rng(seed), t = seed % 3;
  const seller = pick(r, COMPANIES);
  let buyer = pick(r, COMPANIES); while (buyer === seller) buyer = pick(r, COMPANIES);
  const contact = `${pick(r, FIRST)} ${pick(r, LAST)}`;
  const number = `INV-${2024 + (seed % 2)}-${String(1000 + Math.floor(r() * 8999))}`;
  const day = 1 + Math.floor(r() * 27), month = 1 + Math.floor(r() * 12);
  const date = new Date(Date.UTC(2025, month - 1, day)).toISOString().slice(0, 10);
  const rows = sample(r, ITEMS, 5 + Math.floor(r() * 10)).map((desc) => {
    const qty = 1 + Math.floor(r() * 14), rate = 45 + Math.floor(r() * 460);
    return { desc, qty, rate, amount: qty * rate };
  });
  const subtotal = rows.reduce((s, i) => s + i.amount, 0);
  const taxRate = [0.0825, 0.2, 0.07][t]!;
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const addr = (name: string, who: string) => `<td style="width:50%"><div style="font-weight:bold">${name}</div>${who}<br>${pick(r, STREETS)}<br>${pick(r, CITIES)}<br>United States</td>`;
  const extra = [
    `.items th { background: ${ACCENTS[0]}; color: #fff; text-align: left; } .items td { border-bottom: 1px solid #ccc; }`,
    `.items th { border-bottom: 2px solid ${ACCENTS[1]}; text-align: left; } .items td { border-bottom: 1px dotted #999; } .items tr:nth-child(even) td { background: #f5f0ec; }`,
    `.items th, .items td { border: 1px solid #444; } .items th { background: #eee; text-align: left; }`,
  ][t]!;
  const body = `<h1>Invoice</h1>
<table><tr>${addr("From", seller)}${addr("Bill to", buyer)}</tr></table>
<table style="margin-top:4mm"><tr>
<td style="width:34%"><b>Invoice number</b><br>${number}</td>
<td style="width:33%"><b>Issue date</b><br>${date}</td>
<td style="width:33%"><b>Terms</b><br>Net ${[14, 30, 45][t]} days</td></tr></table>
<h2>Services rendered</h2>
<table class="items"><tr><th>#</th><th>Description</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Amount</th></tr>
${rows.map((i, k) => `<tr><td>${k + 1}</td><td>${i.desc}</td><td class="num">${i.qty}</td><td class="num">${money(i.rate)}</td><td class="num">${money(i.amount)}</td></tr>`).join("\n")}
</table>
<table style="margin-top:4mm"><tr><td style="width:62%"></td><td class="num"><b>Subtotal</b></td><td class="num">${money(subtotal)}</td></tr>
<tr><td></td><td class="num"><b>Tax (${(taxRate * 100).toFixed(2)}%)</b></td><td class="num">${money(tax)}</td></tr>
<tr><td></td><td class="num" style="border-top:2px solid ${ACCENTS[t]}"><b>Total due</b></td><td class="num" style="border-top:2px solid ${ACCENTS[t]}"><b>${money(subtotal + tax)}</b></td></tr></table>
<h2>Notes</h2>
<p>Payment is due within ${[14, 30, 45][t]} days of the issue date. Late balances accrue interest at 1.5% per month. Please quote invoice number ${number} on the transfer.</p>
<p>Questions about this invoice should go to ${contact} at ${seller}. Bank details were supplied under separate cover; we never change them by email.</p>`;
  return page(t, extra, body);
}

export function resumeHtml(seed: number): string {
  const r = rng(seed), t = seed % 3;
  const name = `${pick(r, FIRST)} ${pick(r, LAST)}`, title = pick(r, TITLES);
  const email = `${name.toLowerCase().replace(" ", ".")}@example.com`;
  const phone = `+1 (${200 + Math.floor(r() * 700)}) ${100 + Math.floor(r() * 899)}-${String(1000 + Math.floor(r() * 8999))}`;
  const skills = sample(r, SKILLS, 12), schools = sample(r, SCHOOLS, 2);
  const duties = sample(r, DUTIES, DUTIES.length), roles = sample(r, TITLES, 3), employers = sample(r, COMPANIES, 3);
  let year = 2025, dealt = 0;
  const jobs = Array.from({ length: 3 }, (_, i) => {
    const span = 2 + Math.floor(r() * 3), to = year, from = (year -= span);
    const bullets = duties.slice(dealt, (dealt += 3 + Math.floor(r() * 2)));
    return { company: employers[i]!, role: roles[i]!, from, to, city: pick(r, CITIES).split(",")[0]!, bullets };
  });
  const extra = [
    `.contact td { border-bottom: 1px solid #ddd; } .skills td { border: 1px solid #bbb; width: 25%; } li { margin-bottom: 1mm; }`,
    `.contact td { background: #f4f1ea; } .skills td { border-bottom: 1px solid #999; width: 25%; } h1 { letter-spacing: 0.6mm; }`,
    `.contact td { font-size: 9.5pt; } .skills td { background: #eef2ee; width: 25%; } ul { margin-top: 1mm; }`,
  ][t]!;
  const job = (j: (typeof jobs)[number]) => `<p style="margin-bottom:0"><b>${j.role}</b> &mdash; ${j.company}, ${j.city} <span style="float:right">${j.from}&ndash;${j.to}</span></p>
<ul>${j.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>`;
  const body = `<h1>${name}</h1>
<p style="margin-top:0;font-size:12pt;color:#444">${title}</p>
<table class="contact"><tr><td style="width:50%">${email}</td><td style="width:50%" class="num">${phone}</td></tr>
<tr><td>${pick(r, CITIES)}</td><td class="num">linkedin.com/in/${name.toLowerCase().replace(" ", "-")}</td></tr></table>
<h2>Summary</h2>
<p>${title} with ${8 + Math.floor(r() * 10)} years of experience across ${pick(r, COMPANIES)} and comparable organisations. Comfortable owning a system end to end, from the data model to the on-call rotation, and used to writing the document that settles an argument rather than repeating it.</p>
<h2>Experience</h2>
${jobs.map(job).join("\n")}
<h2>Education</h2>
${sample(r, DEGREES, 2).map((d, i) => `<p><b>${d}</b>, ${schools[i]} &mdash; ${year - 4 - i * 4}</p>`).join("\n")}
<h2>Skills</h2>
<table class="skills">${Array.from({ length: 3 }, (_, row) => `<tr>${skills.slice(row * 4, row * 4 + 4).map((s) => `<td>${s}</td>`).join("")}</tr>`).join("")}</table>`;
  return page(t, extra, body);
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Project Gutenberg plain text → single-column prose: markers stripped, first ~5000 words,
 *  blank-line paragraphs to <p>, short all-caps lines to <h2>. */
export function bookHtml(gutenbergTxt: string): string {
  let txt = gutenbergTxt.replace(/\r\n/g, "\n");
  const start = /^\*\*\* ?START OF.*$/m.exec(txt);
  if (start) txt = txt.slice(start.index + start[0].length);
  const end = /^\*\*\* ?END OF/m.exec(txt);
  if (end) txt = txt.slice(0, end.index);
  let words = 0;
  const blocks: string[] = [];
  for (const raw of txt.split(/\n\s*\n/)) {
    const block = raw.trim();
    if (words > 5000) break;
    if (!block) continue;
    words += block.split(/\s+/).length;
    blocks.push(block.length < 60 && block === block.toUpperCase() && /[A-Z]/.test(block)
      ? `<h2>${esc(block.replace(/\n/g, " "))}</h2>`
      : `<p>${esc(block.replace(/\n/g, " "))}</p>`);
  }
  return page(1, "p { text-align: justify; text-indent: 6mm; margin: 0 0 2mm 0; }", blocks.join("\n"));
}

export function htmlToPdf(html: string, out: string): void {
  const dir = mkdtempSync(join(tmpdir(), "gen-")); const src = join(dir, "doc.html"); writeFileSync(src, html);
  try {
    // Without --infilter LibreOffice imports .html as a Writer/Web document: no pagination and
    // web-sized row padding. The StarWriter filter gives a real paginated A4 text document.
    run(soffice(), [`-env:UserInstallation=file://${dir}/lo`, "--headless", "--infilter=HTML (StarWriter)", "--convert-to", "pdf:writer_pdf_Export", "--outdir", dir, src]);
    run("cp", [join(dir, "doc.pdf"), out]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** First `pages` pages only — keeps the benchmark run bounded for long downloads. */
export function truncatePdf(pdf: string, pages: number, out: string): void {
  const dir = mkdtempSync(join(tmpdir(), "trunc-"));
  try {
    run("pdfseparate", ["-l", String(pages), pdf, join(dir, "p-%d.pdf")]);
    const parts = readdirSync(dir).sort((a, b) => parseInt(a.slice(2)) - parseInt(b.slice(2))).map((f) => join(dir, f));
    run("pdfunite", [...parts, out]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Rasterize a born-digital PDF into a scan-like one: no text layer, JPEG artefacts, grayscale. */
export function scanPdf(sourcePdf: string, out: string): void {
  const dir = mkdtempSync(join(tmpdir(), "scan-"));
  try {
    run("pdftoppm", ["-r", "150", "-gray", "-jpeg", sourcePdf, join(dir, "p")]);
    const jpgs = readdirSync(dir).sort((a, b) => parseInt(a.slice(2)) - parseInt(b.slice(2))).map((f) => join(dir, f));
    run("uvx", ["img2pdf", ...jpgs, "-o", out]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
