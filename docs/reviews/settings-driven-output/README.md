# Settings-driven output review

The screenshots show the Button page at 1280px: before changing settings (the original prompt and snippets), then after selecting Large, Custom gradient, and Loading, with the detailed prompt visible.

- [Before: defaults](before.png)
- [After: customized](after.png)

Validation: 40 content entries, 79 search cases, 14 generators / 99 parsed examples, TypeScript, and static build pass. The unchanged Next.js 16.4.0 build reports an existing security advisory and succeeds on its prescribed retry; the dependency upgrade is outside this PR.

Playwright verified Button, Badge, Alert, Tabs, and Progress bar at 390px: prompt/code updates, exact clipboard contents, default reset, no console errors, and no horizontal page overflow. Axe reported zero WCAG 2 A/AA and 2.1 A/AA violations with settings expanded.

Vue remains the authored example, labelled Default when customized. The other 26 components retain their original output.
