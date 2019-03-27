sap.ui.define([
	"url/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"url/model/formatter",
	"sap/m/MessageToast"

], function (BaseController, JSONModel, History, Filter, FilterOperator, formatter, MessageToast) {
	"use strict";
	return BaseController.extend("url.controller.Worklist", {
		formatter: formatter,
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			var oViewModel, iOriginalBusyDelay, oTable = this.byId("table");
			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
			this._oTable = oTable;
			// keeps the search state
			this._oTableSearchState = {
				aFilter: [],
				aSearch: []
			};

			// Model used to manipulate control states
			oViewModel = new JSONModel({
				worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
				saveAsTileTitle: this.getResourceBundle().getText("saveAsTileTitle", this.getResourceBundle().getText("worklistViewTitle")),
				shareOnJamTitle: this.getResourceBundle().getText("worklistTitle"),
				shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
				shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
				tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
				tableBusyDelay: 0,
				getEventId: "",
				getObjectId: "",
				popupWindow: ''
			});
			this.setModel(oViewModel, "worklistView");

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oTable.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for worklist's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});

			/* Preeti start  */
			/*	oTable.attachEventOnce("onOrder", function() {
					// Restore original busy indicator delay for worklist's table
					oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
				});  */
			/* Preeti end */

			var oPanel = this.byId("deliveryAddressPanel");
			oPanel.bindElement("modelGetItems>/get_headerSet('')");

			var oheaderPanel = this.byId("headerPanel");
			oheaderPanel.bindElement("modelGetItems>/get_headerSet('')");

			var oVbox = this.byId("vboxTotal");
			oVbox.bindElement("modelGetItems>/get_headerSet('')");

			//-->> Diable Order button as no items
			var oOrderButton = this.byId("orderButton");
			oOrderButton.setEnabled(false);

			this.getOwnerComponent().getModel("modelGetItems").updateBindings(true);
		},
		/*	onBeforeRendering: function() {
				
				var oModel = this.getModel("modelCatalog");
				var sCatlogName = "AMAZON";
				var sPath = "/catalog_urlSet('" + sCatlogName + "')";
				// read the property here not requesting !
				oModel.read(sPath);
			},*/
		onUpdateFinished: function (oEvent) {
			// update the worklist's object counter after the table update
			var sTitle, oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
			} else {
				sTitle = this.getResourceBundle().getText("worklistTableTitle");
			}
			this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);

			var sShoppingCartNo = this.oView.byId("shoppingCartHeader").getTitle();
			var oModel = this.getView().getModel("modelGetItems");
			var eVisible = oModel.getProperty("/get_headerSet('" + sShoppingCartNo + "')/ERROR_VISIBLE");
			var oRefreshButton = this.byId("btnRefresh");
			var oCatalogButton = this.byId("btnAmazon");
			if (eVisible === true) {
				oRefreshButton.setEnabled(false);
				oCatalogButton.setEnabled(false);
			}
			/* else { oRefreshButton.setEnabled(true);
				oCatalogButton.setEnabled(true); 
		   }*/

			var oModel = this.getModel("modelGetItems");
			var oTable = this.byId("table");
			var aItems = oTable.getItems();
			var total = 0;

			for (var itemIndex in aItems) {
				var oItemLine = aItems[itemIndex];
				var oItemContextPath = oItemLine.getBindingContextPath();
				oModel.getProperty(oItemContextPath);
				//var oItemObject = oModel.getProperty(oItemContextPath);
				var oItemContextPathPrice = oItemContextPath + "/PRICE";
				var oItemContextPathQuan = oItemContextPath + "/QUANTITY";
				var price = oModel.getProperty(oItemContextPathPrice);
				var quantity = oModel.getProperty(oItemContextPathQuan);
				var nPrice = Number(price);
				var nQuantity = Number(quantity);
				total = total + (nPrice * nQuantity);
			}

			total = total.toFixed(2);
			var tTotal = total.toString();
			//	var fTotal = tTotal.concat("USD");
			var fTotal = tTotal + ' ' + "USD";
			var sPathHeader = "/get_headerSet('" + sShoppingCartNo + "')";
			oModel.setProperty(sPathHeader + "/PRICE_TOTAL", fTotal);

		},

		onButtonPress: function (oEvent) {
			// The source is the list item that got pressed
			// TODO: Find button name and associate with catalog name 
			//var oSource = oEvent.getSource();
			//var oBtn = this.byId("btnAmazon");

			/*		var oModel = this.getView().getModel("modelCatalog");
					var sCatlogName = "AMAZON";
					var sPath = "/catalog_urlSet('" + sCatlogName + "')";
					var catalogUrl = oModel.getProperty(sPath).catalog_URL;
					var eventid = oModel.getProperty(sPath).event_id;
					this.getModel("worklistView").setProperty("/getEventId", eventid);*/

			//var catalogUrl = oModel.getProperty("/get_headerSet('1006637950')/URL");

			var sShoppingCartNo = this.oView.byId("shoppingCartHeader").getTitle();
			var oModel = this.getView().getModel("modelGetItems");
			var catalogUrl = oModel.getProperty("/get_headerSet('" + sShoppingCartNo + "')/URL");

			//var objectid = oModel.getProperty(sPath).object_id;
			//this.getModel("worklistView").setProperty("/getObjectId", objectid);

			var popupWindow = window.open(catalogUrl, 'catalogWindow', 'height=800,width=1100,resizable=yes,scrollbars=1');
			this.getModel("worklistView").setProperty("/popupWindow", popupWindow);
			popupWindow.focus();

			var pollURL = "/sap/SAPSRM/cat_poll_fiori?sap-client=369&OBJECT_ID=" + sShoppingCartNo;
			this.callAjax(pollURL);

		},


		callAjax: function (url) {
			var oControl = this;
			$.ajax({
				type: "GET",
				url: url + "&random=" + Math.random(),
				success: function (data) {

					if (data !== "004") {
						setTimeout(function () {
							oControl.callAjax(url);
						}, 2000);
					} else {

						if (!oControl.getModel("worklistView").getProperty("/popupWindow").closed) {

							setTimeout(function () {
								oControl.callAjax(url);
							}, 2000);
						} else {
							oControl.onRefresh();
						}
					}

				}
			});

		},

		/**
		 *@memberOf url.controller.Worklist
		 */
		onRefresh: function (oEvent) {

			var oOrderButton = this.byId("orderButton");
			oOrderButton.setEnabled(true);

			var popupWindow = this.getModel("worklistView").getProperty("/popupWindow");
			if (!popupWindow.closed) {
				popupWindow.close();
			}

			/*			var sEventid = this.getModel("worklistView").getProperty("/getEventId");
						this._oTableSearchState.aSearch = [new Filter("EVENT_ID", FilterOperator.EQ, sEventid)];

						var aFilters = this._oTableSearchState.aSearch.concat(this._oTableSearchState.aFilter);
						this._oTable.getBinding("items").filter(aFilters);*/

			/*	    var oModel = this.getView().getModel("modelGetItems");
					oModel.refresh();*/

			/*	var oModel = this.getView().getModel("modelGetItems");
				var sShoppingCartNo = this.oView.byId("shoppingCartHeader").getTitle();
				var sPath = "/get_headerSet('" + sShoppingCartNo + "')/items";
				// read the property here not requesting !
				oModel.read(sPath);*/

			/*TODO start */

			this.getModel("modelGetItems").submitChanges({
				// Success Message
				success: function () {
					MessageToast.show("Total Amount Updated");
				}
			}, {
				//Error Message
				error: function () {
					MessageToast.show("Error updating record");
				}
			});
			/*TODO end*/

			var sShoppingCartNo = this.oView.byId("shoppingCartHeader").getTitle();

			/*	var sPath = "/get_headerSet('" + sShoppingCartNo + "')";
				this.getModel("modelGetItems").read(sPath);*/

			this._oTableSearchState.aSearch = [new Filter("OBJECT_ID", FilterOperator.EQ, sShoppingCartNo)];
			var aFilters = this._oTableSearchState.aSearch.concat(this._oTableSearchState.aFilter);
			this._oTable.getBinding("items").filter(aFilters);

			/*	var oModel = this.getModel("modelGetItems");
						var oTable = this.byId("table");
						var aItems = oTable.getItems();
						var total = 0;
					
			
							for ( var itemIndex in aItems ) { 
								var oItemLine = aItems[itemIndex];
								var oItemContextPath = oItemLine.getBindingContextPath();
								oModel.getProperty( oItemContextPath );
								//var oItemObject = oModel.getProperty(oItemContextPath);
								var oItemContextPathPrice = oItemContextPath+"/PRICE";  
								var oItemContextPathQuan = oItemContextPath+"/QUANTITY"; 
								var price = oModel.getProperty( oItemContextPathPrice );
								var quantity = oModel.getProperty( oItemContextPathQuan );
								var nPrice = Number(price);
								var nQuantity =  Number(quantity);
								total = total + ( nPrice * nQuantity) ;
							}
					
					total = total.toFixed(2);
					var tTotal = total.toString();
				//	var fTotal = tTotal.concat("USD");
					var fTotal = tTotal + ' ' + "USD";
					var sPathHeader = "/get_headerSet('" + sShoppingCartNo + "')";
					oModel.setProperty( sPathHeader +"/PRICE_TOTAL" , fTotal );*/

			//this.getModel("modelGetItems").refresh();

		},

		onDelete: function (oEvent) {
			var oList = oEvent.getSource();

			var oListItem = oEvent.getParameter("listItem");
			var sPath = oListItem.getBindingContextPath();
			//this.getModel("modelGetItems").update(sPath);

			this.getModel("modelGetItems").remove(sPath);

			var sShoppingCartNo = this.oView.byId("shoppingCartHeader").getTitle();
			var sPathHeader = "/get_headerSet('" + sShoppingCartNo + "')";
			this.getModel("modelGetItems").read(sPathHeader);

		},

		_onMetadataLoaded: function () {
			var sEntityType = "get_item";
			this._sGet_itemsChangeGroup = this._sGet_itemsChangeGroup || ("Items-" + jQuery.sap.uid());

			// make sure we have a change group
			var mChangeGroups = this.getOwnerComponent().getModel("modelGetItems").getChangeGroups();
			var oEntityType = {
				name: sEntityType
			};

			// if there is no change group for the entity type yet, create one
			if (!mChangeGroups[oEntityType.name]) {
				mChangeGroups[oEntityType.name] = {
					groupId: this._sUomsChangeGroup,
					single: false
				};
				this.getOwnerComponent().getModel("modelGetItems").setChangeGroups(mChangeGroups);

				// important: the group has to be deferred so
				this.getOwnerComponent().getModel("modelGetItems").setDeferredGroups([this._sGet_itemsChangeGroup]);
			}
		},

		onOrder: function (oEvent) {
			var oOrderButton = oEvent.getSource();
			var oBusyDialog = new sap.m.BusyDialog();

			//Disable Order button to avoid multiple press by user
			oOrderButton.setEnabled(false);
			//-->> Disable Refresh and Amazon  button
			var oRefreshButton = this.byId("btnRefresh");
			oRefreshButton.setEnabled(false);
			var oCatalogButton = this.byId("btnAmazon");
			oCatalogButton.setEnabled(false);

			oBusyDialog.open();
			var oModel = this.getModel("modelGetItems");
			var oTable = this.byId("table");
			var aItems = oTable.getItems();
			//	if (!oModel.hasPendingChanges()) {
			for (var itemIndex in aItems) {
				var oItemLine = aItems[itemIndex];
				var oItemContextPath = oItemLine.getBindingContextPath();
				//var oItemObject = oModel.getProperty(oItemContextPath);
				oItemContextPath = oItemContextPath + "/ORDER_IND";
				oModel.setProperty(oItemContextPath, true);
			}

			//	}

			//var oModel = this.getView().getModel("modelGetItems");
			//oModel.updateBindings({bForceUpdate: true});
			//	this.getModel("modelGetItems").updateBindings(true);

			// Save data
			this.getModel("modelGetItems").submitChanges({
				// Success Message
				success: function () {
					oBusyDialog.close();
					MessageToast.show("Shopping Cart is ordered!", {
						duration: 3000, // default
						width: "15em", // default
						my: sap.ui.core.Popup.Dock.CenterCenter,
						at: sap.ui.core.Popup.Dock.CenterCenter,
						of: window, // default
						offset: "0 0", // default
						collision: "fit fit", // default
						onClose: null, // default
						autoClose: false, // default
						animationTimingFunction: "ease", // default
						animationDuration: 1000, // default
						closeOnBrowserNavigation: true // default
					});
				}
			}, {
				//Error Message
				error: function () {
					MessageToast.show("Error updating record");
				}
			});
			/*	var sShoppingCartNo = this.oView.byId("shoppingCartHeader").getTitle();
				var sServiceUrl = "/get_headerSet('" + sShoppingCartNo + "')";
				this.getModel("modelGetItems").update(sServiceUrl);*/

			var sShoppingCartNo = this.oView.byId("shoppingCartHeader").getTitle();
			this._oTableSearchState.aSearch = [new Filter("OBJECT_ID", FilterOperator.EQ, sShoppingCartNo)];
			var aFilters = this._oTableSearchState.aSearch.concat(this._oTableSearchState.aFilter);
			this._oTable.getBinding("items").filter(aFilters);
		},

		_statusMessage: function (sMessage) {
			MessageToast.show(sMessage, {
				duration: 3000,
				width: "15em",
				my: sap.ui.core.Popup.Dock.CenterCenter,
				at: sap.ui.core.Popup.Dock.CenterCenter,
				of: window,
				offset: "0 0",
				collision: "fit fit",
				onClose: null,
				autoClose: false,
				animationTimingFunction: "ease",
				animationDuration: 1000,
				closeOnBrowserNavigation: true
			});

		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function () {
			var oViewModel = this.getModel("worklistView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});
			oShareDialog.open();
		},

		onCbSelectionChange: function (oEvent) {

		}

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		/*		onPress: function(oEvent) {
					// The source is the list item that got pressed
					//this._showObject(oEvent.getSource());
					var oSource = oEvent.getSource();
					var sPath = oSource.getBindingContext().sPath;
					var oModel = this.getModel();
					var catalogUrl = oModel.getData(sPath).catalog_URL;
					var event_id = oModel.getData(sPath).event_id;
					sap.m.URLHelper.redirect(catalogUrl, true);
					
					
					
					var oModelGetItems = this.getView().getModel("modelGetItems").attachEventOnce("metadataFailed", function(oEvent) {
						this._statusMessage("Request to the OData  failed.");
					});
					oModelGetItems.read("/get_itemSet('" + event_id + "')", {
						success: function() {
							this._statusMessage("Reading  OData  Success.");
						},
						error: function() {
							this._statusMessage("Reading  OData  failed.");
						}
					});
				},
		*/

	});
});