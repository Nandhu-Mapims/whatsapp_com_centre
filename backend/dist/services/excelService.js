"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelService = void 0;
const exceljs_1 = __importDefault(require("exceljs"));
class ExcelService {
    /**
     * Parse uploaded staff roster workbook (.xlsx)
     */
    static async parseEmployeeWorkbook(buffer) {
        const workbook = new exceljs_1.default.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            throw new Error('Workbook contains no worksheets.');
        }
        const rows = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1)
                return; // Skip header
            const employeeId = String(row.getCell(1).value || '').trim();
            const name = String(row.getCell(2).value || '').trim();
            const whatsapp = String(row.getCell(3).value || '').trim();
            const category = String(row.getCell(4).value || '').trim();
            const department = String(row.getCell(5).value || '').trim();
            const designation = String(row.getCell(6).value || '').trim();
            const consentReference = String(row.getCell(7).value || '').trim();
            const issues = [];
            if (!employeeId)
                issues.push('Missing Employee ID');
            if (!name)
                issues.push('Missing Name');
            if (!whatsapp || whatsapp.length < 10)
                issues.push('Invalid WhatsApp phone number');
            if (!category)
                issues.push('Missing Category');
            if (!department)
                issues.push('Missing Department');
            rows.push({
                employeeId,
                name,
                whatsappNumber: whatsapp,
                category,
                department,
                designation,
                consentReference,
                isValid: issues.length === 0,
                issues,
            });
        });
        return rows;
    }
    /**
     * Generate an audit or delivery report in XLSX format
     */
    static async generateDeliveryReport(records) {
        const workbook = new exceljs_1.default.Workbook();
        const sheet = workbook.addWorksheet('Delivery Status Log');
        sheet.columns = [
            { header: 'Employee ID', key: 'employeeId', width: 15 },
            { header: 'Staff Name', key: 'employeeName', width: 25 },
            { header: 'WhatsApp Number', key: 'maskedNumber', width: 18 },
            { header: 'Campaign Name', key: 'campaignName', width: 30 },
            { header: 'Dispatched At', key: 'submittedAt', width: 20 },
            { header: 'Provider Status', key: 'providerStatus', width: 15 },
            { header: 'Error Code', key: 'errorCode', width: 25 },
        ];
        records.forEach((rec) => {
            sheet.addRow({
                employeeId: rec.employeeId,
                employeeName: rec.employeeName,
                maskedNumber: rec.maskedNumber,
                campaignName: rec.campaignName,
                submittedAt: rec.submittedAt,
                providerStatus: rec.providerStatus,
                errorCode: rec.errorCode || 'None',
            });
        });
        return (await workbook.xlsx.writeBuffer());
    }
}
exports.ExcelService = ExcelService;
