import { setNowPayload } from '#now/runtime/payload.js';
import { createDomStudioApp, updateDocumentHead } from './main.js';
import { hydrateAuthState } from './composable/useAuth.js';
import { hydrateBillingOffer } from './composable/useBillingOffer.js';

const payload = window.__NOW__ || {};
setNowPayload(payload);
hydrateAuthState(payload.auth);
hydrateBillingOffer(payload.billingOffer);

const { app, router, pinia } = createDomStudioApp();

router.isReady().then(() => {
	if (payload.pinia) {
		pinia.state.value = payload.pinia;
	}

	updateDocumentHead(router.currentRoute.value);
	app.mount('#app', true);

	delete window.__NOW__;
});
