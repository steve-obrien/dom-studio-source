<script setup>
import HeadlessPage from '../../_layout/docs/HeadlessPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import HtmlDemo from '../../_layout/docs/HtmlDemo.vue';
import { DomAccordionElement } from '../../lib/headless';

import BasicSrc from './examples/basic.html?raw';
</script>

<template>
	<HeadlessPage :element="DomAccordionElement">
		<DocSection eyebrow="Demo" title="Collapsible sections">
			<Example
				:source="BasicSrc"
				lang="html"
				filename="basic.html"
				description="dom-accordion groups dom-accordion-item children — header and content slots per item."
			>
				<HtmlDemo :source="BasicSrc" />
			</Example>
		</DocSection>
	</HeadlessPage>
</template>
