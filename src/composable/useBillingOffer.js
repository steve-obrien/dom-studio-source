import { computed, reactive } from 'vue';
import { getNowPayload } from '#now/runtime/payload.js';
import { createBillingOffer, getPriceForOffer } from '../../shared/billing.js';

const defaultOffer = createBillingOffer();

const state = reactive({
	offer: normalizeOffer(null),
	loaded: false,
});

/**
 * Exposes reactive prices hydrated from the server's active pricing phase.
 *
 * @returns {object} Offers, prices, and introductory-price flags.
 */
export function useBillingOffer() {
	ensureBillingOffer();

	const individual = computed(() => state.offer.individual);
	const team = computed(() => state.offer.team);
	const individualPrice = computed(() => getPriceForOffer(individual.value));
	const teamPrice = computed(() => getPriceForOffer(team.value));
	const hasIndividualPromotion = computed(() => Boolean(individual.value.salePrice));
	const hasTeamPromotion = computed(() => Boolean(team.value.salePrice));

	return {
		hasIndividualPromotion,
		hasSourcePromotion: hasIndividualPromotion,
		hasTeamPromotion,
		individual,
		individualPrice,
		loaded: computed(() => state.loaded),
		source: individual,
		sourcePrice: individualPrice,
		team,
		teamPrice,
	};
}

/**
 * Hydrates the shared offer state from the current SSR payload.
 *
 * @param {object|null} offer Serialized server offer.
 * @returns {object} Normalized reactive offer.
 */
export function hydrateBillingOffer(offer) {
	state.offer = normalizeOffer(offer);
	state.loaded = true;
	return state.offer;
}

/** Initializes client offer state once from the server-rendered payload. */
function ensureBillingOffer() {
	if (state.loaded) return;
	hydrateBillingOffer(getNowPayload()?.billingOffer);
}

/**
 * Supplies safe defaults while preserving the legacy source alias.
 *
 * @param {object|null} offer Serialized server offer.
 * @returns {object} Complete licence offers.
 */
function normalizeOffer(offer) {
	const individual = offer?.individual || offer?.source || {};

	return {
		...defaultOffer,
		...(offer || {}),
		individual: {
			...defaultOffer.individual,
			...individual,
		},
		source: {
			...defaultOffer.individual,
			...individual,
		},
		team: {
			...defaultOffer.team,
			...(offer?.team || {}),
		},
	};
}
