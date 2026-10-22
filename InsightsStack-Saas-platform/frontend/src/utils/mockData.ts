// ─── Mock Data for InsightStack ────────────────────────────────────────────

export const mockKPIs = [
  { id: '1', label: 'Total Revenue', value: '$2.4M', change: +12.5, trend: 'up', unit: '$', icon: 'dollar', color: 'brand' },
  { id: '2', label: 'Active Users', value: '18,340', change: +8.2, trend: 'up', unit: '', icon: 'users', color: 'violet' },
  { id: '3', label: 'Conversion Rate', value: '4.7%', change: -1.3, trend: 'down', unit: '%', icon: 'percent', color: 'amber' },
  { id: '4', label: 'Avg. Session', value: '3m 42s', change: +5.1, trend: 'up', unit: 's', icon: 'clock', color: 'emerald' },
];

export const mockRevenueTrend = [
  { month: 'Jan', revenue: 120000, expenses: 80000, profit: 40000 },
  { month: 'Feb', revenue: 145000, expenses: 90000, profit: 55000 },
  { month: 'Mar', revenue: 132000, expenses: 85000, profit: 47000 },
  { month: 'Apr', revenue: 168000, expenses: 95000, profit: 73000 },
  { month: 'May', revenue: 190000, expenses: 105000, profit: 85000 },
  { month: 'Jun', revenue: 175000, expenses: 98000, profit: 77000 },
  { month: 'Jul', revenue: 220000, expenses: 112000, profit: 108000 },
  { month: 'Aug', revenue: 248000, expenses: 120000, profit: 128000 },
  { month: 'Sep', revenue: 235000, expenses: 115000, profit: 120000 },
  { month: 'Oct', revenue: 280000, expenses: 130000, profit: 150000 },
  { month: 'Nov', revenue: 310000, expenses: 140000, profit: 170000 },
  { month: 'Dec', revenue: 356000, expenses: 155000, profit: 201000 },
];

export const mockActivityFeed = [
  { id: '1', user: 'Alex K.', action: 'Created dashboard', target: 'Q4 Sales Overview', time: '2m ago', type: 'create' },
  { id: '2', user: 'Sarah M.', action: 'Exported report', target: 'Monthly Revenue PDF', time: '15m ago', type: 'export' },
  { id: '3', user: 'James L.', action: 'Invited member', target: 'emily@company.com', time: '1h ago', type: 'invite' },
  { id: '4', user: 'System', action: 'AI Insight generated', target: 'Revenue Trend', time: '2h ago', type: 'ai' },
  { id: '5', user: 'Diana P.', action: 'Uploaded dataset', target: 'customer_data_nov.csv', time: '3h ago', type: 'upload' },
];

export const mockDashboards = [
  { id: '1', name: 'Q4 Sales Overview', description: 'Quarterly sales KPIs and trends', widgets: 8, lastEdited: '2 hours ago', thumbnail: null, isPublic: false },
  { id: '2', name: 'Marketing Analytics', description: 'Campaign performance and ROI', widgets: 12, lastEdited: '1 day ago', thumbnail: null, isPublic: true },
  { id: '3', name: 'Product Usage', description: 'Feature adoption and engagement', widgets: 6, lastEdited: '3 days ago', thumbnail: null, isPublic: false },
  { id: '4', name: 'Finance Report', description: 'Revenue, expenses and forecast', widgets: 10, lastEdited: '1 week ago', thumbnail: null, isPublic: false },
  { id: '5', name: 'Customer Growth', description: 'Acquisition, churn and LTV', widgets: 9, lastEdited: '2 weeks ago', thumbnail: null, isPublic: true },
  { id: '6', name: 'Operations', description: 'Operational KPIs and SLA tracking', widgets: 7, lastEdited: '1 month ago', thumbnail: null, isPublic: false },
];

export const mockCustomerGrowth = [
  { month: 'Jan', new: 320, churned: 45, net: 275 },
  { month: 'Feb', new: 410, churned: 52, net: 358 },
  { month: 'Mar', new: 390, churned: 48, net: 342 },
  { month: 'Apr', new: 520, churned: 60, net: 460 },
  { month: 'May', new: 610, churned: 55, net: 555 },
  { month: 'Jun', new: 580, churned: 70, net: 510 },
  { month: 'Jul', new: 720, churned: 65, net: 655 },
  { month: 'Aug', new: 840, churned: 80, net: 760 },
];

