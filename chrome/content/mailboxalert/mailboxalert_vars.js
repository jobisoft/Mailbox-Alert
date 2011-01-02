//
// Copyright 2010, Jelte Jansen
// BSD licensed, see LICENSE for details
//

//
// Use a namespace for global variables
//

if (typeof(MailboxAlert) == "undefined") {
    var MailboxAlert = {};
}

/* variables for queue handling
 * TODO: queue 'type' with functions (or perhaps remove
 * queueing altogether)
 */
MailboxAlert.queue_length = 0;
MailboxAlert.max_queue_length = 10;
MailboxAlert.queue = new Array(MailboxAlert.max_queue_length);
MailboxAlert.queue_s = new Array(MailboxAlert.max_queue_length);
MailboxAlert.queue_message = new Array(MailboxAlert.max_queue_length);

/* simple lock */
MailboxAlert.running = false;

/* some other protection consts */
MailboxAlert.max_folder_depth = 10;

/* Time to wait before trying for the first time, so that
   the adaptive junk filter can have its way with the folder
   first (in milliseconds) */
MailboxAlert.initial_wait_time = 2000;

/* Time to wait before retrying busy folders (in milliseconds) */
MailboxAlert.wait_time = 5000;

/* Variable to store a renamed folder (we're assuming there's only
 * going to be one renamed folder at a time)
 */
MailboxAlert.renamed_folder = null;

MailboxAlert.getDefaultPrefValue = function (prefname) {
    if (prefname) {
      switch (prefname) {
        case "alert_for_children":
          return false;
          break;
        case "command":
          return "";
          break;
        case "escape":
          return false;
          break;
        case "execute_command":
          return false;
          break;
        case "command":
          return "";
          break;
        case "icon_file":
          return "chrome://mailboxalert/skin/mailboxalert.png";
          break;
        case "message":
          return "";
          break;
        case "no_alert_to_parent":
          return false;
          break;
        case "play_sound":
          return false;
          break;
        case "show_message":
          return false;
          break;
        case "show_message_icon":
          return true;
          break;
        case "sound_wav":
          return true;
          break;
        case "sound_wav_file":
          return "";
          break;
        case "subject":
          return "";
          break;
/*
        case "":
          return ;
          break;
*/
        default:
          alert("unknown default pref: " + prefname);
          break;
      }
    }
}


MailboxAlert.isDefaultPrefValue = function (pref, value) {
    return value == this.getDefaultPrefValue(pref);
}

//
// We have 2 structures that represent configuration values
// 
// - 'global preferences'
//      these are the preferences for where the window goes
// - 'folder preferences'
// 
// A future version will decouple this, and make it three
// - global
// - alert preferences
// - folder->alert link

// These all define at least load() (which is called on creation)
// and save()

MailboxAlert.prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

MailboxAlert.getGlobalPreferences = function() {
}

// idea for prefs;
// big array of arrays
// [name, prefname, type, default]
// 
// prefs object defines:
// - set(name, value)
// - get(name)
// - store()
// - dump()
// 
// get checks if we have gotten it before
// internally this needs an extra bool too (which is what 'read' is for)
// internal helpers:
// - isRead(name)
// - isDefault(name)
//
// global array makes sense
// so prefs just needs an array of 'read' values

        case "alert_for_children":
          return false;
        case "no_alert_to_parent":
          return false;
 

MailboxAlert.folderPrefDefs = {
"show_message": [ "bool", false],
"show_message_icon": [ "bool", true ],
"show_message_icon_file": [ "string", "chrome://mailboxalert/skin/mailboxalert.png" ],
"subject": [ "string", "" ],
"message": [ "string", "" ],
"play_sound": [ "bool", false ],
"sound_wav": [ "bool", true ],
"sound_wav_file": [ "string", "" ],
"execute_command": [ "bool", false ],
"command": [ "string", "" ],
"escape": [ "bool", false ],
"alert_for_children": [ "bool", false ],
"no_alert_to_parent": [ "bool", false ]
}

MailboxAlert.getFolderPreferences = function(folder_uri) {
    var folder_prefs = {};
    folder_prefs.folder_uri = folder_uri;
    folder_prefs.values = {};
    
    folder_prefs.get = function (name) {
        if (!(name in this.values)) {
            // get it from the prefs thingy
            try {
                if (MailboxAlert.folderPrefDefs[name][0] == "bool") {
                    this.values[name] = MailboxAlert.prefService.getBoolPref("extensions.mailboxalert." + name + "." + this.folder_uri);
                } else if (MailboxAlert.folderPrefDefs[name][0] == "string") {
                    this.values[name] = MailboxAlert.prefService.getStringPref("extensions.mailboxalert." + name + "." + this.folder_uri);
                } else if (MailboxAlert.folderPrefDefs[name][0] == "integer") {
                    this.values[name] = MailboxAlert.prefService.getIntPref("extensions.mailboxalert." + name + "." + this.folder_uri);
                }
            } catch(e) {
                // ok pref doesn't exist yet.
                // should we not set and just return?
                this.values[name] = MailboxAlert.folderPrefDefs[name][1];
            }
        }
        return this.values[name];
    }
    
    folder_prefs.set = function(name, value) {
        // should we type-check here?)
        this.values[name] = value;
    }
    
    folder_prefs.store = function() {
        for (var name in MailboxAlert.folderPrefDefs) {
            var type = MailboxAlert.folderPrefDefs[name][0];
            var pref_default = MailboxAlert.folderPrefDefs[name][1];
            if (name in this.values && !(this.values[name] == pref_default)) {
                // non-default, so store it
                if (MailboxAlert.folderPrefDefs[name][0] == "bool") {
                    this.values[name] = MailboxAlert.prefService.setBoolPref("extensions.mailboxalert." + name + "." + this.folder_uri, this.values[name]);
                } else if (MailboxAlert.folderPrefDefs[name][0] == "string") {
                    this.values[name] = MailboxAlert.prefService.setStringPref("extensions.mailboxalert." + name + "." + this.folder_uri, this.values[name]);
                } else if (MailboxAlert.folderPrefDefs[name][0] == "integer") {
                    this.values[name] = MailboxAlert.prefService.setIntPref("extensions.mailboxalert." + name + "." + this.folder_uri, this.values[name]);
                }
            } else {
                // it is unset or it is default, remove any pref previously set
                MailboxAlert.prefService.clearUserPref("extensions.mailboxalert." + name + "." + this.folder_uri);
            }
        }
    }

    
    return folder_prefs;
}
