<script setup>
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import DomAppStack from '../../mobile/stack/DomAppStack.vue';
import DomAppStackScreen from '../../mobile/stack/AppStackScreen.vue';
import DomAppListItem from '../../mobile/list-item/DomAppListItem.vue';
import { buildMenuScreens, hasMenuPage } from './menuTree.js';

defineOptions({
	__doc: {
		name: 'Menu stack',
		tag: '<DomMenuStack>',
		description: 'Nested navigation that slides inside its container on mobile and desktop. Reuses App stack transitions, retained page state, scrolling, and focus. Each item has a unique id and label, plus children, a component and props, or a named slot for richer pages. Leaf items accept to or href, or emit select for application actions.',
		slots: [
			{ name: 'root', payload: '{ screen, stack }', description: 'Content above the root menu rows.' },
			{ name: '(item.slot)', payload: '{ screen, stack }', description: 'Page content above child rows. Set an item’s slot to this slot name; components receive screen and stack props too.' },
		],
		events: [
			{ name: 'select', payload: '(item)', description: 'A leaf was selected. Close the containing popover here if desired.' },
			{ name: 'update:path', payload: '(path: string[])', description: 'Two-way stack path, starting with root.' },
			{ name: 'navigate', payload: '({ path, previousPath, direction, screen, reason })', description: 'A contained page opened or returned.' },
		],
		keyboard: [
			{ keys: 'Tab / Shift+Tab', action: 'Move between visible links, rows, Back, and custom page controls.' },
			{ keys: 'Enter / Space', action: 'Activate a focused button. Enter follows links.' },
		],
		playground: { initial: { title: 'Workspace', items: [
			{ id: 'account', label: 'Account', children: [{ id: 'preferences', label: 'Preferences', children: [{ id: 'language', label: 'English (UK)' }] }] },
			{ id: 'help', label: 'Help' },
		] } },
	},
});

const props = defineProps({
	items: { type: Array, default: () => [], _edit: { description: 'Nested items: unique id, label, description, meta, disabled, children, component, props, slot, to, or href. Page items open their children; use a leaf for a route or action.' } },
	title: { type: String, default: 'Menu', _edit: { description: 'Root page heading.' } },
	height: { type: String, default: 'min(24rem, calc(100dvh - 6rem))', _edit: { description: 'Bounded container height. Use 100% in an explicitly sized parent.' } },
	path: { type: Array, default: null, _edit: { description: 'Controlled path of page ids starting with root. Bind with v-model:path.' } },
	animate: { type: Boolean, default: true, _edit: { description: 'Enable sliding transitions; reduced-motion preferences are respected.' } },
});
const emit = defineEmits(['select', 'update:path', 'navigate']);
const screens = computed(() => buildMenuScreens(props.items, props.title));

/**
 * Opens a contained page or reports a leaf selection to the application.
 * @param {object} item Menu item activated by pointer or keyboard.
 * @param {object} stack Shared App stack navigation helpers.
 */
function activate(item, stack) {
	if (item.disabled) return;
	if (hasMenuPage(item)) stack.push(item.id);
	else emit('select', item);
}

/** Returns a native button for pages/actions or the appropriate link component. */
function rowElement(item) {
	if (item.disabled || hasMenuPage(item)) return 'button';
	return item.to ? RouterLink : item.href ? 'a' : 'button';
}
/**
 * Supplies only attributes owned by the chosen row element. In particular, an
 * undefined href must not fall through to RouterLink and erase its resolved URL.
 */
function rowAttributes(item) {
	if (item.disabled || hasMenuPage(item)) return { type: 'button', disabled: item.disabled || undefined };
	if (item.to) return { to: item.to };
	if (item.href) return { href: item.href };
	return { type: 'button' };
}

</script>

<template>
	<DomAppStack
		data-dom-menu-stack
		class="rounded-lg border border-border [--dom-safe-area-top:0px] [--dom-safe-area-bottom:0px] [--dom-safe-area-left:0px] [--dom-safe-area-right:0px]"
		root="root"
		layout="mobile"
		:height="height"
		:path="path"
		:animate="animate"
		mobile-panel-class="p-2!"
		@update:path="emit('update:path', $event)"
		@navigate="emit('navigate', $event)"
	>
		<DomAppStackScreen v-for="screen in screens" :key="screen.id" :id="screen.id" :title="screen.title" :parent="screen.parent">
			<template #default="stack">
				<slot v-if="screen.slot" :name="screen.slot" :screen="screen" :stack="stack">
					<component v-if="screen.component" :is="screen.component" v-bind="screen.props" :screen="screen" :stack="stack" />
				</slot>
				<component v-else-if="screen.component" :is="screen.component" v-bind="screen.props" :screen="screen" :stack="stack" />
				<nav v-if="screen.items.length" :aria-label="screen.title">
					<ul class="space-y-1">
						<li v-for="item in screen.items" :key="item.id">
							<component
								:is="rowElement(item)"
								v-bind="rowAttributes(item)"
								:aria-label="item.label || item.title || item.id"
								class="block w-full overflow-hidden rounded-lg text-left hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50"
								@click="activate(item, stack)"
							>
								<DomAppListItem as="div" class="bg-transparent!" :label="item.label || item.title || item.id" :description="item.description" :meta="item.meta" :chevron="hasMenuPage(item)" />
							</component>
						</li>
					</ul>
				</nav>
				<p v-else-if="!screen.component && (!screen.slot || screen.id === 'root') && !$slots[screen.slot]" class="p-4 text-sm text-muted-fg">No menu items.</p>
			</template>
		</DomAppStackScreen>
	</DomAppStack>
</template>
