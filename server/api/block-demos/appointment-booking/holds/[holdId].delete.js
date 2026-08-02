import { releaseAppointmentHold } from '../../../../lib/blockDemos/appointmentBooking.js';

/**
 * Release a temporary slot hold when an attendee returns to availability.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated availability revision or API error.
 */
export async function del(req, res) {
	const result = releaseAppointmentHold(req.params.holdId);
	if (result.error) res.status(result.status || 400);
	return result;
}

export { del as delete };
