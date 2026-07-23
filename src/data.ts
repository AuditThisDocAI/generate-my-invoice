import { DocumentData } from "./types";

export const COLOR_PALETTES = {
  violet: {
    name: "Linear Violet",
    primary: "bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white shadow-sm hover:shadow-violet-200",
    text: "text-violet-700",
    border: "border-violet-100",
    badge: "bg-violet-50 text-violet-700 border-violet-100",
    headerGrad: "from-zinc-900 to-violet-950",
    accentText: "text-violet-600",
    accentBg: "bg-violet-50/50",
    accentHex: "#8B5CF6",
  },
  gold: {
    name: "Stripe Gold",
    primary: "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white shadow-sm",
    text: "text-amber-800",
    border: "border-amber-100",
    badge: "bg-amber-50 text-amber-800 border-amber-100",
    headerGrad: "from-zinc-900 to-amber-950",
    accentText: "text-amber-600",
    accentBg: "bg-amber-50/50",
    accentHex: "#F59E0B",
  },
  emerald: {
    name: "Sage Emerald",
    primary: "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm",
    text: "text-emerald-700",
    border: "border-emerald-100",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-100",
    headerGrad: "from-zinc-900 to-emerald-950",
    accentText: "text-emerald-600",
    accentBg: "bg-emerald-50/50",
    accentHex: "#10B981",
  },
  sapphire: {
    name: "Framer Sapphire",
    primary: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm",
    text: "text-blue-700",
    border: "border-blue-100",
    badge: "bg-blue-50 text-blue-800 border-blue-100",
    headerGrad: "from-zinc-900 to-blue-950",
    accentText: "text-blue-600",
    accentBg: "bg-blue-50/50",
    accentHex: "#3B82F6",
  },
  rose: {
    name: "Notion Rose",
    primary: "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm",
    text: "text-rose-700",
    border: "border-rose-100",
    badge: "bg-rose-50 text-rose-800 border-rose-100",
    headerGrad: "from-zinc-900 to-rose-950",
    accentText: "text-rose-600",
    accentBg: "bg-rose-50/50",
    accentHex: "#F43F5E",
  },
  charcoal: {
    name: "Studio Dark",
    primary: "bg-zinc-800 hover:bg-zinc-900 active:bg-black text-white shadow-sm",
    text: "text-zinc-800",
    border: "border-zinc-200",
    badge: "bg-zinc-50 text-zinc-800 border-zinc-200",
    headerGrad: "from-zinc-950 to-zinc-900",
    accentText: "text-zinc-800",
    accentBg: "bg-zinc-100/50",
    accentHex: "#09090B",
  },
};

