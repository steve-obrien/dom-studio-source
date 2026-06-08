import { handleTemplateEditorTailwindRequest } from '../../../../src/pages/experiments/template-editor/tailwindServer.js';

export const config = {
	body: 'raw',
};

export default async function templateEditorTailwindCss(request, response) {
	await handleTemplateEditorTailwindRequest(request, response);
}
