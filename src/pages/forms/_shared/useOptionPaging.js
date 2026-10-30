import { nextTick, watch } from 'vue';
import { booleanProp } from './options.js';

/**
 * Share incremental-list requests without owning the application's cursor or fetch.
 * One automatic request is allowed per query/result length; the explicit button
 * can retry a failed page. Checking after render also fills short scroll viewports.
 *
 * @param {Object} props Reactive loading and hasMore props.
 * @param {Function} emit Component event emitter.
 * @param {Object} state Refs for list, options, query and open state.
 * @returns {{ onScroll: Function, requestMore: Function }} Paging event handlers.
 */
export function useOptionPaging(props, emit, { list, options, query, open }) {
	let requestedKey = null;

	/** Request the next application-owned page, suppressing duplicate automatic requests. */
	function requestMore(force = false) {
		if (!open.value || booleanProp(props.loading) || !booleanProp(props.hasMore)) return;
		const key = `${query.value}\u0000${options.value.length}`;
		if (!force && requestedKey === key) return;
		requestedKey = key;
		emit('load-more', { query: query.value });
	}

	/** Ask for another page only while the open list is near its scroll boundary. */
	function checkBoundary() {
		const element = list.value;
		if (!element || element.clientHeight <= 0) return;
		if (element.scrollHeight - element.scrollTop - element.clientHeight <= 64) requestMore();
	}

	/** Forward scroll details for custom previews, then check the shared paging threshold. */
	function onScroll(event) {
		emit('list-scroll', event);
		checkBoundary();
	}

	watch(query, () => { requestedKey = null; });
	watch([open, () => props.loading, () => props.hasMore, () => options.value.length], () => nextTick(checkBoundary));
	return { onScroll, requestMore };
}
