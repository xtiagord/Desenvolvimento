// main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');
const XLSX = require('xlsx');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false
        }
    });

    win.loadFile(path.join(__dirname, 'views', 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

async function pdfToText(filePath) {
    console.log(`Reading PDF from: ${filePath}`);
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
}

function saveToExcel(data, outputPath) {
    console.log(`Saving data to Excel at: ${outputPath}`);
    const lines = data.split('\n');
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([["Conteúdo do PDF"]]);

    for (let i = 0; i < lines.length; i++) {
        XLSX.utils.sheet_add_aoa(worksheet, [[lines[i]]], { origin: -1 });
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'PDF Data');
    XLSX.writeFile(workbook, outputPath);
}

ipcMain.handle('select-pdf', async () => {
    console.log('select-pdf called');
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    });
    console.log('File selected:', result.filePaths[0]);
    return result.filePaths[0];
});

ipcMain.handle('save-excel', async (event, pdfPath) => {
    console.log('save-excel called with path:', pdfPath);
    const text = await pdfToText(pdfPath);
    const result = await dialog.showSaveDialog({
        filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    });
    const excelPath = result.filePath;
    saveToExcel(text, excelPath);
    console.log('Excel file saved at:', excelPath);
    return excelPath;
});
