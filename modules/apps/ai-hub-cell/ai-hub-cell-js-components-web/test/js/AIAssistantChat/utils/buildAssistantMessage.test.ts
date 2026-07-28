/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	CONTENT_GAP_ANALYSIS_ACTION,
	CONTENT_GAP_CATEGORIES_ACTION,
} from '../../../../src/main/resources/META-INF/resources/js/AIAssistantChat/constants';
import buildAssistantMessage from '../../../../src/main/resources/META-INF/resources/js/AIAssistantChat/utils/buildAssistantMessage';

describe('buildAssistantMessage', () => {
	it('builds an image message with a base64 data URI', () => {
		expect(
			buildAssistantMessage({
				agentDefinitionExternalReferenceCodes: ['L_GENERATE_IMAGE'],
				data: 'iVBORw0KGgo=',
				mimeType: 'image/jpeg',
				type: 'image',
			})
		).toEqual({
			agentDefinitionExternalReferenceCodes: ['L_GENERATE_IMAGE'],
			images: ['data:image/jpeg;base64,iVBORw0KGgo='],
			sender: 'assistant',
			text: '',
		});
	});

	it('defaults a missing data field to an empty string', () => {
		expect(buildAssistantMessage({}).text).toBe('');
	});

	it('defaults missing agent reference codes to an empty array', () => {
		expect(
			buildAssistantMessage({data: 'hi'})
				.agentDefinitionExternalReferenceCodes
		).toEqual([]);
	});

	it('defaults the image mime type to image/png when missing', () => {
		expect(
			buildAssistantMessage({data: 'iVBORw0KGgo=', type: 'image'}).images
		).toEqual(['data:image/png;base64,iVBORw0KGgo=']);
	});

	it('passes through plain text answers', () => {
		expect(
			buildAssistantMessage({
				agentDefinitionExternalReferenceCodes: ['L_SOMETHING_ELSE'],
				data: 'Plain answer.',
			}).text
		).toBe('Plain answer.');
	});

	describe('content gap analysis action', () => {
		const GAP_ANALYSIS_ANSWER = JSON.stringify({
			action: CONTENT_GAP_ANALYSIS_ACTION,
			gaps: [{funnelStageId: '39681', personaId: '39697'}],
			result: '**Summary:** One gap to address.',
		});

		it('extracts the gaps and renders the result as the message text', () => {
			expect(buildAssistantMessage({data: GAP_ANALYSIS_ANSWER})).toEqual({
				agentDefinitionExternalReferenceCodes: [],
				contentGapAnalysis: {
					gaps: [{funnelStageId: '39681', personaId: '39697'}],
					result: '**Summary:** One gap to address.',
				},
				sender: 'assistant',
				text: '**Summary:** One gap to address.',
			});
		});

		it('defaults missing gaps to an empty array', () => {
			expect(
				buildAssistantMessage({
					data: JSON.stringify({
						action: CONTENT_GAP_ANALYSIS_ACTION,
						result: 'No gaps.',
					}),
				}).contentGapAnalysis?.gaps
			).toEqual([]);
		});

		it('parses an answer wrapped in a markdown code fence', () => {
			expect(
				buildAssistantMessage({
					data: `\`\`\`json\n${GAP_ANALYSIS_ANSWER}\n\`\`\``,
				}).contentGapAnalysis
			).toBeTruthy();
		});

		it('falls back to a text message when the result is missing', () => {
			const data = JSON.stringify({
				action: CONTENT_GAP_ANALYSIS_ACTION,
				gaps: [],
			});

			expect(buildAssistantMessage({data})).toEqual({
				agentDefinitionExternalReferenceCodes: [],
				sender: 'assistant',
				text: data,
			});
		});
	});

	it('builds a content gap categories request message from the find-matching payload', () => {
		const personas = [{id: 39697, name: 'Decision Maker'}];
		const funnelStages = [{id: 39681, name: 'Awareness'}];

		expect(
			buildAssistantMessage({
				data: JSON.stringify({
					action: CONTENT_GAP_CATEGORIES_ACTION,
					agentInstanceId: '41070',
					funnelStages,
					personas,
					projectId: '40551',
					requestTask: false,
				}),
			})
		).toEqual({
			agentDefinitionExternalReferenceCodes: [],
			contentGapCategoriesRequest: {
				agentInstanceId: '41070',
				funnelStages,
				personas,
				requestTask: false,
				tasks: [],
			},
			sender: 'assistant',
			text: 'select-a-persona-and-a-funnel-stage-to-find-matching-assets',
		});
	});

	it('carries the tasks and generic copy when the generate payload requests a task', () => {
		const tasks = [{id: 'L_CMP_TASK_1955591569', name: 'Task 1'}];

		const message = buildAssistantMessage({
			data: JSON.stringify({
				action: CONTENT_GAP_CATEGORIES_ACTION,
				agentInstanceId: '41055',
				funnelStages: [{id: 39681, name: 'Awareness'}],
				personas: [{id: 39697, name: 'Decision Maker'}],
				projectId: '40551',
				requestTask: true,
				tasks,
			}),
		});

		expect(message.text).toBe(
			'select-a-persona-and-a-funnel-stage-to-continue'
		);
		expect(message.contentGapCategoriesRequest?.requestTask).toBe(true);
		expect(message.contentGapCategoriesRequest?.tasks).toEqual(tasks);
	});

	it('normalizes a numeric agent instance id to a string', () => {
		expect(
			buildAssistantMessage({
				data: JSON.stringify({
					action: CONTENT_GAP_CATEGORIES_ACTION,
					agentInstanceId: 42,
					requestTask: false,
				}),
			}).contentGapCategoriesRequest?.agentInstanceId
		).toBe('42');
	});

	it('falls back to a text message when the action payload misses the agent instance id', () => {
		const data = JSON.stringify({
			action: CONTENT_GAP_CATEGORIES_ACTION,
			projectId: '34213',
		});

		expect(buildAssistantMessage({data})).toEqual({
			agentDefinitionExternalReferenceCodes: [],
			sender: 'assistant',
			text: data,
		});
	});

	it('falls back to a text message when the data mentions the action but is not valid JSON', () => {
		const data = `The "${CONTENT_GAP_CATEGORIES_ACTION}" node needs input.`;

		expect(buildAssistantMessage({data}).text).toBe(data);
	});

	it('leaves image messages untouched even when the data mentions the action', () => {
		const data = `"${CONTENT_GAP_CATEGORIES_ACTION}"`;

		expect(buildAssistantMessage({data, type: 'image'}).images).toEqual([
			`data:image/png;base64,${data}`,
		]);
	});
});
