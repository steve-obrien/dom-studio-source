<script setup>
import { RouterLink } from 'vue-router';
import DomStudioLayout from '../_layout/DomStudioLayout.vue';
import DocPage from '../_layout/DocPage.vue';
import DocSection from '../_layout/DocSection.vue';
import LegalBusinessDetails from '../_layout/LegalBusinessDetails.vue';
import { openAnalyticsSettings } from '../../analytics.js';
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Privacy policy" eyebrow="Legal" tagline="How DB3 Ltd handles personal information when you visit getdom.studio, buy a licence, or use our online services.">
			<div class="space-y-10 text-base leading-7 text-muted-fg [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4">
				<p class="text-sm">Last updated: <time datetime="2026-09-28">28 September 2026</time></p>
				<DocSection title="1. Who is responsible for your information">
					<LegalBusinessDetails />
					<p>We are the controller of personal information used to run this website, manage DOM Studio purchases and accounts, and respond to enquiries. This policy covers those activities. If you use DOM Studio components in your own application, you are responsible for that application's data handling and privacy notices.</p>
				</DocSection>
				<DocSection title="2. Information we collect">
					<ul class="list-disc space-y-3 pl-6">
						<li><strong class="text-canvas-fg">Account and contact information:</strong> your name, email address, account identifiers, sign-in credentials in protected form, email verification records, and messages you send us.</li>
						<li><strong class="text-canvas-fg">Purchase and licence information:</strong> purchaser or business name, email address, licence type and reference, payment status, amount, currency, transaction identifiers, receipts and the licence terms supplied with your purchase. Stripe collects payment and billing details directly; we do not receive or store your full payment card number or security code.</li>
						<li><strong class="text-canvas-fg">Technical information:</strong> IP address, browser and device information, requested pages, timestamps, and diagnostic or security events generated when your browser communicates with the website and its service providers.</li>
						<li><strong class="text-canvas-fg">Optional analytics:</strong> when you allow analytics, Google Analytics receives information about visits, pages, interactions, device/browser characteristics, referral sources and approximate location.</li>
						<li><strong class="text-canvas-fg">Content you submit:</strong> prompts, theme settings and information you enter into online features. Some interactive examples send input to our server; others use browser storage. Please use sample data in demonstrations and avoid personal, confidential or sensitive information.</li>
					</ul>
					<p>We receive information directly from you, automatically from your use of the site, and from providers such as Stripe when they confirm a payment. Information needed to fulfil a purchase or authenticate an account is necessary for that service; without it we may be unable to provide access. Analytics is optional.</p>
				</DocSection>
				<DocSection title="3. Why we use it and our legal bases">
					<ul class="list-disc space-y-3 pl-6">
						<li><strong class="text-canvas-fg">Providing the service:</strong> to process purchases, deliver licences and transactional emails, verify account access, provide requested online features and answer purchase enquiries. Our basis is performance of a contract or steps you request before entering one.</li>
						<li><strong class="text-canvas-fg">Operating and protecting the business:</strong> to keep the website working, investigate errors, prevent misuse or fraud, manage business customer relationships, maintain evidence of licence rights and handle disputes. Our basis is our legitimate interests in running a secure and reliable service, balanced against your rights.</li>
						<li><strong class="text-canvas-fg">Meeting legal duties:</strong> to maintain required tax and accounting records and respond to valid legal requests. Our basis is compliance with legal obligations.</li>
						<li><strong class="text-canvas-fg">Optional analytics:</strong> to understand which pages are useful and improve the site. Our basis is your consent, which you can withdraw through Cookie settings.</li>
					</ul>
					<p>We do not use personal information to make solely automated decisions that have legal or similarly significant effects on you. Payment providers may carry out their own fraud checks under their own privacy notices.</p>
				</DocSection>
				<DocSection title="4. Cookies and browser storage">
					<p>We use cookies and similar storage for sign-in, security and the preferences you choose. The <code class="break-all">dom_studio_session</code> cookie keeps you signed in and is normally valid for up to 30 days, unless you sign out or it is invalidated earlier. Browser storage remembers settings such as your theme, documentation layout and analytics choice, and may hold work you save in interactive tools. Local storage remains until you clear it or the relevant feature replaces it.</p>
					<p>Google Analytics is disabled until you choose to allow it. When enabled, Google may set cookies such as <code>_ga</code> and <code>_ga_…</code> to distinguish visits; these can persist for up to two years, subject to Google's settings and your browser. Our analytics integration excludes authentication and licence pages and does not enable advertising consent.</p>
					<p><button type="button" class="font-medium text-primary underline underline-offset-4" @click="openAnalyticsSettings">Open Cookie settings</button> to allow or decline analytics at any time. Declining stops further analytics collection by our integration. You can also delete existing cookies and local storage in your browser. Blocking essential storage may prevent sign-in or stop preferences being remembered. Stripe's checkout uses its own cookies and privacy controls.</p>
				</DocSection>
				<DocSection title="5. Providers and information sharing">
					<p>We share information only as needed to provide the service, operate the business or meet legal duties. The services involved include:</p>
					<ul class="list-disc space-y-3 pl-6">
						<li><a href="https://stripe.com/privacy">Stripe</a> for checkout, payments, receipts and fraud prevention.</li>
						<li><a href="https://resend.com/legal/privacy-policy">Resend</a> for transactional emails, including licence confirmations and account verification links, when email delivery is enabled.</li>
						<li><a href="https://policies.google.com/privacy">Google</a> for consented analytics and Google Fonts previews. When a feature loads a font from Google, your browser sends a request to Google, including technical information such as your IP address.</li>
						<li><a href="https://openai.com/policies/privacy-policy/">OpenAI</a> for the AI theme generator. If you use it, your prompt and current theme tokens are sent to OpenAI to produce a response. Do not include secrets or personal data you are not authorised to share.</li>
						<li>Hosting, infrastructure and technical support providers; professional advisers where necessary; and public authorities where disclosure is legally required.</li>
					</ul>
					<p>External media and linked services may receive technical information when your browser loads their content or you visit them. Their own privacy notices apply to their independent processing. We do not sell your personal information. If the business is reorganised or transferred, relevant records may be shared with advisers and a successor subject to appropriate confidentiality and data protection obligations.</p>
				</DocSection>
				<DocSection title="6. International processing">
					<p>Some providers operate internationally, including in the United States, so information may be processed outside the UK. Where UK data protection law requires safeguards for a transfer, we use an applicable adequacy arrangement or appropriate contractual safeguards, such as approved standard contractual clauses with the UK addendum or the UK International Data Transfer Agreement. You can contact us for details of the safeguards applicable to your information.</p>
				</DocSection>
				<DocSection title="7. How long information is kept">
					<p>We retain information according to its purpose, the continuing licence relationship, legal requirements and any unresolved dispute. Account records are kept while needed to provide access. Because licences permit ongoing use, we retain the minimum purchase and entitlement evidence needed to verify those rights, including after an account closes where necessary.</p>
					<p>Financial records are retained for the applicable statutory accounting and tax period. Enquiries, security logs and diagnostic records are kept only as long as needed to resolve the issue, protect the service or establish or defend a claim. Provider-held records follow the retention applicable to their service and our configuration. Backups may retain information until their normal replacement cycle completes.</p>
					<p>You can ask us about the retention applicable to a particular record or request deletion. We may need to retain some information to meet legal obligations or preserve evidence of a licence; we will explain this when responding.</p>
				</DocSection>
				<DocSection title="8. Your rights and choices">
					<p>Depending on the circumstances, you can ask to access, correct or erase your personal information, restrict its use, or receive a portable copy. You can object to processing based on legitimate interests and withdraw consent without affecting the lawfulness of earlier processing. These rights are subject to legal conditions and exceptions.</p>
					<p>Contact DB3 Ltd using the details above to make a request or raise a privacy concern. We may ask for information to verify your identity and normally respond within one month; if a lawful extension is needed, we will explain why. Requests are normally free of charge.</p>
					<p>You can also complain to the UK's <a href="https://ico.org.uk/make-a-complaint/">Information Commissioner's Office (ICO)</a>, or your local data protection authority where applicable. You do not need to contact us first, although we welcome the opportunity to resolve your concern.</p>
				</DocSection>
				<DocSection title="9. Security, children and policy changes">
					<p>We use technical and organisational measures designed to protect personal information, including access controls and protected authentication credentials. No online service can guarantee absolute security. Keep your account, purchase links and verification emails private.</p>
					<p>DOM Studio is intended for developers and business users, not children under 18. If you believe a child has provided personal information, contact us so we can investigate and take appropriate action.</p>
					<p>We may update this policy as the service or legal requirements change. The date above identifies the current version. Where required, we will give further notice or obtain fresh consent before making a material change to how we use information.</p>
					<p>For the rules governing the service and purchases, see our <RouterLink to="/terms-and-conditions">Terms and conditions</RouterLink>.</p>
				</DocSection>
			</div>
		</DocPage>
	</DomStudioLayout>
</template>
