/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {sub} from '../../utils/strings';
import {PagesVisitor} from '../../utils/visitors.es';
import {EVENT_TYPES} from '../actions/eventTypes.es';

/**
 * NOTE: This is a literal copy of the old LayoutProvider logic. Small changes
 * were made only to adapt to the reducer.
 */
export default function pageValidationReducer(state, action) {
	switch (action.type) {
		case EVENT_TYPES.PAGE.VALIDATION_FAILED: {
			const {newPages, pageIndex} = action.payload;
			const visitor = new PagesVisitor(newPages ?? state.pages);

			let firstInvalidFieldLabel = null;
			let firstInvalidFieldInput = null;

			const pages = visitor.mapFields(
				(
					field,
					fieldIndex,
					columnIndex,
					rowIndex,
					currentPageIndex
				) => {
					const displayErrors = currentPageIndex === pageIndex;

					if (
						displayErrors &&
						field.errorMessage !== undefined &&
						field.errorMessage !== '' &&
						!field.valid &&
						(firstInvalidFieldLabel === null ||
							firstInvalidFieldLabel === undefined)
					) {
						firstInvalidFieldLabel = field.label;
						firstInvalidFieldInput = document.querySelector(
							`[name='${field.name}']`
						);
					}

					return {
						...field,
						displayErrors,
						pageValidationFailed: true,
					};
				},
				true,
				true
			);

			if (firstInvalidFieldInput) {
				const fieldContainer =
					firstInvalidFieldInput.closest('.ddm-field') ||
					firstInvalidFieldInput.parentElement;

				if (fieldContainer) {
					const richTextHiddenInput = fieldContainer.querySelector(
						'input.ddm-form-field-type__richtext-input--hidden'
					);

					if (richTextHiddenInput) {
						richTextHiddenInput.focus();
					}
					else if (firstInvalidFieldInput.focus) {
						firstInvalidFieldInput.focus();
					}
					else {
						fieldContainer.scrollIntoView();
					}
				}
			}

			return {
				forceAriaUpdate: Date.now(),
				invalidFormMessage: sub(
					Liferay.Language.get('this-form-is-invalid-check-field-x'),
					[firstInvalidFieldLabel]
				),
				pages,
			};
		}
		default:
			return state;
	}
}
