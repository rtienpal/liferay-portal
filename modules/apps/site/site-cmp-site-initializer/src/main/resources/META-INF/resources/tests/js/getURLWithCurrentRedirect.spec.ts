/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import getURLWithCurrentRedirect from '../../js/utils/getURLWithCurrentRedirect';

describe('getURLWithCurrentRedirect', () => {
	afterEach(() => {
		window.history.replaceState({}, '', '/');
	});

	it('repoints the redirect parameter to the current location', () => {
		window.history.replaceState(
			{},
			'',
			'/web/cms/tasks?PROJECT_TASKS_fdsConfig=(view:kanban)'
		);

		const result = getURLWithCurrentRedirect(
			'/web/cms/e/edit-task/123/42?redirect=http://localhost/web/cms/tasks'
		);

		expect(
			new URL(result, window.location.origin).searchParams.get('redirect')
		).toBe(window.location.href);
	});

	it('preserves the other parameters when repointing the redirect', () => {
		window.history.replaceState(
			{},
			'',
			'/web/cms/tasks?PROJECT_TASKS_fdsConfig=(view:calendar)'
		);

		const result = getURLWithCurrentRedirect(
			'http://localhost/web/cms/add_task?objectDefinitionId=1&projectId=2&redirect=http://localhost/web/cms/tasks'
		);

		const searchParams = new URL(result, window.location.origin)
			.searchParams;

		expect(searchParams.get('objectDefinitionId')).toBe('1');
		expect(searchParams.get('projectId')).toBe('2');
		expect(searchParams.get('redirect')).toBe(window.location.href);
	});

	it('leaves a URL without a redirect parameter unchanged', () => {
		expect(getURLWithCurrentRedirect('/web/cms/tasks?view=kanban')).toBe(
			'/web/cms/tasks?view=kanban'
		);
	});
});
