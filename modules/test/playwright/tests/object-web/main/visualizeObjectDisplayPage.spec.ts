/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {expect, mergeTests} from '@playwright/test';

import {apiHelpersTest} from '../../../fixtures/apiHelpersTest';
import {dataApiHelpersTest} from '../../../fixtures/dataApiHelpersTest';
import {displayPageTemplatesPagesTest} from '../../../fixtures/displayPageTemplatesPagesTest';
import {featureFlagsTest} from '../../../fixtures/featureFlagsTest';
import {isolatedSiteTest} from '../../../fixtures/isolatedSiteTest';
import {loginTest} from '../../../fixtures/loginTest';
import {objectPagesTest} from '../../../fixtures/objectPagesTest';
import {pageEditorPagesTest} from '../../../fixtures/pageEditorPagesTest';
import {getRandomInt} from '../../../utils/getRandomInt';
import getRandomString from '../../../utils/getRandomString';
import getPageDefinition from '../../layout-content-page-editor-web/main/utils/getPageDefinition';
import {generateObjectFields} from '../utils/generateObjectFields';

const test = mergeTests(
	apiHelpersTest,
	dataApiHelpersTest,
	displayPageTemplatesPagesTest,
	featureFlagsTest({
		'LPS-178052': {enabled: true},
	}),
	isolatedSiteTest,
	loginTest(),
	objectPagesTest,
	pageEditorPagesTest
);

test(
	'Can view image user profile from specific entry on display page',
	{tag: '@LPD-86436'},
	async ({
		apiHelpers,
		page,
		pageEditorPage,
		site,
	}) => {
		// Corresponds to Poshi test: ViewImageUserProfileFromSpecificEntry

		const objectFields = generateObjectFields({
			objectFieldBusinessTypes: ['Text'],
		});

		const objectDefinition =
			await apiHelpers.objectAdmin.postRandomObjectDefinition({
				objectFields,
				status: {code: 0},
			});

		apiHelpers.data.push({
			id: objectDefinition.id,
			type: 'objectDefinition',
		});

		const applicationName =
			'c/' + objectDefinition.name!.toLowerCase() + 's';
		const textFieldName = objectFields[0].name;

		const entryValue = 'TestEntry_' + getRandomInt();

		const objectEntry = await apiHelpers.objectEntry.postObjectEntry(
			{[textFieldName]: entryValue},
			applicationName
		);

		const layout = await apiHelpers.headlessDelivery.createSitePage({
			pageDefinition: getPageDefinition(),
			siteId: site.id,
			title: getRandomString(),
		});

		await test.step('Add Image fragment and map to User Profile Image', async () => {
			await pageEditorPage.goto(layout, site.friendlyUrlPath);

			await pageEditorPage.addFragment('Basic Components', 'Image');

			const imageId = await pageEditorPage.getFragmentId('Image');

			await pageEditorPage.selectEditable(imageId, 'image-square');

			await page.getByLabel('Source Selection').selectOption('Mapping');

			await pageEditorPage.setMappedItem({
				entity: objectDefinition.label['en_US'],
				entry: objectEntry.id.toString(),
				entryLocator: page
					.frameLocator('iframe[title="Select"]')
					.getByText(objectEntry.id.toString())
					.first(),
				field: 'User Profile Image',
			});

			await pageEditorPage.waitForChangesSaved();
		});

		await test.step('Publish and verify user profile image is visible', async () => {
			await pageEditorPage.publishPage();

			await page.goto(
				`/web${site.friendlyUrlPath}${layout.friendlyUrlPath}`
			);

			await expect(
				page.locator(
					'[data-lfr-editable-id="image-square"] img, img[data-lfr-editable-id="image-square"]'
				)
			).toBeVisible();
		});
	}
);
