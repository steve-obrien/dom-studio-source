/**
 * Shared pointer and programmatic press feedback for text and icon buttons.
 * The pressed attribute is visual feedback, independent of toggle selection.
 */
export const buttonInteraction = 'select-none [&:is(:active,[data-pressed])]:bg-[linear-gradient(rgb(0_0_0/6%)_0_0)] [&:is(:active,[data-pressed])]:scale-[0.97] [&:is(:active,[data-pressed])]:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] motion-reduce:[&:is(:active,[data-pressed])]:scale-100';
