/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import '@testing-library/jest-dom';

import MatchingAssetsMessageBalloon from '../../../../src/main/resources/META-INF/resources/js/AIAssistantChat/components/MatchingAssetsMessageBalloon';

const ASSETS = [
	{
		funnelStage: 'Awareness',
		id: 101,
		persona: 'Procurement',
		reasoning: 'Covers the same buying stage.',
		status: 'Approved',
		title: 'Vendor evaluation checklist',
	},
	{
		funnelStage: 'Decision',
		id: 102,
		persona: 'Procurement',
		reasoning: 'Targets the same persona.',
		status: 'Draft',
		title: 'Why Operations Teams Choose Liferay',
	},
];

describe('MatchingAssetsMessageBalloon', () => {
	it('renders each matched asset as a link to its content edit page', () => {
		render(
			<MatchingAssetsMessageBalloon
				assets={ASSETS}
				sendMessage={jest.fn()}
			/>
		);

		expect(
			screen.getByRole('link', {name: 'Vendor evaluation checklist'})
		).toHaveAttribute('href', '/c/cms/edit_content_item?objectEntryId=101');
		expect(
			screen.getByRole('link', {name: 'Why Operations Teams Choose Liferay'})
		).toHaveAttribute('href', '/c/cms/edit_content_item?objectEntryId=102');
	});

	it('renders the status and the persona and funnel stage of each asset', () => {
		render(
			<MatchingAssetsMessageBalloon
				assets={ASSETS}
				sendMessage={jest.fn()}
			/>
		);

		expect(screen.getByText('Approved')).toBeInTheDocument();
		expect(screen.getByText('Draft')).toBeInTheDocument();
		expect(screen.getByText('Procurement x Awareness')).toBeInTheDocument();
		expect(screen.getByText('Procurement x Decision')).toBeInTheDocument();
	});

	it('sends a yes message and disables the buttons when the user confirms', async () => {
		const sendMessage = jest.fn();

		render(
			<MatchingAssetsMessageBalloon
				assets={ASSETS}
				sendMessage={sendMessage}
			/>
		);

		await userEvent.click(screen.getByRole('button', {name: 'yes'}));

		expect(sendMessage).toHaveBeenCalledWith('yes');
		expect(screen.getByRole('button', {name: 'yes'})).toBeDisabled();
		expect(screen.getByRole('button', {name: 'no'})).toBeDisabled();
	});

	it('sends a no message when the user declines', async () => {
		const sendMessage = jest.fn();

		render(
			<MatchingAssetsMessageBalloon
				assets={ASSETS}
				sendMessage={sendMessage}
			/>
		);

		await userEvent.click(screen.getByRole('button', {name: 'no'}));

		expect(sendMessage).toHaveBeenCalledWith('no');
	});

	it('hides the confirmation question when no assets matched', () => {
		render(
			<MatchingAssetsMessageBalloon assets={[]} sendMessage={jest.fn()} />
		);

		expect(
			screen.queryByText('would-you-like-me-to-add-all-suggested-assets')
		).toBeNull();
	});
});
