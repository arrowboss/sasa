({
    init: function(component, event, helper) {
        var workspaceAPI = component.find("workspace");

        workspaceAPI.getFocusedTabInfo().then(function(response) {
            var focusedTabId = response.tabId;

            workspaceAPI.openSubtab({
                parentTabId: focusedTabId,
                pageReference: {
                    type: "standard__component",
                    attributes: {
                        componentName: "c__underwritingFlowLWC"
                    },
                    state: {
                        c__loanId: component.get("v.recordId")
                    }
                },
                focus: true
            }).then(function(subtabId) {
                // Store subtabId so we can close it later
                component.set("v.subtabId", subtabId);

                workspaceAPI.setTabLabel({
                    tabId: subtabId,
                    label: "Underwriting"
                });
                workspaceAPI.setTabIcon({
                    tabId: subtabId,
                    icon: "custom:custom45"
                });

                // Listen for the closesubtab event fired by the LWC
                window.addEventListener("message", function(msg) {
                    if (msg.data && msg.data.type === "uwflow_closesubtab") {
                        var sid = component.get("v.subtabId");
                        if (sid) {
                            workspaceAPI.closeTab({ tabId: sid }).catch(function(err) {
                                console.error("UWFlow close subtab error:", JSON.stringify(err));
                            });
                        }
                    }
                });

            }).catch(function(error) {
                console.error("UWFlowLauncher subtab error: " + JSON.stringify(error));
            });

        }).catch(function(error) {
            console.error("UWFlowLauncher tab error: " + JSON.stringify(error));
        });
    }
})
