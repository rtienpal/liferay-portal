/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayPanel from '@clayui/panel';
import React, {useState} from 'react';

import ScheduleField from './ScheduleField';

import './ScheduleContainer.scss';

type SchedulePropertyKey = 'expirationDate' | 'reviewDate';

interface SchedulePropertyValues {
	value: string;
}

export type ScheduleProperties = {
	[key in SchedulePropertyKey]?: SchedulePropertyValues;
};

interface ScheduleContainerProps {
	portletNamespace: string;
	scheduleProperties: ScheduleProperties;
}

type HiddenValue = {[key in SchedulePropertyKey]: string | null};

export default function ScheduleContainer({
	portletNamespace,
	scheduleProperties,
}: ScheduleContainerProps) {
	const [displayedScheduleValues, setDisplayedScheduleValues] = useState<{
		[key in SchedulePropertyKey]?: SchedulePropertyValues;
	}>({
		expirationDate: {
			value: scheduleProperties.expirationDate?.value ?? '',
		},
		reviewDate: {
			value: scheduleProperties.reviewDate?.value ?? '',
		},
	});

	const [hiddenScheduleValues, setHiddenScheduleValues] =
		useState<HiddenValue>({
			expirationDate: scheduleProperties.expirationDate?.value ?? '',
			reviewDate: scheduleProperties.reviewDate?.value ?? '',
		});

	const handleCheckboxChange = ({
		event,
		property,
	}: {
		event: React.ChangeEvent<HTMLInputElement>;
		property: SchedulePropertyKey;
	}) => {
		const checked = event.target.checked;

		setHiddenScheduleValues((prev) => ({
			...prev,
			[property]: checked
				? null
				: displayedScheduleValues[property]?.value ?? '',
		}));
	};

	console.log('hiddenScheduleValues: ', hiddenScheduleValues);

	return (
		<ClayPanel
			collapsable
			defaultExpanded
			displayTitle={Liferay.Language.get('schedule')}
			displayType="secondary"
		>
			<ClayPanel.Body className="lfr-object__entries-schedule-panel">
				<div className="row">
					<ScheduleField
						checkboxLabel={Liferay.Language.get('never-expire')}
						customValidation={(date) => {
							const currentDateTime = new Date();
							const dateTime = new Date(date);

							if (currentDateTime >= dateTime) {
								return Liferay.Language.get(
									'the-date-entered-is-in-the-past'
								);
							}

							return '';
						}}
						dateLabel={Liferay.Language.get('expiration-date')}
						id={portletNamespace + 'expirationDate'}
						onCheckboxChange={(event) => {
							handleCheckboxChange({
								event,
								property: 'expirationDate',
							});
						}}
						onDateChange={(value: string) => {
							setDisplayedScheduleValues({
								...displayedScheduleValues,
								expirationDate: {
									value,
								},
							});
							setHiddenScheduleValues((prev) => ({
								...prev,
								expirationDate: value,
							}));
						}}
						portletNamespace={portletNamespace}
						value={
							displayedScheduleValues.expirationDate?.value ?? ''
						}
					/>

					<ScheduleField
						checkboxLabel={Liferay.Language.get('never-review')}
						dateLabel={Liferay.Language.get('review-date')}
						id={portletNamespace + 'reviewDate'}
						onCheckboxChange={(event) => {
							handleCheckboxChange({
								event,
								property: 'reviewDate',
							});
						}}
						onDateChange={(value: string) => {
							setDisplayedScheduleValues({
								...displayedScheduleValues,
								reviewDate: {
									value,
								},
							});
							setHiddenScheduleValues((prev) => ({
								...prev,
								reviewDate: value,
							}));
						}}
						portletNamespace={portletNamespace}
						value={displayedScheduleValues.reviewDate?.value ?? ''}
					/>

					<input
						id={portletNamespace + 'scheduleContainer'}
						type="hidden"
						value={JSON.stringify(hiddenScheduleValues)}
					/>
				</div>
			</ClayPanel.Body>
		</ClayPanel>
	);
}
