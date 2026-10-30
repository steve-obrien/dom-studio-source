import { handleTemplateEditorTailwindRequest } from '../../../lib/templateEditorTailwind.js';

export const config = {
	body: 'raw',
};

export default async function templateEditorTailwindCss(request, response) {
	await handleTemplateEditorTailwindRequest(request, response);
}
