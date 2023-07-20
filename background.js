(async () => {

    // Keep track of the number of times Mailbox Alert was initialized
    let initializationCount = 0;

    // This listener returns a selective Promise and is therefore compatible with
    // runtime messaging (messenger.storage.local.set/get return Promises).
    function listener(data) {
        switch (data.command) {
            /*
             * Return the number of times Mailbox Alert was initialized
             * (with the windowListener API, it is instanced every
             * time a new window is opened).
             */
            case "getInitializationCount":
                return initializationCount++;
            default:
                console.log("[MailboxAlert] Unknown command sent to background: " + data.command + "\n");
        }
    }

    // Listen to commands from extension instances
    messenger.NotifyTools.onNotifyBackground.addListener(listener);

    messenger.WindowListener.registerDefaultPrefs("skin/defaults/preferences/mailboxalert_default.js");

    messenger.WindowListener.registerChromeUrl([
        ["content",  "mailboxalert",                "content/"],
        ["resource", "mailboxalert-skin",           "skin/classic/"]
    ]);

    messenger.WindowListener.registerOptionsPage("chrome://mailboxalert/content/alert_list.xhtml");
    
    messenger.WindowListener.registerWindow(
        "chrome://messenger/content/messenger.xhtml",
        "chrome://mailboxalert/content/scripts/mailboxalertOverlay.js");

    messenger.WindowListener.registerWindow(
        "chrome://messenger/content/FilterEditor.xhtml",
        "chrome://mailboxalert/content/scripts/filterEditorOverlay.js");

    messenger.WindowListener.startListening();
})();