export const SAMPLE_DOCUMENTS: Record<string, DocumentData> = {
  invoice1: {
    documentType: 'invoice',
    customTypeName: 'Consulting Invoice',
    documentNumber: 'INV-2026-894',
    logoText: '🏢 YOUR COMPANY',
    issueDate: '2026-05-24',
    dueDate: '2026-06-23',
    currency: '$',
    
    senderName: 'Jane Doe',
    senderCompany: 'Your Company Name',
    senderEmail: 'hello@yourcompany.com',
    senderPhone: '+1 (555) 019-2834',
    senderAddress: '123 Innovation Way, Suite 400\nSan Jose, CA 95112',
    senderTaxId: 'US-1234567-B',

    clientName: 'Sarah Jenkins',
    clientCompany: 'Aether Labs Biocare',
    clientEmail: 'billing@aetherlabs.io',
    clientPhone: '+1 (415) 304-9483',
    clientAddress: '88 Quantum Blvd, Suite 2B\nSausalito, CA 94965',
    clientTaxId: 'VAT-US-A829375',

    customFields: [
      { label: 'Project Name', value: 'Interactive Web Platform Redesign' },
      { label: 'PO Number', value: 'PO-AETHER-2026' }
    ],

    items: [
      {
        id: '1',
        name: 'Brand Identity Design',
        description: 'Comprehensive design process & component research, color palettes, typographic kit, and custom high-fidelity vector assets for dark/light setups.',
        quantity: 1,
        rate: 2400,
        taxPercent: 5,
        discountPercent: 10
      },
      {
        id: '2',
        name: 'Interactive React Landing Page',
        description: 'High performance web experience with custom motion animations, optimized responsive layouts, and full accessibility implementation.',
        quantity: 40,
        rate: 85,
        taxPercent: 5,
        discountPercent: 0
      },
      {
        id: '3',
        name: 'Post-launch Cloud Orchestration & CDN Support',
        description: 'Transition of servers, domain record settings, cloud environment replication config, and CDN propagation.',
        quantity: 5,
        rate: 150,
        taxPercent: 0,
        discountPercent: 0
      }
    ],

    discountRate: 200,
    taxRate: 5,
    shippingCharge: 0,
    amountPaid: 1500,

    notes: 'Thank you for your business! Please pay the balance sum within 30 days of invoice date. If you have any questions regarding the line breakdown, reach out to us at hello@yourcompany.com.',
    terms: 'Payments can be completed via Bank Transfer or securely on our client platform via Card processing. Standard interest penalty of 1.5% per month applies for overdue balances.',
    themeColor: 'violet',
    themeLayout: 'modern_bold',
    bankName: 'Capitec Bank Ltd',
    bankAccountHolder: 'Jane Doe Consulting Services',
    bankAccountNumber: '100239482947',
    bankBranchCode: 'CABLZAJJ',
    bankSwiftCode: 'CABLZAJJXXX',
    bankIban: 'GB29 UTBS 4005 1612 3456 78'
  },

  quote2: {
    documentType: 'quote',
    customTypeName: 'Project Estimate',
    documentNumber: 'EST-9037',
    logoText: '🌿 ECOSTRUCTURE',
    issueDate: '2026-05-24',
    dueDate: '2026-06-07',
    currency: '€',
    
    senderName: 'Léa Dubois',
    senderCompany: 'Ecostructure Architectes Paris',
    senderEmail: 'lea@ecostructure-paris.fr',
    senderPhone: '+33 1 42 39 88 12',
    senderAddress: '15 Rues de la Rénovation\nParis, 75011, France',
    senderTaxId: 'FR-8893472910',

    clientName: 'Oliver König',
    clientCompany: 'Neustadt Coffee Co.',
    clientEmail: 'contact@neustadtcoffee.de',
    clientPhone: '+49 30 5553229',
    clientAddress: 'Allee-Strasse 104-106, Haus B\nBerlin, 10115, Germany',
    clientTaxId: 'DE-394817294',

    customFields: [
      { label: 'Site Location', value: 'Mitte Quarter Café Space, Berlin' },
      { label: 'Phase', value: 'Preliminary Conceptual Phase' }
    ],

    items: [
      {
        id: 'q1',
        name: 'Interior Space Mapping & Sustainable Consulting',
        description: 'Complete inspection of dimensions, thermal retention calculations, natural light diagnostics, and list of recommended recycled construction materials.',
        quantity: 1,
        rate: 3200,
        taxPercent: 19,
        discountPercent: 5
      },
      {
        id: 'q2',
        name: '3D Photorealistic Rendering Slides',
        description: 'Generation of 10 perspectives depicting custom counter design, seating organization, coffee brewing counter, and light propagation scenarios.',
        quantity: 1,
        rate: 1800,
        taxPercent: 19,
        discountPercent: 5
      },
      {
        id: 'q3',
        name: 'Berlin Local Build Application Preparation',
        description: 'Drafting of general layout blueprints, exit door placements, plumbing lines, and submission file checklist compliant with Berlin planning regulation laws.',
        quantity: 1,
        rate: 1500,
        taxPercent: 19,
        discountPercent: 0
      }
    ],

    discountRate: 0,
    taxRate: 0,
    shippingCharge: 0,
    amountPaid: 0,

    notes: 'This estimate is strictly valid for 30 days. Proposed pricing accounts for initial engineering mappings. If architectural changes exceed 10% structural offset, a new estimate will be compiled.',
    terms: '50% retainer fee required immediately to schedule mapping. 30% on delivery of initial 3D drafts. 20% on final planning submissions. All prices subject to standard German VAT where listed.',
    themeColor: 'emerald',
    themeLayout: 'elegant_standard'
  },

  receipt3: {
    documentType: 'receipt',
    customTypeName: 'Payment Receipt',
    documentNumber: 'RCP-57294',
    logoText: '⚡ NEUTRON HARDWARE',
    issueDate: '2026-05-24',
    dueDate: '2026-05-24',
    currency: '£',
    
    senderName: 'Sales Dispatch',
    senderCompany: 'Neutron Hardware (London) Ltd.',
    senderEmail: 'london-dispatch@neutron-tech.co.uk',
    senderPhone: '+44 20 7946 0912',
    senderAddress: 'Unit 4, Gateway Business Park\nGreenwich, London, SE10 0ER',
    senderTaxId: 'GB-924-8832-13',

    clientName: 'Marcus Thorne',
    clientCompany: 'Thorne Film Productions',
    clientEmail: 'm.thorne@thornefilms.com',
    clientPhone: '+44 7700 900077',
    clientAddress: 'The Studio Rooms, 42 Broadgate\nShoreditch, London, EC2M 2QS',
    clientTaxId: '',

    customFields: [
      { label: 'Cashier ID', value: 'POS-CASHIER-07' },
      { label: 'Payment Method', value: 'Credit Card (Visa - ****8821)' },
      { label: 'Authorization Code', value: 'AUTH-94283921' }
    ],

    items: [
      {
        id: 'r1',
        name: 'Quantum-X Liquid Cooled Editing Station',
        description: 'AMD Ryzen 9950X, 128GB DDR5, Dual RTX 5090 GPUs, 8TB NVMe RAID Array, custom acrylic loop.',
        quantity: 1,
        rate: 4500,
        taxPercent: 20,
        discountPercent: 0
      },
      {
        id: 'r2',
        name: 'Reference Grade OLED 32" Monitor',
        description: '4K resolution, 240Hz, hardware-calibrated for Dolby Vision & DCI-P3 workspace mapping.',
        quantity: 2,
        rate: 1100,
        taxPercent: 20,
        discountPercent: 10
      },
      {
        id: 'r3',
        name: 'Ergonomic Aero-Mesh Studio Chair',
        description: 'Adjustable posture angles with aluminum cast bases.',
        quantity: 1,
        rate: 650,
        taxPercent: 20,
        discountPercent: 0
      }
    ],

    discountRate: 150,
    taxRate: 0,
    shippingCharge: 45,
    amountPaid: 8014, // Matches exact total (calculated below) to represent Fully Paid Status!

    notes: 'Thank you for your purchase from Neutron Hardware! Your equipment carries a comprehensive 3-year store replacements warranty. Ensure you keep this receipt for barcode scanner indexing.',
    terms: 'Warranty cases demand the reference of this slip. Refund or substitution requests are accepted within 14 calendar days of delivery, provided components reside inside their original protective wrappers.',
    themeColor: 'rose',
    themeLayout: 'neon_digital'
  },

  po4: {
    documentType: 'purchase_order',
    customTypeName: 'Supply Purchase Order',
    documentNumber: 'PO-2026-0049',
    logoText: '🍩 FLUFFY CRUSTS',
    issueDate: '2026-05-24',
    dueDate: '2026-06-15',
    currency: '$',
    
    senderName: 'Brenda Vance',
    senderCompany: 'Fluffy Crusts Bakery Chains',
    senderEmail: 'vance.p@fluffycrusts.com',
    senderPhone: '+1 (800) 555-CRUST',
    senderAddress: '900 Sweetwater Blvd, Suite D\nOrlando, FL 32801',
    senderTaxId: 'US-8219375-B',

    clientName: 'Supply Accounts',
    clientCompany: 'Apex Baker Wholesalers Inc.',
    clientEmail: 'bulk-orders@apexbakersupply.co',
    clientPhone: '+1 (888) 310-9481',
    clientAddress: '150 Flour Mills highway\nKansas City, MO 64120',
    clientTaxId: 'US-9348102-K',

    customFields: [
      { label: 'Warehouse Code', value: 'WH-ORLANDO-SOUTH' },
      { label: 'Carrier Preference', value: 'Apex Freight Refrigerated' }
    ],

    items: [
      {
        id: 'p1',
        name: 'Organic Unbleached Pastry Flour (40 lb bags)',
        description: 'High-protein bakers standard flour, organic certified, non-GMO.',
        quantity: 150,
        rate: 18.5,
        taxPercent: 0,
        discountPercent: 5
      },
      {
        id: 'p2',
        name: 'European-Style Salted Cultured Butter (25 lb cases)',
        description: '82% butterfat premium cultured baking blocks.',
        quantity: 30,
        rate: 82,
        taxPercent: 0,
        discountPercent: 0
      },
      {
        id: 'p3',
        name: 'Madagascar Bourbon Vanilla Extract (1 Gallon)',
        description: 'Strictly sourced pure single fold vanilla extract liquor.',
        quantity: 4,
        rate: 350,
        taxPercent: 0,
        discountPercent: 0
      }
    ],

    discountRate: 350,
    taxRate: 0,
    shippingCharge: 190,
    amountPaid: 0,

    notes: 'Please dispatch goods using temperature-guarded transport units to maintain butter standards. Send automated container tracker numbers to vance.p@fluffycrusts.com on shipping initiation.',
    terms: 'All items must strictly comply with USDA food safety standards. Purchase order values are binding. Payment will be released strictly Net 30 days post receiving verified delivery logs.',
    themeColor: 'gold',
    themeLayout: 'compact_grid'
  }
};

