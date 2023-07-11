import { ItemView, MarkdownRenderer, Vault, WorkspaceLeaf, moment } from 'obsidian';
import { PluginSettings } from 'main';

export class OnThisDayView extends ItemView {
    public static VIEW_TYPE: string = 'on-this-day-view';
    private rootEl: Element;
    settings: PluginSettings;

    constructor(leaf: WorkspaceLeaf, settings: PluginSettings) {
        super(leaf);
        this.rootEl = this.containerEl.children[1];
        this.settings = settings;
        this.icon = 'history';

        // re-render when settings change
        this.registerEvent(
            (this.app.workspace as any).on(
                "on-this-day:settings-updated",
                () => this.renderView()
            )
        );

        this.updateViewDaily();
    }

    // re-render at midnight, then again every 24 hours
    updateViewDaily() {
        const timeTilMidnight = moment().add(1, 'd').startOf('day').add(1, 's').diff(moment());

        window.setTimeout(() => {
            this.registerInterval(
                window.setInterval(() => {
                    console.log('rendering');
                    this.renderView();
                }, moment.duration(1, 'day').asMilliseconds())
            );
        }, timeTilMidnight);
    }

    getViewType(): string {
        return OnThisDayView.VIEW_TYPE;
    }

    getDisplayText(): string {
        return 'On this day';
    }

    async onOpen() {
        await this.renderView();
    }

    private async renderView() {
        const currentYear: number = moment().year();
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

    // Adds an entry to the sidebar for a given day for previous years' entries.
    async addDayNode(filterDate: moment.Moment, contentEl: Element, vault: Vault, currentYear: number) {
        for (const file of Array.from(vault.getMarkdownFiles()).sort((a, b) => a.basename.localeCompare(b.basename))) {
            if (file.basename.match(/^\d{4}$/)) {

                const year: number = +file.basename;

                // Don't show this year, future years, or years further in the past than the yearsToShow setting specifies.
                if (year >= currentYear ||
                    (currentYear - this.settings.yearsToShow > year)) {
                    continue;
                }

                const day = filterDate.format("ddd");
                const month = filterDate.format("MMMM");
                const date = filterDate.format("DD");
                const journalEntryRegex = new RegExp(`^#\\w{3} #${month}${date}\\s+(.*)`);

                const content = await vault.cachedRead(file);
                const lines = content.split("\n");
                for (const [lineNumber, line] of lines.entries()) {
                    const match = line.match(journalEntryRegex);
                    if (match) {
                        const text = match[1];

                        // Create a paragraph with a link to the entry and a summary of the entry.
                        const entry = contentEl.createEl('p');

                        const link = entry.createEl('a', { attr: { href: "#" }, text: `${year} ${day} ${month} ${date}` });
                        link.onClickEvent(() => { this.app.workspace.getLeaf(false).openFile(file, { eState: { line: lineNumber } }); });

                        const summary = entry.createDiv({ text: ` ${text.substring(0, 100)}...` });

                        // Show the full entry when the user clicks on the summary, and vice versa.
                        let showingSummary = true;
                        summary.onClickEvent(() => {
                            if (showingSummary) {
                                summary.innerText = `${text}`;
                            } else {
                                summary.innerText = `${text.substring(0, 100)}...`;
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
