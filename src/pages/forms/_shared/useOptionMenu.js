import { computed, onBeforeUnmount, ref, watch } from 'vue';

/** Manage transient token-query navigation independently from committed selections. */
export function useOptionMenu(items, options = {}) {
	const {
		emitQuery,
		openOnQuery = true,
		closeDelay = 120,
		query: queryRef,
	} = options;
	const query = queryRef || ref('');
	const isOpen = ref(false);
	const activeIndex = ref(0);
	const trimmedQuery = computed(() => query.value.trim());
	let closeTimer = null;
	onBeforeUnmount(() => clearTimeout(closeTimer));
	watch(isOpen, (open) => { if (open) clearTimeout(closeTimer); });

	watch(query, (value) => {
		emitQuery?.(value);
		activeIndex.value = 0;
		if (openOnQuery && value) isOpen.value = true;
	});

	watch(items, () => {
		if (activeIndex.value >= items.value.length) {
			activeIndex.value = Math.max(0, items.value.length - 1);
		}
	});

	/** Wrap keyboard navigation within the currently available entries. */
	function wrapIndex(index) {
		if (!items.value.length) return 0;
		return (index + items.value.length) % items.value.length;
	}

	/** Open the menu and move its active descendant by one step. */
	function move(delta) {
		isOpen.value = true;
		activeIndex.value = wrapIndex(activeIndex.value + delta);
	}

	/** Reset transient input without changing any committed tokens. */
	function reset() {
		clearTimeout(closeTimer);
		query.value = '';
		isOpen.value = false;
		activeIndex.value = 0;
	}

	/** Defer blur closure to allow a pointer-driven option click to commit. */
	function closeSoon() {
		clearTimeout(closeTimer);
		closeTimer = window.setTimeout(() => {
			isOpen.value = false;
		}, closeDelay);
	}

	/** Cancel an outstanding blur when focus immediately returns to the input. */
	function cancelClose() {
		clearTimeout(closeTimer);
	}

	return {
		query,
		isOpen,
		activeIndex,
		trimmedQuery,
		wrapIndex,
		move,
		reset,
		closeSoon,
		cancelClose,
	};
}
