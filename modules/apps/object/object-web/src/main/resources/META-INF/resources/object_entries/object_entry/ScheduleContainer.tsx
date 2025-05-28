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
	checked: boolean;
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
		[key in SchedulePropertyKey]: SchedulePropertyValues;
	}>({
		expirationDate: {
			checked: scheduleProperties.expirationDate?.checked ?? true,
			value: scheduleProperties.expirationDate?.value ?? '',
		},
		reviewDate: {
			checked: scheduleProperties.reviewDate?.checked ?? true,
			value: scheduleProperties.reviewDate?.value ?? '',
		},
	});

	const [hiddenScheduleValues, setHiddenScheduleValues] =
		useState<HiddenValue>({
			expirationDate: scheduleProperties.expirationDate?.value ?? null,
			reviewDate: scheduleProperties.reviewDate?.value ?? null,
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
				: displayedScheduleValues[property].value,
		}));
	};

	interface ScheduleFieldProps {
		checkboxLabel: string;
		customValidation?: (date: string) => string;
		dateLabel: string;
		schedulePropertyKey: SchedulePropertyKey;
	}

	const SchedulePropertiesProps: ScheduleFieldProps[] = [
		{
			checkboxLabel: Liferay.Language.get('never-expire'),
			customValidation: (date: string) => {
				const currentDateTime = new Date();
				const dateTime = new Date(date);

				if (currentDateTime >= dateTime) {
					return Liferay.Language.get(
						'the-date-entered-is-in-the-past'
					);
				}

				return '';
			},
			dateLabel: Liferay.Language.get('expiration-date'),
			schedulePropertyKey: 'expirationDate',
		},
		{
			checkboxLabel: Liferay.Language.get('never-review'),
			dateLabel: Liferay.Language.get('review-date'),
			schedulePropertyKey: 'reviewDate',
		},
	];

	return (
		<ClayPanel
			collapsable
			defaultExpanded
			displayTitle={Liferay.Language.get('schedule')}
			displayType="secondary"
		>
			<ClayPanel.Body className="lfr-object__entries-schedule-panel">
				<div className="row">
					{SchedulePropertiesProps.map(
						({
							checkboxLabel,
							customValidation,
							dateLabel,
							schedulePropertyKey,
						}) => (
							<ScheduleField
								checkboxLabel={checkboxLabel}
								customValidation={customValidation}
								dateLabel={dateLabel}
								id={`portletNamespace + ${schedulePropertyKey}`}
								key={schedulePropertyKey}
								onCheckboxChange={(
									event: React.ChangeEvent<HTMLInputElement>
								) => {
									handleCheckboxChange({
										event,
										property: schedulePropertyKey,
									});
								}}
								onDateChange={(value: string) => {
									setDisplayedScheduleValues({
										...displayedScheduleValues,
										[schedulePropertyKey]: {
											checked:
												displayedScheduleValues[
													schedulePropertyKey
												].checked,
											value,
										},
									});
									setHiddenScheduleValues((prev) => ({
										...prev,
										[schedulePropertyKey]: value,
									}));
								}}
								portletNamespace={portletNamespace}
								value={
									displayedScheduleValues[schedulePropertyKey]
										?.value ?? ''
								}
							/>
						)
					)}

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
