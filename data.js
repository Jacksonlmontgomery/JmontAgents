// data.js - Data model, sample data, and persistence

const STORAGE_KEY = 'jmontagents_v2';

// Department color map
const DEPT_COLORS = {
    'Engineering':       '#378ADD',
    'Sales':             '#29AC4A',
    'Marketing':         '#EA6020',
    'Customer Support':  '#7F77DD',
    'HR':                '#BA7517',
    'Finance':           '#16A34A',
    'Operations':        '#6366F1',
    'Legal':             '#DC2626',
    'Product':           '#0891B2',
};

const DEFAULT_AGENTS = [
    {
        id: '1',
        name: 'Customer Inquiry Router',
        department: 'Customer Support',
        status: 'deployed',
        owner: 'Sarah Chen',
        startDate: '2026-01-10',
        targetDate: '2026-03-01',
        description: 'Routes incoming customer inquiries to the correct support tier based on intent classification.',
        usesPerWeek: 45,
        activeUsers: 'Sarah, Kylie, Support Team',
        lastUsed: '2026-03-29',
        hoursSaved: 8,
        blendedRate: 100,
        revenueInfluence: 'indirect',
        revenueNote: 'Faster ticket resolution, improved CSAT scores',
        replaces: 'Manual ticket triage (2 FTE hours/day)'
    },
    {
        id: '2',
        name: 'Lead Scoring Agent',
        department: 'Sales',
        status: 'active',
        owner: 'Marcus Rivera',
        startDate: '2026-02-01',
        targetDate: '2026-04-15',
        description: 'Scores inbound leads using firmographic data and engagement signals.',
        usesPerWeek: 30,
        activeUsers: 'Marcus, Sales Team',
        lastUsed: '2026-03-28',
        hoursSaved: 6,
        blendedRate: 125,
        revenueInfluence: 'direct',
        revenueNote: 'Prioritized 40 leads, 8 converted to pipeline',
        replaces: 'Manual lead qualification process'
    },
    {
        id: '3',
        name: 'Code Review Assistant',
        department: 'Engineering',
        status: 'testing',
        owner: 'Alex Kim',
        startDate: '2026-01-20',
        targetDate: '2026-03-30',
        description: 'Reviews pull requests for code quality, security vulnerabilities, and style compliance.',
        usesPerWeek: 12,
        activeUsers: 'Alex, Casey, Dev Team',
        lastUsed: '2026-03-29',
        hoursSaved: 5,
        blendedRate: 150,
        revenueInfluence: 'indirect',
        revenueNote: 'Faster PR turnaround, fewer production bugs',
        replaces: 'Senior engineer review bottleneck (~3 hrs/day)'
    },
    {
        id: '4',
        name: 'Campaign Copy Generator',
        department: 'Marketing',
        status: 'active',
        owner: 'Dana Patel',
        startDate: '2026-02-15',
        targetDate: '2026-05-01',
        description: 'Generates ad copy and email content based on campaign briefs and brand guidelines.',
        usesPerWeek: 8,
        activeUsers: 'Dana, Marketing Team',
        lastUsed: '2026-03-27',
        hoursSaved: 4,
        blendedRate: 100,
        revenueInfluence: 'indirect',
        revenueNote: 'Faster campaign launches, A/B test velocity up 2x',
        replaces: 'Copywriter first-draft time (~$2k/mo freelance)'
    },
    {
        id: '5',
        name: 'Resume Screening Agent',
        department: 'HR',
        status: 'planning',
        owner: 'Jordan Lee',
        startDate: '2026-03-10',
        targetDate: '2026-06-01',
        description: 'Pre-screens resumes against job requirements and provides shortlist recommendations.',
        usesPerWeek: 0,
        activeUsers: '',
        lastUsed: '',
        hoursSaved: 0,
        blendedRate: 75,
        revenueInfluence: 'none',
        revenueNote: '',
        replaces: 'Manual resume screening (est. 10 hrs/week when active)'
    },
    {
        id: '6',
        name: 'Invoice Processing Bot',
        department: 'Finance',
        status: 'deployed',
        owner: 'Taylor Brooks',
        startDate: '2025-11-01',
        targetDate: '2026-02-01',
        description: 'Extracts data from invoices and auto-populates accounting entries.',
        usesPerWeek: 25,
        activeUsers: 'Taylor, AP Team',
        lastUsed: '2026-03-29',
        hoursSaved: 7,
        blendedRate: 85,
        revenueInfluence: 'none',
        revenueNote: '',
        replaces: 'Manual data entry, could replace $500/mo OCR SaaS tool'
    },
    {
        id: '7',
        name: 'Incident Triage Agent',
        department: 'Engineering',
        status: 'active',
        owner: 'Casey Nguyen',
        startDate: '2026-02-05',
        targetDate: '2026-04-10',
        description: 'Triages production incidents by severity and routes to on-call teams.',
        usesPerWeek: 6,
        activeUsers: 'Casey, On-call rotation',
        lastUsed: '2026-03-28',
        hoursSaved: 3,
        blendedRate: 150,
        revenueInfluence: 'indirect',
        revenueNote: 'Reduced MTTR by ~30%',
        replaces: 'Manual PagerDuty triage process'
    },
    {
        id: '8',
        name: 'Compliance Doc Reviewer',
        department: 'Legal',
        status: 'testing',
        owner: 'Morgan Shaw',
        startDate: '2026-01-15',
        targetDate: '2026-04-01',
        description: 'Reviews contracts and documents for compliance with company policies and regulations.',
        usesPerWeek: 4,
        activeUsers: 'Morgan, Legal Team',
        lastUsed: '2026-03-25',
        hoursSaved: 5,
        blendedRate: 200,
        revenueInfluence: 'indirect',
        revenueNote: 'Faster contract turnaround for deals',
        replaces: 'Outside counsel review time (~$400/hr)'
    },
    {
        id: '9',
        name: 'Onboarding Guide Bot',
        department: 'HR',
        status: 'deployed',
        owner: 'Jordan Lee',
        startDate: '2025-10-01',
        targetDate: '2026-01-15',
        description: 'Guides new hires through onboarding steps and answers common policy questions.',
        usesPerWeek: 10,
        activeUsers: 'All new hires, HR Team',
        lastUsed: '2026-03-29',
        hoursSaved: 3,
        blendedRate: 75,
        revenueInfluence: 'none',
        revenueNote: '',
        replaces: 'HR onboarding coordinator time (partial FTE)'
    },
    {
        id: '10',
        name: 'Sales Forecast Agent',
        department: 'Sales',
        status: 'planning',
        owner: 'Riley Zhao',
        startDate: '2026-03-20',
        targetDate: '2026-07-01',
        description: 'Generates weekly sales forecasts based on pipeline data and historical trends.',
        usesPerWeek: 0,
        activeUsers: '',
        lastUsed: '',
        hoursSaved: 0,
        blendedRate: 125,
        revenueInfluence: 'none',
        revenueNote: '',
        replaces: 'Spreadsheet-based forecasting (est. 4 hrs/week)'
    },
    {
        id: '11',
        name: 'SEO Content Optimizer',
        department: 'Marketing',
        status: 'testing',
        owner: 'Dana Patel',
        startDate: '2026-01-25',
        targetDate: '2026-03-30',
        description: 'Optimizes blog posts and landing pages for search engine ranking.',
        usesPerWeek: 3,
        activeUsers: 'Dana',
        lastUsed: '2026-03-26',
        hoursSaved: 2,
        blendedRate: 100,
        revenueInfluence: 'indirect',
        revenueNote: 'Organic traffic growth contributing to pipeline',
        replaces: 'SEO agency retainer (~$3k/mo)'
    },
    {
        id: '12',
        name: 'Warehouse Scheduler',
        department: 'Operations',
        status: 'active',
        owner: 'Quinn Torres',
        startDate: '2026-03-01',
        targetDate: '2026-05-15',
        description: 'Optimizes warehouse shift schedules based on demand forecasts and staffing availability.',
        usesPerWeek: 5,
        activeUsers: 'Quinn, Ops Leads',
        lastUsed: '2026-03-28',
        hoursSaved: 4,
        blendedRate: 85,
        revenueInfluence: 'indirect',
        revenueNote: 'Reduced overtime costs by ~15%',
        replaces: 'Manual scheduling in spreadsheets'
    },
    {
        id: '13',
        name: 'Feature Request Analyzer',
        department: 'Product',
        status: 'planning',
        owner: 'Avery Grant',
        startDate: '2026-03-15',
        targetDate: '2026-06-15',
        description: 'Analyzes customer feature requests to identify patterns and prioritize the roadmap.',
        usesPerWeek: 0,
        activeUsers: '',
        lastUsed: '',
        hoursSaved: 0,
        blendedRate: 125,
        revenueInfluence: 'none',
        revenueNote: '',
        replaces: 'Manual tagging and analysis of support tickets'
    },
    {
        id: '14',
        name: 'Expense Auditor',
        department: 'Finance',
        status: 'active',
        owner: 'Taylor Brooks',
        startDate: '2026-02-10',
        targetDate: '2026-04-30',
        description: 'Audits expense reports for policy violations and flags anomalies for review.',
        usesPerWeek: 15,
        activeUsers: 'Taylor, Finance Team',
        lastUsed: '2026-03-29',
        hoursSaved: 3,
        blendedRate: 85,
        revenueInfluence: 'none',
        revenueNote: '',
        replaces: 'Manual expense review process'
    },
    {
        id: '15',
        name: 'Ticket Summarizer',
        department: 'Customer Support',
        status: 'paused',
        owner: 'Sarah Chen',
        startDate: '2026-02-20',
        targetDate: '2026-05-01',
        description: 'Summarizes lengthy support ticket threads for faster agent handoff.',
        usesPerWeek: 0,
        activeUsers: '',
        lastUsed: '2026-03-10',
        hoursSaved: 0,
        blendedRate: 100,
        revenueInfluence: 'none',
        revenueNote: '',
        replaces: 'Manual ticket reading (~20 min per escalation)'
    }
];

function loadAgents() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    saveAgents(DEFAULT_AGENTS);
    return [...DEFAULT_AGENTS];
}

function saveAgents(agents) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getDeptColor(dept) {
    return DEPT_COLORS[dept] || '#6E6E6E';
}

// Calculate annual savings for an agent
function calcAnnualSavings(agent) {
    return (agent.hoursSaved || 0) * (agent.blendedRate || 0) * 52;
}
