/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ExtensionNodeType, TreeItem } from 'azdata';
import { TreeItemCollapsibleState, ExtensionContext } from 'vscode';
import * as nls from 'vscode-nls';
const localize = nls.loadMessageBundle();

import { AzureResourceItemType } from '../../constants';
import { ApiWrapper } from '../../../apiWrapper';
import { generateGuid } from '../../utils';
import { IAzureResourceService } from '../../interfaces';
import { ResourceTreeDataProviderBase } from '../resourceTreeDataProviderBase';
import { azureResource } from '../../azure-resource';

export class KustoTreeDataProvider extends ResourceTreeDataProviderBase<azureResource.AzureResourceDatabaseServer> {
	private static readonly containerId = 'azure.resource.providers.KustoContainer';
	private static readonly containerLabel = localize('azure.resource.providers.KustoContainerLabel', "Azure Data Explorer Clusters");

	public constructor(
		databaseServerService: IAzureResourceService<azureResource.AzureResourceDatabaseServer>,
		apiWrapper: ApiWrapper,
		private _extensionContext: ExtensionContext
	) {
		super(databaseServerService, apiWrapper);
	}


	protected getTreeItemForResource(databaseServer: azureResource.AzureResourceDatabaseServer): TreeItem {
		return {
			id: `Kusto_${databaseServer.id ? databaseServer.id : databaseServer.name}`,
			label: databaseServer.name,
			iconPath: {
				dark: this._extensionContext.asAbsolutePath('resources/dark/azureDE_inverse.svg'),
				light: this._extensionContext.asAbsolutePath('resources/light/azureDE.svg')
			},
			collapsibleState: TreeItemCollapsibleState.Collapsed,
			contextValue: AzureResourceItemType.databaseServer,
			payload: {
				id: generateGuid(),
				connectionName: undefined,
				serverName: databaseServer.fullName,
				databaseName: databaseServer.defaultDatabaseName,
				userName: databaseServer.loginName,
				password: '',
				authenticationType: 'AzureMFA',
				savePassword: true,
				groupFullName: '',
				groupId: '',
				providerName: 'MSSQL',
				saveProfile: false,
				options: {}
			},
			childProvider: 'MSSQL',
			type: ExtensionNodeType.Server
		};
	}

	protected createContainerNode(): azureResource.IAzureResourceNode {
		return {
			account: undefined,
			subscription: undefined,
			tenantId: undefined,
			treeItem: {
				id: KustoTreeDataProvider.containerId,
				label: KustoTreeDataProvider.containerLabel,
				iconPath: {
					dark: this._extensionContext.asAbsolutePath('resources/dark/folder_inverse.svg'),
					light: this._extensionContext.asAbsolutePath('resources/light/folder.svg')
				},
				collapsibleState: TreeItemCollapsibleState.Collapsed,
				contextValue: AzureResourceItemType.databaseServerContainer
			}
		};
	}
}
