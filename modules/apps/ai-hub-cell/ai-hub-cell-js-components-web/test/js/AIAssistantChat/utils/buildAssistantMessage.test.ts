/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

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

	it('keeps action payloads as plain text for the chat body to parse', () => {
		const data = JSON.stringify({
			action: 'requestContentGapCategories',
			agentInstanceId: '41070',
		});

		expect(buildAssistantMessage({data})).toEqual({
			agentDefinitionExternalReferenceCodes: [],
			sender: 'assistant',
			text: data,
		});
	});
});
