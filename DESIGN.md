# DESIGN.md - 数独游戏领域对象接入 Svelte 设计文档

## 一、领域对象是怎么被用的？

### 1. View 层实际消费是什么？

View 层（.svelte 组件）**不直接**操作 `Game` 或 `Sudoku`，而是通过 `src/stores/grid.js` 的响应式 store（Store Adapter 模式）。

- 组件通过 `$userGrid` 拿到9x9棋盘数组，`$invalidCells` 拿到有冲突的格子。
- 状态相关的，比如“撤销/重做”按钮是否可点击，用的是 `grid.canUndo()` 和 `grid.canRedo()`。
- 用户输入数字或操作撤销/重做，通过 `userGrid.set(pos, value)`、`grid.undo()`、`grid.redo()` 实现。

### 2. View 层的数据都有哪些？

| 变量            | 来源             | 类型         | 说明                     |
| --------------- | ---------------- | ------------ | ------------------------ |
| `$userGrid`     | writable store   | number[][]   | 当前显示的棋盘           |
| `$invalidCells` | derived store    | string[]     | ["x,y"] 格式的冲突格子   |
| `canUndo`       | grid.canUndo()   | boolean      | 撤销按钮可用             |
| `canRedo`       | grid.canRedo()   | boolean      | 重做按钮可用             |

### 3. 用户操作怎么影响到领域对象？

简单梳理下流程：

1. 用户点击格子或键盘输入  
2. 组件调用 `userGrid.set({x, y}, value)`
3. store 里面 `userGrid` 先去调用 `grid.makeMove(x, y, value)`  
4. `makeMove` 再由领域对象 `Game` 做校验（比如 Sudoku.guess）
5. 更新历史、返回结果，如果成功，再手动同步 UI 状态  
6. View 层依赖的 `$userGrid` `$invalidCells` 自动刷新

撤销/重做也是类似：

1. 用户点 Undo
2. 组件调 `grid.undo()`，store 改变当前 Game 状态，并同步一次 userGrid，UI 跟着刷新

### 4. 为什么领域对象变了，Svelte UI 就会变？

因为用了 Svelte 3 的 Store（响应式），只要 store 里的值变了，所有依赖它的组件自动刷新。  
我们用的是“手动同步”，不会一改领域对象就立即覆盖用户输入，只有在需要的时候调用 sync 方法。

---

## 二、响应式机制说明

- grid 是 writable store，包一层领域对象
- userGrid 作为渲染用缓冲区，invalidCells 派生 store
- 组件用 `$userGrid`, `$invalidCells` 语法即可自动订阅
- Store 变了会自动触发 UI 重绘  
- 不直接 subscribe grid 自动同步 userGrid，改为手动同步；这样不会莫名把用户输入覆盖

---

## 三、和 HW1 比改了啥

| 改进点         | 以前 (HW1)         | 现在 (HW1.1)                |
| -------------- | ------------------ | -------------------------- |
| 验证           | 没校验             | 构造必须 0-9，异常会抛错    |
| 空格           | 0 和 null 混用     | 统一用 0                    |
| 固定格保护     | 没有               | 增加 _givens, isGiven 方法  |
| guess 方法     | 返回新对象         | 直接改 _grid，返回 boolean  |
| 历史记录       | 双栈管理           | 单数组+索引，简洁           |
| UI 接入        | 无 store           | 新增 store 适配层           |
| 键盘禁用       | 有数字就禁         | 只固定格禁，输入可覆盖      |
| 数据同步       | 自动 subscribe     | 改为手动同步                |

---

## 四、常见问题 & 经验

**例：用户填完数字，无法继续改。**

排查流程：
1. 打日志发现 userGrid.set 根本没进
2. keyboardDisabled 的逻辑是“有数字就禁用”
3. 应该只禁固定格，改成 `grid.isGiven(x, y)` 就行

**注意点**：  
有些 derived store 的副作用可能和预期不符，遇到 UI 不刷新的问题记得检查。

---

## 五、课堂讨论 Q&A

- View 层直接消费什么？  
  → Store Adapter：`grid`、`userGrid`，不是领域对象本身

- 为什么 UI 跟着领域对象变化自动刷新？  
  → grid store 变了自动触发响应式

- 响应式边界？  
  → Store 层是响应式，Domain 层是纯 JS

- 哪些状态对 UI 可见？  
  → userGrid、invalidCells、canUndo/Redo，隐藏的有 _history、_givens 等

- 升级到 Svelte 5 哪层最稳定？  
  → 领域对象（Domain），store 层适配一下，UI 换响应式语法即可
