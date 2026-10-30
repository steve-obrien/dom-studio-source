<script setup>
import HeadlessPage from '../../_layout/docs/HeadlessPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import HtmlDemo from '../../_layout/docs/HtmlDemo.vue';
import { DomTooltipElement } from '../../lib/headless';

import BasicSrc from './examples/basic.html?raw';
import ForSrc from './examples/for.html?raw';
</script>

<template>
	<HeadlessPage :element="DomTooltipElement">
		<DocSection eyebrow="Demo" title="Hover tooltip">
			<Example
				:source="BasicSrc"
				lang="html"
				filename="basic.html"
				description="Wrap any focusable child — text and placement are attributes on the host."
			>
				<HtmlDemo :source="BasicSrc" />
			</Example>
		</DocSection>
		<DocSection eyebrow="Explicit target" title="Reference a trigger by id">
			<Example
				:source="ForSrc"
				lang="html"
				filename="for.html"
				description="Set for to an existing element id when the tooltip should register without wrapping its trigger."
			>
				<HtmlDemo :source="ForSrc" />
			</Example>
		</DocSection>
	</HeadlessPage>
</template>
