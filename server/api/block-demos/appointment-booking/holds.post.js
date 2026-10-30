import { holdAppointmentSlot } from '../../../lib/blockDemos/appointmentBooking.js';

/**
 * Place a short-lived server-side hold on a selected appointment slot.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Slot hold or API error.
 */
export async function post(req, res) {
	const result = holdAppointmentSlot(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
