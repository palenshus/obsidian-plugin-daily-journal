import { ItemView, Vault, WorkspaceLeaf, moment } from 'obsidian';
import { PluginSettings } from 'main';

export class OnThisDayView extends ItemView {
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
        const currentYear: string = moment().format("YYYY");
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
