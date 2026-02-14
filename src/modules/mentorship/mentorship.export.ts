import ExcelJS from 'exceljs';
import { getAllRegistrationsSortedByName } from './mentorship.service';

export async function exportMentorshipRegistrationsToExcel(): Promise<Buffer> {
  const items = await getAllRegistrationsSortedByName();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Mentorship Registrations', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = [
    { header: 'Name', key: 'name', width: 25 },
    { header: 'University/School', key: 'school', width: 30 },
    { header: 'Experience Level', key: 'experienceLevel', width: 20 },
    { header: 'Major', key: 'major', width: 25 },
    { header: 'Finance Focus', key: 'financeFocus', width: 35 },
    { header: 'Created At', key: 'createdAt', width: 22 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };

  for (const item of items) {
    sheet.addRow({
      name: item.name,
      school: item.school,
      experienceLevel: item.experienceLevel,
      major: item.major,
      financeFocus: item.financeFocus,
      createdAt: item.createdAt instanceof Date
        ? item.createdAt.toISOString()
        : new Date(item.createdAt).toISOString(),
    });
  }

  if (items.length > 0) {
    for (let i = 1; i <= 6; i++) {
      const col = sheet.getColumn(i);
      col.eachCell((cell) => {
        if (cell.value != null) {
          col.width = Math.max(col.width || 10, Math.min(String(cell.value).length + 2, 50));
        }
      });
    }
  }

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf as ArrayBuffer);
}
