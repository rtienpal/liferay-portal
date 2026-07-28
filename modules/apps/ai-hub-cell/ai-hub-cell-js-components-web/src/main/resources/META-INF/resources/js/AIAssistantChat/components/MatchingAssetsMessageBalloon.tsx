/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayButton from '@clayui/button';
import ClayIcon from '@clayui/icon';
import ClayLabel from '@clayui/label';
import ClayList from '@clayui/list';
import ClayLoadingIndicator from '@clayui/loading-indicator';
import {sub} from 'frontend-js-web';
import React, {useState} from 'react';

import {linkAssetsToProject} from '../services/linkAssetsToProject';
import {MatchingAsset} from '../types';

import '../chat.scss';

const STATUS_DISPLAY_TYPES: Record<string, 'secondary' | 'success'> = {
	approved: 'success',
};

function countDistinct(values: Array<string | undefined>) {
	return new Set(values.filter(Boolean)).size;
}

interface MatchingAssetsMessageBalloonProps {
	assets: MatchingAsset[];
	disabled?: boolean;
	projectId?: number | string;
}

const MatchingAssetsMessageBalloon: React.FC<
	MatchingAssetsMessageBalloonProps
> = ({assets, disabled, projectId}) => {
	const [declined, setDeclined] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [successMessage, setSuccessMessage] = useState('');

	async function handleAddAssets() {
		if (!projectId) {
			Liferay.Util.openToast({
				message: Liferay.Language.get('your-request-failed-to-complete'),
				type: 'danger',
			});

			return;
		}

		setSubmitting(true);

		try {
			const {title} = await linkAssetsToProject({assets, projectId});

			setSuccessMessage(
				sub(
					Liferay.Language.get(
						'i-have-added-all-existing-assets-to-the-x-project-across-x-personas-and-x-funnel-stages'
					),
					title,
					`${countDistinct(assets.map((asset) => asset.persona))}`,
					`${countDistinct(assets.map((asset) => asset.funnelStage))}`
				)
			);
		}
		catch {
			Liferay.Util.openToast({
				message: Liferay.Language.get('your-request-failed-to-complete'),
				type: 'danger',
			});
		}
		finally {
			setSubmitting(false);
		}
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
					{submitting && (
						<div className="ai-assistant-chat__generating-balloon">
							<div className="ai-assistant-chat__generating-balloon-indicator">
								<ClayLoadingIndicator />
							</div>

							<span className="ai-assistant-chat__generating-loading-text">
								{Liferay.Language.get('adding-assets')}
							</span>
						</div>
					)}

					{!submitting && !!successMessage && (
						<span>{successMessage}</span>
					)}

					{!submitting && !successMessage && (
						<>
							<span>
								{Liferay.Language.get(
									'would-you-like-me-to-add-all-suggested-assets'
								)}
							</span>

							<div className="d-flex justify-content-end">
								<ClayButton
									className="mr-2"
									disabled={declined || disabled}
									displayType="secondary"
									onClick={() => setDeclined(true)}
									size="sm"
								>
									{Liferay.Language.get('no')}
								</ClayButton>

								<ClayButton
									disabled={declined || disabled}
									displayType="primary"
									onClick={handleAddAssets}
									size="sm"
								>
									{Liferay.Language.get('yes')}
								</ClayButton>
							</div>
						</>
					)}
				</div>
			)}
		</div>
	);
};

export default MatchingAssetsMessageBalloon;
