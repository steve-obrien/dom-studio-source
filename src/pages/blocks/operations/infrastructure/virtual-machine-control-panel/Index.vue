<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import VirtualMachineControlPanel from './examples/VirtualMachineControlPanel.vue';
import VirtualMachineControlPanelSrc from './examples/VirtualMachineControlPanel.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Virtual Machine Control Panel Block"
			tagline="A working compute workspace for provisioning machines, following provider jobs, and operating a durable fleet."
			tag="API-backed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Operations / Infrastructure" title="Virtual machine control panel">
				<Example
					:source="VirtualMachineControlPanelSrc"
					filename="VirtualMachineControlPanel.vue"
					presentation="iframe"
					frame-src="/blocks/operations/infrastructure/virtual-machine-control-panel/preview/VirtualMachineControlPanel"
					description="A DigitalOcean- and EC2-inspired application section with a responsive fleet rail, exact provider-request review, deterministic provisioning, health evidence, snapshots, and power operations."
					default-open
					:preview-lines="20"
				>
					<VirtualMachineControlPanel />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						This example is a complete repository-local application section, not a client-only mock. Every selection and mutation is sent to an API that owns fleet revisions, machine versions, provider receipts, provisioning checks, lifecycle rules, and reload persistence.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li><code>GET /bootstrap</code> returns the authoritative catalog, fleet, selected machine, provider job, evidence, and exact workspace revision.</li>
						<li><code>POST /provision/preview</code> validates the full draft and locks an expiring checksum over image, size, region, access, protection, storage, and cost.</li>
						<li><code>POST /provision/commit</code> requires that checksum plus explicit acknowledgement, then returns a provider receipt and deterministic async job.</li>
						<li>Machine-scoped power and snapshot routes require both the latest workspace revision and exact machine version, so stale operators receive a recoverable conflict.</li>
						<li>The mobile bottom navigation changes the composition rather than shrinking the three-pane desktop workspace into an unusable screenshot.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended virtual machine payload">
				<CodeBlock lang="js" filename="virtual-machine-create.js" :code="`{
\tid: 'vm_2048',
\tname: 'api-worker-04',
\tprojectId: 'proj_commerce_prod',
\tregion: 'lon1',
\timage: 'ubuntu-24-04-lts',
\tsize: {
\t\tid: 'balanced-4x16',
\t\tvcpu: 4,
\t\tmemoryGb: 16,
\t\tincludedDiskGb: 120
\t},
\tstorage: {
\t\tbootDiskGb: 160,
\t\tencrypted: true,
\t\tbackupPolicyId: 'daily-14-day'
\t},
\tnetwork: {
\t\tvpcId: 'vpc_prod_private',
\t\tfirewallPolicyId: 'fw_web_private',
\t\tpublicIpv4: false
\t},
\taccess: {
\t\tsshKeyIds: ['key_deploy_prod'],
\t\tpasswordLogin: false
\t},
\tprotection: {
\t\tmonitoring: true,
\t\tdeleteLock: true
\t},
\tpolicyChecks: [
\t\t{ key: 'hostname_unique', status: 'passed' },
\t\t{ key: 'quota_available', status: 'passed' },
\t\t{ key: 'backup_required', status: 'passed' }
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Production boundary" title="What to replace in a real platform">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Provider adapter</h3>
						<p class="mt-2">Replace the deterministic job with your cloud provider SDK, event stream, or reconciler while preserving provider request IDs and step evidence.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Durable records</h3>
						<p class="mt-2">Move process memory into machines, jobs, snapshots, commands, and receipts tables with transactions around exact-version mutations.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Policy and identity</h3>
						<p class="mt-2">Resolve project roles, quotas, regional capacity, budget, SSH-key scope, network policy, and acknowledgements on the server for the authenticated operator.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
