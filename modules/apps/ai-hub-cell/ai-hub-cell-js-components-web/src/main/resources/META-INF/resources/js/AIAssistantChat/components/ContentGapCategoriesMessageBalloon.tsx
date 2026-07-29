/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayButton from '@clayui/button';
import ClayForm, {ClaySelectWithOption} from '@clayui/form';
import ClayIcon from '@clayui/icon';
import React, {useId, useState} from 'react';

import {ContentGapCategory} from '../types';

import '../chat.scss';

export interface ContentGapCategoriesSelection {
	funnelStageId: string;
	personaId: string;
}

interface ContentGapCategoriesMessageBalloonProps {
	funnelStages: ContentGapCategory[];
	message: string;
	onSubmit: (selection: ContentGapCategoriesSelection) => Promise<boolean>;
	personas: ContentGapCategory[];
}

function toOptions(items: ContentGapCategory[], placeholder: string) {
	return [
		{disabled: true, label: placeholder, value: ''},
		...items.map((item) => ({label: item.name, value: String(item.id)})),
	];
}

const ContentGapCategoriesMessageBalloon: React.FC<
	ContentGapCategoriesMessageBalloonProps
> = ({funnelStages, message, onSubmit, personas}) => {
	const [funnelStageId, setFunnelStageId] = useState('');
	const [personaId, setPersonaId] = useState('');
	const [submitted, setSubmitted] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const funnelStageSelectId = useId();
	const personaSelectId = useId();

	const missingOptions = !personas.length || !funnelStages.length;

	const complete = Boolean(personaId) && Boolean(funnelStageId);

	async function handleSubmit() {
		setSubmitting(true);

		const success = await onSubmit({funnelStageId, personaId});

		setSubmitting(false);

		setSubmitted(success);
	}

	return (
		<div className="ai-assistant-chat__ai-assistant-message-balloon ai-assistant-chat__content-generation-balloon">
			<div className="ai-assistant-chat__content-generation-balloon-header">
				<ClayIcon spritemap={Liferay.Icons.spritemap} symbol="stars" />

				<span>{message}</span>
			</div>

			<div className="ai-assistant-chat__content-generation-balloon-form">
				{missingOptions ? (
					<span>
						{Liferay.Language.get(
							'no-personas-or-funnel-stages-were-found'
						)}
					</span>
				) : (
					<>
						<ClayForm.Group>
							<label htmlFor={personaSelectId}>
								{Liferay.Language.get('persona')}
							</label>

							<ClaySelectWithOption
								disabled={submitted || submitting}
								id={personaSelectId}
								onChange={(event) =>
									setPersonaId(event.target.value)
								}
								options={toOptions(
									personas,
									Liferay.Language.get('choose-a-persona')
								)}
								value={personaId}
							/>
						</ClayForm.Group>

						<ClayForm.Group>
							<label htmlFor={funnelStageSelectId}>
								{Liferay.Language.get('funnel-stage')}
							</label>

							<ClaySelectWithOption
								disabled={submitted || submitting}
								id={funnelStageSelectId}
								onChange={(event) =>
									setFunnelStageId(event.target.value)
								}
								options={toOptions(
									funnelStages,
									Liferay.Language.get(
										'choose-a-funnel-stage'
									)
								)}
								value={funnelStageId}
							/>
						</ClayForm.Group>

						<ClayButton
							disabled={!complete || submitted || submitting}
							displayType="primary"
							onClick={handleSubmit}
							size="sm"
						>
							{Liferay.Language.get('confirm')}
						</ClayButton>
					</>
				)}
			</div>
		</div>
	);
};

export default ContentGapCategoriesMessageBalloon;
