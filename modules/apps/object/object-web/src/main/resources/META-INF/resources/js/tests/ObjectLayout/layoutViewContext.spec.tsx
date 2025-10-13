/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	TAction,
	TState,
	layoutReducer,
} from '../../components/Layout/objectLayoutContext';

describe('viewReducer ADD_OBJECT_LAYOUT_TAB', () => {
	it('can add new layout tab', () => {
		const state = {
			creationLanguageId: 'en_US',
			enableCategorization: true,
			enableFriendlyURLCustomization: true,
			isViewOnly: false,
			objectFieldBusinessTypes: [],
			objectFields: [],
			objectLayout: {
				defaultObjectLayout: false,
				name: {
					en_US: 'layout',
				},
				objectDefinitionExternalReferenceCode: '',
				objectLayoutTabs: [],
			},
			objectLayoutId: '',
			objectRelationships: [],
		} as TState;

		const action = {
			payload: {
				name: {
					en_US: 'tab',
				},
			},
			type: 'ADD_OBJECT_LAYOUT_TAB',
		} as TAction;

		const result = layoutReducer(state, action);

		expect(result.objectLayout.objectLayoutTabs[0].name.en_US).toBe('tab');
	});
});

describe('viewReducer ADD_OBJECT_LAYOUT_BOX', () => {
	it('can add new layout box in correct order', () => {
		const state = {
			creationLanguageId: 'en_US',
			enableCategorization: true,
			enableFriendlyURLCustomization: true,
			isViewOnly: false,
			objectFieldBusinessTypes: [],
			objectFields: [],
			objectLayout: {
				defaultObjectLayout: false,
				name: {
					en_US: 'layout',
				},
				objectDefinitionExternalReferenceCode: '',
				objectLayoutTabs: [
					{
						name: {en_US: 'Main Tab'},
						objectLayoutBoxes: [
							{
								collapsable: false,
								name: {en_US: 'SEO Box'},
								objectLayoutRows: [],
								priority: 0,
								type: 'seo',
							},
						],
						objectRelationshipId: 0,
						priority: 0,
					},
				],
			},
			objectLayoutId: '',
			objectRelationships: [],
		} as TState;

		const tabIndex = 0;

		const addBlock = {
			payload: {
				name: {
					en_US: 'Regular Box',
				},
				tabIndex,
				type: 'regular',
			},
			type: 'ADD_OBJECT_LAYOUT_BOX',
		} as TAction;

		let result = layoutReducer(state, addBlock);

		expect(
			result.objectLayout.objectLayoutTabs[tabIndex].objectLayoutBoxes[0]
				.name.en_US
		).toBe('Regular Box');
		expect(
			result.objectLayout.objectLayoutTabs[tabIndex].objectLayoutBoxes[1]
				.name.en_US
		).toBe('SEO Box');
		expect(
			result.objectLayout.objectLayoutTabs[tabIndex].objectLayoutBoxes
				.length
		).toBe(2);

		const addCategorization = {
			payload: {
				name: {
					en_US: 'Categorization Box',
				},
				tabIndex,
				type: 'categorization',
			},
			type: 'ADD_OBJECT_LAYOUT_BOX',
		} as TAction;

		result = layoutReducer(result, addCategorization);

		const layoutBoxes =
			result.objectLayout.objectLayoutTabs[tabIndex].objectLayoutBoxes;

		expect(layoutBoxes[0].name.en_US).toBe('Regular Box');
		expect(layoutBoxes[1].name.en_US).toBe('Categorization Box');
		expect(layoutBoxes[2].name.en_US).toBe('SEO Box');
		expect(layoutBoxes.length).toBe(3);
	});
});
