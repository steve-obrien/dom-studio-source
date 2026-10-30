import { onBeforeUnmount, ref } from 'vue';

/**
 * Example-owned cursor loader for the docs' real HTTP endpoint. Queries reset the
 * cursor, cancel old requests and ignore stale responses. Failed pages are retried
 * explicitly; controls never know the URL or pagination protocol.
 *
 * @param {'people'|'classes'} kind Synthetic catalogue served by /api/form-options.
 * @returns {Object} Reactive options, loading, error, total and paging handlers.
 */
export function usePagedLookup(kind = 'people') {
	const options = ref([]);
	const loading = ref(false);
	const hasMore = ref(false);
	const error = ref('');
	const total = ref(0);
	let query = null;
	let cursor = null;
	let controller = null;
	let timer = null;
	let generation = 0;

	/** Fetch and append one page, retaining a failed cursor for an explicit retry. */
	async function fetchPage(version) {
		if (cursor === null || version !== generation) return;
		const requestedCursor = cursor;
		controller = new AbortController();
		loading.value = true;
		error.value = '';
		try {
			const params = new URLSearchParams({ kind, q: query || '', cursor: requestedCursor, limit: '12' });
			const response = await fetch(`/api/form-options?${params}`, { signal: controller.signal });
			if (!response.ok) throw new Error(`Options request failed (${response.status}).`);
			const page = await response.json();
			if (version !== generation) return;
			options.value = [...new Map([...options.value, ...page.items].map((item) => [String(item.value), item])).values()];
			cursor = page.nextCursor;
			hasMore.value = cursor !== null;
			total.value = page.total;
		} catch (failure) {
			if (version === generation && failure.name !== 'AbortError') {
				error.value = failure.message;
				hasMore.value = false;
			}
		} finally {
			if (version === generation) loading.value = false;
		}
	}

	/** Debounce searches and cancel both scheduled and in-flight pages. */
	function search(value) {
		if (query === value) return;
		query = value;
		const version = ++generation;
		clearTimeout(timer);
		controller?.abort();
		cursor = '0';
		options.value = [];
		total.value = 0;
		hasMore.value = false;
		error.value = '';
		loading.value = true;
		timer = setTimeout(() => fetchPage(version), 180);
	}

	/** Load the next page or explicitly retry the same cursor after an error. */
	function loadMore() {
		if (!loading.value && cursor !== null) return fetchPage(generation);
	}

	/** Cancel owned work so stale responses cannot update an unmounted example. */
	function dispose() {
		generation += 1;
		clearTimeout(timer);
		controller?.abort();
	}

	onBeforeUnmount(dispose);
	return { options, loading, hasMore, error, total, search, loadMore };
}
