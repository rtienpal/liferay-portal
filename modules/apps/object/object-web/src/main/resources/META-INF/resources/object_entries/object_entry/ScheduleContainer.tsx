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
		[key in SchedulePropertyKey]?: SchedulePropertyValues;
	}>({
		expirationDate: {
			checked: scheduleProperties.expirationDate?.checked ?? false,
			value: scheduleProperties.expirationDate?.value ?? '',
		},
		reviewDate: {
			checked: scheduleProperties.reviewDate?.checked ?? false,
			value: scheduleProperties.reviewDate?.value ?? '',
		},
	});

	console.log(displayedScheduleValues);

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

	interface ScheduleFieldProps {
		checkboxLabel: string;
		customValidation?: (date: string) => string;
		dateLabel: string;
		id: string;
		isChecked: boolean;
		onCheckboxChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
		onDateChange: (value: string) => void;
		portletNamespace: string;
		value: string;
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
			id: portletNamespace + 'expirationDate',
			isChecked: displayedScheduleValues.expirationDate?.checked ?? true,
			onCheckboxChange: (event: React.ChangeEvent<HTMLInputElement>) => {
				handleCheckboxChange({
					event,
					property: 'expirationDate',
				});
			},
			onDateChange: (value: string) => {
				setDisplayedScheduleValues({
					...displayedScheduleValues,
					expirationDate: {
						checked: value === '',
						value,
					},
				});
				setHiddenScheduleValues((prev) => ({
					...prev,
					expirationDate: value,
				}));
			},
			portletNamespace,
			value: displayedScheduleValues.expirationDate?.value ?? '',
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
							id,
							isChecked,
							onCheckboxChange,
							onDateChange,
							portletNamespace,
							value,
						}) => (
							<ScheduleField
								checkboxLabel={checkboxLabel}
								customValidation={customValidation}
								dateLabel={dateLabel}
								id={id}
								isChecked={isChecked}
								key={id}
								onCheckboxChange={onCheckboxChange}
								onDateChange={onDateChange}
								portletNamespace={portletNamespace}
								value={value}
							/>
						)
					)}

					{/* Uncomment if you want to add the review date field */}

					{/* <ScheduleField
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
						isChecked={
							displayedScheduleValues.expirationDate?.checked ??
							true
						}
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
									...scheduleProperties.expirationDate,
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
					/> */}

					{/* {Object.entries(displayedScheduleValues).map(([key]) => (
						<ScheduleField
							checkboxLabel={
								key === 'expirationDate'
									? Liferay.Language.get('never-expire')
									: Liferay.Language.get('never-review')
							}
							customValidation={
								key === 'expirationDate'
									? (date) => {
											const currentDateTime = new Date();
											const dateTime = new Date(date);

											if (currentDateTime >= dateTime) {
												return Liferay.Language.get(
													'the-date-entered-is-in-the-past'
												);
											}

											return '';
										}
									: undefined
							}
							dateLabel={
								key === 'expirationDate'
									? Liferay.Language.get('expiration-date')
									: Liferay.Language.get('review-date')
							}
							id={portletNamespace + key}
							key={key}
							onCheckboxChange={(event) => {
								handleCheckboxChange({
									event,
									property: key as SchedulePropertyKey,
								});
							}}
							onDateChange={(value: string) => {
								setDisplayedScheduleValues({
									...displayedScheduleValues,
									[key]: {
										value,
									},
								});
								setHiddenScheduleValues((prev) => ({
									...prev,
									[key]: value,
								}));
							}}
							portletNamespace={portletNamespace}
							value={
								displayedScheduleValues[
									key as SchedulePropertyKey
								]?.value ?? ''
							}
						/>
					))} */}

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
