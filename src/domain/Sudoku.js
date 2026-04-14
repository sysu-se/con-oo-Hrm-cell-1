// src/domain/sudoku.js
export class Sudoku {
  /**
   * @param {number[][]} grid 9x9数组
   */
  constructor(grid, givens = null) {
    /**
     * 构造的时候用0统一表示空。
     * 增加校验功能：如果cell不是1-9的整数就会抛出错误。
     */
    this._grid = grid.map((row, r)=>row.map((cell, c) => {
      if(cell === null || cell === undefined) return 0;
      if(typeof cell !== 'number' || !Number.isInteger(cell) || cell<0 || cell>9){
        throw new Error(`Invalid cell value at [${r}][${c}]: ${cell}. Must be integer 0-9.`);
      }
      return cell;
    }));
    /**
     * 新增标记固定格，避免修改数独题面。
     */
      // 如果传入了 givens 就用，否则从 grid 推断
    if (givens) {
      this._givens = givens.map(row => [...row]);
    } else {
      this._givens = grid.map(row => row.map(cell => cell !== 0 && cell !== null && cell !== undefined));
    };
  }


  /** 
   * 返回当前棋盘的二维数组深拷贝 
   * @returns {number[][]} 9*9数组，1-9表示数字，0表示空格
   */
  // 对于无参的不改变状态的函数，如下面这个，可以改成get Grid(), 调用时直接sudoku.Grid()
  getGrid() {
    return this._grid.map(row => row.slice());
  }
  /**
   * 判断某个位置是否是题目给定的固定格
   * @param {number} row 行索引 0-8
   * @param {number} col 列索引 0-8
   * @returns {boolean}
   */
  isGiven(row, col){
    return this._givens[row][col];
  }
  /**
   * 尝试对某格填入
   * @param {{row:number,col:number,value:number}} move
   * @returns {boolean} 
   */
guess(move) {
  const { row, col, value } = move;
  console.log('guess called:', { row, col, value, currentValue: this._grid[row][col] });
  // 边界检查
  if (row < 0 || row > 8 || col < 0 || col > 8) {
    return false;  
  }
  
  // 检查固定格
  if (this._givens[row][col]) {
    return false;  
  }
  // 清空格子
  if (value === 0 || value === null || value === undefined) {
    this._grid[row][col] = 0;  
    return true;
  }
  
  // 值域检查
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 9) {
    return false;
  }

  // 冲突检查
  if (!this.isValid(row, col, value)) {
    return false;
  }
  
  this._grid[row][col] = value;
  return true;
}

  /** 检查当前行/列/九宫格无重复*/
  isValid(row, col, value) {
    for(let c=0; c<9; c++){
      if(c!=col && this._grid[row][c] === value) return false;
    }
    for(let r=0; r<9; r++){
      if(r!=row && this._grid[r][col] === value) return false;
    }   
  
    const boxRow = Math.floor(row / 3)*3;
    const boxCol = Math.floor(col / 3)*3;
    for(let r=0; r<3; r++){
      for(let c=0; c<3; c++){
        const rr = boxRow + r;
        const cc = boxCol + c;
        if(!(rr === row && cc === col) && this._grid[rr][cc] === value)return false;
      }
    }
    return true;
  }

  /** 深拷贝当前Sudoku对象 */
  clone() {
    //传入当前的 _givens，保持固定格标记不变
    return new Sudoku(this.getGrid(), this._givens);
  }

  /** 外表化到字符串（调试用） */
  toString() {
    return this._grid
      .map(row => row.map(cell => cell ? cell : '.').join(' '))
      .join('\n');
  }

  /** 
   * 序列化为JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      grid: this.getGrid(),
      givens: this._givens.map(row => row.slice())
    };
  }

  /** 从JSON恢复棋盘 */
  static fromJSON(json) {
    return new Sudoku(json.grid, json.givens)
  }
}