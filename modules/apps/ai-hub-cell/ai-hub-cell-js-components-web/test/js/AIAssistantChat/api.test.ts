/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {fetch} from 'frontend-js-web';

import {putAgentInstanceResume} from '../../../src/main/resources/META-INF/resources/js/AIAssistantChat/api';

jest.mock('frontend-js-web', () => ({fetch: jest.fn()}));

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

const AUTHORIZATION_TOKEN = {
	accessToken: 'access-token',
	serviceURL: 'https://ai-hub-cell.example',
	userToken: 'user-token',
};

function tokenResponse() {
	return {
		json: () => Promise.resolve(AUTHORIZATION_TOKEN),
		ok: true,
	};
}

describe('putAgentInstanceResume', () => {
	beforeEach(() => {
		mockFetch.mockReset();
	});

	it('resumes the agent instance with the given context', async () => {
		mockFetch.mockResolvedValueOnce(tokenResponse() as never);
		mockFetch.mockResolvedValueOnce({ok: true} as never);

		await putAgentInstanceResume({
			agentInstanceId: '41070',
			context: {funnelStageId: '39681', personaId: '39697'},
		});

		expect(mockFetch).toHaveBeenCalledTimes(2);

		const [url, init] = mockFetch.mock.calls[1];

		expect(url).toBe(
			'https://ai-hub-cell.example/o/ai-hub/v1.0/agent-instances/41070/resume'
		);
		expect((init as RequestInit).method).toBe('PUT');
		expect((init as RequestInit).body).toBe(
			JSON.stringify({
				context: {funnelStageId: '39681', personaId: '39697'},
			})
		);

		const headers = (init as RequestInit).headers as Headers;

		expect(headers.get('Authorization')).toBe('Bearer access-token');
		expect(headers.get('Liferay-AI-Hub-Cell-On-Behalf-Of')).toBe(
			'user-token'
		);
	});

	it('includes the task in the resume context for the generate flow', async () => {
		mockFetch.mockResolvedValueOnce(tokenResponse() as never);
		mockFetch.mockResolvedValueOnce({ok: true} as never);

		await putAgentInstanceResume({
			agentInstanceId: '41055',
			context: {
				funnelStageId: '39681',
				personaId: '39697',
				task: 'L_CMP_TASK_1955591569',
			},
		});

		expect((mockFetch.mock.calls[1][1] as RequestInit).body).toBe(
			JSON.stringify({
				context: {
					funnelStageId: '39681',
					personaId: '39697',
					task: 'L_CMP_TASK_1955591569',
				},
			})
		);
	});

	it('throws when the authorization token cannot be generated', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			statusText: 'Unauthorized',
		} as never);

		await expect(
			putAgentInstanceResume({
				agentInstanceId: '41070',
				context: {funnelStageId: '39681', personaId: '39697'},
			})
		).rejects.toThrow('Unable to generate authorization token.');

		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it('throws when the resume request fails', async () => {
		mockFetch.mockResolvedValueOnce(tokenResponse() as never);
		mockFetch.mockResolvedValueOnce({
			ok: false,
			statusText: 'Not Found',
		} as never);

		await expect(
			putAgentInstanceResume({
				agentInstanceId: '41070',
				context: {funnelStageId: '39681', personaId: '39697'},
			})
		).rejects.toThrow('Unable to resume agent instance: Not Found');
	});
});
