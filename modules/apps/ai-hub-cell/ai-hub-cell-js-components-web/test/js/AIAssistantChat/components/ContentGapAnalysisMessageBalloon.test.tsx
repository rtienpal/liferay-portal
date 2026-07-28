/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import '@testing-library/jest-dom';

import ContentGapAnalysisMessageBalloon from '../../../../src/main/resources/META-INF/resources/js/AIAssistantChat/components/ContentGapAnalysisMessageBalloon';

describe('ContentGapAnalysisMessageBalloon', () => {
	it('renders the analysis and the next step actions', () => {
		render(
			<ContentGapAnalysisMessageBalloon
				message="One gap to address."
				onFindMatchingAssets={jest.fn()}
				onGenerateContent={jest.fn()}
			/>
		);

		expect(screen.getByText('One gap to address.')).toBeInTheDocument();
		expect(
			screen.getByText('what-would-you-like-to-do-next')
		).toBeInTheDocument();
	});

	it('notifies when the user asks to find matching assets', async () => {
		const onFindMatchingAssets = jest.fn();

		render(
			<ContentGapAnalysisMessageBalloon
				message="One gap to address."
				onFindMatchingAssets={onFindMatchingAssets}
				onGenerateContent={jest.fn()}
			/>
		);

		await userEvent.click(
			screen.getByRole('button', {name: 'find-matching-assets-in-cms'})
		);

		expect(onFindMatchingAssets).toHaveBeenCalled();
	});

	it('notifies when the user asks to generate content', async () => {
		const onGenerateContent = jest.fn();

		render(
			<ContentGapAnalysisMessageBalloon
				message="One gap to address."
				onFindMatchingAssets={jest.fn()}
				onGenerateContent={onGenerateContent}
			/>
		);

		await userEvent.click(
			screen.getByRole('button', {name: 'generate-content-for-gaps'})
		);

		expect(onGenerateContent).toHaveBeenCalled();
	});

	it('disables the actions while a message is generating', () => {
		render(
			<ContentGapAnalysisMessageBalloon
				disabled
				message="One gap to address."
				onFindMatchingAssets={jest.fn()}
				onGenerateContent={jest.fn()}
			/>
		);

		expect(
			screen.getByRole('button', {name: 'find-matching-assets-in-cms'})
		).toBeDisabled();
		expect(
			screen.getByRole('button', {name: 'generate-content-for-gaps'})
		).toBeDisabled();
	});
});
