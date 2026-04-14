// src/domain/game.js
import { Sudoku } from './Sudoku';

export class Game {
  /**
   * @param {Sudoku} initialSudoku 初始棋盘
   */
  constructor(initialSudoku) {
    this._history = [initialSudoku];
    this._currentIndex = 0;
  }

  /** 获取当前Sudoku对象（注意要返回副本） */
  getSudoku() {
    return this._history[this._currentIndex];
  }

  /**
   * 下棋操作
   * @param {{row: number, col: number, value: number}} move
   * @returns {boolean} 是否成功
   */
  guess(move) {
    const current = this._history[this._currentIndex];
    const newSudoku = current.clone();
    const success = newSudoku.guess(move);
    
    if (!success) return false;
    // 如果当前不在最新状态 截断后续历史
    if(this._currentIndex < this._history.length - 1){
      this._history = this._history.slice(0, this._currentIndex+1);
    }
    // 添加新状态
    this._history.push(newSudoku);
    this._currentIndex++;
    return true;
  }

  /** 
   * 撤销到上一步 
   * @returns {boolean} 是否成功撤回
   */
  undo() {
    if(this.canUndo()) {
      this._currentIndex--;
      return true;
    }
    return false;
  }

  /** 
   * 重做到下一步
   * @returns {boolean} 是否成功撤回
   */
  redo() {
    if(this.canRedo()) {
      this._currentIndex++;
      return true;
    }
    return false;
  }

  canUndo() {
    return this._currentIndex > 0;
  }
  canRedo() {
    return this._currentIndex < this._history.length-1;
  }

  /** 
   * 游戏对象序列化为JSON 
   * @returns {Object}
   */
  toJSON() {
    return {
      history: this._history.map(s => s.toJSON()),
      currentIndex: this._currentIndex
    };
  }

  /** 
   * 从 JSON 恢复 Game 对象
   * @param {Object} json
   * @returns {Game}
   */
  static fromJSON(json) {
    const history = json.history.map(data => Sudoku.fromJSON(data));
    const game = new Game(history[0]);
    game._history = history;
    game._currentIndex = json.currentIndex;
    return game;
  }
}