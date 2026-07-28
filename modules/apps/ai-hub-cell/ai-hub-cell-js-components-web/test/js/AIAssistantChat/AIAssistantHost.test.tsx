/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import '@testing-library/jest-dom';

import AIAssistantHost from '../../../src/main/resources/META-INF/resources/js/AIAssistantChat/AIAssistantHost';
import AIAssistantTriggerButton from '../../../src/main/resources/META-INF/resources/js/AIAssistantChat/AIAssistantTriggerButton';
import {
	createEventSource,
	postChatByExternalReferenceCodeMessage,
	putAgentInstanceResume,
} from '../../../src/main/resources/META-INF/resources/js/AIAssistantChat/api';
import {CATEGORIZE_EVENT} from '../../../src/main/resources/META-INF/resources/js/Categorization/events';
import {classifyCategorizationIntent} from '../../../src/main/resources/META-INF/resources/js/Categorization/services/classifyCategorizationIntent';
import {ECategorizationAgent} from '../../../src/main/resources/META-INF/resources/js/Categorization/types';
import {postAIIssueReport} from '../../../src/main/resources/META-INF/resources/js/ReportFeedback/api';

jest.mock(
	'../../../src/main/resources/META-INF/resources/js/AIAssistantChat/api',
	() => ({
		createEventSource: jest.fn(() => Promise.resolve(null)),
		postChatByExternalReferenceCodeMessage: jest.fn(() =>
			Promise.resolve()
		),
		putAgentInstanceResume: jest.fn(() => Promise.resolve()),
	})
);

jest.mock(
	'../../../src/main/resources/META-INF/resources/js/AIAssistantChat/components/CategorizationMessageBalloon',
	() => ({
		__esModule: true,
		default: () => 'categorization-balloon',
	})
);

jest.mock(
	'../../../src/main/resources/META-INF/resources/js/Categorization/services/classifyCategorizationIntent'
);

jest.mock(
	'../../../src/main/resources/META-INF/resources/js/ReportFeedback/api'
);

const mockClassify = classifyCategorizationIntent as jest.MockedFunction<
	typeof classifyCategorizationIntent
>;
const mockCreateEventSource = createEventSource as jest.MockedFunction<
	typeof createEventSource
>;
const mockPostChat =
	postChatByExternalReferenceCodeMessage as jest.MockedFunction<
		typeof postChatByExternalReferenceCodeMessage
	>;
const mockPostAIIssueReport = postAIIssueReport as jest.MockedFunction<
	typeof postAIIssueReport
>;
const mockPutAgentInstanceResume =
	putAgentInstanceResume as jest.MockedFunction<
		typeof putAgentInstanceResume
	>;

const HOST_CONTAINER_ID = 'ai-assistant-host-root';

const defaultProps = {
	getContext: () => ({}),
	instructionDefinitionScope: 'test-scope',
};

function createFakeEventSource() {
	const listeners: Record<string, (event: {data: string}) => void> = {};

	return {
		addEventListener: jest.fn(
			(type: string, handler: (event: {data: string}) => void) => {
				listeners[type] = handler;
			}
		),
		close: jest.fn(),
		emit(type: string, data: string) {
			listeners[type]?.({data});
		},
	};
}

function renderHost(
	triggerProps?: Partial<
		React.ComponentProps<typeof AIAssistantTriggerButton>
	>
) {
	return render(
		<>
			<AIAssistantHost />

			{triggerProps && (
				<AIAssistantTriggerButton {...defaultProps} {...triggerProps} />
			)}
		</>
	);
}

async function clickTrigger() {
	await act(async () => {
		fireEvent.click(screen.getByRole('button', {name: 'ai-assistant'}));
	});
}

async function renderAndOpen(
	triggerProps: Partial<
		React.ComponentProps<typeof AIAssistantTriggerButton>
	> = {presentation: 'dropdown'}
) {
	await act(async () => {
		renderHost(triggerProps);
	});

	await clickTrigger();
}

