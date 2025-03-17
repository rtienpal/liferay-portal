/**
 * SPDX-FileCopyrightText: (c) 2024 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {Locator, Page} from '@playwright/test';

export class FormBuilderSidePanelPage {
	readonly addOptionButton: Locator;
	readonly addSelectFromListButton: Locator;
	readonly addSelectOptionButton: Locator;
	readonly addSingleSelectionButton: Locator;
	readonly advancedTab: Locator;
	readonly backButton: Locator;
	readonly closeOptionButton: Locator;
	readonly displayName: Locator;
	readonly htmlAutocompleteAttributeField: Locator;
	readonly label: Locator;
	readonly objectFieldSelect: Locator;
	readonly page: Page;
	readonly paragraphFieldTextarea: Locator;
	readonly paragraphFieldTitle: Locator;
	readonly predefinedValueField: Locator;
	readonly requiredFieldToggleSwitch: Locator;
	readonly saveButton: Locator;

	constructor(page: Page) {
		this.addOptionButton = page.getByRole('button', {
			name: 'Add Option',
		});
		this.addSelectFromListButton = page.getByRole('button', {
			name: 'Press enter to add Select',
		});
		this.addSelectOptionButton = page.getByRole('button', {
			name: 'Add Option',
		});
		this.addSingleSelectionButton = page.getByRole('button', {
			name: 'Press enter to add Single',
		});
		this.advancedTab = page.getByRole('tab', {
			name: 'Advanced',
		});
		this.backButton = page.getByRole('button', {name: 'Back'});
		this.closeOptionButton = page
			.locator('button.close.close-modal')
			.last();
		this.displayName = page.getByLabel('Display Name').last();
		this.htmlAutocompleteAttributeField = page.getByLabel(
			'HTML Autocomplete Attribute'
		);
		this.label = page.getByLabel('Label', {exact: true}).first();
		this.objectFieldSelect = page.getByLabel('Object Field');
		this.page = page;
		this.paragraphFieldTextarea = page
			.frameLocator('iframe')
			.locator('.cke_editable');
		this.paragraphFieldTitle = page.getByPlaceholder('Enter a title.');
		this.predefinedValueField = page.getByLabel('Predefined Value');
		this.requiredFieldToggleSwitch = page.getByText('Required Field');
		this.saveButton = page.getByRole('button', {name: 'Save'});
	}

	async addFieldByDoubleClick(formFieldTypeTitle: FormFieldTypeTitle) {
		await this.page
			.getByTitle(formFieldTypeTitle, {exact: true})
			.dblclick();
	}

	async clickAdvancedTab() {
		await this.advancedTab.click();
	}

	async clickBackButton() {
		await this.backButton.click();
	}

	async createMultipleSelection(options: string[]) {
		await this.addFieldByDoubleClick('Multiple Selection');
		for (const option of options) {
			await this.displayName.fill(option);
			await this.addOptionButton.click();
		}
		await this.closeOptionButton.click();
	}

	async fillMultiplePredefinedValues(values: string[]) {
		for (const value of values) {
			await this.page
				.getByRole('combobox', {name: 'Predefined Value'})
				.click();
			await this.page.getByRole('option', {name: value}).click();
		}
	}

	async fillParagraphField({text}: {text: string}) {
		await this.paragraphFieldTextarea.fill(text);

		// filling is not enough, we need need a key event to make it work

		await this.paragraphFieldTextarea.press('End');

		await this.page.waitForLoadState('networkidle');
	}

	async selectObjectField(objectFieldLabel: string) {
		await this.objectFieldSelect.click();

		const option = this.getSelectOptionLocator(objectFieldLabel);
		await option.click();
	}

	getSelectOptionLocator(optionLabel: string) {
		return this.page.getByRole('option', {name: optionLabel});
	}
}
