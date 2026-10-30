import { getAppointmentAvailability } from '../../../lib/blockDemos/appointmentBooking.js';

/**
 * Return live availability for one meeting type, date, and timezone.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Availability payload or API error.
 */
export async function get(req, res) {
	const result = getAppointmentAvailability(req.query || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
