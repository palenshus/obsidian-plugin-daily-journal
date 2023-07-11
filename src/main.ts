import { OnThisDayView } from 'src/OnThisDayView';
import { SettingTab } from 'src/SettingTab';
import { MarkdownView, Plugin, moment } from 'obsidian';

export interface PluginSettings {
    automaticNewEntry: boolean;
    yearsToShow: number;
    showYesterday: boolean;
    showTomorrow: boolean;
}

const DEFAULT_SETTINGS: PluginSettings = {
    automaticNewEntry: true,
    yearsToShow: 5,
    showYesterday: true,
    showTomorrow: true,
}

const settingsUpdatedTrigger = "on-this-day:settings-updated";

export default class DailyJournalPlugin extends Plugin {
    settings: PluginSettings;

    async onload() {
        await this.loadSettings();

        // This creates an icon in the left ribbon.
        this.addRibbonIcon('history', "Open 'On this day' view", () => {
            this.activateView();
        });

        // Command to activate the sidebar from the command palette or a hotkey.
        this.addCommand({
            id: "open-on-this-day",
            name: "Open 'On this day' view",
            callback: () => {
                this.activateView();
            },
        });

        // Command to create a new journal page for current year.
        this.addCommand({
            id: "create-journal-page",
            name: "Create new journal page for current year",
            callback: () => {
                this.createEmptyJournalPage();
            },
        });

        // Register the right sidebar view
        this.registerView(OnThisDayView.VIEW_TYPE, (leaf) => new OnThisDayView(leaf, this.settings));

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new SettingTab(this.app, this));

        // This monitors keyboard events so when the user presses enter, it will automatically create a new entry
        // if the line above it is blank and the previous line is a journal entry.
        this.registerDomEvent(document, 'keydown', (evt: KeyboardEvent) => {
            if (this.settings.automaticNewEntry && evt.key === 'Enter') {
                const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
                if (!editor) {
                    return;
                }

                const line = editor.getCursor().line;
                if (line > 1) {
                    const prevLine2 = editor.getLine(line - 2);
                    const prevLine = editor.getLine(line - 1);

                    if (prevLine === "") {
                        const prevDate = moment(prevLine2, "ddd MMMMDD");
                        if (prevDate.isValid()) {
                            const newDate = prevDate.add(1, 'days');
                            const newDateString = `${newDate.format("#ddd #MMMMDD")} `;
                            editor.replaceRange(newDateString, editor.getCursor());
                            editor.setCursor(line, newDateString.length);
                        }
                    }
                }
            }
        });
    }

    // Create a new journal page for the current year, with a blank entry for each day so far.
    async createEmptyJournalPage() {
        const fileName = `${moment().year()}.md`;
        const file = await this.app.vault.create(fileName, "");
        for (let current = moment([moment().year(), 0, 1]); current < moment(); current.add(1, 'days')) {
            this.app.vault.append(file, `${current.format("#ddd #MMMMDD")} \n\n`);                        
        }
    }

    // Activate the right sidebar view
    async activateView() {
        this.app.workspace.detachLeavesOfType(OnThisDayView.VIEW_TYPE);

        await this.app.workspace.getRightLeaf(false).setViewState({
            type: OnThisDayView.VIEW_TYPE,
            active: true,
        });

        this.app.workspace.revealLeaf(
            this.app.workspace.getLeavesOfType(OnThisDayView.VIEW_TYPE)[0]
        );
    }

    onunload() {
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.app.workspace.trigger(settingsUpdatedTrigger);
    }
}