function getLiferayHandler(eventName: string) {
	return (Liferay.on as jest.Mock).mock.calls
		.filter(([name]) => name === eventName)
		.at(-1)?.[1];
}

function fireCategorizeEvent(payload: unknown) {
	getLiferayHandler(CATEGORIZE_EVENT)?.(payload);
}

function getSidebar() {
	return screen.getByRole('complementary', {name: 'ai-assistant'});
}

async function waitForSidebarOpen() {
	const sidebar = getSidebar();

	await waitFor(() => expect(sidebar).not.toHaveAttribute('inert'));

	return sidebar;
}

describe('AIAssistantHost', () => {
	let hostContainerStub: HTMLDivElement;

	beforeEach(() => {
		(window as unknown as {[key: string]: unknown})[
			'__LIFERAY_AI_ASSISTANT_SINGLETON__'
		] = {
			eventBound: true,
			hostMounted: true,
			listeners: new Set(),
			state: {command: null},
		};

		hostContainerStub = document.createElement('div');
		hostContainerStub.id = HOST_CONTAINER_ID;

		document.body.appendChild(hostContainerStub);

		Object.defineProperty(document.body, 'clientWidth', {
			configurable: true,
			value: 1440,
		});

		window.HTMLElement.prototype.scrollIntoView = jest.fn();

		mockCreateEventSource.mockReset();
		mockCreateEventSource.mockResolvedValue(null);
		mockPostChat.mockReset();
		mockPostChat.mockResolvedValue(undefined);
		mockPostAIIssueReport.mockReset();
		mockPostAIIssueReport.mockResolvedValue({id: 'report-1'});
		mockPutAgentInstanceResume.mockReset();
		mockPutAgentInstanceResume.mockResolvedValue(undefined);

		global.Liferay = {
			...global.Liferay,
			Util: {
				...global.Liferay?.Util,
				openToast: jest.fn(),
			},
		};
	});

	afterEach(() => {
		hostContainerStub.remove();
	});

	it('accumulates several image events into a single balloon', async () => {
		const fakeEventSource = createFakeEventSource();

		mockCreateEventSource.mockResolvedValue(fakeEventSource as never);

		await renderAndOpen();

		await act(async () => {
			fakeEventSource.emit(
				'Chat Message Sent',
				JSON.stringify({
					data: 'AAA',
					mimeType: 'image/png',
					type: 'image',
				})
			);
		});

		await act(async () => {
			fakeEventSource.emit(
				'Chat Message Sent',
				JSON.stringify({
					data: 'BBB',
					mimeType: 'image/png',
					type: 'image',
				})
			);
		});

		const images = screen.getAllByAltText('generated-image');

		expect(images).toHaveLength(2);
		expect(images[0]).toHaveAttribute('src', 'data:image/png;base64,AAA');
		expect(images[1]).toHaveAttribute('src', 'data:image/png;base64,BBB');

		expect(
			screen.getAllByRole('checkbox', {name: 'generated-image'})
		).toHaveLength(2);
	});

	it('closes the sidebar on Escape', async () => {
		await renderAndOpen({presentation: 'sidebar'});

		const sidebar = await waitForSidebarOpen();

		await act(async () => {
			fireEvent.keyDown(document, {key: 'Escape'});
		});

		await waitFor(() => expect(sidebar).toHaveAttribute('inert'));

		expect(
			screen.getByRole('button', {name: 'ai-assistant'})
		).toHaveAttribute('aria-expanded', 'false');
	});

	it('releases the pushed page content when the sidebar closes', async () => {
		const wrapper = document.createElement('div');

		wrapper.id = 'wrapper';

		document.body.appendChild(wrapper);

		await renderAndOpen({presentation: 'sidebar'});

		const sidebar = await waitForSidebarOpen();

		expect(wrapper).toHaveClass('c-slideout-push-end');
		expect(wrapper).toHaveClass('ai-assistant-sidebar-push');

		await act(async () => {
			fireEvent.keyDown(document, {key: 'Escape'});
		});

		await waitFor(() => expect(sidebar).toHaveAttribute('inert'));

		await waitFor(() =>
			expect(wrapper).not.toHaveClass('c-slideout-push-end')
		);

		expect(wrapper).not.toHaveClass('ai-assistant-sidebar-push');

		wrapper.remove();
	});

	it('injects the image into a select file field found on the page when no field context is provided', async () => {
		const originalDataTransfer = (global as {DataTransfer?: unknown})
			.DataTransfer;

		(global as {DataTransfer?: unknown}).DataTransfer = class {
			items = {
				_files: [] as File[],
				add(file: File) {
					this._files.push(file);
				},
			};

			get files() {
				return this.items._files;
			}
		};

		const field = document.createElement('div');

		field.setAttribute('data-ai-assistant-field-id', '');
		field.innerHTML = '<input class="file-upload-input" type="file" />';

		document.body.appendChild(field);

		const fileInput = field.querySelector(
			'.file-upload-input'
		) as HTMLInputElement;

		let files: File[] = [];

		Object.defineProperty(fileInput, 'files', {
			configurable: true,
			get: () => files,
			set: (value) => {
				files = value;
			},
		});

		const fakeEventSource = createFakeEventSource();

		mockCreateEventSource.mockResolvedValue(fakeEventSource as never);

		await renderAndOpen();

		await act(async () => {
			fakeEventSource.emit(
				'Chat Message Sent',
				JSON.stringify({
					data: 'AAA',
					mimeType: 'image/png',
					type: 'image',
				})
			);
		});

		fireEvent.click(screen.getByRole('button', {name: 'save-image'}));

		expect(fileInput.files).toHaveLength(1);

		field.remove();

		(global as {DataTransfer?: unknown}).DataTransfer =
			originalDataTransfer;
	});

	it('defaults the mime type to image/png when the image event omits it', async () => {
		const fakeEventSource = createFakeEventSource();

		mockCreateEventSource.mockResolvedValue(fakeEventSource as never);

		await renderAndOpen();

		await act(async () => {
			fakeEventSource.emit(
				'Chat Message Sent',
				JSON.stringify({data: 'CCC', type: 'image'})
			);
		});

		expect(screen.getByAltText('generated-image')).toHaveAttribute(
			'src',
			'data:image/png;base64,CCC'
		);
	});

	it('exposes the feedback row on a successful message and wires the codes', async () => {
		const fakeEventSource = createFakeEventSource();

		mockCreateEventSource.mockResolvedValue(fakeEventSource as never);

		await renderAndOpen();

		await act(async () => {
			fakeEventSource.emit(
				'Chat Message Sent',
				JSON.stringify({
					agentDefinitionExternalReferenceCodes: ['agent-x'],
					data: 'Here is your answer',
				})
			);
		});

		expect(
			screen.getByRole('button', {
				name: 'send-negative-feedback-or-report-legal-concern',
			})
		).toBeInTheDocument();

		await act(async () => {
			fireEvent.click(
				screen.getByRole('button', {name: 'give-positive-feedback'})
			);
		});

		expect(mockPostAIIssueReport).toHaveBeenCalledWith({
			agentDefinitionExternalReferenceCodes: ['agent-x'],
			feedback: 'positive',
			surface: 'aiAssistant',
		});
	});

	describe('free-form categorization', () => {
		beforeEach(() => {
			mockClassify.mockReset();
			mockPostChat.mockClear();
			(Liferay.fire as jest.Mock).mockClear();
		});

		it('does not classify when the feature is disabled', async () => {
			const fakeEventSource = createFakeEventSource();

			mockCreateEventSource.mockResolvedValue(fakeEventSource as never);

			await renderAndOpen({initialMessage: 'tag this article'});

			await act(async () => {
				fakeEventSource.emit('Subscribe', 'ref-1');
			});

			expect(mockClassify).not.toHaveBeenCalled();
			expect(mockPostChat).toHaveBeenCalled();
		});

		it('fires a single request event for a categorization message', async () => {
			const fakeEventSource = createFakeEventSource();

			mockCreateEventSource.mockResolvedValue(fakeEventSource as never);
			mockClassify.mockResolvedValue({
				actions: [{agent: 'tag', count: 3, targets: []}],
				passthrough: false,
			});

			await renderAndOpen({
				enableFreeFormCategorization: true,
				initialMessage: 'tag this article',
			});

			await act(async () => {
				fakeEventSource.emit('Subscribe', 'ref-1');
			});

			expect(mockClassify).toHaveBeenCalledWith('tag this article');
			expect(Liferay.fire).toHaveBeenCalledWith(
				'cms:aiAssistant:requestCategorize',
				{actions: [{agent: 'tag', count: 3, targets: []}]}
			);
			expect(mockPostChat).not.toHaveBeenCalled();
		});

		it('posts a passthrough message to the chat', async () => {
			const fakeEventSource = createFakeEventSource();

			mockCreateEventSource.mockResolvedValue(fakeEventSource as never);
			mockClassify.mockResolvedValue({actions: [], passthrough: true});

			await renderAndOpen({
				enableFreeFormCategorization: true,
				initialMessage: 'what can you do?',
			});

			await act(async () => {
				fakeEventSource.emit('Subscribe', 'ref-1');
			});

			expect(mockClassify).toHaveBeenCalledWith('what can you do?');
			expect(mockPostChat).toHaveBeenCalled();
			expect(Liferay.fire).not.toHaveBeenCalledWith(
				'cms:aiAssistant:requestCategorize',
				expect.anything()
			);
		});

		it('renders only the balloon when the categorization event suppresses the user message', async () => {
			await act(async () => {
				renderHost();
			});

			await act(async () => {
				fireCategorizeEvent({
					agent: 'L_GENERATE_TAGS',
					cmsGroupId: 1,
					content: 'x',
					scopeId: 1,
					suppressUserMessage: true,
					targets: ['kayaking'],
				});
			});

			expect(
				screen.getByText('categorization-balloon')
			).toBeInTheDocument();
			expect(screen.queryByText('generate-tags')).not.toBeInTheDocument();
		});
	});

	it('hides the feedback row on an error message', async () => {
		const fakeEventSource = createFakeEventSource();

		mockCreateEventSource.mockResolvedValue(fakeEventSource as never);

		await renderAndOpen();

		await act(async () => {
			fakeEventSource.emit(
				'Agent Invocation Failed',
				JSON.stringify({data: 'Something went wrong'})
			);
		});

		expect(screen.getByText('Something went wrong')).toBeInTheDocument();
		expect(
			screen.queryByRole('button', {name: 'give-positive-feedback'})
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole('button', {
				name: 'send-negative-feedback-or-report-legal-concern',
			})
		).not.toBeInTheDocument();
	});

	it('keeps the live connection across shell switches', async () => {
		await renderAndOpen();

		await act(async () => {
			fireEvent.click(screen.getByRole('button', {name: 'maximize'}));
		});

		await act(async () => {
			fireEvent.click(screen.getByRole('button', {name: 'minimize'}));
		});

		expect(mockCreateEventSource).toHaveBeenCalledTimes(1);
	});

	it('keeps the message draft when switching shells', async () => {
		await renderAndOpen();

		fireEvent.change(screen.getByPlaceholderText('Ask me anything...'), {
			target: {value: 'Draft in progress'},
		});

		await act(async () => {
			fireEvent.click(screen.getByRole('button', {name: 'maximize'}));
		});

		expect(
			within(getSidebar()).getByPlaceholderText('Ask me anything...')
		).toHaveValue('Draft in progress');
	});

	it('merges the static context and the getContext snapshot when sending', async () => {
		const fakeEventSource = createFakeEventSource();

		mockCreateEventSource.mockResolvedValue(fakeEventSource as never);

		await renderAndOpen({
			context: {scope: 'static'},
			getContext: () => ({live: 'value'}),
			presentation: 'dropdown',
		});

		await act(async () => {
			fakeEventSource.emit('Subscribe', 'ref-code');
		});

		const textArea = screen.getByPlaceholderText('Ask me anything...');

		await act(async () => {
			fireEvent.change(textArea, {target: {value: 'Hello'}});
		});

		await act(async () => {
			fireEvent.submit(textArea.closest('form') as HTMLFormElement);
		});

		expect(mockPostChat).toHaveBeenCalledWith(
			expect.objectContaining({
				chatContext: {live: 'value', scope: 'static'},
			})
		);
	});

	it('moves the conversation into the sidebar when maximized', async () => {
		const fakeEventSource = createFakeEventSource();

		mockCreateEventSource.mockResolvedValue(fakeEventSource as never);

		await renderAndOpen();

		await act(async () => {
			fakeEventSource.emit(
				'Chat Message Sent',
				JSON.stringify({data: 'Here is your answer'})
			);
		});

		await act(async () => {
			fireEvent.click(screen.getByRole('button', {name: 'maximize'}));
		});

		expect(
			within(getSidebar()).getByText('Here is your answer')
		).toBeInTheDocument();

		await act(async () => {
			fireEvent.click(screen.getByRole('button', {name: 'minimize'}));
		});

		expect(
			screen.getByRole('button', {name: 'maximize'})
		).toBeInTheDocument();
		expect(screen.getByText('Here is your answer')).toBeInTheDocument();
	});

	it('offers no expand toggle for a sidebar command', async () => {
		await renderAndOpen({presentation: 'sidebar'});

		await waitForSidebarOpen();

		expect(
			screen.queryByRole('button', {name: 'maximize'})
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole('button', {name: 'minimize'})
		).not.toBeInTheDocument();
	});

	it('offers the expand toggle for a dropdown command', async () => {
		await renderAndOpen();

		expect(
			screen.getByRole('button', {name: 'maximize'})
		).toBeInTheDocument();
	});

	it('reopens with the last presentation for an open event', async () => {
		await renderAndOpen();

		await act(async () => {
			fireEvent.click(screen.getByRole('button', {name: 'close'}));
		});

		await act(async () => {
			getLiferayHandler('openAIAssistantChat')?.({
				message: 'Generate content',
			});
		});

		expect(
			screen.getByRole('button', {name: 'maximize'})
		).toBeInTheDocument();
		expect(
			screen.queryByRole('button', {name: 'minimize'})
		).not.toBeInTheDocument();
	});

	it('opens the sidebar for an open event with no prior command', async () => {
		await act(async () => {
			renderHost();
		});

		await act(async () => {
			getLiferayHandler('openAIAssistantChat')?.({
				message: 'Translate Content',
			});
		});

		const sidebar = await waitForSidebarOpen();

		expect(
			within(sidebar).getByPlaceholderText('Ask me anything...')
		).toBeInTheDocument();
		expect(
			screen.queryByRole('button', {name: 'maximize'})
		).not.toBeInTheDocument();
	});

	it('opens the sidebar from the trigger in the default presentation', async () => {
		await renderAndOpen({});

		expect(
			screen.getByRole('button', {name: 'ai-assistant'})
		).toHaveAttribute('aria-expanded', 'true');

		const sidebar = await waitForSidebarOpen();

		expect(
			within(sidebar).getByPlaceholderText('Ask me anything...')
		).toBeInTheDocument();
		expect(
			screen.queryByRole('button', {name: 'minimize'})
		).not.toBeInTheDocument();
	});

	it('opens the sidebar when a categorize event fires with no prior command', async () => {
		await act(async () => {
			renderHost();
		});

		await act(async () => {
			fireCategorizeEvent({
				agent: ECategorizationAgent.GENERATE_TAGS,
				content: 'Body',
			});
		});

		const sidebar = await waitForSidebarOpen();

		expect(within(sidebar).getByText('generate-tags')).toBeInTheDocument();
	});

	it('renders a generated image from an image event', async () => {
		const fakeEventSource = createFakeEventSource();

		mockCreateEventSource.mockResolvedValue(fakeEventSource as never);

		await renderAndOpen();

		await act(async () => {
			fakeEventSource.emit(
				'Chat Message Sent',
				JSON.stringify({
					agentDefinitionExternalReferenceCodes: ['agent-x'],
					data: 'BASE64',
					mimeType: 'image/png',
					type: 'image',
				})
			);
		});

		expect(screen.getByAltText('generated-image')).toHaveAttribute(
			'src',
			'data:image/png;base64,BASE64'
		);
	});

	it('reopens as a dropdown after the expanded chat is closed', async () => {
		await renderAndOpen();

		await act(async () => {
			fireEvent.click(screen.getByRole('button', {name: 'maximize'}));
		});

		const sidebar = await waitForSidebarOpen();

		await act(async () => {
			fireEvent.click(
				within(sidebar).getByRole('button', {name: 'close'})
			);
		});

		await clickTrigger();

		expect(
			screen.getByRole('button', {name: 'maximize'})
		).toBeInTheDocument();
		expect(
			screen.queryByRole('button', {name: 'minimize'})
		).not.toBeInTheDocument();
	});

	it('reuses the same body DOM across shell switches', async () => {
		await renderAndOpen();

		const inputBeforeExpand =
			screen.getByPlaceholderText('Ask me anything...');

		await act(async () => {
			fireEvent.click(screen.getByRole('button', {name: 'maximize'}));
		});

		expect(
			within(getSidebar()).getByPlaceholderText('Ask me anything...')
		).toBe(inputBeforeExpand);
	});

	it('sends the command initial message when the connection is already subscribed', async () => {
		const fakeEventSource = createFakeEventSource();

		mockCreateEventSource.mockResolvedValue(fakeEventSource as never);

		await act(async () => {
			renderHost({initialMessage: 'tag this article'});
		});

		await act(async () => {
			fakeEventSource.emit('Subscribe', 'ref-1');
		});

		expect(mockPostChat).not.toHaveBeenCalled();

		await clickTrigger();

		expect(mockPostChat).toHaveBeenCalledWith(
			expect.objectContaining({message: 'tag this article'})
		);
	});

	it('shows the chat input immediately on open', async () => {
		await renderAndOpen();

		expect(
			screen.getByPlaceholderText('Ask me anything...')
		).toBeInTheDocument();
	});

	it('shows the footer disclaimer', async () => {
		await renderAndOpen();

		expect(
			screen.getByText('ai-generated-responses-may-be-inaccurate')
		).toBeInTheDocument();
	});

	describe('content gap analysis action', () => {
		function emitAnalysis(
			fakeEventSource: ReturnType<typeof createFakeEventSource>
		) {
			fakeEventSource.emit(
				'Chat Message Sent',
				JSON.stringify({
					data: JSON.stringify({
						action: 'contentGapAnalysis',
						gaps: [{funnelStageId: '39681', personaId: '39697'}],
						result: 'One gap to address.',
					}),
				})
			);
		}

		it('renders the analysis with the next step actions', async () => {
			const fakeEventSource = createFakeEventSource();

			mockCreateEventSource.mockResolvedValue(fakeEventSource as never);

			await renderAndOpen();

			await act(async () => {
				emitAnalysis(fakeEventSource);
			});

			expect(
				await screen.findByText('One gap to address.')
			).toBeInTheDocument();
			expect(
				screen.getByText('what-would-you-like-to-do-next')
			).toBeInTheDocument();
			expect(
				screen.getByRole('button', {
					name: 'find-matching-assets-in-cms',
				})
			).toBeEnabled();
			expect(
				screen.getByRole('button', {name: 'generate-content-for-gaps'})
			).toBeEnabled();
		});

		it('sends the gaps with the routing message when the user asks for matching assets', async () => {
			const fakeEventSource = createFakeEventSource();

			mockCreateEventSource.mockResolvedValue(fakeEventSource as never);

			await renderAndOpen();

			await act(async () => {
				fakeEventSource.emit('Subscribe', 'ref-code');
			});

			await act(async () => {
				emitAnalysis(fakeEventSource);
			});

			await userEvent.click(
				await screen.findByRole('button', {
					name: 'find-matching-assets-in-cms',
				})
			);

			expect(mockPostChat).toHaveBeenCalledWith(
				expect.objectContaining({
					chatContext: expect.objectContaining({
						gaps: JSON.stringify([
							{funnelStageId: '39681', personaId: '39697'},
						]),
					}),
					message: 'find-matching-assets-in-cms',
				})
			);
		});
	});

	describe('find matching assets action', () => {
		it('renders the matched assets with the confirmation question', async () => {
			const fakeEventSource = createFakeEventSource();

			mockCreateEventSource.mockResolvedValue(fakeEventSource as never);

			await renderAndOpen();

			await act(async () => {
				fakeEventSource.emit(
					'Chat Message Sent',
					JSON.stringify({
						data: JSON.stringify({
							action: 'findMatchingAssets',
							results: [
								{
									funnelStage: 'Awareness',
									id: 101,
									persona: 'Procurement',
									status: 'Approved',
									title: 'Vendor evaluation checklist',
								},
							],
						}),
					})
				);
			});

			expect(
				await screen.findByRole('link', {
					name: 'Vendor evaluation checklist',
				})
			).toHaveAttribute(
				'href',
				'/c/cms/edit_content_item?objectEntryId=101'
			);
			expect(
				screen.getByText(
					'would-you-like-me-to-add-all-suggested-assets'
				)
			).toBeInTheDocument();
		});
	});

	describe('content gap categories request', () => {
		const PERSONAS = [{id: 39697, name: 'Decision Maker'}];
		const FUNNEL_STAGES = [{id: 39681, name: 'Awareness'}];
		const TASKS = [{id: 'L_CMP_TASK_1955591569', name: 'Task 1'}];

		function envelope(overrides = {}) {
			return JSON.stringify({
				data: JSON.stringify({
					action: 'requestContentGapCategories',
					agentInstanceId: '41070',
					funnelStages: FUNNEL_STAGES,
					personas: PERSONAS,
					projectId: '40551',
					requestTask: false,
					...overrides,
				}),
			});
		}

		async function emitActionRequest(
			fakeEventSource: ReturnType<typeof createFakeEventSource>,
			overrides = {}
		) {
			await act(async () => {
				fakeEventSource.emit('Chat Message Sent', envelope(overrides));
			});

			await screen.findByLabelText('persona');
		}

		it('stops generating and renders the category pickers on the action event', async () => {
			const fakeEventSource = createFakeEventSource();

			mockCreateEventSource.mockResolvedValue(fakeEventSource as never);

			await renderAndOpen();

			await act(async () => {
				fakeEventSource.emit('Subscribe', 'ref-code');
			});

			const textArea = screen.getByPlaceholderText('Ask me anything...');

			await act(async () => {
				fireEvent.change(textArea, {
					target: {value: 'Find matching assets'},
				});
			});

			await act(async () => {
				fireEvent.submit(textArea.closest('form') as HTMLFormElement);
			});

			expect(screen.getByText('generating')).toBeInTheDocument();

			await emitActionRequest(fakeEventSource);

			expect(
				screen.getByText(
					'select-a-persona-and-a-funnel-stage-to-find-matching-assets'
				)
			).toBeInTheDocument();
			expect(screen.queryByLabelText('task')).not.toBeInTheDocument();
			expect(screen.queryByText('generating')).not.toBeInTheDocument();
		});

		it('resumes the paused agent instance with the selected categories', async () => {
			const fakeEventSource = createFakeEventSource();

			mockCreateEventSource.mockResolvedValue(fakeEventSource as never);

			await renderAndOpen();

			await emitActionRequest(fakeEventSource);

			await userEvent.selectOptions(
				screen.getByLabelText('persona'),
				'39697'
			);
			await userEvent.selectOptions(
				screen.getByLabelText('funnel-stage'),
				'39681'
			);
			await userEvent.click(
				screen.getByRole('button', {name: 'confirm'})
			);

			expect(mockPutAgentInstanceResume).toHaveBeenCalledWith({
				agentInstanceId: '41070',
				context: {funnelStageId: '39681', personaId: '39697'},
			});

			expect(screen.getByText('generating')).toBeInTheDocument();

			await act(async () => {
				fakeEventSource.emit(
					'Chat Message Sent',
					JSON.stringify({data: 'Here are the matching assets.'})
				);
			});

			expect(
				screen.getByText('Here are the matching assets.')
			).toBeInTheDocument();
			expect(screen.queryByText('generating')).not.toBeInTheDocument();
		});

		it('resumes with a task for the generate flow (three dropdowns)', async () => {
			const fakeEventSource = createFakeEventSource();

			mockCreateEventSource.mockResolvedValue(fakeEventSource as never);

			await renderAndOpen();

			await emitActionRequest(fakeEventSource, {
				agentInstanceId: '41055',
				requestTask: true,
				tasks: TASKS,
			});

			await userEvent.selectOptions(
				screen.getByLabelText('persona'),
				'39697'
			);
			await userEvent.selectOptions(
				screen.getByLabelText('funnel-stage'),
				'39681'
			);
			await userEvent.selectOptions(
				screen.getByLabelText('task'),
				'L_CMP_TASK_1955591569'
			);
			await userEvent.click(
				screen.getByRole('button', {name: 'confirm'})
			);

			expect(mockPutAgentInstanceResume).toHaveBeenCalledWith({
				agentInstanceId: '41055',
				context: {
					funnelStageId: '39681',
					personaId: '39697',
					task: 'L_CMP_TASK_1955591569',
				},
			});
		});

		it('shows an error balloon and unlocks the pickers when the resume fails', async () => {
			const fakeEventSource = createFakeEventSource();

			mockCreateEventSource.mockResolvedValue(fakeEventSource as never);
			mockPutAgentInstanceResume.mockRejectedValue(new Error('failed'));

			await renderAndOpen();

			await emitActionRequest(fakeEventSource);

			await userEvent.selectOptions(
				screen.getByLabelText('persona'),
				'39697'
			);
			await userEvent.selectOptions(
				screen.getByLabelText('funnel-stage'),
				'39681'
			);
			await userEvent.click(
				screen.getByRole('button', {name: 'confirm'})
			);

			expect(
				await screen.findByText('your-request-failed-to-complete')
			).toBeInTheDocument();
			expect(screen.queryByText('generating')).not.toBeInTheDocument();
			expect(screen.getByRole('button', {name: 'confirm'})).toBeEnabled();
		});

		it('renders an incomplete action payload as plain text', async () => {
			const fakeEventSource = createFakeEventSource();

			mockCreateEventSource.mockResolvedValue(fakeEventSource as never);

			await renderAndOpen();

			await act(async () => {
				fakeEventSource.emit(
					'Chat Message Sent',
					JSON.stringify({
						data: JSON.stringify({
							action: 'requestContentGapCategories',
							projectId: '34213',
						}),
					})
				);
			});

			expect(screen.queryByLabelText('persona')).not.toBeInTheDocument();
			expect(
				screen.queryByRole('button', {name: 'confirm'})
			).not.toBeInTheDocument();
		});
	});
});
