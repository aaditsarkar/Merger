const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const mergeBtn = document.getElementById('merge-btn');
const statusMessage = document.getElementById('status-message');
const messageModal = document.getElementById('message-modal');
const modalText = document.getElementById('modal-text');
const modalCloseBtn = document.getElementById('modal-close-btn');
const themeToggleBtn = document.getElementById('theme-toggle');
const moonIcon = document.getElementById('moon-icon');
const sunIcon = document.getElementById('sun-icon');

let uploadedFiles = [];
let dragSrcEl = null;
 
// Check for saved theme preference or default to system preference
function initializeTheme() {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        moonIcon.style.display = 'block';
        sunIcon.style.display = 'none';
    } else {
        document.documentElement.classList.remove('dark');
        moonIcon.style.display = 'none';
        sunIcon.style.display = 'block';
    }
}
 
// Initialize theme on page load
initializeTheme();

themeToggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    if (isDark) {
        localStorage.theme = 'dark';
        moonIcon.style.display = 'block';
        sunIcon.style.display = 'none';
    } else {
        localStorage.theme = 'light';
        moonIcon.style.display = 'none';
        sunIcon.style.display = 'block';
    }
});

// Displays a message in the custom modal
function showMessage(text) {
    modalText.textContent = text;
    messageModal.style.display = 'flex';
}

// Hides the custom modal
modalCloseBtn.addEventListener('click', () => {
    messageModal.style.display = 'none';
});

// Event listeners for drag and drop
dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.add('drag-over');
});

dropArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.remove('drag-over');
});

dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
});

// Event listener for file input change
fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// Main function to handle file processing
function handleFiles(files) {
    if (files.length === 0) return;

    // Filter for only PDF files
    const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');

    // Add valid PDFs to our list
    if (pdfFiles.length > 0) {
        uploadedFiles = uploadedFiles.concat(pdfFiles);
        renderFileList();
    } else {
        showMessage("Please upload only PDF files.");
    }
}

// Renders the list of files to the UI
function renderFileList() {
    fileList.innerHTML = ''; // Clear previous list
    if (uploadedFiles.length > 0) {
        uploadedFiles.forEach((file, index) => {
            const listItem = document.createElement('li');
            listItem.id = `file-${index}`;
            listItem.classList.add('file-item', 'flex', 'items-center', 'justify-between', 'p-4', 'bg-gray-50', 'rounded-lg', 'shadow-sm', 'dark:bg-gray-700', 'dark:text-gray-100');
            listItem.draggable = true;
            listItem.dataset.index = index;
            
            // File name and icon
            const fileName = document.createElement('span');
            fileName.classList.add('flex-1', 'truncate', 'font-medium');
            fileName.textContent = file.name;

            // Remove button
            const removeBtn = document.createElement('button');
            removeBtn.classList.add('ml-4', 'text-red-500', 'hover:text-red-700', 'transition-colors', 'duration-200');
            removeBtn.innerHTML = `
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>`;
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                uploadedFiles.splice(index, 1);
                renderFileList();
            });

            listItem.appendChild(fileName);
            listItem.appendChild(removeBtn);
            fileList.appendChild(listItem);

            // Add drag and drop listeners to the list item
            listItem.addEventListener('dragstart', handleDragStart);
            listItem.addEventListener('dragenter', handleDragEnter);
            listItem.addEventListener('dragleave', handleDragLeave);
            listItem.addEventListener('dragover', handleDragOver);
            listItem.addEventListener('drop', handleDrop);
            listItem.addEventListener('dragend', handleDragEnd);
        });
    }
    // Update UI state
    updateUIState();
}

// Drag and drop reordering functions
function handleDragStart(e) {
    this.style.opacity = '0.4';
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.index);
}
 
function handleDragEnter(e) {
    this.classList.add('drag-over');
}
 
function handleDragLeave(e) {
    this.classList.remove('drag-over');
}
 
function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    this.classList.remove('drag-over');
    
    if (dragSrcEl !== this) {
        const fromIndex = parseInt(dragSrcEl.dataset.index);
        const toIndex = parseInt(this.dataset.index);

        // Reorder the files in the array
        const [removed] = uploadedFiles.splice(fromIndex, 1);
        uploadedFiles.splice(toIndex, 0, removed);
        
        renderFileList();
    }
    return false;
}
 
function handleDragEnd(e) {
    this.style.opacity = '1';
    const items = document.querySelectorAll('.file-item');
    items.forEach(item => item.classList.remove('drag-over'));
}

// Updates the UI based on the number of files
function updateUIState() {
    if (uploadedFiles.length >= 2) {
        mergeBtn.disabled = false;
        statusMessage.textContent = `${uploadedFiles.length} files ready to merge. Drag to reorder.`;
    } else if (uploadedFiles.length === 1) {
        mergeBtn.disabled = true;
        statusMessage.textContent = "Please upload at least two PDFs to merge.";
    } else {
        mergeBtn.disabled = true;
        statusMessage.textContent = "Ready to merge.";
    }
}

// The main merge function
mergeBtn.addEventListener('click', async () => {
    if (uploadedFiles.length < 2) {
        showMessage("Please upload at least two PDFs to merge.");
        return;
    }

    // Disable button and show status
    mergeBtn.disabled = true;
    statusMessage.textContent = "Merging... this may take a moment.";

    try {
        // Create a new PDF document
        const mergedPdf = await PDFLib.PDFDocument.create();

        // Loop through each uploaded PDF file
        for (let i = 0; i < uploadedFiles.length; i++) {
            const file = uploadedFiles[i];
            statusMessage.textContent = `Processing file ${i + 1} of ${uploadedFiles.length}...`;
            
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, {
                ignoreEncryption: true
            });
            
            // Copy all pages from the current PDF to the new one
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach(page => mergedPdf.addPage(page));
        }

        // Save the merged PDF to a byte array
        const mergedPdfBytes = await mergedPdf.save();
        
        // Create a blob and a download link
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'merged_document.pdf';
        
        // Trigger the download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the object URL
        setTimeout(() => {
            URL.revokeObjectURL(link.href);
        }, 100);
        
        // Show success message
        statusMessage.textContent = "Merge complete! Your file is downloading.";
        showMessage("PDF merge successful! Check your downloads folder.");
        
        // Reset the application state after successful merge
        setTimeout(() => {
            uploadedFiles = [];
            renderFileList();
            fileInput.value = '';
            statusMessage.textContent = "Ready to merge.";
            mergeBtn.disabled = true;
        }, 3000);
        
    } catch (error) {
        console.error("An error occurred during merging:", error);
        statusMessage.textContent = "Error merging files. Please try again.";
        showMessage("An error occurred while merging the PDFs. Please ensure all files are valid PDFs and try again.");
    } finally {
        // Re-enable the merge button if there are still files
        if (uploadedFiles.length >= 2) {
            mergeBtn.disabled = false;
        }
    }
});
 
// Close modal when clicking outside of it
messageModal.addEventListener('click', (e) => {
    if (e.target === messageModal) {
        messageModal.style.display = 'none';
    }
});
 
// Keyboard accessibility for modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && messageModal.style.display === 'flex') {
        messageModal.style.display = 'none';
    }
});