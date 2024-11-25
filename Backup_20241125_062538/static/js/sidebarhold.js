// sidebar.js
document.addEventListener('DOMContentLoaded', () => {
    setupSidebar();
});   

function setupSidebar() {
    // Handle submenu toggles
    document.querySelectorAll('.menu-item.has-submenu').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // Add this to prevent event bubbling
            
            // Toggle active state on the menu item
            this.classList.toggle('active');
            
            // Get the next element (submenu)
            const submenu = this.nextElementSibling;
            if (!submenu || !submenu.classList.contains('submenu')) {
                Utils.log('Submenu not found for item', 'warn');
                return;
            }
            
            // Toggle submenu visibility
            if (submenu.style.maxHeight) {
                submenu.style.maxHeight = null;
                submenu.classList.remove('active');
            } else {
                submenu.style.maxHeight = submenu.scrollHeight + "px";
                submenu.classList.add('active');
            }
            
            // Log for debugging
            Utils.log(`Toggled submenu for: ${this.textContent.trim()}`);
        });
    });

    // Handle menu items (including submenu items)
    document.querySelectorAll('.menu-item:not(.has-submenu)').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Remove active state from all menu items
            document.querySelectorAll('.menu-item').forEach(mi => {
                mi.classList.remove('current-active');
            });
            
            // Add active state to clicked item
            this.classList.add('current-active');
            
            // Get and handle the section
            const section = this.getAttribute('data-section');
            if (section) {
                handleSectionDisplay(section);
            } else {
                Utils.log('No section defined for menu item', 'warn');
            }
        });
    });
}

function handleSectionDisplay(section) {
    Utils.log(`Handling section display for: ${section}`);

    try {
        switch(section) {
            case 'dashboard':
                ModalManager.open('transactionDashboard');
                break;

            case 'engineering':
                ModalManager.open('engineeringConsole');
                break;

            case 'analytics':
                ModalManager.open('analyticsConsole');
                break;

            case 'families':
                ModalManager.open('familiesConsole');
                break;

            case 'configuration':
                ModalManager.open('configurationConsole');
                break;

            case 'operationscommand':
                ModalManager.open('operationsCommand');
                break;

            case 'platformtour':
                ModalManager.open('platformTour');
                break;

            case 'home':
                ModalManager.closeAll();
                document.querySelectorAll('.main-content > div[id$="Container"]').forEach(div => {
                    div.style.display = 'none';
                });
                document.getElementById('homeContainer').style.display = 'block';
                break;

            case 'projects':
                ModalManager.closeAll();
                document.querySelectorAll('.main-content > div[id$="Container"]').forEach(div => {
                    div.style.display = 'none';
                });
                document.getElementById('projectsContainer').style.display = 'block';
                break;

            default:
                Utils.log(`Section "${section}" not yet implemented`, 'info');
                Utils.showToast(`${section} functionality coming soon!`, 'info');
                break;
        }
    } catch (error) {
        Utils.log(`Error handling section display for ${section}: ${error}`, 'error');
        Utils.showToast('An error occurred while loading the section', 'error');
    }
}