import { App, PluginSettingTab, Setting, debounce } from 'obsidian';
import DailyJournalPlugin from 'main';

export class SettingTab extends PluginSettingTab {
    plugin: DailyJournalPlugin;

    constructor(app: App, plugin: DailyJournalPlugin) {
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
