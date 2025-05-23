/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ObjectField} from '@liferay/object-admin-rest-client-js';
import {getRandomInt} from '../../../../utils/getRandomInt';

function getObjectFieldBaseProperties() {
	return {
		indexedAsKeyword: false,
		indexedLanguageId: '',
		localized: false,
		readOnly: 'false' as ObjectField['readOnly'],
		readOnlyConditionExpression: '',
		required: false,
		state: false,
		system: false,
		unique: false,
	};
}

type SupportedObjectFieldBusinessType = Exclude<ObjectField['businessType'], 'Aggregation' | 'Formula'>;

function getObjectFieldSpecificProperties(
	objectFieldBusinessType: SupportedObjectFieldBusinessType,
	listTypeDefinitionExternalReferenceCode: string
): {
	['DBType']: ObjectField['DBType'];
	['businessType']: ObjectField['businessType'];
	['listTypeDefinitionExternalReferenceCode']?: ObjectField['listTypeDefinitionExternalReferenceCode'];
	['objectFieldSettings']?: any;
	['type']: ObjectField['type'];
} {
	switch (objectFieldBusinessType) {
		case 'Attachment':
			return {
				DBType: 'Long',
				businessType: 'Attachment',
				objectFieldSettings: [
					{
						name: 'acceptedFileExtensions',
						value: 'jpeg, jpg, pdf, png',
					},
					{
						name: 'fileSource',
						value: 'documentsAndMedia',
					},
					{
						name: 'maximumFileSize',
						value: '0',
					},
				],
				type: 'Long',
			};
		case 'AutoIncrement':
			return {
				DBType: 'String',
				businessType: 'AutoIncrement',
				objectFieldSettings: [
					{
						name: 'initialValue',
						value: '1',
					} as any,
				],
				type: 'String',
			};
		case 'Boolean':
			return {
				DBType: 'Boolean',
				businessType: 'Boolean',
				type: 'Boolean',
			};
		case 'Date':
			return {
				DBType: 'Date',
				businessType: 'Date',
				type: 'Date',
			};
		case 'DateTime':
			return {
				DBType: 'DateTime',
				businessType: 'DateTime',
				objectFieldSettings: [
					{
						name: 'timeStorage',
						value: 'convertToUTC',
					},
				],
				type: 'DateTime',
			};
		case 'Decimal':
			return {
				DBType: 'Double',
				businessType: 'Decimal',
				type: 'Double',
			};
		case 'Encrypted':
			return {
				DBType: 'Clob',
				businessType: 'Encrypted',
				type: 'Clob',
			};
		case 'Integer':
			return {
				DBType: 'Integer',
				businessType: 'Integer',
				type: 'Integer',
			};
		case 'LongInteger':
			return {
				DBType: 'Long',
				businessType: 'LongInteger',
				type: 'Long',
			};
		case 'LongText':
			return {
				DBType: 'Clob',
				businessType: 'LongText',
				objectFieldSettings: [
					{
						name: 'showCounter',
						value: false,
					} as any,
				],
				type: 'Clob',
			};
		case 'MultiselectPicklist':
			return {
				DBType: 'String',
				businessType: 'MultiselectPicklist',
				listTypeDefinitionExternalReferenceCode: listTypeDefinitionExternalReferenceCode,
				type: 'String',
			};
		case 'Picklist':
			return {
				DBType: 'String',
				businessType: 'Picklist',
				listTypeDefinitionExternalReferenceCode: listTypeDefinitionExternalReferenceCode,
				type: 'String',
			};
		case 'PrecisionDecimal':
			return {
				DBType: 'BigDecimal',
				businessType: 'PrecisionDecimal',
				type: 'BigDecimal',
			};
		case 'RichText':
			return {
				DBType: 'Clob',
				businessType: 'RichText',
				type: 'Clob',
			};
		case 'Text':
			return {
				DBType: 'String',
				businessType: 'Text',
				type: 'String',
			};
	}
}

function generateObjectField({
	listTypeDefinitionExternalReferenceCode,
	objectFieldBusinessType
}: {
	listTypeDefinitionExternalReferenceCode?: string,
	objectFieldBusinessType: SupportedObjectFieldBusinessType
}): Partial<ObjectField> {
	const objectFieldBaseProperties = getObjectFieldBaseProperties();
	const objectFieldLabel = `${objectFieldBusinessType}${getRandomInt()}`
	const objectFieldSpecificProperties =
		getObjectFieldSpecificProperties(objectFieldBusinessType, listTypeDefinitionExternalReferenceCode);

	return {
		...objectFieldBaseProperties,
		...objectFieldSpecificProperties,
		label: {en_US: objectFieldLabel},
		name: objectFieldLabel.toLocaleLowerCase(),
	};
}

export function generateObjectFields({
	listTypeDefinitionExternalReferenceCode,
	objectFieldBusinessTypes,
}: {
	listTypeDefinitionExternalReferenceCode?: string;
	objectFieldBusinessTypes: SupportedObjectFieldBusinessType[];
}) {
	const objectFields: Partial<ObjectField>[] = [];

	for (const objectFieldBusinessType of objectFieldBusinessTypes) {
		const objectField = generateObjectField({
			listTypeDefinitionExternalReferenceCode,
			objectFieldBusinessType
		});

		objectFields.push(objectField);
	}

	return objectFields;
}
