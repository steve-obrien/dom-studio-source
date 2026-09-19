const analyticsConsentStorageKey = 'dom-studio:analytics-consent';
const analyticsConsentChangeEvent = 'dom-studio:analytics-consent-change';
const googleAnalyticsMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-RHFEKPJ8PH';
let analyticsInstalled = false;
let googleTagLoaded = false;

/**
 * Returns the visitor's saved analytics consent choice when browser storage is available.
 *
 * @returns {'granted'|'denied'|null} Saved consent choice, or null before a choice is made.
 */
export function getAnalyticsConsent() {
	if (typeof window === 'undefined') return null;

	try {
		const consent = window.localStorage.getItem(analyticsConsentStorageKey);
		return consent === 'granted' || consent === 'denied' ? consent : null;
	} catch {
		return null;
	}
}

/**
 * Saves an analytics consent choice and notifies the current page.
 *
 * @param {'granted'|'denied'} consent Visitor's analytics consent choice.
 * @returns {void}
 */
export function setAnalyticsConsent(consent) {
	if (typeof window === 'undefined') return;
	if (consent !== 'granted' && consent !== 'denied') return;

	try {
		window.localStorage.setItem(analyticsConsentStorageKey, consent);
	} catch {
		// Keep the in-page choice working when browser storage is unavailable.
	}

	window.dispatchEvent(new CustomEvent(analyticsConsentChangeEvent, {
		detail: { consent },
	}));
}

/**
 * Requests that the global analytics preference surface is shown again.
 *
 * @returns {void}
 */
export function openAnalyticsSettings() {
	if (typeof window === 'undefined') return;
	window.dispatchEvent(new CustomEvent('dom-studio:open-analytics-settings'));
}

/**
 * Installs consent-aware Google Analytics tracking for client-side navigation.
 *
 * @param {import('vue-router').Router} router Application router.
 * @returns {void}
 */
export function installGoogleAnalytics(router) {
	if (typeof window === 'undefined' || analyticsInstalled) return;
	analyticsInstalled = true;

	router.afterEach((to) => {
		trackPageView(to.fullPath, document.title);
	});

	window.addEventListener(analyticsConsentChangeEvent, (event) => {
		if (event.detail?.consent === 'granted') {
			enableGoogleAnalytics();
			trackPageView(router.currentRoute.value.fullPath, document.title);
			return;
		}

		disableGoogleAnalytics();
	});

	if (getAnalyticsConsent() === 'granted') enableGoogleAnalytics();
}

/**
 * Loads Google's tag only on the public production site after consent.
 *
 * @returns {void}
 */
function enableGoogleAnalytics() {
	if (!isPublicProductionSite()) return;
	window[`ga-disable-${googleAnalyticsMeasurementId}`] = false;
	if (googleTagLoaded) {
		window.gtag('consent', 'update', { analytics_storage: 'granted' });
		return;
	}
	googleTagLoaded = true;

	window.dataLayer = window.dataLayer || [];
	window.gtag = window.gtag || function gtag() {
		window.dataLayer.push(arguments);
	};
	window.gtag('js', new Date());
	window.gtag('consent', 'default', {
		ad_personalization: 'denied',
		ad_storage: 'denied',
		ad_user_data: 'denied',
		analytics_storage: 'granted',
	});
	window.gtag('config', googleAnalyticsMeasurementId, {
		send_page_view: false,
	});

	const script = document.createElement('script');
	script.async = true;
	script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleAnalyticsMeasurementId)}`;
	document.head.appendChild(script);
}

/**
 * Stops further GA4 collection immediately when a visitor withdraws consent.
 *
 * @returns {void}
 */
function disableGoogleAnalytics() {
	if (!isPublicProductionSite()) return;
	window[`ga-disable-${googleAnalyticsMeasurementId}`] = true;
	window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
}

/**
 * Sends one GA4 page-view event when analytics consent is granted.
 *
 * @param {string} pagePath Router path including query and hash.
 * @param {string} pageTitle Current document title.
 * @returns {void}
 */
function trackPageView(pagePath, pageTitle) {
	if (getAnalyticsConsent() !== 'granted' || !isPublicProductionSite()) return;
	enableGoogleAnalytics();
	window.gtag('event', 'page_view', {
		page_location: window.location.href,
		page_path: pagePath,
		page_title: pageTitle,
	});
}

/**
 * Prevents development, preview, and alternate hosts from sending production analytics.
 *
 * @returns {boolean} Whether the current hostname is the public DOM Studio site.
 */
function isPublicProductionSite() {
	return window.location.hostname === 'getdom.studio' || window.location.hostname === 'www.getdom.studio';
}
