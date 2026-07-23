/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	CONTENT_GAP_ANALYSIS_ERC,
	CONTENT_GAP_CATEGORIES_ACTION,
} from '../constants';
import {
	ChatMessageSentData,
	ContentGapCategoriesRequest,
	Message,
} from '../types';
import formatContentGapAnalysis from './formatContentGapAnalysis';

const TEXT_ANSWER_FORMATTERS: Record<string, (data: string) => string | null> =
	{
		[CONTENT_GAP_ANALYSIS_ERC]: formatContentGapAnalysis,
	};

function formatTextAnswer(
	data: string,
	agentDefinitionExternalReferenceCodes: string[]
): string {
	for (const agentDefinitionExternalReferenceCode of agentDefinitionExternalReferenceCodes) {
		const formatter =
			TEXT_ANSWER_FORMATTERS[agentDefinitionExternalReferenceCode];

		if (formatter) {
			return formatter(data) ?? data;
		}
	}

	return data;
}

function parseContentGapCategoriesRequest(
	data: string
): ContentGapCategoriesRequest | null {
	if (!data.includes(`"${CONTENT_GAP_CATEGORIES_ACTION}"`)) {
		return null;
	}

	let parsed;

	try {
		parsed = JSON.parse(data);
	}
	catch {
		return null;
	}

	const agentInstanceId = parsed?.agentInstanceId;

	if (
		parsed?.action !== CONTENT_GAP_CATEGORIES_ACTION ||
		(typeof agentInstanceId !== 'string' &&
			typeof agentInstanceId !== 'number')
	) {
		return null;
	}

	return {
		agentInstanceId: String(agentInstanceId),
		funnelStages: Array.isArray(parsed.funnelStages)
			? parsed.funnelStages
			: [],
		personas: Array.isArray(parsed.personas) ? parsed.personas : [],
		requestTask: Boolean(parsed.requestTask),
		tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
	};
}

export default function buildAssistantMessage(
	dataJSON: ChatMessageSentData
): Message {
	const agentDefinitionExternalReferenceCodes =
		dataJSON.agentDefinitionExternalReferenceCodes ?? [];

	const data = dataJSON.data ?? '';

	if (dataJSON.type === 'image') {
		return {
			agentDefinitionExternalReferenceCodes,
			images: [`data:${dataJSON.mimeType ?? 'image/png'};base64,${data}`],
			sender: 'assistant',
			text: '',
		};
	}

	const contentGapCategoriesRequest = parseContentGapCategoriesRequest(data);

	if (contentGapCategoriesRequest) {
		return {
			agentDefinitionExternalReferenceCodes,
			contentGapCategoriesRequest,
			sender: 'assistant',
			text: contentGapCategoriesRequest.requestTask
				? Liferay.Language.get(
						'select-a-persona-and-a-funnel-stage-to-continue'
					)
				: Liferay.Language.get(
						'select-a-persona-and-a-funnel-stage-to-find-matching-assets'
					),
		};
	}

	return {
		agentDefinitionExternalReferenceCodes,
		sender: 'assistant',
		text: formatTextAnswer(data, agentDefinitionExternalReferenceCodes),
	};
}
