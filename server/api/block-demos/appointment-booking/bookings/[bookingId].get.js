import { getAppointmentBooking } from '../../../../lib/blockDemos/appointmentBooking.js';

/**
 * Return one appointment and its current immutable receipt.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Booking payload or API error.
 */
export async function get(req, res) {
	const result = getAppointmentBooking(req.params.bookingId);
	if (result.error) res.status(result.status || 400);
	return result;
}
