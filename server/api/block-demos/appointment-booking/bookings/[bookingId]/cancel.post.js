import { cancelAppointmentBooking } from '../../../../../lib/blockDemos/appointmentBooking.js';

/**
 * Cancel a confirmed appointment and release its reserved slot.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Cancelled booking payload or API error.
 */
export async function post(req, res) {
	const result = cancelAppointmentBooking(req.params.bookingId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
