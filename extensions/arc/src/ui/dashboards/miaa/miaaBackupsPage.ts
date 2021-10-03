/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// import * as vscode from 'vscode';
import * as azdata from 'azdata';
// import * as azExt from 'az-ext';
import * as loc from '../../../localizedConstants';
import { IconPathHelper, cssStyles } from '../../../constants';
import { DashboardPage } from '../../components/dashboardPage';
import { MiaaModel } from '../../../models/miaaModel';
import { ControllerModel } from '../../../models/controllerModel';
import { getDatabaseStateDisplayText } from '../../../common/utils';

export class MiaaBackupsPage extends DashboardPage {
	constructor(modelView: azdata.ModelView, dashboard: azdata.window.ModelViewDashboard, private _controllerModel: ControllerModel, private _miaaModel: MiaaModel) {
		super(modelView, dashboard);
		//this._instanceProperties.miaaAdmin = this._miaaModel.username || this._instanceProperties.miaaAdmin;
		this.disposables.push(
			this._miaaModel.onDatabasesUpdated(() => this.eventuallyRunOnInitialized(() => this.handleDatabasesUpdated()))
		);
	}

	private _databasesContainer!: azdata.DivContainer;
	private _connectToServerLoading!: azdata.LoadingComponent;
	private _connectToServerButton!: azdata.ButtonComponent;
	private _databasesTableLoading!: azdata.LoadingComponent;
	private _databasesTable!: azdata.DeclarativeTableComponent;
	private _databasesMessage!: azdata.TextComponent;
	public get title(): string {
		return loc.backup;
	}

	public get id(): string {
		return 'backups';
	}

	public get icon(): { dark: string, light: string } {
		return IconPathHelper.properties;
	}
	protected async refresh(): Promise<void> {
		await Promise.all([this._controllerModel.refresh(false, this._controllerModel.info.namespace), this._miaaModel.refresh()]);
	}
	protected async configureRetentionPolicyButton(): Promise<void> {
		await Promise.all([this._controllerModel.refresh(false, this._controllerModel.info.namespace), this._miaaModel.refresh()]);
	}

	public get container(): azdata.Component {
		const root = this.modelView.modelBuilder.divContainer().component();
		const content = this.modelView.modelBuilder.divContainer().component();
		this._databasesContainer = this.modelView.modelBuilder.divContainer().component();
		root.addItem(content, { CSSStyles: { 'margin': '20px' } });

		const infoBackupDatabases = this.modelView.modelBuilder.text().withProps({
			value: loc.miaaBackupsDatabasesDescription,
			CSSStyles: { ...cssStyles.text, 'margin-block-start': '0px', 'margin-block-end': '0px', 'max-width': 'auto' }
		}).component();
		const backupInfoDescrition = this.modelView.modelBuilder.flexContainer()
		.withLayout({ flexWrap: 'wrap' })
		.withItems([
			infoBackupDatabases
		], { CSSStyles: { 'margin-right': '5px' } }).component();

		const backupsDbsLearnMoreLink = this.modelView.modelBuilder.hyperlink().withProps({
			label: loc.learnMore,
			url: '',
			CSSStyles: { 'margin-block-start': '0px', 'margin-block-end': '0px' }
		}).component();

		const backupDatabaseInfoAndLinks = this.modelView.modelBuilder.flexContainer()
		.withLayout({ flexWrap: 'wrap' })
		.withItems([
			backupInfoDescrition,
			backupsDbsLearnMoreLink
		], { CSSStyles: { 'margin-right': '5px' } }).component();

		content.addItem(backupDatabaseInfoAndLinks, { CSSStyles: { 'min-height': '30px' } });
		content.addItem(this.modelView.modelBuilder.text().withProps({
			value: loc.backup,
			CSSStyles: { ...cssStyles.title }
		}).component());


		// Create loaded components
		const connectToServerText = this.modelView.modelBuilder.text().withProps({
			value: loc.miaaConnectionRequired
		}).component();

		this._connectToServerButton = this.modelView.modelBuilder.button().withProps({
			label: loc.connectToServer,
			enabled: false,
			CSSStyles: { 'max-width': '125px', 'margin-left': '40%' }
		}).component();

		const connectToServerContainer = this.modelView.modelBuilder.divContainer().component();


		connectToServerContainer.addItem(connectToServerText, { CSSStyles: { 'text-align': 'center', 'margin-top': '20px' } });
		connectToServerContainer.addItem(this._connectToServerButton);

		this._connectToServerLoading = this.modelView.modelBuilder.loadingComponent().withItem(connectToServerContainer).component();

		// this._connectToServerLoading = this.modelView.modelBuilder.loadingComponent().withItem(connectToServerContainer).component();
		this._databasesContainer.addItem(this._connectToServerLoading, { CSSStyles: { 'margin-top': '20px' } });

		this._databasesTableLoading = this.modelView.modelBuilder.loadingComponent().component();
		this._databasesTable = this.modelView.modelBuilder.declarativeTable().withProps({
			width: '100%',
			columns: [
				{
					displayName: loc.name,
					valueType: azdata.DeclarativeDataType.string,
					isReadOnly: true,
					width: '80%',
					headerCssStyles: cssStyles.tableHeader,
					rowCssStyles: cssStyles.tableRow
				},
				{
					displayName: loc.status,
					valueType: azdata.DeclarativeDataType.string,
					isReadOnly: true,
					width: '20%',
					headerCssStyles: cssStyles.tableHeader,
					rowCssStyles: cssStyles.tableRow
				}
			],
			dataValues: []
		}).component();

		this._databasesMessage = this.modelView.modelBuilder.text()
			.withProps({ CSSStyles: { 'text-align': 'center' } })
			.component();

		this.handleDatabasesUpdated();
		this._databasesTableLoading.component = this._databasesTable;

		const titleCSS = { ...cssStyles.title, 'margin-block-start': '2em', 'margin-block-end': '0' };
		root.addItem(this.modelView.modelBuilder.text().withProps({ value: loc.databases, CSSStyles: titleCSS }).component());
		this.disposables.push(
			this._connectToServerButton!.onDidClick(async () => {
				this._connectToServerButton!.enabled = false;
				this._databasesTableLoading!.loading = true;
				try {
					await this._miaaModel.callGetDatabases();
				} catch {
					this._connectToServerButton!.enabled = true;
				}
			})
		);
		root.addItem(this._databasesContainer);
		root.addItem(this._databasesMessage);

		this.initialized = true;
		return root;
	}