export const mockTrafficSources = [
  { name: 'Organic', value: 42, color: '#6366f1' },
  { name: 'Direct', value: 28, color: '#8b5cf6' },
  { name: 'Referral', value: 15, color: '#10b981' },
  { name: 'Social', value: 10, color: '#f59e0b' },
  { name: 'Email', value: 5, color: '#ef4444' },
];

export const mockRegionalData = [
  { region: 'North America', revenue: 850000, users: 8200 },
  { region: 'Europe', revenue: 620000, users: 5800 },
  { region: 'Asia Pacific', revenue: 480000, users: 4100 },
  { region: 'Latin America', revenue: 210000, users: 2300 },
  { region: 'Middle East', revenue: 140000, users: 1200 },
  { region: 'Africa', revenue: 80000, users: 740 },
];

export const mockMonthlySummary = [
  { month: 'Jan', sessions: 12400, pageviews: 38200, bounceRate: 42 },
  { month: 'Feb', sessions: 14100, pageviews: 43500, bounceRate: 38 },
  { month: 'Mar', sessions: 13800, pageviews: 41200, bounceRate: 40 },
  { month: 'Apr', sessions: 16200, pageviews: 50100, bounceRate: 35 },
  { month: 'May', sessions: 18900, pageviews: 58700, bounceRate: 33 },
  { month: 'Jun', sessions: 17400, pageviews: 53900, bounceRate: 36 },
  { month: 'Jul', sessions: 21500, pageviews: 66800, bounceRate: 30 },
  { month: 'Aug', sessions: 24100, pageviews: 74500, bounceRate: 28 },
];

export const mockAIInsights = [
  { id: '1', type: 'trend', title: 'Revenue acceleration detected', body: 'Revenue growth rate has increased by 23% month-over-month for the last 3 months. At this trajectory, you are on track to exceed Q4 targets by $180K.', severity: 'positive', createdAt: '1h ago' },
  { id: '2', type: 'anomaly', title: 'Unusual churn spike in Asia Pacific', body: 'Customer churn in APAC increased 2.4x this week compared to baseline. Primary driver appears to be pricing changes effective Nov 1. Consider a targeted retention campaign.', severity: 'warning', createdAt: '3h ago' },
  { id: '3', type: 'opportunity', title: 'Untapped email channel', body: 'Email converts at 5% of your traffic but receives only 5% of marketing budget. Increasing email spend by 20% could generate an estimated $45K in additional monthly revenue.', severity: 'info', createdAt: '6h ago' },
  { id: '4', type: 'forecast', title: 'December revenue forecast: $420K', body: 'Based on seasonality patterns and current growth, December revenue is forecast at $420K ± $25K. This would represent a 18% increase vs December last year.', severity: 'positive', createdAt: '1d ago' },
];

export const mockReports = [
  { id: '1', name: 'Monthly Revenue Report', description: 'Revenue, expenses, and profit breakdown', lastGenerated: '2 hours ago', schedule: 'Monthly', format: 'PDF', status: 'ready' },
  { id: '2', name: 'Customer Acquisition Analysis', description: 'New vs churned customers by channel', lastGenerated: '1 day ago', schedule: 'Weekly', format: 'XLSX', status: 'ready' },
  { id: '3', name: 'Product Performance Summary', description: 'Feature usage, adoption rates, NPS', lastGenerated: '3 days ago', schedule: 'Monthly', format: 'PDF', status: 'ready' },
  { id: '4', name: 'Campaign ROI Dashboard', description: 'Marketing spend vs conversions', lastGenerated: 'Never', schedule: 'On-demand', format: 'PDF', status: 'pending' },
  { id: '5', name: 'Q4 Board Report', description: 'Executive summary for board meeting', lastGenerated: '1 week ago', schedule: 'Quarterly', format: 'PDF', status: 'ready' },
];

