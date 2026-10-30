/**
 * Dependency-free export helpers for DomDataGrid.
 *
 * CSV follows RFC 4180 with a UTF-8 byte order mark so Excel opens accented
 * text correctly. XLSX is a real Office Open XML workbook written into an
 * uncompressed ZIP, so numbers, dates and booleans stay typed in Excel,
 * Numbers and Google Sheets without pulling in a spreadsheet library.
 */

/**
 * @typedef {object} GridExportColumn
 * @property {string} label Header text.
 * @property {'text'|'number'|'date'|'boolean'|'select'|'currency'} type Column type.
 * @property {number} [width] Column width in pixels.
 * @property {string} [currency] Currency code for currency columns.
 * @property {string} [locale] Locale used to resolve the currency symbol.
 */

/**
 * @typedef {object} GridExportSheet
 * @property {string} [name] Worksheet name.
 * @property {Array<GridExportColumn>} columns Exported columns, in order.
 * @property {Array<Array<unknown>>} rows Typed cell values, one array per row.
 */

const formulaPrefix = /^[=+\-@\t\r]/;

/**
 * Escapes one CSV field and neutralises spreadsheet formula injection in text.
 *
 * @param {unknown} value Cell value.
 * @returns {string} CSV-safe field.
 */
function csvField(value) {
	if (value === null || value === undefined) return '';
	let text = typeof value === 'string' ? value : String(value);
	if (typeof value === 'string' && formulaPrefix.test(text)) text = `'${text}`;
	return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Builds CSV text from a header row and value rows.
 *
 * @param {Array<string>} header Header labels.
 * @param {Array<Array<unknown>>} rows Plain cell values.
 * @returns {string} CSV document.
 */
export function toCsv(header, rows) {
	return [header, ...rows].map((row) => row.map(csvField).join(',')).join('\r\n');
}

/**
 * Builds tab-separated text for the clipboard, matching what spreadsheets paste.
 *
 * @param {Array<Array<unknown>>} rows Plain cell values.
 * @returns {string} TSV text.
 */
export function toTsv(rows) {
	return rows.map((row) => row.map((value) => {
		const text = value === null || value === undefined ? '' : String(value);
		return /[\t\r\n"]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
	}).join('\t')).join('\n');
}

/**
 * Parses clipboard text from a spreadsheet into rows of cells. Quoted fields
 * may contain tabs and new lines, as Excel and Google Sheets produce.
 *
 * @param {string} text Clipboard text.
 * @returns {Array<Array<string>>} Parsed cells.
 */
export function parseTsv(text) {
	const source = String(text ?? '').replace(/\r\n?/g, '\n').replace(/\n$/, '');
	const rows = [];
	let row = [];
	let field = '';
	let quoted = false;

	for (let index = 0; index < source.length; index += 1) {
		const char = source[index];
		if (quoted) {
			if (char === '"' && source[index + 1] === '"') {
				field += '"';
				index += 1;
			} else if (char === '"') {
				quoted = false;
			} else {
				field += char;
			}
			continue;
		}

		if (char === '"' && field === '') quoted = true;
		else if (char === '\t') {
			row.push(field);
			field = '';
		} else if (char === '\n') {
			row.push(field);
			rows.push(row);
			row = [];
			field = '';
		} else {
			field += char;
		}
	}

	row.push(field);
	rows.push(row);
	return rows;
}

/**
 * Starts a browser download for a Blob.
 *
 * @param {Blob} blob File contents.
 * @param {string} fileName Suggested file name.
 */
export function downloadBlob(blob, fileName) {
	if (typeof document === 'undefined') return;
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = fileName;
	link.rel = 'noopener';
	document.body.append(link);
	link.click();
	link.remove();
	setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Wraps CSV text in a Blob with a UTF-8 byte order mark.
 *
 * @param {string} csv CSV document.
 * @returns {Blob} CSV file.
 */
export function csvBlob(csv) {
	return new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
}

function xmlEscape(value) {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		// Control characters other than tab and new lines are invalid in XML 1.0.
		// eslint-disable-next-line no-control-regex
		.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
}

function columnName(index) {
	let name = '';
	let number = index + 1;
	while (number > 0) {
		const modulo = (number - 1) % 26;
		name = String.fromCharCode(65 + modulo) + name;
		number = Math.floor((number - modulo) / 26);
	}
	return name;
}

function excelDateSerial(value) {
	const match = typeof value === 'string' ? value.match(/^(\d{4})-(\d{2})-(\d{2})/) : null;
	const date = match ? null : value instanceof Date ? value : new Date(value);
	const utc = match
		? Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
		: date && !Number.isNaN(date.getTime()) ? Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) : NaN;
	if (!Number.isFinite(utc)) return null;
	return (utc - Date.UTC(1899, 11, 30)) / 86400000;
}

function currencySymbol(column) {
	try {
		const parts = new Intl.NumberFormat(column.locale || 'en-GB', { style: 'currency', currency: column.currency || 'GBP' }).formatToParts(0);
		return parts.find((part) => part.type === 'currency')?.value || '';
	} catch {
		return '';
	}
}

function sheetName(name) {
	const cleaned = String(name || 'Sheet1').replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 31);
	return cleaned || 'Sheet1';
}

/**
 * Builds the styles part and returns the style index for each column. Number
 * and currency columns holding only whole numbers get a format without
 * decimals.
 *
 * @param {Array<GridExportColumn>} columns Exported columns.
 * @param {Array<Array<unknown>>} rows Typed cell values.
 * @returns {{ xml: string, styles: Array<number> }} Styles part and a style index per column.
 */
function buildStyles(columns, rows) {
	const numberFormats = [];
	const customStyles = new Map();
	// 0 default, 1 bold header, 2 date, 3 decimal number, 4 whole number, then currencies.
	const cellFormats = [
		'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>',
		'<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>',
		'<xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>',
		'<xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>',
		'<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>',
	];

	const styles = columns.map((column, columnIndex) => {
		if (column.type === 'date') return 2;
		if (column.type !== 'number' && column.type !== 'currency') return 0;

		const whole = rows.every((row) => {
			const value = row[columnIndex];
			return value === null || value === undefined || value === '' || typeof value !== 'number' || Number.isInteger(value);
		});
		if (column.type === 'number') return whole ? 4 : 3;

		const symbol = currencySymbol(column).replace(/"/g, '');
		const key = `${symbol}:${whole}`;
		if (!customStyles.has(key)) {
			const id = 164 + numberFormats.length;
			const code = `${symbol ? `"${symbol}"` : ''}#,##0${whole ? '' : '.00'}`;
			numberFormats.push(`<numFmt numFmtId="${id}" formatCode="${xmlEscape(code)}"/>`);
			customStyles.set(key, cellFormats.length);
			cellFormats.push(`<xf numFmtId="${id}" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>`);
		}
		return customStyles.get(key);
	});

	const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${numberFormats.length ? `<numFmts count="${numberFormats.length}">${numberFormats.join('')}</numFmts>` : ''}<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${cellFormats.length}">${cellFormats.join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

	return { xml, styles };
}

function cellXml(reference, value, column, style) {
	if (value === null || value === undefined || value === '') return '';
	if (column.type === 'boolean' || typeof value === 'boolean') {
		return `<c r="${reference}" t="b"><v>${value ? 1 : 0}</v></c>`;
	}
	if (column.type === 'number' || column.type === 'currency') {
		const number = Number(value);
		if (Number.isFinite(number)) return `<c r="${reference}" s="${style}"><v>${number}</v></c>`;
	}
	if (column.type === 'date') {
		const serial = excelDateSerial(value);
		if (serial !== null) return `<c r="${reference}" s="${style}"><v>${serial}</v></c>`;
	}
	return `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
}

function worksheetXml(sheet, styles) {
	const columns = sheet.columns;
	const lastColumn = columnName(Math.max(0, columns.length - 1));
	const lastRow = sheet.rows.length + 1;
	const widths = columns.map((column, index) => {
		const characters = Math.max(8, Math.min(60, Math.round((column.width || 120) / 7)));
		return `<col min="${index + 1}" max="${index + 1}" width="${characters}" customWidth="1"/>`;
	}).join('');
	const header = `<row r="1">${columns.map((column, index) => (
		`<c r="${columnName(index)}1" t="inlineStr" s="1"><is><t xml:space="preserve">${xmlEscape(column.label)}</t></is></c>`
	)).join('')}</row>`;
	const body = sheet.rows.map((row, rowIndex) => {
		const rowNumber = rowIndex + 2;
		const cells = columns.map((column, columnIndex) => (
			cellXml(`${columnName(columnIndex)}${rowNumber}`, row[columnIndex], column, styles[columnIndex])
		)).join('');
		return `<row r="${rowNumber}">${cells}</row>`;
	}).join('');

	return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><dimension ref="A1:${lastColumn}${lastRow}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>${widths ? `<cols>${widths}</cols>` : ''}<sheetData>${header}${body}</sheetData>${columns.length ? `<autoFilter ref="A1:${lastColumn}${lastRow}"/>` : ''}</worksheet>`;
}

/**
 * Builds an XLSX workbook with one worksheet.
 *
 * @param {GridExportSheet} sheet Worksheet contents.
 * @returns {Blob} XLSX file.
 */
export function xlsxBlob(sheet) {
	const name = sheetName(sheet.name);
	const styles = buildStyles(sheet.columns, sheet.rows);
	const files = [
		['[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`],
		['_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
		['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xmlEscape(name)}" sheetId="1" r:id="rId1"/></sheets>${sheet.columns.length ? `<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${xmlEscape(name.replace(/'/g, "''"))}'!$A$1:$${columnName(sheet.columns.length - 1)}$${sheet.rows.length + 1}</definedName></definedNames>` : ''}</workbook>`],
		['xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
		['xl/styles.xml', styles.xml],
		['xl/worksheets/sheet1.xml', worksheetXml(sheet, styles.styles)],
	];

	return new Blob([zipStore(files)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

let crcTable = null;

function crc32(bytes) {
	if (!crcTable) {
		crcTable = new Uint32Array(256);
		for (let index = 0; index < 256; index += 1) {
			let value = index;
			for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
			crcTable[index] = value >>> 0;
		}
	}

	let crc = 0xffffffff;
	for (let index = 0; index < bytes.length; index += 1) crc = crcTable[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
	return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Writes files into an uncompressed (stored) ZIP archive.
 *
 * @param {Array<[string, string]>} files Path and UTF-8 text pairs.
 * @returns {Uint8Array} ZIP bytes.
 */
export function zipStore(files) {
	const encoder = new TextEncoder();
	const now = new Date();
	const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
	const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
	const entries = files.map(([path, text]) => {
		const name = encoder.encode(path);
		const data = encoder.encode(text);
		return { name, data, crc: crc32(data) };
	});
	const localSize = entries.reduce((total, entry) => total + 30 + entry.name.length + entry.data.length, 0);
	const centralSize = entries.reduce((total, entry) => total + 46 + entry.name.length, 0);
	const output = new Uint8Array(localSize + centralSize + 22);
	const view = new DataView(output.buffer);
	let offset = 0;
	const offsets = [];

	for (const entry of entries) {
		offsets.push(offset);
		view.setUint32(offset, 0x04034b50, true);
		view.setUint16(offset + 4, 20, true);
		view.setUint16(offset + 6, 0x0800, true);
		view.setUint16(offset + 8, 0, true);
		view.setUint16(offset + 10, dosTime, true);
		view.setUint16(offset + 12, dosDate, true);
		view.setUint32(offset + 14, entry.crc, true);
		view.setUint32(offset + 18, entry.data.length, true);
		view.setUint32(offset + 22, entry.data.length, true);
		view.setUint16(offset + 26, entry.name.length, true);
		view.setUint16(offset + 28, 0, true);
		output.set(entry.name, offset + 30);
		output.set(entry.data, offset + 30 + entry.name.length);
		offset += 30 + entry.name.length + entry.data.length;
	}

	const centralStart = offset;
	entries.forEach((entry, index) => {
		view.setUint32(offset, 0x02014b50, true);
		view.setUint16(offset + 4, 20, true);
		view.setUint16(offset + 6, 20, true);
		view.setUint16(offset + 8, 0x0800, true);
		view.setUint16(offset + 10, 0, true);
		view.setUint16(offset + 12, dosTime, true);
		view.setUint16(offset + 14, dosDate, true);
		view.setUint32(offset + 16, entry.crc, true);
		view.setUint32(offset + 20, entry.data.length, true);
		view.setUint32(offset + 24, entry.data.length, true);
		view.setUint16(offset + 28, entry.name.length, true);
		view.setUint16(offset + 30, 0, true);
		view.setUint16(offset + 32, 0, true);
		view.setUint16(offset + 34, 0, true);
		view.setUint16(offset + 36, 0, true);
		view.setUint32(offset + 38, 0, true);
		view.setUint32(offset + 42, offsets[index], true);
		output.set(entry.name, offset + 46);
		offset += 46 + entry.name.length;
	});

	view.setUint32(offset, 0x06054b50, true);
	view.setUint16(offset + 4, 0, true);
	view.setUint16(offset + 6, 0, true);
	view.setUint16(offset + 8, entries.length, true);
	view.setUint16(offset + 10, entries.length, true);
	view.setUint32(offset + 12, offset - centralStart, true);
	view.setUint32(offset + 16, centralStart, true);
	view.setUint16(offset + 20, 0, true);
	return output;
}
