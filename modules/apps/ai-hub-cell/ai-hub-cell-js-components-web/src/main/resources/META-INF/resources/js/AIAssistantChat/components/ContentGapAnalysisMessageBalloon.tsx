/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayButton from '@clayui/button';
import React from 'react';

import AIAssistantMessageBalloon from './AIAssistantMessageBalloon';

import '../chat.scss';

interface ContentGapAnalysisMessageBalloonProps {
	disabled?: boolean;
	feedbackGiven?: boolean;
	message: string;
	onFindMatchingAssets: () => void;
	onGenerateContent: () => void;
	onReport?: () => void;
	onThumbsUp?: () => void;
}

const ContentGapAnalysisMessageBalloon: React.FC<
	ContentGapAnalysisMessageBalloonProps
> = ({
	disabled,
	feedbackGiven,
	message,
	onFindMatchingAssets,
	onGenerateContent,
	onReport,
	onThumbsUp,
}) => {
	return (
		<>
			<AIAssistantMessageBalloon
				error={false}
				feedbackGiven={feedbackGiven}
				message={message}
				onReport={onReport}
				onThumbsUp={onThumbsUp}
			/>

			<div className="ai-assistant-chat__content-gap-analysis-actions">
				<span className="ai-assistant-chat__content-gap-analysis-actions-title">
					{Liferay.Language.get('what-would-you-like-to-do-next')}
				</span>

				<div className="ai-assistant-chat__content-gap-analysis-actions-list">
					<ClayButton
						className="ai-assistant-chat__content-gap-analysis-action"
						disabled={disabled}
						displayType="secondary"
						onClick={onFindMatchingAssets}
						size="sm"
					>
						{Liferay.Language.get('find-matching-assets-in-cms')}
					</ClayButton>

					<ClayButton
						className="ai-assistant-chat__content-gap-analysis-action"
						disabled={disabled}
						displayType="secondary"
						onClick={onGenerateContent}
						size="sm"
					>
						{Liferay.Language.get('generate-content-for-gaps')}
					</ClayButton>
				</div>
			</div>
		</>
	);
};

export default ContentGapAnalysisMessageBalloon;
