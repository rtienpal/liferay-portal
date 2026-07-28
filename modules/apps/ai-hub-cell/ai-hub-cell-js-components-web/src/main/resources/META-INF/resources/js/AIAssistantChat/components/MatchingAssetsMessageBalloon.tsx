/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayButton from '@clayui/button';
import ClayIcon from '@clayui/icon';
import ClayLabel from '@clayui/label';
import ClayList from '@clayui/list';
import {sub} from 'frontend-js-web';
import React, {useState} from 'react';

import {MatchingAsset} from '../types';

import '../chat.scss';

const STATUS_DISPLAY_TYPES: Record<string, 'secondary' | 'success'> = {
	approved: 'success',
};

interface MatchingAssetsMessageBalloonProps {
	assets: MatchingAsset[];
	disabled?: boolean;
	sendMessage: (text: string) => void;
}

const MatchingAssetsMessageBalloon: React.FC<
	MatchingAssetsMessageBalloonProps
> = ({assets, disabled, sendMessage}) => {
	const [submitted, setSubmitted] = useState(false);

	function answer(text: string) {
		setSubmitted(true);

		sendMessage(text);
	}

	return (
		<div className="ai-assistant-chat__ai-assistant-message-balloon ai-assistant-chat__content-generation-balloon">
			<div className="ai-assistant-chat__content-generation-balloon-header">
				<ClayIcon spritemap={Liferay.Icons.spritemap} symbol="stars" />

				<span>
					{sub(
						Liferay.Language.get(
							'i-have-scanned-your-library-and-found-x-assets-that-match-some-gaps-of-your-project'
						),
						`${assets.length}`
					)}
				</span>
			</div>

			<ClayList className="ai-assistant-chat__content-generation-balloon-list">
				{assets.map((asset, index) => {
					const category = [asset.persona, asset.funnelStage]
						.filter(Boolean)
						.join(' x ');

					return (
						<ClayList.Item flex key={index}>
							<ClayList.ItemField>
								<span className="ai-assistant-chat__content-generation-balloon-icon">
									<ClayIcon
										spritemap={Liferay.Icons.spritemap}
										symbol="document-text"
									/>
								</span>
							</ClayList.ItemField>

							<ClayList.ItemField expand>
								<ClayList.ItemTitle>
									<a
										href={`/c/cms/edit_content_item?objectEntryId=${asset.id}`}
									>
										{asset.title}
									</a>
								</ClayList.ItemTitle>

								<ClayList.ItemText>
									{asset.status && (
										<ClayLabel
											className="mr-1"
											displayType={
												STATUS_DISPLAY_TYPES[
													asset.status.toLowerCase()
												] ?? 'secondary'
											}
										>
											{asset.status}
										</ClayLabel>
									)}

									{category && (
										<ClayLabel displayType="info">
											{category}
										</ClayLabel>
									)}
								</ClayList.ItemText>

								{asset.reasoning && (
									<ClayList.ItemText className="text-secondary">
										{asset.reasoning}
									</ClayList.ItemText>
								)}
							</ClayList.ItemField>
						</ClayList.Item>
					);
				})}
			</ClayList>

			{!!assets.length && (
				<div className="ai-assistant-chat__content-generation-balloon-form">
					<span>
						{Liferay.Language.get(
							'would-you-like-me-to-add-all-suggested-assets'
						)}
					</span>

					<div className="d-flex justify-content-end">
						<ClayButton
							className="mr-2"
							disabled={disabled || submitted}
							displayType="secondary"
							onClick={() => answer(Liferay.Language.get('no'))}
							size="sm"
						>
							{Liferay.Language.get('no')}
						</ClayButton>

						<ClayButton
							disabled={disabled || submitted}
							displayType="primary"
							onClick={() => answer(Liferay.Language.get('yes'))}
							size="sm"
						>
							{Liferay.Language.get('yes')}
						</ClayButton>
					</div>
				</div>
			)}
		</div>
	);
};

export default MatchingAssetsMessageBalloon;