export interface IndustryItem {
  id: string;
  name: string;
  icon: string;
  desc: string;
  prompt: string;
}

export const INDUSTRY_PRESETS: IndustryItem[] = [
  {
    id: "cleaners",
    name: "Commercial Cleaners",
    icon: "Sparkles",
    desc: "Office deep-cleaning & standard maintenance entries",
    prompt: "Create a monthly cleaning invoice for Alquins Commercial Services. Fixed maintenance rate of R2850. Add ZA VAT of 15%."
  },
  {
    id: "roofing",
    name: "Roofing & Contractors",
    icon: "Wrench",
    desc: "Labor + waterproofing & tiling specs",
    prompt: "Estimate for John Smith roof repairs under waterproofing labor & cement sealing. Quantity 1 for R8500. Include 14 days review."
  },
  {
    id: "freelancers",
    name: "SaaS & Freelancers",
    icon: "User",
    desc: "UI Design consulting, hourly milestones",
    prompt: "Create a UI design quote for Neural Mind Studio. 40 hours consulting at $120/hr, apply 10% discount. Due in 14 days."
  },
  {
    id: "agencies",
    name: "Creative Agencies",
    icon: "Briefcase",
    desc: "Asset production, copyright licenses",
    prompt: "Invoice for Red Media. Brand video production package flat-rate $3500, asset delivery fee $150. VAT exempt."
  },
  {
    id: "plumbers",
    name: "Plumbers & Trade Specialists",
    icon: "Wrench",
    desc: "Leak repairs and standard callout rates",
    prompt: "Make a receipt for leak repairs at 123 Main St. Plumber Callout fee $120, copper pipe replacements $75. Paid in cash."
  },
  {
    id: "electricians",
    name: "Electricians & Electrical Co",
    icon: "Zap",
    desc: "Compliance certificate and inspection",
    prompt: "Create an estimate for home rewiring project. Inspection labor 8 hours @ $85/hr, copper conduit packs $300. Certificate of compliance included."
  },
  {
    id: "sme",
    name: "South African SMEs",
    icon: "Building",
    desc: "SME compliance, multi-tier tax rates",
    prompt: "Create a tax invoice in Rand (R) for Cape Town Logistics. Cargo container tracking fee of R12500. Add South African VAT @ 15%."
  },
  {
    id: "contractors",
    name: "Global Contractors",
    icon: "Globe",
    desc: "Multi-currency remote services",
    prompt: "Estimate for Tokyo Labs. Dev consultation fee 40 hours @ €110/hr. Tax rate 0%. Set currency code to €."
  },
  {
    id: "resume_builder",
    name: "AI Professional Resume",
    icon: "User",
    desc: "Generate professional resumes and CV profiles with AI",
    prompt: "Generate a professional software engineer resume. Objective details high motivation in modern fullstack development. Add work experience as Senior Developer at Google for 3 years, and Tech Lead at Stripe for 2 years. Include core technical skills: React, TypeScript, GraphQL, Node.js."
  }
];

