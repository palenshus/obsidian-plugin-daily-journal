import { App, ItemView, MarkdownView, Plugin, PluginSettingTab, Setting, Vault, WorkspaceLeaf, debounce, moment } from 'obsidian';

interface PluginSettings {
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

export default class MyPlugin extends Plugin {
    settings: PluginSettings;

    async onload() {
        await this.loadSettings();

        // This creates an icon in the left ribbon.
        this.addRibbonIcon('dice', "Open 'On this day' view", () => {
            this.activateView();
        });

        this.addCommand({
            id: "open-on-this-day",
            name: "Open 'On this day' view",
            callback: () => {
                this.activateView();
            },
        });

        this.registerView(OnThisDayView.VIEW_TYPE, (leaf) => new OnThisDayView(leaf, this.settings));

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new SettingTab(this.app, this));

        this.registerDomEvent(document, 'keydown', (evt: KeyboardEvent) => {
            console.log(this.settings.automaticNewEntry);
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
        console.log(this.settings.automaticNewEntry);
        await this.saveData(this.settings);
        console.log(this.settings.automaticNewEntry);
        this.app.workspace.trigger(settingsUpdatedTrigger);
    }
}

class OnThisDayView extends ItemView {
    public static VIEW_TYPE: string = 'on-this-day-view';
    private rootEl: Element;
    private dateShowing: moment.Moment;
    settings: PluginSettings;

    getViewType(): string {
        return OnThisDayView.VIEW_TYPE;
    }

    getDisplayText(): string {
        return 'On This Day';
    }

    constructor(leaf: WorkspaceLeaf, settings: PluginSettings) {
        super(leaf);
        this.rootEl = this.containerEl.children[1];
        this.settings = settings;

        this.registerEvent(
            (this.app.workspace as any).on(
                "on-this-day:settings-updated",
                () => this.renderView()
            )
        );

        // rerender at midnight
        this.registerInterval(
            window.setInterval(() => {
                if (this.dateShowing.date() !== moment().date()) {
                    this.renderView();
                }
            }, 60 * 60 * 1000 // 1 hour)
            ));
    }

    async onOpen() {
        await this.renderView();
    }

    private async renderView() {
        this.dateShowing = moment();
        const currentYear: string = moment().format("YYYY")
        const { vault } = this.app;

        this.rootEl.empty();

        if (this.settings.showYesterday) {
            this.rootEl.createEl('h1', { text: `Yesterday` });
            await this.addDayNode(moment().add(-1, "days"), this.rootEl, vault, currentYear);
        }

        this.rootEl.createEl('h1', { text: `Today`, attr: { style: "color: greenyellow;" } });
        await this.addDayNode(moment(), this.rootEl, vault, currentYear);

        if (this.settings.showTomorrow) {
            this.rootEl.createEl('h1', { text: `Tomorrow` });
            await this.addDayNode(moment().add(1, "days"), this.rootEl, vault, currentYear);
        }
    }

    async addDayNode(filterDate: moment.Moment, contentEl: Element, vault: Vault, currentYear: string) {
        for (const file of Array.from(vault.getMarkdownFiles()).sort((a, b) => a.basename.localeCompare(b.basename))) {
            if (file.basename.match(/^\d{4}$/)) {
                const year: string = file.basename;
                console.log("Found file: " + year);

                if (year === currentYear) {
                    break;
                }

                const content = await vault.cachedRead(file);
                for (const match of content.matchAll(/^#(\w{3}) #(\w+)(\d{2})\s+(.*)/gm)) {
                    const [_, day, month, date, text] = match;

                    if (month === filterDate.format("MMMM") && date === filterDate.format("DD")) {
                        contentEl.createEl('h3', { text: `${year} - ${day}, ${month} ${date}` });

                        let showingSummary = true;
                        const summary = contentEl.createEl('p', { text: `${text.substring(0, 100)}...` });
                        summary.onClickEvent(() => {
                            if (showingSummary) {
                                summary.innerText = `${text}`
                            } else {
                                summary.innerText = `${text.substring(0, 100)}...`
                            }
                            showingSummary = !showingSummary;
                        });
                        break;
                    }
                }
            }
        }
    }

    async onClose() {
    }
}

class SettingTab extends PluginSettingTab {
    public static VIEW_TYPE: string = 'on-this-day-view';
    plugin: MyPlugin;

    constructor(app: App, plugin: MyPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        const DEBOUNCE_DELAY = 500;

        containerEl.empty();

        containerEl.createEl('h2', { text: "Settings for 'Daily Journal' plugin." });

        new Setting(containerEl)
            .setName('Add new entry on double-newline')
            .setDesc("If you press Enter twice in a row, a new entry will automatically be created for the next day.")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.automaticNewEntry)
                .onChange(async (value) => {
                    this.plugin.settings.automaticNewEntry = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Years to show')
            .setDesc("Number of previous years to show in the 'On this day' view")
            .addSlider(slider => slider
                .setLimits(1, 10, 1)
                .setDynamicTooltip()
                .setValue(this.plugin.settings.yearsToShow)
                .onChange(debounce(async (value) => {
                    this.plugin.settings.yearsToShow = value;
                    await this.plugin.saveSettings();
                }, DEBOUNCE_DELAY)));

        new Setting(containerEl)
            .setName('Show yesterday')
            .setDesc("Show entry for yesterday in previous years in the 'On this day' view")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showYesterday)
                .onChange(async (value) => {
                    this.plugin.settings.showYesterday = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Show tomorrow')
            .setDesc("Show entry for tomorrow in previous years in the 'On this day' view")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showTomorrow)
                .onChange(async (value) => {
                    this.plugin.settings.showTomorrow = value;
                    await this.plugin.saveSettings();
                }));
    }
}
