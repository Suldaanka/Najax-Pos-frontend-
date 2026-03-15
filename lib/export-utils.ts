import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportToExcel(data: any[], fileName: string) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export function exportToPDF(data: any[], fileName: string, title?: string) {
    const doc = new jsPDF();
    
    if (title) {
        doc.setFontSize(18);
        doc.text(title, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    }

    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    const rows = data.map(item => Object.values(item) as (string | number | boolean)[]);

    autoTable(doc, {
        head: [headers],
        body: rows as any,
        startY: title ? 35 : 15,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], textColor: 255 }, // Indigo-600 logic
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { top: 15 },
    });

    doc.save(`${fileName}.pdf`);
}
