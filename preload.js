// preload.js
const { contextBridge, ipcRenderer } = require('electron');

console.log("Preload script loaded");

contextBridge.exposeInMainWorld('electron', {
    selectPdf: () => {
        console.log("selectPdf called");
        return ipcRenderer.invoke('select-pdf');
    },
    saveExcel: (pdfPath) => {
        console.log("saveExcel called with", pdfPath);
        return ipcRenderer.invoke('save-excel', pdfPath);
    }
});
