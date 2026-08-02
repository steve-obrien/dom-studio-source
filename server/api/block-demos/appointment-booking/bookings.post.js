import { createAppointmentBooking } from '../../../lib/blockDemos/appointmentBooking.js';

/**
 * Confirm an appointment from a valid slot hold and attendee profile.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Confirmed booking receipt or API error.
 */
export async function post(req, res) {
	const result = createAppointmentBooking(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
