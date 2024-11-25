document.addEventListener('DOMContentLoaded', () => {
    setupSidebar();
    setupFileUpload;
    });   
    
    // Sidebar Functions
    function setupSidebar() {
    // Handle submenu toggles
    document.querySelectorAll('.menu-item.has-submenu').forEach(item => {
       item.addEventListener('click', function(e) {
           e.preventDefault();
           this.classList.toggle('active');
           const submenu = this.nextElementSibling;
           
           if (submenu.classList.contains('active')) {
               submenu.classList.remove('active');
               submenu.style.height = '0px';
           } else {
               submenu.classList.add('active');
               submenu.style.height = submenu.scrollHeight + 'px';
           }
       });
    });
    
    // Handle ALL menu items that don't have submenus
    document.querySelectorAll('.menu-item:not(.has-submenu)').forEach(item => {
       item.addEventListener('click', function(e) {
           e.stopPropagation();
           
           // Remove active state from all menu items
           document.querySelectorAll('.menu-item').forEach(mi => {
               mi.classList.remove('active');
           });
           
           // Add active state to clicked item
           this.classList.add('active');
           
           // Get and handle the section
           const section = this.getAttribute('data-section');
           handleSectionDisplay(section);
       });
    });
    }
    
    
    
    function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) {
       showToast('No file selected', 'error');
       return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
       try {
           const data = JSON.parse(e.target.result);
           processImportData(data);
       } catch (error) {
           showToast('Error parsing JSON file', 'error');
           console.error('Error parsing JSON:', error);
       }
    };
    
    reader.onerror = function() {
       showToast('Error reading file', 'error');
    };
    
    reader.readAsText(file);
    }
    
    // Data Processing Functions
    function processImportData(data) {
    try {
       const categoryCounters = {};
       const parentIdMapping = new Map();
       const amendmentCounters = new Map(); // Track amendment sequences per target
       const childCounters = new Map(); // Add this to track children per parent
       
       // First pass - process parent records and create ID mapping
       let processedData = data.map(agreement => {
           if (agreement.family_role === 'parent') {
               if (!categoryCounters[agreement.taxonomy_category]) {
                   categoryCounters[agreement.taxonomy_category] = 1;
               }
               const counter = categoryCounters[agreement.taxonomy_category]++;
               const sequenceNumber = String(counter).padStart(4, '0');
               const newParentId = `${agreement.taxonomy_category}${sequenceNumber}-P`;
               
               parentIdMapping.set(agreement.title, newParentId);
               
               return {
                   agreement_id: newParentId,
                   original_parent_id: agreement.parent_id,
                   ...agreement
               };
           }
           return agreement;
       });
    
       // Second pass - process child records
       processedData = processedData.map(agreement => {
           if (agreement.family_role === 'child') {
               const parentRecord = processedData.find(
                   parent => parent.family_role === 'parent' && 
                            parent.taxonomy_category === agreement.taxonomy_category &&
                            parent.counterparty === agreement.counterparty
               );
               
               const parentId = parentRecord ? parentRecord.agreement_id : agreement.parent_id;
               
               
               // Initialize or increment child counter for this parent
               if (!childCounters.has(parentId)) {
                   childCounters.set(parentId, 1);
               }
               const childNumber = childCounters.get(parentId);
               childCounters.set(parentId, childNumber + 1);
               
               // Include child number in agreement_id
               const agreement_id = `${agreement.taxonomy_category}C${childNumber}(${parentId})`;
               
               return {
                   agreement_id,
                   original_parent_id: agreement.parent_id,
                   ...agreement
               };
           }
           return agreement;
       });
    
       // Third pass - process amendments with sequential numbering per target
       const finalData = processedData.map(agreement => {
           if (agreement.family_role === 'amends') {
               const targetId = agreement.amends_id;
               
               // Get or initialize amendment counter for this target
               if (!amendmentCounters.has(targetId)) {
                   amendmentCounters.set(targetId, 1);
               }
               const amendmentNumber = amendmentCounters.get(targetId);
               amendmentCounters.set(targetId, amendmentNumber + 1);
    
               const agreement_id = `${agreement.taxonomy_category}.A${amendmentNumber}(${targetId})`;
               
               return {
                   agreement_id,
                   amends_id: targetId,
                   amendment_number: amendmentNumber,
                   ...agreement
               };
           }
           return agreement;
       });
    
       // Enhanced debug logging for amendments
       console.log('\nAmendatory Records:');
       finalData
           .filter(record => record.family_role === 'amends')
           .forEach(amends => {
               const targetRecord = finalData.find(r => r.agreement_id === amends.amends_id);
               console.log(`Amendment Title: ${amends.title}`);
               console.log(`Generated Amendment ID: ${amends.agreement_id}`);
               console.log(`Target Agreement: ${targetRecord ? targetRecord.title : 'Unknown'}`);
               console.log(`Target ID: ${amends.amends_id}`);
               console.log(`Amendment Number: ${amends.amendment_number}`);
               console.log('---');
           });
    
       // Group amendments by target for clarity
       console.log('\nAmendments Grouped by Target:');
       const groupedAmendments = new Map();
       finalData
           .filter(record => record.family_role === 'amends')
           .forEach(amendment => {
               if (!groupedAmendments.has(amendment.amends_id)) {
                   groupedAmendments.set(amendment.amends_id, []);
               }
               groupedAmendments.get(amendment.amends_id).push(amendment);
           });
    
       groupedAmendments.forEach((amendments, targetId) => {
           const targetRecord = finalData.find(r => r.agreement_id === targetId);
           console.log(`\nAmendments to: ${targetRecord ? targetRecord.title : targetId}`);
           amendments
               .sort((a, b) => a.amendment_number - b.amendment_number)
               .forEach(amendment => {
                   console.log(`  ${amendment.agreement_id} - ${amendment.title}`);
               });
       });
    
      
    
       // Debug logging
       console.log('\nGenerated Parent IDs:');
       console.log('Parent Title -> Generated ID');
       parentIdMapping.forEach((id, title) => {
           console.log(`${title} -> ${id}`);
       });
       
       console.log('\nChild Records with Parent Matching:');
       finalData
           .filter(record => record.family_role === 'child')
           .forEach(child => {
               const parentRecord = processedData.find(
                   parent => parent.family_role === 'parent' && 
                            parent.taxonomy_category === child.taxonomy_category &&
                            parent.counterparty === child.counterparty
               );
               
               console.log(`Child Title: ${child.title}`);
               console.log(`Parent Title: ${parentRecord ? parentRecord.title : 'Not Found'}`);
               console.log(`Generated Child ID: ${child.agreement_id}`);
               console.log('---');
           });
    
       console.log('\nNon-Parent Records:');
       finalData
           .filter(record => record.family_role === 'non_parent')
           .forEach(nonParent => {
               console.log(`Title: ${nonParent.title}`);
               console.log(`Generated ID: ${nonParent.agreement_id}`);
               console.log(`Category: ${nonParent.taxonomy_category}`);
               console.log('---');
           });
    
       console.log('\nAmendatory Records:');
       finalData
           .filter(record => record.family_role === 'amends')
           .forEach(amends => {
               console.log(`Title: ${amends.title}`);
               console.log(`Generated ID: ${amends.agreement_id}`);
               console.log(`Amends: ${amends.amends_id || amends.amends_title}`);
               console.log('---');
           });
       // Populate the HTML table with the final processed data
       populateAgreementTable(finalData);
       showToast('All records processed with IDs. Check console for results.');
       closeImportModal();
       
    } catch (error) {
       console.error('Error in data processing:', error);
       showToast('Error processing data', 'error');
    }
    }
    // Toast notification function
    function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) {
       console.error('Toast element not found');
       return;
    }
    
    toast.textContent = message;
    toast.style.backgroundColor = type === 'error' ? '#dc3545' : '#333';
    toast.style.display = 'block';
    
    setTimeout(() => {
       toast.style.display = 'none';
    }, 3000);
    }
    
    function populateAgreementTable(data) {
    const tableBody = document.getElementById('agreementTableBody');
    tableBody.innerHTML = ''; // Clear the table before populating
    
    data.forEach(agreement => {
       const row = document.createElement('tr');
    
       // Create table cells for each field
       row.innerHTML = `
           <td>${agreement.agreement_id || 'N/A'}</td>
           <td>${agreement.title || 'N/A'}</td>
           <td>${agreement.counterparty || 'N/A'}</td>
           <td>${agreement.taxonomy_category || 'N/A'}</td>
           <td>${agreement.family_role || 'N/A'}</td>
           <td>${agreement.effective_date || 'N/A'}</td>
           <td>${agreement.end_date || 'N/A'}</td>
           <td>${agreement.region || 'N/A'}</td>
           <td>${agreement.status || 'N/A'}</td>
           <td>${agreement.clm_reference || 'N/A'}</td>
           <td>
               <button class="view-details-btn" onclick="viewDetails('${agreement.agreement_id}')">View</button>
           </td>
       `;
    
       // Append the row to the table body
       tableBody.appendChild(row);
    });
    }
    
    // Example function to handle "View Details" button clicks
    function viewDetails(agreementId) {
    alert(`Details for Agreement ID: ${agreementId}`);
    }
    
    // Call this function after processing data
    // populateAgreementTable(finalData);
    
    
    
    
    
    function setupFileUpload() {
    const dropArea = document.querySelector('.file-upload-area');
    const fileInput = document.getElementById('fileInput');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
       dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
       e.preventDefault();
       e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
       dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
       dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight(e) {
       dropArea.classList.add('highlight');
    }
    
    function unhighlight(e) {
       dropArea.classList.remove('highlight');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
       const dt = e.dataTransfer;
       const files = dt.files;
       fileInput.files = files;
       handleFileSelect({ target: fileInput });
    }
    }
    
    
    
    function loadDemoData() {
    const demoData = [
       {
           "title": "Master Services Agreement - XYZ Corp",
           "counterparty": "XYZ Corporation",
           "taxonomy_category": "MSA",
           "family_role": "parent",
           "effective_date": "2023-01-01",
           "end_date": "2025-12-31",
           "region": "North America",
           "status": "Active",
           "clm_reference": "CLM-2023-001"
       },
       {
           "title": "Statement of Work 1 - XYZ Corp",
           "counterparty": "XYZ Corporation",
           "taxonomy_category": "MSA",
           "family_role": "child",
           "effective_date": "2023-02-01",
           "end_date": "2024-01-31",
           "region": "North America",
           "status": "Active",
           "clm_reference": "CLM-2023-002"
       },
       {
           "title": "Amendment 1 to MSA - XYZ Corp",
           "counterparty": "XYZ Corporation",
           "taxonomy_category": "MSA",
           "family_role": "amends",
           "amends_id": "MSA0001-P",
           "effective_date": "2023-06-01",
           "end_date": "2025-12-31",
           "region": "North America",
           "status": "Active",
           "clm_reference": "CLM-2023-003"
       }
       // Add more sample records as needed
    ];
    
    // Process the demo data using your existing function
    processImportData(demoData);
    
    // Close the import modal
    closeImportModal();
    
    // Show success message
    showToast('Demo data loaded successfully');
    }
    
    // Modal Management System
    const modalManager = {
    // Registry of all modals and their functions
    modals: {
       'transactionDashboard': {
           open: function() {
               document.getElementById('transactionDashboard').classList.add('active');
           },
           close: function() {
               document.getElementById('transactionDashboard').classList.remove('active');
           }
       },
       'engineeringConsole': {
           open: function() {
               document.getElementById('engineeringConsole').classList.add('active');
           },
           close: function() {
               document.getElementById('engineeringConsole').classList.remove('active');
           }
       },
       'analyticsConsole': {
           open: function() {
               document.getElementById('analyticsConsole').classList.add('active');
           },
           close: function() {
               document.getElementById('analyticsConsole').classList.remove('active');
           }
       },
       'familiesConsole': {
           open: function() {
               document.getElementById('familiesConsole').classList.add('active');
           },
           close: function() {
               document.getElementById('familiesConsole').classList.remove('active');
           }
       },
       'configurationConsole': {
           open: function() {
               document.getElementById('configurationConsole').classList.add('active');
           },
           close: function() {
               document.getElementById('configurationConsole').classList.remove('active');
           }
       },
       'operationsCommand': {
           open: function() {
               document.getElementById('operationsCommand').classList.add('active');
           },
           close: function() {
               document.getElementById('operationsCommand').classList.remove('active');
           }
       },
    
       'platformTour': {
           open: function() {
               document.getElementById('platformTour').classList.add('active');
           },
           close: function() {
               document.getElementById('platfromTour').classList.remove('active');
           }
       },
    
       'importModal': {
           open: function() {
               document.getElementById('importModal').classList.add('active');
           },
           close: function() {
               document.getElementById('importModal').classList.remove('active');
               document.getElementById('fileInput').value = ''; // Clear file input on close
           }
       }
    },
    
    // Close all modals
    closeAll: function() {
       Object.keys(this.modals).forEach(modalId => {
           const modal = document.getElementById(modalId);
           if (modal) {
               modal.classList.remove('active');
           }
       });
    },
    
    // Open a specific modal
    open: function(modalId) {
       if (!this.modals[modalId]) {
           console.error(`Modal ${modalId} not registered`);
           return;
       }
       // Close all other modals first unless it's the import modal
       if (modalId !== 'importModal') {
           this.closeAll();
       }
       this.modals[modalId].open();
    },
    
    // Close a specific modal
    close: function(modalId) {
       if (!this.modals[modalId]) {
           console.error(`Modal ${modalId} not registered`);
           return;
       }
       this.modals[modalId].close();
    },
    
    // Register a new modal
    register: function(modalId, openFn, closeFn) {
       this.modals[modalId] = {
           open: openFn,
           close: closeFn
       };
    }
    };
    function handleSectionDisplay(section) {
    console.log(`Handling section display for: ${section}`);
    
    // Remove active state from all menu items
    document.querySelectorAll('.menu-item').forEach(item => {
       item.classList.remove('current-active');
    });
    
    // Add active state to current menu item
    const currentMenuItem = document.querySelector(`.menu-item[data-section="${section}"]`);
    if (currentMenuItem) {
       currentMenuItem.classList.add('current-active');
    }
    
    try {
       switch(section) {
           case 'dashboard':
               modalManager.open('transactionDashboard');
               break;
    
           case 'engineering':
               modalManager.open('engineeringConsole');
               break;
    
           case 'analytics':
               modalManager.open('analyticsConsole');
               break;
    
           case 'families':
               modalManager.open('familiesConsole');
               break;
    
           case 'configuration':
               modalManager.open('configurationConsole');
               break;
    
           case 'operationscommand':
               modalManager.open('operationsCommand');
               break;
    
           case 'platformtour':
               modalManager.open('platformTour');
               break;
    
           case 'home':
               modalManager.closeAll();
               // For non-modal content, we still need to handle display
               document.querySelectorAll('.main-content > div[id$="Container"]').forEach(div => {
                   div.style.display = 'none';
               });
               document.getElementById('homeContainer').style.display = 'block';
               break;
    
           case 'projects':
               modalManager.closeAll();
               document.querySelectorAll('.main-content > div[id$="Container"]').forEach(div => {
                   div.style.display = 'none';
               });
               document.getElementById('projectsContainer').style.display = 'block';
               break;
    
           case 'settings':
               modalManager.closeAll();
               document.querySelectorAll('.main-content > div[id$="Container"]').forEach(div => {
                   div.style.display = 'none';
               });
               document.getElementById('settingsContainer').style.display = 'block';
               break;
    
           default:
               console.warn(`Section "${section}" not yet implemented`);
               showToast(`${section} functionality coming soon!`, 'info');
               break;
       }
    } catch (error) {
       console.error(`Error handling section display for ${section}:`, error);
       showToast('An error occurred while loading the section', 'error');
    }
    
    window.location.hash = section;
    }
    
    // Update your modal-related functions to use modalManager
    function openImportModal() {
    modalManager.open('importModal');
    }
    
    function closeImportModal() {
    modalManager.close('importModal');
    }
    
    // Example of how to register a new modal later
    function registerNewModal(modalId) {
    modalManager.register(modalId,
       function() { document.getElementById(modalId).classList.add('active'); },
       function() { document.getElementById(modalId).classList.remove('active'); }
    );
    }
    function launchProgram() {
    const selectedProgram = document.querySelector('input[name="program"]:checked');
    
    if (!selectedProgram) {
       showToast('Please select a program to launch', 'error');
       return;
    }
    
    // Handle program launch
    const programValue = selectedProgram.value;
    console.log(`Launching program: ${programValue}`);
    
    // Close the engineering modal
    modalManager.close('engineeringConsole');
    
    // Show success message
    showToast(`Launching ${programValue} program...`);
    
    // Here you would add your program launch logic
    }
                       // Sample data
                       const sampleData = {
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
                       };
               
                   // Populate the dashboard
                       function initializeDashboard() {
                           populateProjects();
                           populateMetrics();
                           populateFlags();
                           populateAlerts();
                       }
               
                       function populateProjects() {
                           const container = document.getElementById('projectsContainer');
                           container.innerHTML = sampleData.projects.map(project => `
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
                       }
               
                       function populateMetrics() {
                           const container = document.getElementById('metricsContainer');
                           container.innerHTML = sampleData.metrics.map(metric => `
                               <div class="metric-card">
                                   <div class="metric-header">${metric.title}</div>
                                   <div class="metric-value">${metric.value}</div>
                                   <div class="metric-trend ${metric.trend.startsWith('+') ? 'trend-up' : 'trend-down'}">
                                       ${metric.trend}
                                   </div>
                               </div>
                           `).join('');
                       }
               
                       function populateFlags() {
                           const container = document.getElementById('flagsContainer');
                           container.innerHTML = sampleData.flags.map(flag => `
                               <div class="flag-item">
                                   <div class="flag-header">
                                       <h4>${flag.title}</h4>
                                       <span class="priority-badge">${flag.priority}</span>
                                   </div>
                                   <div>Due: ${flag.dueDate}</div>
                               </div>
                           `).join('');
                       }
               
                       function populateAlerts() {
                           const container = document.getElementById('alertsContainer');
                           container.innerHTML = sampleData.alerts.map(alert => `
                               <div class="alert-item">
                                   <div class="alert-header">
                                       <span class="alert-badge">${alert.type}</span>
                                       <span>${alert.timestamp}</span>
                                   </div>
                                   <div>${alert.message}</div>
                               </div>
                           `).join('');
                       }
               
                       function handleNewRequest() {
                           // Placeholder for request handling
                           alert('Feature request functionality coming soon!');
                       }
               
                       // Initialize the dashboard when the document loads
                       document.addEventListener('DOMContentLoaded', initializeDashboard);
           
    
    