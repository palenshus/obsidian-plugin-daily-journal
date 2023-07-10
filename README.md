# Obsidian Daily Journal Plugin

This is a daily journaling plugin for [Obsidian](https://obsidian.md). It's inspired by the "5-year journal", a type of journal where each page has space for 5 entries, across 5 years, for the same day. As you use the journal over the course of years, you'll add new entries while at the same time seeing what you were doing in previous years.

I wanted to enable a digital version of that. This plugin has functionality to create a new journal page, and a sidebar view which shows all your previous years' entries for the same day (and optionally for the surrounding days as well).

## Installation

1. Open Obsidian, go to `Settings > Community plugins > Browse`
2. Select `Daily Journal` in the list, then click `Install`, then `Enable`
3. Configure `Options` as desired

## Usage

To get started, open the command palette (`CTRL+P`) and select `Create new journal page for current year`

This will create a new journal page for the current year, with blank entries for each day so far. Feel free to keep them to backfill some entries, or delete everything up until the current day.

Write each journal entry on the same line as the tags. When you're ready for a new entry, just press Enter twice, and a new blank entry will be created for the next day. (You can turn this off in Settings)

![Alt text](Obsidian_2023-07-10_00-28-09.gif)

Open the `On this day` view via the ribbon icon or the command palette and it will display your entries from previous years on the current day. The view will refresh around midnight to show the new day's entries.

By default it will show entries for the surrounding days as well (yesterday and tomorrow), you can disable those in Settings. And by default it'll show entries for the past 5 years, which can also be changed in Settings.
