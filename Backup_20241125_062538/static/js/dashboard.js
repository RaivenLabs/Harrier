// dashboard.js
const DashboardManager = {
    // Sample data structure - could be replaced with API calls later
    sampleData: {
        projects: [
            { id: 1, title: "Global SaaS Procurement", status: "In Progress", completion: 75 },
            { id: 2, title: "Hardware Vendor Consolidation", status: "Review", completion: 45 },
            { id: 3, title: "EMEA Service Agreements", status: "Planning", completion: 20 },
            { id: 4, title: "Cloud Infrastructure Deal", status: "Negotiation", completion: 60 }
        ],
        metrics: [
            { title: "Orders Last Quarter", value: "1,247", trend: "+12%" },
            { title: "Total Spend", value: "$2.8M", trend: "+5%" },
            { title: "Total Transactions", value: "3,856", trend: "+8%" },
            { title: "Active Users", value: "245", trend: "+15%" },
            { title: "Avg. Completion Time", value: "3.2 days", trend: "-10%" }
        ],
        flags: [
            { id: 1, title: "MSA Expiring - ABC Corp", priority: "High", dueDate: "2024-12-01" },
            { id: 2, title: "Pending Approval - $1M+", priority: "Critical", dueDate: "2024-11-25" },
            { id: 3, title: "Compliance Review Required", priority: "High", dueDate: "2024-11-30" }
        ],
        alerts: [
            { id: 1, type: "System", message: "Planned maintenance: Dec 1, 2024 - 2AM EST", timestamp: "2024-11-20" },
            { id: 2, type: "User", message: "New template available: SAAS-MSA-v2", timestamp: "2024-11-19" },
            { id: 3, type: "System", message: "Quarter-end processing starts in 5 days", timestamp: "2024-11-18" }
        ]
    },

    init() {
        Utils.log('Initializing Dashboard Manager');
        this.initializeDashboard();
        this.setupEventListeners();
    },

    initializeDashboard() {
        this.populateProjects();
        this.populateMetrics();
        this.populateFlags();
        this.populateAlerts();
    },

    setupEventListeners() {
        // Setup refresh button if exists
        const refreshBtn = document.querySelector('.dashboard-refresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshDashboard());
        }

        // Setup new request button if exists
        const newRequestBtn = document.querySelector('.new-request-btn');
        if (newRequestBtn) {
            newRequestBtn.addEventListener('click', () => this.handleNewRequest());
        }
    },

    populateProjects() {
        const container = document.getElementById('projectsContainer');
        if (!container) {
            Utils.log('Projects container not found', 'warn');
            return;
        }

        container.innerHTML = this.sampleData.projects.map(project => `
            <div class="project-item">
                <div class="project-info">
                    <h4>${project.title}</h4>
                    <span class="project-status">${project.status}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${project.completion}%"></div>
                </div>
            </div>
        `).join('');
    },

    populateMetrics() {
        const container = document.getElementById('metricsContainer');
        if (!container) {
            Utils.log('Metrics container not found', 'warn');
            return;
        }

        container.innerHTML = this.sampleData.metrics.map(metric => `
            <div class="metric-card">
                <div class="metric-header">${metric.title}</div>
                <div class="metric-value">${metric.value}</div>
                <div class="metric-trend ${metric.trend.startsWith('+') ? 'trend-up' : 'trend-down'}">
                    ${metric.trend}
                </div>
            </div>
        `).join('');
    },

    populateFlags() {
        const container = document.getElementById('flagsContainer');
        if (!container) {
            Utils.log('Flags container not found', 'warn');
            return;
        }

        container.innerHTML = this.sampleData.flags.map(flag => `
            <div class="flag-item">
                <div class="flag-header">
                    <h4>${flag.title}</h4>
                    <span class="priority-badge ${flag.priority.toLowerCase()}">${flag.priority}</span>
                </div>
                <div class="flag-due-date">Due: ${flag.dueDate}</div>
            </div>
        `).join('');
    },

    populateAlerts() {
        const container = document.getElementById('alertsContainer');
        if (!container) {
            Utils.log('Alerts container not found', 'warn');
            return;
        }

        container.innerHTML = this.sampleData.alerts.map(alert => `
            <div class="alert-item">
                <div class="alert-header">
                    <span class="alert-badge ${alert.type.toLowerCase()}">${alert.type}</span>
                    <span class="alert-timestamp">${alert.timestamp}</span>
                </div>
                <div class="alert-message">${alert.message}</div>
            </div>
        `).join('');
    },

    refreshDashboard() {
        Utils.log('Refreshing dashboard');
        Utils.showToast('Refreshing dashboard data...');
        // In the future, this could fetch new data from an API
        this.initializeDashboard();
    },

    handleNewRequest() {
        Utils.showToast('New request feature coming soon!');
    },

    // Method to update data (could be called from other modules)
    updateDashboardData(newData) {
        this.sampleData = { ...this.sampleData, ...newData };
        this.initializeDashboard();
        Utils.log('Dashboard data updated');
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    DashboardManager.init();
});

// Make DashboardManager available globally
window.DashboardManager = DashboardManager;