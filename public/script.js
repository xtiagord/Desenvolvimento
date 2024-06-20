$(document).ready(function() {
    // Initialize the datepicker
    $('#date').datepicker({
        format: 'dd/mm/yyyy',
        autoclose: true
    });

    // Manage main folder selection
    $('#mainFolder').change(function() {
        if ($(this).val() === 'ENTREGAS') {
            $('#baseFolder').prop('disabled', true);
        } else {
            $('#baseFolder').prop('disabled', false);
        }
    });

    // Drag and Drop for image
    let dropzone = document.getElementById('dropzone');
    let fileInput = document.getElementById('file');
    let imagePreview = document.getElementById('image-preview');

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(event) { 
                imagePreview.src = event.target.result;
                imagePreview.style.display = 'block';
            }
            reader.readAsDataURL(file);
        } else {
            alert('Please drop an image file.');
        }
        
        fileInput.files = e.dataTransfer.files;
        dropzone.textContent = file.name;
    });

    dropzone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(event) {
                imagePreview.src = event.target.result;
                imagePreview.style.display = 'block';
            }
            reader.readAsDataURL(file);
        } else {
            alert('Please select an image file.');
        }
        
        dropzone.textContent = file.name;
    });

    // Drag and Drop for PDF
    let pdfDropzone = document.getElementById('pdf-dropzone');
    let pdfFileInput = document.getElementById('pdfFile');
    let pdfFilename = document.getElementById('pdf-filename');

    pdfDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        pdfDropzone.classList.add('dragover');
    });

    pdfDropzone.addEventListener('dragleave', () => {
        pdfDropzone.classList.remove('dragover');
    });

    pdfDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        pdfDropzone.classList.remove('dragover');
        
        const file = e.dataTransfer.files[0];
        if (file.type === 'application/pdf') {
            pdfFilename.textContent = file.name;
        } else {
            alert('Please drop a PDF file.');
        }
        
        pdfFileInput.files = e.dataTransfer.files;
        pdfDropzone.textContent = file.name;
    });

    pdfDropzone.addEventListener('click', () => {
        pdfFileInput.click();
    });

    pdfFileInput.addEventListener('change', () => {
        const file = pdfFileInput.files[0];
        if (file.type === 'application/pdf') {
            pdfFilename.textContent = file.name;
        } else {
            alert('Please select a PDF file.');
        }
        
        pdfDropzone.textContent = file.name;
    });

    $('#create-folder-form').on('submit', function(event) {
        event.preventDefault();
        var formData = new FormData(this);

        $.ajax({
            url: '/create-subfolder',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                $('#result').text(response);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                $('#result').text('Error: ' + textStatus + ' - ' + errorThrown);
            }
        });
    });

    $('#toggle-folders').on('click', function() {
        $('#folders-table').toggle();
        if ($('#folders-table').is(':visible')) {
            $.get('/last-10-folders', function(data) {
                let rows = '';
                data.forEach(folder => {
                    rows += `<tr><td>${folder.path}</td><td>${folder.createdAt}</td></tr>`;
                });
                $('#folders-table tbody').html(rows);
            });
        }
    });
});