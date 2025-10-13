/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {fireEvent, render, screen} from '@testing-library/react';
import React from 'react';

import {HeaderDropdown} from '../../components/Layout/LayoutScreen/HeaderDropdown';

const mockUseLayoutContext = jest.fn();

jest.mock('../../components/Layout/objectLayoutContext', () => ({
	useLayoutContext: () =>
		mockUseLayoutContext() || [
			{
				enableCategorization: true,
				enableFriendlyURLCustomization: true,
				isViewOnly: false,
				objectLayout: {
					objectLayoutTabs: [],
				},
			},
			jest.fn(),
		],
}));

const mockAddCategorization = jest.fn();
const mockAddSeo = jest.fn();
const mockDeleteElement = jest.fn();

function renderHeaderDropdown() {
	const defaultProps = {
		addCategorization: mockAddCategorization,
		addSeo: mockAddSeo,
		deleteElement: mockDeleteElement,
	};

	return render(<HeaderDropdown {...defaultProps} />);
}

const openDropdown = () => {
	const triggerButton = screen.getByRole('button', {
		name: 'more-actions',
	});
	fireEvent.click(triggerButton);
};

describe('HeaderDropdown component', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseLayoutContext.mockClear();
	});

	it('disables "add-categorization" if it already exists in a tab', () => {
		mockUseLayoutContext.mockReturnValue([
			{
				enableCategorization: true,
				enableFriendlyURLCustomization: true,
				isViewOnly: false,
				objectLayout: {
					objectLayoutTabs: [
						{
							objectLayoutBoxes: [{type: 'categorization'}],
						},
					],
				},
			},
			jest.fn(),
		]);

		renderHeaderDropdown();
		openDropdown();

		const categorizationButton = screen.getByRole('menuitem', {
			name: 'add-categorization',
		});

		expect(categorizationButton.hasAttribute('disabled')).toBe(true);
	});

	it('disables "add-seo" if it already exists in a tab', () => {
		mockUseLayoutContext.mockReturnValue([
			{
				enableCategorization: true,
				enableFriendlyURLCustomization: true,
				isViewOnly: false,
				objectLayout: {
					objectLayoutTabs: [
						{
							objectLayoutBoxes: [{type: 'seo'}],
						},
					],
				},
			},
			jest.fn(),
		]);

		renderHeaderDropdown();
		openDropdown();

		const addSeoButton = screen.getByRole('menuitem', {
			name: 'add-seo',
		});

		expect(addSeoButton.hasAttribute('disabled')).toBe(true);
	});

	it('opens the dropdown and renders all available items', async () => {
		renderHeaderDropdown();
		openDropdown();

		const categorizationButton = await screen.findByRole('menuitem', {
			name: 'add-categorization',
		});
		const seoButton = await screen.findByRole('menuitem', {
			name: 'add-seo',
		});
		const deleteButton = await screen.findByRole('menuitem', {
			name: 'delete',
		});

		expect(document.body.contains(categorizationButton)).toBe(true);
		expect(document.body.contains(seoButton)).toBe(true);
		expect(document.body.contains(deleteButton)).toBe(true);
	});
});
