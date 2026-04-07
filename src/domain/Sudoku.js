// src/domain/sudoku.js
export class Sudoku {
  /**
   * @param {number[][]} grid 9x9数组，0表示空
   */
  constructor(grid) {
    // 存储棋盘数据
    // 每一格的数据推荐为 number 或 null，原始题目数据要做深拷贝
    this._grid = grid.map(row => row.slice());
  }

  /** 返回当前棋盘的二维数组深拷贝 */
  getGrid() {
    return this._grid.map(row => row.slice());
  }

  /**
   * 对某格填写值
   * @param {{row:number,col:number,value:number|null}} move
   */
  guess(move) {
    const { row, col, value } = move;
    if(row < 0 || row > 8 || col < 0 || col > 8)
      throw new Error('row/col 超出范围');
    // 检查 value 是否为1~9或null
    if(value === null ){
      this._grid[row][col] = null;
      return true;
    }
    if(this.isValid(row, col, value)){
      this._grid[row][col] = value;
      return true;
    }
    
    return false;
  }

  /** 简单校验当前局面是否合法（可拓展为完整校验）*/
  isValid(row, col, value) {
    // 检查当前行/列/九宫格无重复
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
        if(rr!=row && cc!=col && this._grid[rr][cc] === value)return false;
      }
    }
    return true;
  }

  /** 深拷贝当前Sudoku对象 */
  clone() {
    return new Sudoku(this.getGrid());
  }

  /** 外表化到字符串（调试用） */
  toString() {
    return this._grid
      .map(row => row.map(cell => cell ? cell : '.').join(' '))
      .join('\n');
  }

  /** 序列化为JSON（所有要存储的字段） */
  toJSON() {
    return {
      grid: this.getGrid()
    };
  }

  /** 从JSON恢复棋盘 */
  static fromJSON(json) {
    return new Sudoku(json.grid);
  }
}