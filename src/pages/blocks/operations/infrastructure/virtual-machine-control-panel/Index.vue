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
			tagline="A copyable cloud control panel for reviewing compute capacity, configuring a virtual machine, and launching it with policy checks."
			tag="Operations UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Operations / Infrastructure" title="Virtual machine control panel">
				<Example
					:source="VirtualMachineControlPanelSrc"
					filename="VirtualMachineControlPanel.vue"
					presentation="iframe"
					frame-src="/blocks/operations/infrastructure/virtual-machine-control-panel/preview/VirtualMachineControlPanel"
					description="Copy this into cloud dashboards, internal platform consoles, hosting products, lab environments, or managed infrastructure tools that need a practical VM creation workflow."
					default-open
					:preview-lines="20"
				>
					<VirtualMachineControlPanel />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when operators need to provision compute from the same surface where they review fleet health, regional capacity, launch cost, and guardrail readiness.
						The example keeps the create form, VM inventory, selected machine details, and policy checklist together so teams can adapt it into a real cloud control panel.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>virtualMachines</code>, project choices, size plans, images, and regions with records from your compute, quota, and billing APIs.</li>
						<li>Submit creation through a server-owned command such as <code>POST /compute/virtual-machines</code>, then poll or subscribe to provisioning state until the machine is ready.</li>
						<li>Keep quota checks, hostname uniqueness, region capacity, SSH key eligibility, budget limits, firewall rules, and image availability enforced on the server.</li>
						<li>Persist the visible launch payload with requester, project, estimated cost, policy check results, network assignment, and audit reason before provisioning starts.</li>
						<li>Return structured errors for capacity, billing, permissions, image deprecation, or network policy failures so the checklist can explain what changed.</li>
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

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Provisioning state</h3>
						<p class="mt-2">Treat creation as an async job. Show pending, provisioning, booting, ready, failed, and rollback states from your backend rather than assuming immediate success.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Network policy</h3>
						<p class="mt-2">Keep VPC, firewall, public IP, and SSH rules server-owned. The UI should collect intent and explain policy, not become the enforcement layer.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include image search, cloud-init editing, quota request dialogs, snapshot restore, approval routing, and post-launch health checks.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