export const mockDatasets = [
  { id: '1', name: 'customer_data_nov.csv', rows: 24830, columns: 18, size: '4.2 MB', status: 'ready', uploadedAt: '2 hours ago', type: 'csv' },
  { id: '2', name: 'sales_q4_2024.xlsx', rows: 8924, columns: 12, size: '1.8 MB', status: 'ready', uploadedAt: '1 day ago', type: 'excel' },
  { id: '3', name: 'web_analytics_oct.csv', rows: 145200, columns: 24, size: '28 MB', status: 'ready', uploadedAt: '1 week ago', type: 'csv' },
  { id: '4', name: 'product_usage_q3.json', rows: 52100, columns: 8, size: '9.4 MB', status: 'processing', uploadedAt: '2 minutes ago', type: 'json' },
];

export const mockNotifications = [
  { id: '1', title: 'Revenue target reached', message: 'November revenue surpassed $300K target!', type: 'success', isRead: false, createdAt: '5m ago' },
  { id: '2', title: 'Churn anomaly detected', message: 'AI detected unusual churn spike in APAC region.', type: 'warning', isRead: false, createdAt: '2h ago' },
  { id: '3', title: 'New team member', message: 'emily@company.com has joined the workspace.', type: 'info', isRead: false, createdAt: '4h ago' },
  { id: '4', title: 'Report generated', message: 'Monthly Revenue Report is ready for download.', type: 'info', isRead: true, createdAt: '1d ago' },
  { id: '5', title: 'Dataset import complete', message: 'customer_data_nov.csv has been processed.', type: 'success', isRead: true, createdAt: '1d ago' },
];

export const mockTeamMembers = [
  { id: '1', name: 'Alex Kim', email: 'alex@company.com', role: 'admin', avatar: null, joinedAt: '6 months ago', status: 'active' },
  { id: '2', name: 'Sarah Martinez', email: 'sarah@company.com', role: 'manager', avatar: null, joinedAt: '3 months ago', status: 'active' },
  { id: '3', name: 'James Lee', email: 'james@company.com', role: 'analyst', avatar: null, joinedAt: '2 months ago', status: 'active' },
  { id: '4', name: 'Diana Patel', email: 'diana@company.com', role: 'analyst', avatar: null, joinedAt: '1 month ago', status: 'active' },
  { id: '5', name: 'Emily Chen', email: 'emily@company.com', role: 'viewer', avatar: null, joinedAt: '1 week ago', status: 'pending' },
];

export const mockPlans = [
  { id: 'starter', name: 'Starter', price: 29, users: 3, dashboards: 5, datasets: 10, active: false },
  { id: 'pro', name: 'Pro', price: 99, users: 20, dashboards: 999, datasets: 100, active: true },
  { id: 'enterprise', name: 'Enterprise', price: 399, users: 999, dashboards: 999, datasets: 999, active: false },
];

export const mockAuditLogs = [
  { id: '1', user: 'alex@company.com', action: 'DASHBOARD_CREATED', resource: 'Q4 Sales Overview', ip: '192.168.1.10', timestamp: '2024-11-05 14:22:01' },
  { id: '2', user: 'sarah@company.com', action: 'REPORT_EXPORTED', resource: 'Monthly Revenue PDF', ip: '192.168.1.11', timestamp: '2024-11-05 14:07:44' },
  { id: '3', user: 'james@company.com', action: 'DATASET_UPLOADED', resource: 'customer_data_nov.csv', ip: '192.168.1.12', timestamp: '2024-11-05 13:45:18' },
  { id: '4', user: 'alex@company.com', action: 'MEMBER_INVITED', resource: 'emily@company.com', ip: '192.168.1.10', timestamp: '2024-11-05 12:30:05' },
  { id: '5', user: 'diana@company.com', action: 'WIDGET_UPDATED', resource: 'Revenue Chart Widget', ip: '192.168.1.14', timestamp: '2024-11-05 11:15:33' },
  { id: '6', user: 'system', action: 'AI_INSIGHT_GENERATED', resource: 'Revenue Trend Analysis', ip: 'internal', timestamp: '2024-11-05 10:00:00' },
];
