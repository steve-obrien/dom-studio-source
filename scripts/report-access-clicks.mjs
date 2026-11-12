import { parseArgs } from 'node:util';
import { getDb } from '../server/lib/db.js';
import { accessClickDateRange, accessClickReportCsv, readAccessClickReport } from '../server/lib/accessClickReport.js';

/**
 * Prints a private database report without exposing an unauthenticated HTTP endpoint.
 * @returns {Promise<void>} Resolves after output and database cleanup complete.
 */
async function main() {
	let db;
	try {
		const { values } = parseArgs({ options: {
			days: { type: 'string' }, from: { type: 'string' }, to: { type: 'string' },
			format: { type: 'string', default: 'text' }, help: { type: 'boolean' },
		} });
		if (values.help) {
			console.log('Usage: npm run report:access-clicks -- [--days 30 | --from YYYY-MM-DD --to YYYY-MM-DD] [--format text|json|csv]\nDates are inclusive UTC days. Counts begin after migration and deployment.');
			return;
		}
		if (!['text', 'json', 'csv'].includes(values.format)) throw new Error('--format must be text, json or csv.');
		const range = accessClickDateRange(values);
		db = getDb();
		const report = await readAccessClickReport(db, range);
		if (values.format === 'json') console.log(JSON.stringify(report, null, '\t'));
		else if (values.format === 'csv') process.stdout.write(accessClickReportCsv(report));
		else printReport(report);
	} catch (error) {
		console.error(error.code === 'ER_NO_SUCH_TABLE'
			? 'Click counters are not installed. Run npm run db:migrate on the intended database first.'
			: db ? 'Unable to read click counters. Check the database connection and migrations.' : error.message);
		process.exitCode = 1;
	} finally {
		await db?.destroy();
	}
}

/**
 * Renders an operator-friendly total, daily series and anonymous breakdowns.
 * @param {object} report Completed aggregate report.
 * @returns {void}
 */
function printReport(report) {
	console.log(`Get full access: ${report.total} filtered clicks\n${report.from} to ${report.to} (UTC, inclusive)`);
	console.log('Clicks, not unique visitors or purchases. Bot filtering is best effort; historical clicks are unavailable.');
	if (!report.total) console.log('No clicks recorded in this period. Confirm tracking is enabled and deployed before interpreting this as zero activity.');
	console.table(report.daily);
	for (const [dimension, rows] of Object.entries(report.breakdowns)) {
		console.log(dimension);
		console.table(rows);
	}
}

await main();