	public get toolbarContainer(): azdata.ToolbarContainer {
		// Refresh
		const refreshButton = this.modelView.modelBuilder.button().withProps({
			label: loc.refresh,
			iconPath: IconPathHelper.refresh
		}).component();
		this.disposables.push(
			refreshButton.onDidClick(async () => {
				refreshButton.enabled = false;
				try {
					await this.refresh();
				} finally {
					refreshButton.enabled = true;
				}
			}));
		const configureRetentionPolicyButton = this.modelView.modelBuilder.button().withProps({
				label: loc.configureRetentionPolicyButton,
				enabled: true,
				iconPath: IconPathHelper.edit,
				CSSStyles: {
				'height': '16px',
				'width': '150px',
				'left': '32px',
				'top': '10px',
				'border-radius': 'nullpx',
				}
			}).component();
		this.disposables.push(
			configureRetentionPolicyButton.onDidClick(async () => {
				configureRetentionPolicyButton.enabled = false;
					try {
						await this.configureRetentionPolicyButton();
					} finally {
						configureRetentionPolicyButton.enabled = true;
					}
				}));

		return this.modelView.modelBuilder.toolbarContainer().withToolbarItems(
				[
					{ component: refreshButton, toolbarSeparatorAfter: true },
					{ component: configureRetentionPolicyButton, toolbarSeparatorAfter: false },

				]
			).component();

	}

	private handleDatabasesUpdated(): void {
		// If we were able to get the databases it means we have a good connection so update the username too
		let databaseDisplayText = this._miaaModel.databases.map(d => [d.name, getDatabaseStateDisplayText(d.status)]);
		let databasesTextValues = databaseDisplayText.map(d => {
			return d.map((value): azdata.DeclarativeTableCellValue => {
				return { value: value };
			});
		});
		this._databasesTable.setDataValues(databasesTextValues);
		this._databasesTableLoading.loading = false;

		if (this._miaaModel.databasesLastUpdated) {
			// We successfully connected so now can remove the button and replace it with the actual databases table
			this._databasesContainer.removeItem(this._connectToServerLoading);
			this._databasesContainer.addItem(this._databasesTableLoading, { CSSStyles: { 'margin-bottom': '20px' } });
		} else {
			// If we don't have an endpoint then there's no point in showing the connect button - but the logic
			// to display text informing the user of this is already handled by the handleMiaaConfigUpdated
			if (this._miaaModel?.config?.status.primaryEndpoint) {
				this._connectToServerLoading.loading = false;
				this._connectToServerButton.enabled = true;
			}
		}
	}
}