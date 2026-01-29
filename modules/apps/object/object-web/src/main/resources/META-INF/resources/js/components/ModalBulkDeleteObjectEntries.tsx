/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayButton from '@clayui/button';
import ClayModal, {useModal} from '@clayui/modal';
import {openToast} from '@liferay/object-js-components-web';
import React, {useEffect, useState} from 'react';

import AssetBulkActionTaskService from '../common/services/AssetBulkActionTaskService';

interface ModalBulkDeleteObjectEntriesState {
	deletionErrorMessage: string | null;
	selectedData: any | null;
	visible: boolean;
}

export default function ModalBulkDeleteObjectEntries() {
	const [modalDeleteObjectsEntriesState, setModalDeleteObjectsEntriesState] =
		useState<ModalBulkDeleteObjectEntriesState>({
			deletionErrorMessage: null,
			selectedData: null,
			visible: false,
		});

	const [deleteButtonDisabled, setDeleteButtonDisabled] =
		useState<boolean>(false);

	const {observer, onClose} = useModal({
		onClose: () => {
			setModalDeleteObjectsEntriesState({
				deletionErrorMessage: null,
				selectedData: null,
				visible: false,
			});

			setDeleteButtonDisabled(false);
		},
	});

	const onSubmit = async () => {
		try {
			const bulkActionItems = (
				modalDeleteObjectsEntriesState.selectedData?.items || []
			).map((item: any) => ({
				classExternalReferenceCode: item.externalReferenceCode,
				className: '',
				classPK: item.id,
			}));

			const url = new URL(
				`${Liferay.ThemeDisplay.getPortalURL()}/o/bulk/v1.0/bulk-action`
			);

			url.searchParams.set('scope', 'objectEntry');

			await AssetBulkActionTaskService.createTask(
				{
					bulkActionItems,
					selectionScope: {
						selectAll:
							modalDeleteObjectsEntriesState.selectedData
								?.selectAll ?? false,
					},
					type: 'DeleteBulkAction',
				},
				url.toString()
			);

			openToast({
				message: Liferay.Language.get(
					'your-request-completed-successfully'
				),
				type: 'success',
			});

			onClose();

			setTimeout(() => window.location.reload(), 1000);
		}
		catch (error) {
			setModalDeleteObjectsEntriesState((prevState) => ({
				...prevState,
				deletionErrorMessage: (error as Error).message,
			}));
		}
	};

	useEffect(() => {
		const openModal = ({selectedData}: {selectedData: any}) => {
			setDeleteButtonDisabled(false);

			setModalDeleteObjectsEntriesState({
				deletionErrorMessage: null,
				selectedData,
				visible: true,
			});
		};

		Liferay.on('openModalBulkDeleteObjectEntries', openModal);

		return () =>
			Liferay.detach(
				'openModalBulkDeleteObjectEntries',
				openModal as () => void
			);
	}, []);

	return modalDeleteObjectsEntriesState.visible ? (
		<ClayModal
			center
			observer={observer}
			status={
				modalDeleteObjectsEntriesState.deletionErrorMessage
					? 'warning'
					: 'danger'
			}
		>
			<ClayModal.Header
				closeButtonAriaLabel={Liferay.Language.get('close')}
			>
				{modalDeleteObjectsEntriesState.deletionErrorMessage
					? Liferay.Language.get('deletion-not-possible')
					: Liferay.Language.get('delete-entries')}
			</ClayModal.Header>

			<ClayModal.Body>
				{modalDeleteObjectsEntriesState.deletionErrorMessage ??
					Liferay.Language.get('delete-entries-confirmation')}
			</ClayModal.Body>

			<ClayModal.Footer
				last={
					<ClayButton.Group spaced>
						{!modalDeleteObjectsEntriesState.deletionErrorMessage && (
							<ClayButton
								displayType="secondary"
								onClick={onClose}
							>
								{Liferay.Language.get('cancel')}
							</ClayButton>
						)}

						<ClayButton
							disabled={deleteButtonDisabled}
							displayType={
								modalDeleteObjectsEntriesState.deletionErrorMessage
									? 'warning'
									: 'danger'
							}
							onClick={() => {
								setDeleteButtonDisabled(true);
								modalDeleteObjectsEntriesState.deletionErrorMessage
									? onClose()
									: onSubmit();
							}}
						>
							{modalDeleteObjectsEntriesState.deletionErrorMessage
								? Liferay.Language.get('close')
								: Liferay.Language.get('delete')}
						</ClayButton>
					</ClayButton.Group>
				}
			/>
		</ClayModal>
	) : null;
}