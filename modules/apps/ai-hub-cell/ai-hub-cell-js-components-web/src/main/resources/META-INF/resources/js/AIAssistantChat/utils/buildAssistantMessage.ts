/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	CONTENT_GAP_ANALYSIS_ACTION,
	CONTENT_GAP_CATEGORIES_ACTION,
} from '../constants';
import {
	ChatMessageSentData,
	ContentGapAnalysis,
	ContentGapCategoriesRequest,
	Message,
} from '../types';

function parseActionJSONObject(action: string, data: string) {
	if (!data.includes(`"${action}"`)) {
		return null;
	}

	let parsed;

	try {
		parsed = JSON.parse(
			data
				.trim()
				.replace(/^```(?:json)?/i, '')
				.replace(/```$/, '')
				.trim()
		);
	}
	catch {
		return null;
	}

	if (parsed?.action !== action) {
		return null;
	}

	return parsed;
}

function parseContentGapAnalysis(data: string): ContentGapAnalysis | null {
	const parsed = parseActionJSONObject(CONTENT_GAP_ANALYSIS_ACTION, data);

	if (!parsed || typeof parsed.result !== 'string') {
		return null;
	}

	return {
		gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
		result: parsed.result,
	};
}

function parseContentGapCategoriesRequest(
	data: string
): ContentGapCategoriesRequest | null {
	const parsed = parseActionJSONObject(CONTENT_GAP_CATEGORIES_ACTION, data);

	const agentInstanceId = parsed?.agentInstanceId;

	if (
		typeof agentInstanceId !== 'string' &&
		typeof agentInstanceId !== 'number'
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

	const contentGapAnalysis = parseContentGapAnalysis(data);

	if (contentGapAnalysis) {
		return {
			agentDefinitionExternalReferenceCodes,
			contentGapAnalysis,
			sender: 'assistant',
			text: contentGapAnalysis.result,
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
		text: data,
	};
}
