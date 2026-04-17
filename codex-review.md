# con-oo-Hrm-cell-1 - Review

## Review 结论

代码已经完成了基本的 `Sudoku`/`Game` 对象抽取，并把输入、Undo/Redo 入口接到了 Svelte 层；但当前实现没有把领域状态与 Svelte 状态流统一成单一事实来源，导致封装性、数独业务语义和响应式接入都存在明显缺口。整体看，领域对象雏形是有的，但离“清晰、稳定、可扩展的 OOD + Svelte 接入”还有一段距离。

## 总体评价

| 维度 | 评价 |
| --- | --- |
| OOP | fair |
| JS Convention | fair |
| Sudoku Business | fair |
| OOD | fair |

## 缺点

### 1. Svelte 层维护了第二份可写棋盘，破坏单一事实来源

- 严重程度：core
- 位置：src/node_modules/@sudoku/stores/grid.js:106-147
- 原因：`userGrid` 被单独做成可写 store，并在 `userGrid.set` 里先直接改 UI 状态，再调用 `grid.makeMove(...)`。一旦 `Game/Sudoku` 拒绝该步（例如固定格、冲突值），领域层状态不会变，但 UI 已经变了，导致显示、提示、冲突标记与真实游戏状态脱节。这不是局部 bug，而是接入层建模错误。

### 2. “题面 givens / 用户填写” 的判定用了当前局面，业务语义错误

- 严重程度：major
- 位置：src/components/Board/index.svelte:42-51
- 原因：`userNumber` 和 `conflictingNumber` 通过 `$grid[y][x] === 0` 判断，但 `$grid` 是当前可变棋盘，不是初始题面。用户一旦成功填入数字，该格就不再等于 0，于是会被当成非用户输入；而冲突高亮也被同样条件抑制。这里本应依赖 `Sudoku.isGiven(...)` 这类稳定语义，而不是当前值是否为 0。

### 3. Game 没有保护历史快照的封装边界

- 严重程度：major
- 位置：src/domain/Game.js:8-16
- 原因：构造函数直接把传入的 `initialSudoku` 放进历史，`getSudoku()` 又直接返回内部快照对象。外部代码如果拿到这个对象后调用 `guess()`，会绕过 `Game` 直接改写历史状态，Undo/Redo 的不变量也就不再受控。对以历史管理为核心职责的 `Game` 来说，这是明显的封装泄漏。

### 4. Undo/Redo 没有按 Svelte 响应式方式接入可用性状态

- 严重程度：major
- 位置：src/node_modules/@sudoku/stores/grid.js:66-85; src/components/Controls/ActionBar/Actions.svelte:22-49
- 原因：领域层已经提供了 `canUndo()/canRedo()`，但 UI 按钮只依据 `$gamePaused` 控制禁用态，没有把历史可用性建成响应式状态。`grid.undo()`/`grid.redo()` 也没有把失败结果反馈给 UI。结果是按钮经常处于“可点但可能什么都不做”的状态，不符合 Svelte 以声明式状态驱动视图的惯例。

### 5. 序列化/反序列化能力停留在领域对象，未接入实际游戏流程

- 严重程度：major
- 位置：src/node_modules/@sudoku/stores/grid.js:8-100
- 原因：`Sudoku/Game` 和 `src/domain/index.js` 已提供 `toJSON/fromJSON` 与工厂函数，但当前 grid store 只暴露了生成、解码、落子、撤销、重做，没有暴露保存/恢复当前 `Game` 的入口。静态搜索也未发现 `createGameFromJSON` 或 `createSudokuFromJSON` 在 Svelte 流程中的调用，因此“支持当前局面保存/恢复”并没有真正落地到应用流程。

### 6. 领域核心方法残留调试输出

- 严重程度：minor
- 位置：src/domain/Sudoku.js:52-55
- 原因：`guess()` 中直接 `console.log(...)` 会把调试痕迹带到正式领域代码里，污染运行输出，也削弱了核心对象接口的整洁度。对 JS 生态和代码质量而言，这属于应当清理的实现噪音。

## 优点

### 1. 撤销/重做的历史模型简单直接，且正确处理了 redo 截断

- 位置：src/domain/Game.js:23-68
- 原因：`Game.guess()` 先 clone 当前 `Sudoku`，成功后在非最新分支上先截断后续历史，再 push 新快照；`undo/redo/canUndo/canRedo` 也保持了明确职责。这种快照式历史虽然不轻量，但很适合作业场景，行为清晰。

### 2. Sudoku 对题面 givens、当前 grid、clone、外表化做了成体系封装

- 位置：src/domain/Sudoku.js:18-27; src/domain/Sudoku.js:44-131
- 原因：`Sudoku` 既持有当前局面，也保留了固定格信息，并提供 `isGiven`、`guess`、`clone`、`toString`、`toJSON`、`fromJSON`。相比把这些规则散在组件里，这已经体现出比较明确的领域对象边界。

### 3. 组件没有直接承载数独规则，输入主要经由 store 转发到 Game

- 位置：src/node_modules/@sudoku/stores/grid.js:25-37; src/node_modules/@sudoku/stores/grid.js:53-99
- 原因：无论是新开局、自定义局面、普通落子还是提示填充，组件侧都不是直接操作二维数组，而是通过 `grid` store 间接调用 `Game`/`Sudoku`。这说明作者至少有意识地把领域逻辑从组件事件处理中抽离出来。

### 4. 固定格可编辑性的判断接到了领域对象语义

- 位置：src/node_modules/@sudoku/stores/keyboard.js:6-22
- 原因：键盘禁用逻辑没有继续靠“当前格子是否为 0”这类脆弱推断，而是调用 `grid.isGiven(...)`。这条接入链路比直接读界面数据更稳，也更符合“UI 问领域对象、而不是自己猜规则”的方向。

## 补充说明

- 本次结论完全基于静态阅读，未运行测试、未实际操作页面。
- 关于游戏流程、Undo/Redo 按钮状态、冲突高亮与保存/恢复是否真正生效的判断，均来自对 Svelte 组件和 store 调用链的静态推导。
- 关于“序列化/反序列化未接入 Svelte 流程”的结论，来自对 `src` 内调用点的静态搜索：只看到定义，未看到 `createGameFromJSON` / `createSudokuFromJSON` 被实际流程使用。
- 本次 review 仅覆盖 `src/domain/*` 及其在 `src/node_modules/@sudoku/*`、相关 Svelte 组件中的接入，没有扩展到无关目录。
