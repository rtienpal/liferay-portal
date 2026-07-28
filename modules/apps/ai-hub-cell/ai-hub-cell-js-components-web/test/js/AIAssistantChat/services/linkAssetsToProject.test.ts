/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {fetch} from 'frontend-js-web';

import {linkAssetsToProject} from '../../../../src/main/resources/META-INF/resources/js/AIAssistantChat/services/linkAssetsToProject';

jest.mock('frontend-js-web', () => ({fetch: jest.fn()}));

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

const ASSETS = [
	{
		classExternalReferenceCode: 'ASSET_ERC_1',
		className: 'com.liferay.object.model.ObjectDefinition#123',
		groupExternalReferenceCode: 'GROUP_ERC',
		id: 101,
		title: 'Vendor evaluation checklist',
	},
	{
		classExternalReferenceCode: 'ASSET_ERC_2',
		className: 'com.liferay.object.model.ObjectDefinition#123',
		groupExternalReferenceCode: 'GROUP_ERC',
		id: 102,
		title: 'Why Operations Teams Choose Liferay',
	},
];

function response(body: object, ok = true) {
	return {
		json: () => Promise.resolve(body),
		ok,
		statusText: 'Bad Request',
	};
}

describe('linkAssetsToProject', () => {
	beforeEach(() => {
		mockFetch.mockReset();
	});

	it('posts a project link for every asset into the project scope', async () => {
		mockFetch.mockResolvedValueOnce(
			response({
				scopeKey: 'YTzxGyCJ',
				title: 'EuroRoad Construction',
			}) as never
		);
		mockFetch.mockResolvedValue(response({}) as never);

		await expect(
			linkAssetsToProject({assets: ASSETS, projectId: 77})
		).resolves.toEqual({title: 'EuroRoad Construction'});

		expect(mockFetch).toHaveBeenCalledTimes(3);
		expect(mockFetch.mock.calls[0][0]).toBe('/o/cmp/projects/77');

		const [url, init] = mockFetch.mock.calls[1];

		expect(url).toBe('/o/cmp/project-links/scopes/YTzxGyCJ');
		expect((init as RequestInit).method).toBe('POST');
		expect(JSON.parse((init as RequestInit).body as string)).toEqual({
			classExternalReferenceCode: 'ASSET_ERC_1',
			className: 'com.liferay.object.model.ObjectDefinition#123',
			groupExternalReferenceCode: 'GROUP_ERC',
		});
		expect(mockFetch.mock.calls[2][0]).toBe(
			'/o/cmp/project-links/scopes/YTzxGyCJ'
		);
	});

	it('throws when the project cannot be loaded', async () => {
		mockFetch.mockResolvedValue(response({}, false) as never);

		await expect(
			linkAssetsToProject({assets: ASSETS, projectId: 77})
		).rejects.toThrow();

		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it('throws when the project has no scope key', async () => {
		mockFetch.mockResolvedValue(response({}) as never);

		await expect(
			linkAssetsToProject({assets: ASSETS, projectId: 77})
		).rejects.toThrow();

		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it('throws when a link cannot be created', async () => {
		mockFetch.mockResolvedValueOnce(
			response({scopeKey: 'YTzxGyCJ'}) as never
		);
		mockFetch.mockResolvedValueOnce(response({}) as never);
		mockFetch.mockResolvedValue(response({}, false) as never);

		await expect(
			linkAssetsToProject({assets: ASSETS, projectId: 77})
		).rejects.toThrow();
	});
});
