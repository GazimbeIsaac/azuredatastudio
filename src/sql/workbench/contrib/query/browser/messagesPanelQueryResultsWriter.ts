/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IResultMessageIntern, Model } from 'sql/workbench/contrib/query/browser/messagePanel';
import { IQueryMessage, IQueryResultsWriter } from 'sql/workbench/services/query/common/query';
import { IDataTreeViewState } from 'vs/base/browser/ui/tree/dataTree';
import { FuzzyScore } from 'vs/base/common/filters';
import { isArray } from 'vs/base/common/types';
import { WorkbenchDataTree } from 'vs/platform/list/browser/listService';

export class MessagesPanelQueryResultsWriter implements IQueryResultsWriter {

	constructor(private readonly model: Model,
		private readonly tree: WorkbenchDataTree<Model, IResultMessageIntern, FuzzyScore>,
		private readonly treeStates: Map<string, IDataTreeViewState>,
		private readonly currentUri: string
	) { }

	public onQueryStart(): void {
		this.reset();
	}

	public onResultSet(): void {
		// intentionally made no-op
	}

	public updateResultSet(): void {
		// intentionally made no-op
	}

	public onMessage(incomingMessage: IQueryMessage | IQueryMessage[], setInput: boolean = false): void {
		if (isArray(incomingMessage)) {
			this.model.messages.push(...incomingMessage);
		} else {
			this.model.messages.push(incomingMessage);
		}
		if (setInput) {
			this.tree.setInput(this.model, this.treeStates.get(this.currentUri));
		} else {
			this.tree.updateChildren();
		}
	}

	public reset(): void {
		this.model.messages = [];
		this.model.totalExecuteMessage = undefined;
		this.tree.updateChildren();
	}
}
