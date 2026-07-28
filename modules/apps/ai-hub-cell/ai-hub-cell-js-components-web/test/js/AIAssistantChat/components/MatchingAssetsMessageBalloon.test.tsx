/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {act, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import '@testing-library/jest-dom';

import MatchingAssetsMessageBalloon from '../../../../src/main/resources/META-INF/resources/js/AIAssistantChat/components/MatchingAssetsMessageBalloon';
import {linkAssetsToProject} from '../../../../src/main/resources/META-INF/resources/js/AIAssistantChat/services/linkAssetsToProject';

jest.mock(
	'../../../../src/main/resources/META-INF/resources/js/AIAssistantChat/services/linkAssetsToProject',
	() => ({linkAssetsToProject: jest.fn()})
);

const mockLinkAssetsToProject = linkAssetsToProject as jest.MockedFunction<
	typeof linkAssetsToProject
>;

const SUCCESS_MESSAGE_KEY =
	'i-have-added-all-existing-assets-to-the-x-project-across-x-personas-and-x-funnel-stages';

const ASSETS = [
	{
		classExternalReferenceCode: 'ASSET_ERC_1',
		className: 'com.liferay.object.model.ObjectDefinition#123',
		funnelStage: 'Awareness',
		groupExternalReferenceCode: 'GROUP_ERC',
		id: 101,
		persona: 'Procurement',
		reasoning: 'Covers the same buying stage.',
		status: 'Approved',
		title: 'Vendor evaluation checklist',
	},
	{
		classExternalReferenceCode: 'ASSET_ERC_2',
		className: 'com.liferay.object.model.ObjectDefinition#123',
		funnelStage: 'Decision',
		groupExternalReferenceCode: 'GROUP_ERC',
		id: 102,
		persona: 'Procurement',
		reasoning: 'Targets the same persona.',
		status: 'Draft',
		title: 'Why Operations Teams Choose Liferay',
	},
];

describe('MatchingAssetsMessageBalloon', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders each matched asset as a link to its content edit page', () => {
		render(<MatchingAssetsMessageBalloon assets={ASSETS} projectId={77} />);

		expect(
			screen.getByRole('link', {name: 'Vendor evaluation checklist'})
		).toHaveAttribute('href', '/c/cms/edit_content_item?objectEntryId=101');
		expect(
			screen.getByRole('link', {name: 'Why Operations Teams Choose Liferay'})
		).toHaveAttribute('href', '/c/cms/edit_content_item?objectEntryId=102');
	});

	it('renders the status and the persona and funnel stage of each asset', () => {
		render(<MatchingAssetsMessageBalloon assets={ASSETS} projectId={77} />);

		expect(screen.getByText('Approved')).toBeInTheDocument();
		expect(screen.getByText('Draft')).toBeInTheDocument();
		expect(screen.getByText('Procurement x Awareness')).toBeInTheDocument();
		expect(screen.getByText('Procurement x Decision')).toBeInTheDocument();
	});

	it('shows the adding assets indicator while the linking is in flight', async () => {
		let resolveLink: (value: {title: string}) => void = () => {};

		mockLinkAssetsToProject.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveLink = resolve;
				})
		);

		render(<MatchingAssetsMessageBalloon assets={ASSETS} projectId={77} />);

		await userEvent.click(screen.getByRole('button', {name: 'yes'}));

		expect(screen.getByText('adding-assets')).toBeInTheDocument();
		expect(screen.queryByRole('button', {name: 'yes'})).toBeNull();
		expect(screen.queryByRole('button', {name: 'no'})).toBeNull();

		await act(async () => {
			resolveLink({title: 'EuroRoad Construction'});
		});

		expect(screen.getByText(SUCCESS_MESSAGE_KEY)).toBeInTheDocument();
	});

	it('links the assets and shows the confirmation message when the user confirms', async () => {
		mockLinkAssetsToProject.mockResolvedValue({
			title: 'EuroRoad Construction',
		});

		render(<MatchingAssetsMessageBalloon assets={ASSETS} projectId={77} />);

		await userEvent.click(screen.getByRole('button', {name: 'yes'}));

		expect(mockLinkAssetsToProject).toHaveBeenCalledWith({
			assets: ASSETS,
			projectId: 77,
		});

		expect(
			await screen.findByText(SUCCESS_MESSAGE_KEY)
		).toBeInTheDocument();
		expect(screen.queryByRole('button', {name: 'yes'})).toBeNull();
		expect(
			screen.queryByText('would-you-like-me-to-add-all-suggested-assets')
		).toBeNull();
	});

	it('shows an error and keeps the buttons enabled when the linking fails', async () => {
		mockLinkAssetsToProject.mockRejectedValue(new Error('nope'));

		render(<MatchingAssetsMessageBalloon assets={ASSETS} projectId={77} />);

		await userEvent.click(screen.getByRole('button', {name: 'yes'}));

		await waitFor(() =>
			expect(Liferay.Util.openToast).toHaveBeenCalledWith(
				expect.objectContaining({type: 'danger'})
			)
		);

		expect(screen.getByRole('button', {name: 'yes'})).toBeEnabled();
	});

	it('shows an error without linking when no project is in the context', async () => {
		render(<MatchingAssetsMessageBalloon assets={ASSETS} />);

		await userEvent.click(screen.getByRole('button', {name: 'yes'}));

		expect(mockLinkAssetsToProject).not.toHaveBeenCalled();
		expect(Liferay.Util.openToast).toHaveBeenCalledWith(
			expect.objectContaining({type: 'danger'})
		);
	});

	it('disables both buttons when the user declines', async () => {
		render(<MatchingAssetsMessageBalloon assets={ASSETS} projectId={77} />);

		await userEvent.click(screen.getByRole('button', {name: 'no'}));

		expect(screen.getByRole('button', {name: 'no'})).toBeDisabled();
		expect(screen.getByRole('button', {name: 'yes'})).toBeDisabled();
		expect(mockLinkAssetsToProject).not.toHaveBeenCalled();
	});

	it('hides the confirmation question when no assets matched', () => {
		render(<MatchingAssetsMessageBalloon assets={[]} projectId={77} />);

		expect(
			screen.queryByText('would-you-like-me-to-add-all-suggested-assets')
		).toBeNull();
	});
});
