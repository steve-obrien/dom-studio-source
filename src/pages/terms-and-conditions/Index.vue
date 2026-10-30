<script setup>
import { RouterLink } from 'vue-router';
import DomStudioLayout from '../_layout/DomStudioLayout.vue';
import DocPage from '../_layout/DocPage.vue';
import DocSection from '../_layout/DocSection.vue';
import LegalBusinessDetails from '../_layout/LegalBusinessDetails.vue';
import licenceUrl from '../../../LICENSE.md?url';
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Terms and conditions" eyebrow="Legal" tagline="The terms for using getdom.studio and purchasing DOM Studio licences from DB3 Ltd.">
			<div class="space-y-10 text-base leading-7 text-muted-fg [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4">
				<p class="text-sm">Last updated: <time datetime="2026-09-28">28 September 2026</time></p>
				<DocSection title="1. About us and these terms">
					<LegalBusinessDetails />
					<p>These terms apply to the DOM Studio website, documentation, online tools and purchases. Please read them before using the services or placing an order and keep a copy for your records. You must be at least 18 to purchase or create an account. If you act for an organisation, you confirm that you have authority to bind it.</p>
					<p>Software use is also governed by the <a :href="licenceUrl" download="DOM-Studio-Commercial-License.md">DOM Studio Commercial License 1.0</a>, supplied with the package and purchase confirmation. The licence controls software permissions and restrictions; your order confirmation controls the purchased licence type, price and any expressly agreed additional services. These terms do not reduce rights promised with an existing purchase or override mandatory consumer rights.</p>
				</DocSection>
				<DocSection title="2. What DOM Studio provides">
					<p>DOM Studio provides Vue and Web Component interface software, source materials, examples and documentation. The public package is available for local evaluation. Production, deployed, distributed and paid client use requires an appropriate commercial licence.</p>
					<p>The product and included access are described on the pricing page and in your order. Features identified as experimental, beta, planned or preview may change. Base your purchase on the features and commitments stated at the time of purchase, not on an assumption that a future feature will be delivered.</p>
				</DocSection>
				<DocSection title="3. Orders, payment and delivery">
					<p>Licence prices, currency, applicable taxes and the total payable are shown during checkout. Payments are processed by Stripe. Current Individual and Team licences are one-time purchases, not recurring subscriptions. Separately agreed services or future offers will state their own charges before you order.</p>
					<p>Your order is accepted when payment is confirmed and we issue your licence confirmation. If we cannot accept or fulfil an order, we will notify you and refund any amount paid for it. An obvious pricing error does not require you to accept a revised price: we will ask you to confirm the corrected order or cancel it and refund you.</p>
					<p>Delivery is electronic. Use an accurate email address and retain your confirmation and licence reference. You can purchase without an account; email verification is required to claim account access associated with a purchase. Contact us if payment completes but your confirmation or access does not arrive.</p>
				</DocSection>
				<DocSection title="4. Your software licence">
					<ul class="list-disc space-y-3 pl-6">
						<li><strong class="text-canvas-fg">Evaluation:</strong> local development and non-public testing only. It does not permit production deployment, distribution or paid client services.</li>
						<li><strong class="text-canvas-fg">Individual:</strong> one named developer may use and modify the software in unlimited personal, commercial and bespoke client products. Sharing the library or paid source access with other developers is not included.</li>
						<li><strong class="text-canvas-fg">Team:</strong> the purchasing legal entity may allow its employees and contractors to use the software on its behalf, including in its own and bespoke client products. Contractors cannot retain or reuse it for unrelated work.</li>
						<li><strong class="text-canvas-fg">Client delivery:</strong> clients may operate and maintain a delivered bespoke end product. They need their own licence to extract or reuse DOM Studio in another product.</li>
						<li><strong class="text-canvas-fg">Redistribution:</strong> the software may be distributed only as part of a larger end product with substantial functionality beyond DOM Studio. You may not resell, share or publish it as a standalone library, UI kit, template library, starter kit or competing component-building product.</li>
					</ul>
					<p>The commercial licence permits ongoing use of versions obtained under it, subject to its conditions. Included updates cover releases under major version 1 while DOM Studio makes them available. Future major upgrades are optional and may cost extra. Perpetual use does not promise indefinite operation of hosted services, support or development of future releases. Existing purchases, including introductory £1 and lifetime v1 offers, retain their promised rights.</p>
					<p>This section is a summary. Read and retain the <a :href="licenceUrl" download="DOM-Studio-Commercial-License.md">full commercial licence</a>. Third-party dependencies retain their own licences and notices.</p>
				</DocSection>
				<DocSection title="5. Accounts and acceptable use">
					<p>Keep your account information accurate and protect passwords, sign-in links and paid access. Do not share access beyond your licence entitlement. Tell us promptly if you believe someone has accessed your account without permission.</p>
					<p>You must not misuse the service, attempt unauthorised access, bypass access controls, distribute malicious code, interfere with other users or infrastructure, infringe others' rights, or submit unlawful content. Automated use must respect access restrictions and must not impose an unreasonable load on the service.</p>
					<p>You are responsible for your applications, their security, accessibility, legal compliance, backups and testing. Documentation and examples illustrate implementation patterns and are not a guarantee that a particular application meets every requirement.</p>
				</DocSection>
				<DocSection title="6. Your content and AI features">
					<p>You retain rights in the original content you submit. You give us permission to process that content as needed to provide the feature you request, including sending it to a provider where the feature requires this. You must have the rights and permissions needed to submit it. Do not enter secrets or sensitive personal information into public demonstrations or AI prompts.</p>
					<p>AI theme generation sends your prompt and theme settings to OpenAI. Generated output may be inaccurate, unsuitable or similar to output provided to others. Review and test it before use, including for accessibility, security and third-party rights. AI output does not remove the licence conditions that apply to DOM Studio materials.</p>
					<p>Our <RouterLink to="/privacy">Privacy policy</RouterLink> explains how personal information is handled.</p>
				</DocSection>
				<DocSection title="7. Cancellation, refunds and consumer rights">
					<p>If you are buying mainly for purposes outside your trade, business or profession, applicable consumer law may give you cancellation and other rights. Nothing in these terms removes those rights.</p>
					<p>UK consumers generally have 14 days from entering an online contract to cancel. For digital content, that cancellation right is lost only if supply begins after you expressly consent to immediate supply and acknowledge that you will lose the right to cancel, and we provide the required confirmation. Merely reading these terms or buying a licence does not itself give that consent or acknowledgement.</p>
					<p>Where a cancellation right applies, contact us before the cancellation period ends with a clear statement that you wish to cancel, your name, purchase email and order or licence reference. You may use: “I give notice that I cancel my contract for DOM Studio, ordered on [date], reference [reference]. My name is [name] and my address is [address].” We will refund qualifying cancellations within 14 days of being informed, using the original payment method unless agreed otherwise, without a refund fee.</p>
					<p>Digital content supplied to consumers must be of satisfactory quality, fit for a purpose made known and agreed, and as described. If it is faulty or misdescribed, you may be entitled to repair, replacement or an appropriate price reduction or refund. Please contact us with details so we can investigate. Outside statutory rights or an express promise at purchase, we do not offer a general change-of-mind refund for business purchases or digital content whose cancellation right has validly ended.</p>
				</DocSection>
				<DocSection title="8. Availability, support and changes">
					<p>We aim to keep the website and online features available, but access may be interrupted for maintenance, faults or events outside our reasonable control. We do not promise uninterrupted availability. Architecture reviews, consulting, hosted services and support commitments are included only where your order expressly says so.</p>
					<p>We may update the website and these terms for future use, including to reflect changes in the service or law. The version agreed at purchase continues to govern that purchase unless we agree otherwise or a change is required by law. We will give reasonable notice of material changes affecting ongoing paid services where practicable. Updates to these terms do not revoke perpetual rights already granted under your licence.</p>
				</DocSection>
				<DocSection title="9. Suspension and termination">
					<p>We may restrict website or account access where reasonably necessary to address a security threat, unlawful activity or a material breach. Where practicable, we will explain the reason and provide an opportunity to resolve it; urgent protective action may be immediate.</p>
					<p>Termination of your software licence follows the commercial licence: a material breach must remain unremedied for 14 days after written notice. Termination does not remove accrued payment obligations, statutory remedies or rights that must survive by law. Account closure alone does not end a valid perpetual software licence.</p>
				</DocSection>
				<DocSection title="10. Intellectual property and liability">
					<p>DOM Studio materials are licensed, not sold. Copyright and other intellectual property remain with their respective owners, including Steve O'Brien as identified in the commercial licence. No transfer of ownership occurs through a purchase. You retain rights in your original application code, subject to the licence for incorporated DOM Studio materials.</p>
					<p>Nothing excludes or limits liability for fraud or fraudulent misrepresentation, death or personal injury caused by negligence, or any liability or statutory right that cannot lawfully be excluded or limited.</p>
					<p><strong class="text-canvas-fg">Business customers:</strong> subject to the preceding paragraph and any express written commitment, the software and online tools are supplied “as is” to the extent permitted by law. We exclude implied warranties to that extent and liability for indirect or consequential loss, loss of profit, revenue, business opportunity or goodwill. Our aggregate liability relating to a software licence is limited to the amount paid for that licence, as set out in the commercial licence.</p>
					<p><strong class="text-canvas-fg">Consumers:</strong> we are responsible for foreseeable loss or damage caused by our breach of contract or failure to use reasonable care and skill. We do not apply the business liability cap to limit mandatory consumer rights. We are not responsible for business losses where you purchase as a consumer. Your remedies for defective digital content remain available under applicable law.</p>
				</DocSection>
				<DocSection title="11. Resolving concerns and governing law">
					<p>Contact DB3 Ltd using the details above with any complaint, purchase issue or question about these terms. Include your order reference where relevant, but never send passwords or full payment card details.</p>
					<p>These terms are governed by the laws of England and Wales. Business disputes are subject to the exclusive jurisdiction of the courts of England and Wales. If you are a consumer, you retain any mandatory protections and rights to bring proceedings in your country of residence that applicable law provides, including the right of UK consumers in Scotland or Northern Ireland to use their local courts.</p>
					<p>If a provision is held unenforceable, the remaining provisions continue to apply. A delay in exercising a right is not a waiver of it.</p>
				</DocSection>
			</div>
		</DocPage>
	</DomStudioLayout>
</template>
