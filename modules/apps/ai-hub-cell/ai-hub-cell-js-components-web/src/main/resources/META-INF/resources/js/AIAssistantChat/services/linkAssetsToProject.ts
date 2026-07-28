/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {fetch} from 'frontend-js-web';

import {MatchingAsset} from '../types';

export async function linkAssetsToProject({
	assets,
	projectId,
}: {
	assets: MatchingAsset[];
	projectId: number | string;
}): Promise<{title: string}> {
	const response = await fetch(`/o/cmp/projects/${projectId}`, {
		headers: new Headers({Accept: 'application/json'}),
	});

	if (!response.ok) {
		throw new Error(`Unable to load the project: ${response.statusText}`);
	}

	const {scopeKey, title} = await response.json();

	if (!scopeKey) {
		throw new Error('Unable to resolve the project scope.');
	}

	const responses = await Promise.all(
		assets.map((asset) =>
			fetch(`/o/cmp/project-links/scopes/${scopeKey}`, {
				body: JSON.stringify({
					classExternalReferenceCode:
						asset.classExternalReferenceCode,
					className: asset.className,
					groupExternalReferenceCode:
						asset.groupExternalReferenceCode,
				}),
				headers: new Headers({
					'Accept': 'application/json',
					'Content-Type': 'application/json',
				}),
				method: 'POST',
			})
		)
	);

	const failedResponses = responses.filter((response) => !response.ok);

	if (failedResponses.length) {
		throw new Error(
			`Unable to link ${failedResponses.length} assets to the project.`
		);
	}

	return {title: title ?? ''};
}
