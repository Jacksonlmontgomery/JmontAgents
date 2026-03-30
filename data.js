// data.js - Sample data and localStorage persistence for the Agent Build Dashboard

const STORAGE_KEY = 'jmontagents_data';

const DEFAULT_AGENTS = [
    {
        id: '1',
        name: 'Customer Inquiry Router',
        department: 'Customer Support',
        status: 'deployed',
        progress: 100,
        owner: 'Sarah Chen',
        priority: 'high',
        startDate: '2026-01-10',
        targetDate: '2026-03-01',
        description: 'Routes incoming customer inquiries to the correct support tier based on intent classification.'
    },
    {
        id: '2',
        name: 'Lead Scoring Agent',
        department: 'Sales',
        status: 'in-progress',
        progress: 65,
        owner: 'Marcus Rivera',
        priority: 'critical',
        startDate: '2026-02-01',
        targetDate: '2026-04-15',
        description: 'Scores inbound leads using firmographic data and engagement signals.'
    },
    {
        id: '3',
        name: 'Code Review Assistant',
        department: 'Engineering',
        status: 'testing',
        progress: 85,
        owner: 'Alex Kim',
        priority: 'high',
        startDate: '2026-01-20',
        targetDate: '2026-03-30',
        description: 'Reviews pull requests for code quality, security vulnerabilities, and style compliance.'
    },
    {
        id: '4',
        name: 'Campaign Copy Generator',
        department: 'Marketing',
        status: 'in-progress',
        progress: 40,
        owner: 'Dana Patel',
        priority: 'medium',
        startDate: '2026-02-15',
        targetDate: '2026-05-01',
        description: 'Generates ad copy and email content based on campaign briefs and brand guidelines.'
    },
    {
        id: '5',
        name: 'Resume Screening Agent',
        department: 'HR',
        status: 'planning',
        progress: 10,
        owner: 'Jordan Lee',
        priority: 'medium',
        startDate: '2026-03-10',
        targetDate: '2026-06-01',
        description: 'Pre-screens resumes against job requirements and provides shortlist recommendations.'
    },
    {
        id: '6',
        name: 'Invoice Processing Bot',
        department: 'Finance',
        status: 'deployed',
        progress: 100,
        owner: 'Taylor Brooks',
        priority: 'high',
        startDate: '2025-11-01',
        targetDate: '2026-02-01',
        description: 'Extracts data from invoices and auto-populates accounting entries.'
    },
    {
        id: '7',
        name: 'Incident Triage Agent',
        department: 'Engineering',
        status: 'in-progress',
        progress: 55,
        owner: 'Casey Nguyen',
        priority: 'critical',
        startDate: '2026-02-05',
        targetDate: '2026-04-10',
        description: 'Triages production incidents by severity and routes to on-call teams.'
    },
    {
        id: '8',
        name: 'Compliance Doc Reviewer',
        department: 'Legal',
        status: 'testing',
        progress: 75,
        owner: 'Morgan Shaw',
        priority: 'high',
        startDate: '2026-01-15',
        targetDate: '2026-04-01',
        description: 'Reviews contracts and documents for compliance with company policies and regulations.'
    },
    {
        id: '9',
        name: 'Onboarding Guide Bot',
        department: 'HR',
        status: 'deployed',
        progress: 100,
        owner: 'Jordan Lee',
        priority: 'medium',
        startDate: '2025-10-01',
        targetDate: '2026-01-15',
        description: 'Guides new hires through onboarding steps and answers common policy questions.'
    },
    {
        id: '10',
        name: 'Sales Forecast Agent',
        department: 'Sales',
        status: 'planning',
        progress: 5,
        owner: 'Riley Zhao',
        priority: 'medium',
        startDate: '2026-03-20',
        targetDate: '2026-07-01',
        description: 'Generates weekly sales forecasts based on pipeline data and historical trends.'
    },
    {
        id: '11',
        name: 'SEO Content Optimizer',
        department: 'Marketing',
        status: 'testing',
        progress: 80,
        owner: 'Dana Patel',
        priority: 'low',
        startDate: '2026-01-25',
        targetDate: '2026-03-30',
        description: 'Optimizes blog posts and landing pages for search engine ranking.'
    },
    {
        id: '12',
        name: 'Warehouse Scheduler',
        department: 'Operations',
        status: 'in-progress',
        progress: 30,
        owner: 'Quinn Torres',
        priority: 'high',
        startDate: '2026-03-01',
        targetDate: '2026-05-15',
        description: 'Optimizes warehouse shift schedules based on demand forecasts and staffing availability.'
    },
    {
        id: '13',
        name: 'Feature Request Analyzer',
        department: 'Product',
        status: 'planning',
        progress: 15,
        owner: 'Avery Grant',
        priority: 'medium',
        startDate: '2026-03-15',
        targetDate: '2026-06-15',
        description: 'Analyzes customer feature requests to identify patterns and prioritize the roadmap.'
    },
    {
        id: '14',
        name: 'Expense Auditor',
        department: 'Finance',
        status: 'in-progress',
        progress: 50,
        owner: 'Taylor Brooks',
        priority: 'medium',
        startDate: '2026-02-10',
        targetDate: '2026-04-30',
        description: 'Audits expense reports for policy violations and flags anomalies for review.'
    },
    {
        id: '15',
        name: 'Ticket Summarizer',
        department: 'Customer Support',
        status: 'paused',
        progress: 35,
        owner: 'Sarah Chen',
        priority: 'low',
        startDate: '2026-02-20',
        targetDate: '2026-05-01',
        description: 'Summarizes lengthy support ticket threads for faster agent handoff.'
    }
];

// Load agents from localStorage, or use defaults
function loadAgents() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    saveAgents(DEFAULT_AGENTS);
    return DEFAULT_AGENTS;
}

// Save agents to localStorage
function saveAgents(agents) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
