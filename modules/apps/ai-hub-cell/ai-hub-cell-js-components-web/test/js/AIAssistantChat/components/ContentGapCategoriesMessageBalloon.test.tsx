/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom';

// eslint-disable-next-line @liferay/portal/no-cross-module-deep-import, @liferay/no-extraneous-dependencies
import {checkAccessibility} from '@liferay/layout-js-components-web/test/__lib__/index';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import ContentGapCategoriesMessageBalloon from '../../../../src/main/resources/META-INF/resources/js/AIAssistantChat/components/ContentGapCategoriesMessageBalloon';

const PERSONAS = [
	{id: 39697, name: 'Decision Maker'},
	{id: 39700, name: 'Champion'},
];
const FUNNEL_STAGES = [
	{id: 39681, name: 'Awareness'},
	{id: 39684, name: 'Consideration'},
];
const TASKS = [
	{id: 'L_CMP_TASK_1955591569', name: 'Task 1'},
	{id: 'L_CMP_TASK_715301579', name: 'Task 2'},
];

function renderBalloon(props = {}) {
	const onSubmit = jest.fn(() => Promise.resolve(true));

	render(
		<ContentGapCategoriesMessageBalloon
			funnelStages={FUNNEL_STAGES}
			message="Select a persona and a funnel stage to find matching assets."
			onSubmit={onSubmit}
			personas={PERSONAS}
			requestTask={false}
			tasks={[]}
			{...props}
		/>
	);

	return onSubmit;
}

describe('ContentGapCategoriesMessageBalloon', () => {
	describe('find matching assets (two dropdowns)', () => {
		it('renders the persona and funnel stage options and no task dropdown', () => {
			renderBalloon();

			expect(screen.getByLabelText('persona')).toBeInTheDocument();
			expect(screen.getByLabelText('funnel-stage')).toBeInTheDocument();
			expect(screen.queryByLabelText('task')).not.toBeInTheDocument();

			expect(
				screen.getByRole('option', {name: 'Decision Maker'})
			).toHaveValue('39697');
			expect(screen.getByRole('option', {name: 'Awareness'})).toHaveValue(
				'39681'
			);
		});

		it('enables confirm only once both dropdowns are selected', async () => {
			renderBalloon();

			const confirmButton = screen.getByRole('button', {name: 'confirm'});

			expect(confirmButton).toBeDisabled();

			await userEvent.selectOptions(
				screen.getByLabelText('persona'),
				'39697'
			);

			expect(confirmButton).toBeDisabled();

			await userEvent.selectOptions(
				screen.getByLabelText('funnel-stage'),
				'39681'
			);

			expect(confirmButton).toBeEnabled();
		});

		it('submits the selected category ids and locks the form on success', async () => {
			const onSubmit = renderBalloon();

			await userEvent.selectOptions(
				screen.getByLabelText('persona'),
				'39697'
			);
			await userEvent.selectOptions(
				screen.getByLabelText('funnel-stage'),
				'39681'
			);
			await userEvent.click(
				screen.getByRole('button', {name: 'confirm'})
			);

			expect(onSubmit).toHaveBeenCalledWith({
				funnelStageId: '39681',
				personaId: '39697',
			});

			await waitFor(() =>
				expect(screen.getByLabelText('persona')).toBeDisabled()
			);
			expect(
				screen.getByRole('button', {name: 'confirm'})
			).toBeDisabled();
		});

		it('re-enables the form when the submission fails', async () => {
			renderBalloon({onSubmit: jest.fn(() => Promise.resolve(false))});

			await userEvent.selectOptions(
				screen.getByLabelText('persona'),
				'39697'
			);
			await userEvent.selectOptions(
				screen.getByLabelText('funnel-stage'),
				'39681'
			);
			await userEvent.click(
				screen.getByRole('button', {name: 'confirm'})
			);

			await waitFor(() =>
				expect(
					screen.getByRole('button', {name: 'confirm'})
				).toBeEnabled()
			);
			expect(screen.getByLabelText('persona')).toBeEnabled();
		});
	});

	describe('generate assets (three dropdowns)', () => {
		it('also renders a task dropdown and requires all three selections', async () => {
			const onSubmit = renderBalloon({requestTask: true, tasks: TASKS});

			expect(screen.getByLabelText('task')).toBeInTheDocument();
			expect(screen.getByRole('option', {name: 'Task 1'})).toHaveValue(
				'L_CMP_TASK_1955591569'
			);

			const confirmButton = screen.getByRole('button', {name: 'confirm'});

			await userEvent.selectOptions(
				screen.getByLabelText('persona'),
				'39697'
			);
			await userEvent.selectOptions(
				screen.getByLabelText('funnel-stage'),
				'39681'
			);

			expect(confirmButton).toBeDisabled();

			await userEvent.selectOptions(
				screen.getByLabelText('task'),
				'L_CMP_TASK_1955591569'
			);

			expect(confirmButton).toBeEnabled();

			await userEvent.click(confirmButton);

			expect(onSubmit).toHaveBeenCalledWith({
				funnelStageId: '39681',
				personaId: '39697',
				task: 'L_CMP_TASK_1955591569',
			});
		});
	});

	describe('empty states', () => {
		it('shows a message and no dropdowns when a category list is empty', () => {
			renderBalloon({personas: []});

			expect(
				screen.getByText('no-personas-or-funnel-stages-were-found')
			).toBeInTheDocument();
			expect(
				screen.queryByLabelText('funnel-stage')
			).not.toBeInTheDocument();
		});

		it('shows a message when a task is required but none are available', () => {
			renderBalloon({requestTask: true, tasks: []});

			expect(
				screen.getByText('no-personas-or-funnel-stages-were-found')
			).toBeInTheDocument();
			expect(screen.queryByLabelText('persona')).not.toBeInTheDocument();
		});
	});

	it('has no accessibility violations', async () => {
		const {container} = render(
			<ContentGapCategoriesMessageBalloon
				funnelStages={FUNNEL_STAGES}
				message="Select a persona and a funnel stage to find matching assets."
				onSubmit={jest.fn(() => Promise.resolve(true))}
				personas={PERSONAS}
				requestTask
				tasks={TASKS}
			/>
		);

		await checkAccessibility({bestPractices: true, context: container});
	});
});
