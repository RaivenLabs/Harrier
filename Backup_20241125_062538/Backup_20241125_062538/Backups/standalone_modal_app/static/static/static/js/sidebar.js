// Initialize the modalManager object
const modalManager = {
    open: function (modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal with ID "${modalId}" not found`);
            return;
        }
        modal.classList.add("active");
    },
    close: function (modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal with ID "${modalId}" not found`);
            return;
        }
        modal.classList.remove("active");
    },
};

// Add event listeners for the buttons
document.addEventListener("DOMContentLoaded", () => {
    // Open Engineering Console Basic
    const openBasicBtn = document.getElementById("openEngineeringConsoleBasic");
    if (openBasicBtn) {
        openBasicBtn.addEventListener("click", () => {
            modalManager.open("engineeringConsoleBasic");
        });
    }

    // Open Engineering Console (different modal or route)
    const openConsoleBtn = document.getElementById("openEngineeringConsole");
    if (openConsoleBtn) {
        openConsoleBtn.addEventListener("click", () => {
            window.location.href = "/engineering_modal";
        });
    }

    // Close Engineering Console Basic
    const closeBasicBtn = document.getElementById("closeEngineeringConsoleBasic");
    if (closeBasicBtn) {
        closeBasicBtn.addEventListener("click", () => {
            modalManager.close("engineeringConsoleBasic");
        });
    }

    // Cancel button for Engineering Console Basic
    const cancelBasicBtn = document.getElementById("cancelEngineeringConsoleBasic");
    if (cancelBasicBtn) {
        cancelBasicBtn.addEventListener("click", () => {
            modalManager.close("engineeringConsoleBasic");
        });
    }
});

// Optional: Close modal when clicking outside of it
document.addEventListener("click", (event) => {
    const activeModal = document.querySelector(".modal.active");
    if (activeModal && event.target === activeModal) {
        activeModal.classList.remove("active");
    }
});
