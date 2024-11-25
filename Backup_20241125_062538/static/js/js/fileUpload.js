// fileUpload.js
const FileUploadManager = {
    init() {
        Utils.log('Initializing File Upload Manager');
        this.setupFileUpload();
        this.setupDemoButton();
    },

    setupFileUpload() {
        const dropArea = document.querySelector('.file-upload-area');
        const fileInput = document.getElementById('fileInput');

        if (!dropArea || !fileInput) {
            Utils.log('File upload elements not found', 'warn');
            return;
        }

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, this.preventDefaults, false);
        });

        // Handle drag states
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => {
                dropArea.classList.add('highlight');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => {
                dropArea.classList.remove('highlight');
            });
        });

        // Handle drops
        dropArea.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            fileInput.files = files;
            this.handleFileSelect({ target: fileInput });
        });

        // Handle manual file selection
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    },

    setupDemoButton() {
        const demoButton = document.querySelector('[data-action="loadDemo"]');
        if (demoButton) {
            demoButton.addEventListener('click', this.loadDemoData.bind(this));
        }
    },

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    },

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) {
            Utils.showToast('No file selected', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.processImportData(data);
            } catch (error) {
                Utils.log('Error parsing JSON file', 'error');
                Utils.showToast('Error parsing JSON file', 'error');
            }
        };

        reader.onerror = () => {
            Utils.showToast('Error reading file', 'error');
        };

        reader.readAsText(file);
    },

    processImportData(data) {
        try {
            const categoryCounters = {};
            const parentIdMapping = new Map();
            const amendmentCounters = new Map();
            const childCounters = new Map();

            // Process the data
            let processedData = this.processParentRecords(data, categoryCounters, parentIdMapping);
            processedData = this.processChildRecords(processedData, childCounters);
            const finalData = this.processAmendments(processedData, amendmentCounters);

            // Log processing results
            this.logProcessingResults(finalData, parentIdMapping, amendmentCounters);

            // Update UI
            this.populateAgreementTable(finalData);
            Utils.showToast('Data processed successfully');
            modalManager.close('importModal');

        } catch (error) {
            Utils.log('Error processing import data: ' + error, 'error');
            Utils.showToast('Error processing data', 'error');
        }
    },

    processParentRecords(data, categoryCounters, parentIdMapping) {
        return data.map(agreement => {
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
    },

    processChildRecords(data, childCounters) {
        return data.map(agreement => {
            if (agreement.family_role === 'child') {
                const parentRecord = data.find(
                    parent => parent.family_role === 'parent' && 
                             parent.taxonomy_category === agreement.taxonomy_category &&
                             parent.counterparty === agreement.counterparty
                );
                
                const parentId = parentRecord ? parentRecord.agreement_id : agreement.parent_id;
                
                if (!childCounters.has(parentId)) {
                    childCounters.set(parentId, 1);
                }
                const childNumber = childCounters.get(parentId);
                childCounters.set(parentId, childNumber + 1);
                
                return {
                    agreement_id: `${agreement.taxonomy_category}C${childNumber}(${parentId})`,
                    original_parent_id: agreement.parent_id,
                    ...agreement
                };
            }
            return agreement;
        });
    },

    processAmendments(data, amendmentCounters) {
        return data.map(agreement => {
            if (agreement.family_role === 'amends') {
                const targetId = agreement.amends_id;
                
                if (!amendmentCounters.has(targetId)) {
                    amendmentCounters.set(targetId, 1);
                }
                const amendmentNumber = amendmentCounters.get(targetId);
                amendmentCounters.set(targetId, amendmentNumber + 1);

                return {
                    agreement_id: `${agreement.taxonomy_category}.A${amendmentNumber}(${targetId})`,
                    amends_id: targetId,
                    amendment_number: amendmentNumber,
                    ...agreement
                };
            }
            return agreement;
        });
    },

    populateAgreementTable(data) {
        const tableBody = document.getElementById('agreementTableBody');
        if (!tableBody) {
            Utils.log('Agreement table body not found', 'error');
            return;
        }

        tableBody.innerHTML = '';

        data.forEach(agreement => {
            const row = Utils.createElement('tr');
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
                    <button class="view-details-btn" onclick="FileUploadManager.viewDetails('${agreement.agreement_id}')">View</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    },

    loadDemoData() {
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
            // ... rest of your demo data
        ];

        this.processImportData(demoData);
        Utils.showToast('Demo data loaded successfully');
    },

    viewDetails(agreementId) {
        Utils.showToast(`Viewing details for ${agreementId}`);
        // Implement your view details logic here
    },

    logProcessingResults(data, parentIdMapping, amendmentCounters) {
        Utils.log('\nProcessing Results:', 'info');
        Utils.log(`Total records processed: ${data.length}`);
        Utils.log(`Parent records mapped: ${parentIdMapping.size}`);
        Utils.log(`Amendment sequences created: ${amendmentCounters.size}`);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    FileUploadManager.init();
});

// Make FileUploadManager available globally
window.FileUploadManager = FileUploadManager;