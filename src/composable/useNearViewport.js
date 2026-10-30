import { onBeforeUnmount, onMounted, ref } from 'vue';

/**
 * Enables a deferred demo once its container approaches the viewport, preserving
 * its state on later scrolls and keeping the server and first client render equal.
 *
 * @param {import('vue').Ref<HTMLElement|null>} target Demo container element.
 * @returns {import('vue').Ref<boolean>} Whether the demo may load and mount.
 */
export function useNearViewport(target) {
	const ready = ref(false);
	let observer;

	/** Start observing after hydration, with eager fallback for older browsers. */
	function observe() {
		if (!target.value || typeof IntersectionObserver === 'undefined') {
			ready.value = true;
			return;
		}
		observer = new IntersectionObserver(reveal, { rootMargin: '300px' });
		observer.observe(target.value);
	}

	/**
	 * Mount once when the container enters the loading margin.
	 * @param {IntersectionObserverEntry[]} entries Updated visibility records.
	 * @returns {void}
	 */
	function reveal(entries) {
		if (!entries.some(isIntersecting)) return;
		ready.value = true;
		disconnect();
	}

	/**
	 * Checks whether an observed container is within the loading margin.
	 * @param {IntersectionObserverEntry} entry Container visibility record.
	 * @returns {boolean} Whether this container should load.
	 */
	function isIntersecting(entry) {
		return entry.isIntersecting;
	}

	/** Releases observation after activation or when navigating away. */
	function disconnect() {
		observer?.disconnect();
	}

	onMounted(observe);
	onBeforeUnmount(disconnect);
	return ready;
}