export const MEMORY_SAMPLES = [
  {
    clientId: "mem_client_1",
    clientName: "Alquins Cleaning Ltd",
    clientCompany: "Alquins Commercial Cleaning Services",
    clientEmail: "accounts@alquinscleaning.co.za",
    clientPhone: "+27 11 904 8321",
    clientAddress: "77 Ghandi Square, Floor 4\nJohannesburg, 2000, South Africa",
    clientTaxId: "ZA-440283941",
    customTypeName: "Corporate Maintenance Invoice",
    logoText: "🧹 ALQUINS CLEAN Co.",
    currency: "ZAR",
    themeColor: "violet",
    defaultItems: [
      { id: "row_m1", name: "Monthly Corporate Deep-Clean Maintenance", description: "Standard sanitation of floor plates A and B, window wash, waste sorting.", quantity: 1, rate: 2850, taxPercent: 15, discountPercent: 0 }
    ],
    terms: "Net 15 Days. Standard late billing fee of 2.5% per month.",
    notes: "Thank you for trusting Alquins for corporate hygiene safety!"
  },
  {
    clientId: "mem_client_2",
    clientName: "Neural Mind Studio PLC",
    clientCompany: "Neural Mind AI Design Hub Ltd",
    clientEmail: "billing@neuralmind.ai",
    clientPhone: "+1 (888) AI-MIND-1",
    clientAddress: "Suite 600, Infinity Tower\nSan Francisco, CA 94105",
    clientTaxId: "US-9038421-E",
    customTypeName: "AI Design Deliverable",
    logoText: "🧠 NEURAL MIND HUB",
    currency: "$",
    themeColor: "gold",
    defaultItems: [
      { id: "row_m2", name: "AI Agent UI Design Consulting", description: "Design workflow modeling, responsive component framework drafts, high fidelity prototype maps.", quantity: 40, rate: 120, taxPercent: 0, discountPercent: 10 }
    ],
    terms: "Due in 14 days. Subject to remote engineering licensing agreements.",
    notes: "Accelerating your visual-intelligence stack."
  },
  {
    clientId: "mem_client_3",
    clientName: "John Smith Home Repair",
    clientCompany: "John Smith Private Residence LLC",
    clientEmail: "smith.john@gmail.com",
    clientPhone: "+27 82 555 1092",
    clientAddress: "12 Meadow Way, Bishopscourt\nCape Town, 7708, South Africa",
    clientTaxId: "",
    customTypeName: "Service Repairs Estimate",
    logoText: "🔨 SMITH TRADES",
    currency: "ZAR",
    themeColor: "emerald",
    defaultItems: [
      { id: "row_m3", name: "Premium Roof Waterproofing Labor & Coating", description: "Locating structural ceiling leaks, scraping current tiles, laying membrane seals, and dual coat UV protection paint.", quantity: 1, rate: 8500, taxPercent: 0, discountPercent: 0 }
    ],
    terms: "Estimate valid for 30 days. 50% upfront retainer to schedule labor logistics.",
    notes: "Complete trade certificate of compliance issued post project completion."
  }
];

