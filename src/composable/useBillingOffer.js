import { computed, reactive } from 'vue';
import { getNowPayload } from '#now/runtime/payload.js';

const defaultOffer = {
	individual: {
		originalPrice: 149,
		salePrice: null,
		currency: 'GBP',
		promotionCode: '',
		offerLabel: '',
	},
	team: {
		originalPrice: 499,
		salePrice: null,
		currency: 'GBP',
		promotionCode: '',
		offerLabel: '',
	},
};

const state = reactive({
	offer: normalizeOffer(null),
	loaded: false,
});

export function useBillingOffer() {
	ensureBillingOffer();

	const individual = computed(() => state.offer.individual);
	const team = computed(() => state.offer.team);
	const individualPrice = computed(() => priceForOffer(individual.value));
	const teamPrice = computed(() => priceForOffer(team.value));
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

export function hydrateBillingOffer(offer) {
	state.offer = normalizeOffer(offer);
	state.loaded = true;
	return state.offer;
}

function ensureBillingOffer() {
	if (state.loaded) return;
	hydrateBillingOffer(getNowPayload()?.billingOffer);
}

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

function priceForOffer(offer) {
	return offer.salePrice || offer.originalPrice;
}
