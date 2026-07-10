/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

/**
 * Rewrites the `redirect` parameter of `url` to the current browser location.
 *
 * The task action links (edit, view, create) are rendered on the server with
 * `redirect` set to the page URL as it was first loaded. That snapshot predates
 * any client-side view switch, so it never carries the Frontend Data Set `view`
 * parameter. Returning to it after saving a task therefore drops the user back
 * on the default (Table) view instead of the Calendar or Kanban view they were
 * on.
 *
 * Swapping `redirect` for `window.location`, which does carry the current view,
 * keeps the user on the view they started from. URLs without a `redirect`
 * parameter are returned unchanged.
 */
export default function getURLWithCurrentRedirect(url: string): string {
	const nextURL = new URL(url, window.location.href);

	if (nextURL.searchParams.has('redirect')) {
		nextURL.searchParams.set('redirect', window.location.href);
	}

	return nextURL.pathname + nextURL.search + nextURL.hash;
}
