// src/domain/game.js
import { Sudoku } from './Sudoku';

export class Game {
  /**
   * @param {Sudoku} sudoku
   */
  constructor(sudoku) {
    // 当前棋盘对象，需深拷贝保存
    this._sudoku = sudoku.clone();
    // 历史：逐步保存棋盘快照
    this._history = [this._sudoku.clone()];
    this._future = []; // redo用
  }

  /** 当前Sudoku对象（注意要返回副本） */
  getSudoku() {
    // 返回可读副本，也允许直接返回内部对象
    return this._sudoku.clone();
  }

  /**
   * 下棋并清空 redo
   * @param {Move} move
   */
  guess(move) {
    this._sudoku.guess(move);
    this._history.push(this._sudoku.clone());
    this._future = []; // 只要新操作，redo栈作废
  }

  /** 撤销到上一步 */
  undo() {
    if(this.canUndo()) {
      this._future.push(this._sudoku.clone()); 
      this._history.pop();
      this._sudoku = this._history[this._history.length-1].clone();
    }
  }

  /** 重做到下一步 */
  redo() {
    if(this.canRedo()) {
      const next = this._future.pop();
      this._history.push(next.clone());
      this._sudoku = next.clone();
    }
  }

  canUndo() {
    return this._history.length > 1;
  }
  canRedo() {
    return this._future.length > 0;
  }

  /** 游戏对象序列化为JSON */
  toJSON() {
    return {
      sudoku: this._sudoku.toJSON(),
      history: this._history.map(sdk => sdk.toJSON()),
      future: this._future.map(sdk => sdk.toJSON()),
    };
  }

  /** 从JSON恢复Game对象 */
  static fromJSON(json) {
    const game = new Game(Sudoku.fromJSON(json.sudoku));
    // 重放快照
    game._history = json.history.map(js => Sudoku.fromJSON(js));
    game._future = json.future.map(js => Sudoku.fromJSON(js));
    game._sudoku = game._history[game._history.length - 1].clone();
    return game;
  }
}