---
title: "If AI Can Generate UI, Why Keep the Code?"
slug: "introducing-dom-studio"
description: "AI may make fixed UI less central, but interfaces and source code still matter when humans need trust, accessibility, repeatability, and a faster path to finished work."
date: "2026-06-08T09:00:00Z"
tags: ["AI UI", "Design systems", "Software", "Accessibility"]
---

There is a strange possibility sitting in front of software teams now: AI may make a lot of user interface feel redundant.

Not all at once. Not everywhere. But slowly, then suddenly in certain corners. If an assistant can understand the task, ask the right question, call the right tool, and produce the right answer, why should the user click through a fixed screen designed months earlier for a generic version of that task?

The obvious answer is that maybe they should not.

## The Interface Might Become Temporary

The future of UI may be less like opening an app and more like watching an interface appear when the conversation needs one.

A pricing table appears because you are comparing plans. A dense filter panel appears because you are cleaning data. A kanban board appears because the conversation has turned into planning. A form appears because the assistant needs structured confirmation before it takes an action. When the job is done, the interface can disappear.

That is a very different idea from the current model of software. Today we build permanent rooms and ask users to walk through them. AI may build temporary scaffolds around the task instead.

If that happens, a lot of UI work changes. Navigation matters less. Static dashboards matter less. Settings pages may shrink. Whole categories of admin screens may become conversational flows with just enough interface generated at the moment of need.

And yet, that does not make UI worthless. It makes good UI more precise.

## Generated Does Not Mean Free

There is also a lazy argument floating around: if AI can generate code, code has no value.

I do not buy it.

AI generation still costs time, money, judgment, iteration, and attention. A codebase that cost GBP 1000 in AI tokens and human steering can still be valuable at GBP 100 if it saves someone else the journey. The buyer is not paying because the code was difficult in some romantic sense. They are paying because it shortcuts development time.

That has always been part of the value of software. Libraries, templates, starter kits, design systems, examples, and boilerplates are valuable because they collapse a future sequence of decisions into something you can start from now.

AI changes the economics, but it does not erase them. It may lower the cost of generating a first version. It does not remove the value of a known-good version.

## Interfaces Are How Humans Stay In The Loop

For now, humans still need discrete interfaces.

We need them to review, compare, correct, approve, reject, edit, and understand. A conversational answer is powerful, but it is often too fluid for decisions that need precision. When money moves, data changes, permissions shift, or customers are affected, the human needs something concrete to inspect.

That might be a form. It might be a diff. It might be a table, a timeline, a preview, a permissions matrix, a chart, a command palette, or a confirmation dialog. The shape matters because the human role matters.

This is especially true for assistive technologies. Interfaces are not only visual decoration. They are structure. Good markup, labels, focus behavior, keyboard paths, landmarks, and state announcements are how software becomes available to more people. If AI generates UI on the fly, it still has to generate that structure well.

Accessibility does not become obsolete because the screen was created in the moment. If anything, it becomes more important.

## UI Will Evolve, Not Vanish

So yes, UI will probably evolve.

Some interfaces will become shorter-lived. Some will be generated only for a specific task. Some will exist as conversational artifacts. Some will be assembled from trusted primitives instead of designed by hand. Some will be discarded seconds after they help a user make a decision.

But there will still be value in the code that makes those interfaces reliable. There will still be value in components with known behavior. There will still be value in patterns that an AI can reuse without inventing a broken combobox for the thousandth time.

That is the bet behind DOM Studio.

It is not just a component library for the current shape of apps. It is a complete Vue and Web Component UI system for the period where humans and AI are learning how to work together. It assumes interfaces may become more dynamic, more contextual, and more disposable, while still needing to be accessible, inspectable, testable, and worth owning.

Maybe one day the fixed app screen becomes the exception.

For now, the interface is still where human judgment touches the machine.
