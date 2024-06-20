document.getElementById('convertButton').addEventListener('click', convertPdfToExcel);

async function convertPdfToExcel() {
    console.log("Iniciando a conversão");

    const input = document.getElementById('pdfFile');
    if (!input.files.length) {
        alert('Por favor, selecione um arquivo PDF');
        return;
    }

    const file = input.files[0];
    console.log("Arquivo selecionado:", file.name);

    try {
        const arrayBuffer = await file.arrayBuffer();
        console.log("Arquivo carregado em arrayBuffer");

        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();
        console.log("PDF carregado, número de páginas:", pages.length);

        let textContent = [];

        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            const textContentItems = await page.getTextContent();
            const strings = textContentItems.items.map(item => item.str);
            textContent.push(strings.join(' '));
        }

        console.log("Texto extraído do PDF:", textContent);

        const aoa = textContent.map(line => [line]);
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(aoa);

        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

        XLSX.writeFile(wb, 'output.xlsx');
        console.log("Arquivo Excel gerado com sucesso");

    } catch (error) {
        console.error("Erro durante a conversão:", error);
    }
}