import { getAppointmentBookingBootstrap } from '../../../lib/blockDemos/appointmentBooking.js';

/**
 * Return the appointment types, booking window, timezones, and viewer defaults.
 *
 * @returns {Promise<Record<string, unknown>>} Appointment-booking bootstrap payload.
 */
export async function get() {
	return getAppointmentBookingBootstrap();
}
